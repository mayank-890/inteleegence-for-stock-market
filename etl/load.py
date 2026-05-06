"""Load layer for the Nifty 100 PostgreSQL warehouse."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

from etl.config import DatabaseConfig
from etl.transform import WarehouseTables


LOGGER = logging.getLogger(__name__)


def connect(database: DatabaseConfig) -> psycopg2.extensions.connection:
    """Create a PostgreSQL connection."""
    return psycopg2.connect(
        dbname=database.dbname,
        user=database.user,
        password=database.password,
        host=database.host,
        port=database.port,
        connect_timeout=10,
    )


def ensure_schema(connection: psycopg2.extensions.connection, schema_path: Path) -> None:
    """Apply the SQL schema before loading data."""
    if not schema_path.exists():
        raise FileNotFoundError(f"Schema file does not exist: {schema_path}")

    with connection.cursor() as cursor:
        cursor.execute(schema_path.read_text(encoding="utf-8"))
    connection.commit()
    LOGGER.info("Database schema ensured")


def load_warehouse_tables(
    connection: psycopg2.extensions.connection,
    tables: WarehouseTables,
) -> None:
    """Load dimensions first, then facts, using PostgreSQL upserts."""
    try:
        with connection:
            with connection.cursor() as cursor:
                upsert_dim_sector(cursor, tables.dim_sector)
                sector_ids = fetch_key_map(cursor, "dim_sector", "sector_name", "sector_id")

                company_rows = tables.dim_company.copy()
                company_rows["sector_id"] = company_rows["sector_name"].map(sector_ids)
                upsert_dim_company(cursor, company_rows)
                company_ids = fetch_key_map(cursor, "dim_company", "ticker_symbol", "company_id")

                upsert_dim_year(cursor, tables.dim_year)
                year_ids = fetch_key_map(cursor, "dim_year", "fiscal_year", "year_id")

                upsert_fact_profit_loss(cursor, _attach_fact_keys(tables.fact_profit_loss, company_ids, year_ids))
                upsert_fact_balance_sheet(cursor, _attach_fact_keys(tables.fact_balance_sheet, company_ids, year_ids))
                upsert_fact_cash_flow(cursor, _attach_fact_keys(tables.fact_cash_flow, company_ids, year_ids))
                upsert_fact_analysis(cursor, _attach_company_keys(tables.fact_analysis, company_ids))
    except Exception:
        connection.rollback()
        LOGGER.exception("ETL load failed; transaction rolled back")
        raise


def upsert_dim_sector(cursor: psycopg2.extensions.cursor, df: pd.DataFrame) -> None:
    """Upsert sector dimension records."""
    rows = _records(df, ["sector_name"])
    if not rows:
        return

    execute_values(
        cursor,
        """
        INSERT INTO dim_sector (sector_name)
        VALUES %s
        ON CONFLICT (sector_name)
        DO UPDATE SET updated_at = NOW()
        """,
        rows,
    )
    LOGGER.info("Loaded dim_sector rows: %s", len(rows))


def upsert_dim_company(cursor: psycopg2.extensions.cursor, df: pd.DataFrame) -> None:
    """Upsert company dimension records."""
    columns = ["sector_id", "company_name", "ticker_symbol", "isin", "nse_symbol", "bse_code"]
    rows = _records(df, columns)
    if not rows:
        return

    execute_values(
        cursor,
        """
        INSERT INTO dim_company (
            sector_id,
            company_name,
            ticker_symbol,
            isin,
            nse_symbol,
            bse_code
        )
        VALUES %s
        ON CONFLICT (ticker_symbol)
        DO UPDATE SET
            sector_id = EXCLUDED.sector_id,
            company_name = EXCLUDED.company_name,
            isin = EXCLUDED.isin,
            nse_symbol = EXCLUDED.nse_symbol,
            bse_code = EXCLUDED.bse_code,
            updated_at = NOW()
        """,
        rows,
    )
    LOGGER.info("Loaded dim_company rows: %s", len(rows))


def upsert_dim_year(cursor: psycopg2.extensions.cursor, df: pd.DataFrame) -> None:
    """Upsert fiscal year dimension records."""
    rows = _records(df, ["fiscal_year", "year_start_date", "year_end_date"])
    if not rows:
        return

    execute_values(
        cursor,
        """
        INSERT INTO dim_year (fiscal_year, year_start_date, year_end_date)
        VALUES %s
        ON CONFLICT (fiscal_year)
        DO UPDATE SET
            year_start_date = EXCLUDED.year_start_date,
            year_end_date = EXCLUDED.year_end_date,
            updated_at = NOW()
        """,
        rows,
    )
    LOGGER.info("Loaded dim_year rows: %s", len(rows))


def upsert_fact_profit_loss(cursor: psycopg2.extensions.cursor, df: pd.DataFrame) -> None:
    """Upsert profit and loss fact records."""
    columns = [
        "company_id",
        "year_id",
        "revenue",
        "other_income",
        "total_income",
        "finance_costs",
        "depreciation_and_amortization",
        "other_expenses",
        "profit_before_tax",
        "tax_expense",
        "profit_after_tax",
        "basic_eps",
        "diluted_eps",
    ]
    _upsert_fact(cursor, df, "fact_profit_loss", columns, "uq_fact_profit_loss_company_year")


def upsert_fact_balance_sheet(cursor: psycopg2.extensions.cursor, df: pd.DataFrame) -> None:
    """Upsert balance sheet fact records."""
    columns = [
        "company_id",
        "year_id",
        "share_capital",
        "reserves_and_surplus",
        "total_equity",
        "long_term_borrowings",
        "short_term_borrowings",
        "total_liabilities",
        "property_plant_equipment",
        "capital_work_in_progress",
        "investments",
        "inventories",
        "trade_receivables",
        "cash_and_cash_equivalents",
        "total_assets",
    ]
    _upsert_fact(cursor, df, "fact_balance_sheet", columns, "uq_fact_balance_sheet_company_year")


def upsert_fact_cash_flow(cursor: psycopg2.extensions.cursor, df: pd.DataFrame) -> None:
    """Upsert cash flow fact records."""
    columns = [
        "company_id",
        "year_id",
        "cash_flow_from_operating_activities",
        "cash_flow_from_investing_activities",
        "cash_flow_from_financing_activities",
        "net_increase_in_cash",
        "opening_cash_and_cash_equivalents",
        "closing_cash_and_cash_equivalents",
    ]
    _upsert_fact(cursor, df, "fact_cash_flow", columns, "uq_fact_cash_flow_company_year")


def upsert_fact_analysis(cursor: psycopg2.extensions.cursor, df: pd.DataFrame) -> None:
    """Upsert analysis fact records."""
    columns = [
        "company_id",
        "analysis_period",
        "compounded_sales_growth_pct",
        "compounded_profit_growth_pct",
        "stock_price_cagr_pct",
        "roe_pct",
    ]
    _upsert_fact(cursor, df, "fact_analysis", columns, "uq_fact_analysis_company_period")


def fetch_key_map(
    cursor: psycopg2.extensions.cursor,
    table_name: str,
    natural_key: str,
    surrogate_key: str,
) -> dict[Any, int]:
    """Fetch a natural-key to surrogate-key mapping from a dimension table."""
    cursor.execute(f"SELECT {natural_key}, {surrogate_key} FROM {table_name}")
    return {row[0]: row[1] for row in cursor.fetchall()}


def _attach_fact_keys(
    df: pd.DataFrame,
    company_ids: dict[str, int],
    year_ids: dict[int, int],
) -> pd.DataFrame:
    if df.empty:
        return df

    result = df.copy()
    result["company_id"] = result["source_company_id"].map(company_ids)
    result["year_id"] = result["fiscal_year"].map(year_ids)
    return result.dropna(subset=["company_id", "year_id"])


def _attach_company_keys(df: pd.DataFrame, company_ids: dict[str, int]) -> pd.DataFrame:
    if df.empty:
        return df

    result = df.copy()
    result["company_id"] = result["source_company_id"].map(company_ids)
    return result.dropna(subset=["company_id"])


def _upsert_fact(
    cursor: psycopg2.extensions.cursor,
    df: pd.DataFrame,
    table_name: str,
    columns: list[str],
    constraint_name: str,
) -> None:
    rows = _records(df, columns)
    if not rows:
        LOGGER.info("No rows to load for %s", table_name)
        return

    update_columns = [column for column in columns if column not in {"company_id", "year_id", "analysis_period"}]
    assignments = ", ".join(f"{column} = EXCLUDED.{column}" for column in update_columns)
    sql = f"""
        INSERT INTO {table_name} ({", ".join(columns)})
        VALUES %s
        ON CONFLICT ON CONSTRAINT {constraint_name}
        DO UPDATE SET
            {assignments},
            updated_at = NOW()
    """
    execute_values(cursor, sql, rows)
    LOGGER.info("Loaded %s rows: %s", table_name, len(rows))


def _records(df: pd.DataFrame, columns: list[str]) -> list[tuple[Any, ...]]:
    if df.empty:
        return []

    missing = [column for column in columns if column not in df.columns]
    if missing:
        raise ValueError(f"Missing load columns {missing} in dataframe")

    prepared = df[columns].where(pd.notnull(df[columns]), None)
    return [
        tuple(_to_db_value(value) for value in row)
        for row in prepared.itertuples(index=False, name=None)
    ]


def _to_db_value(value: Any) -> Any:
    """Convert pandas and numpy scalar values into psycopg2-friendly values."""
    if value is None:
        return None
    # Catch pd.NA (NAType), pd.NaT, float('nan'), and numpy NaN
    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass
    if hasattr(value, "item"):
        return value.item()
    return value