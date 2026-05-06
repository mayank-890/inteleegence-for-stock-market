"""Transformation layer for the Nifty 100 warehouse star schema."""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date
from typing import Any

import pandas as pd


NULL_VALUES = {"", "-", "--", "nan", "none", "null", "n/a", "na"}
YEAR_RE = re.compile(r"(?P<year>\d{2,4})")
PERCENT_RE = re.compile(r"(?P<value>-?[\d,.]+)\s*%?")


@dataclass(frozen=True)
class WarehouseTables:
    """Transformed dimension and fact tables ready for loading."""

    dim_sector: pd.DataFrame
    dim_company: pd.DataFrame
    dim_year: pd.DataFrame
    fact_profit_loss: pd.DataFrame
    fact_balance_sheet: pd.DataFrame
    fact_cash_flow: pd.DataFrame
    fact_analysis: pd.DataFrame


def transform_sources(
    sources: dict[str, pd.DataFrame],
    default_sector_name: str,
) -> WarehouseTables:
    """Transform source datasets into star-schema dataframes."""
    cleaned = {name: clean_dataframe(df) for name, df in sources.items()}

    companies = _required_dataset(cleaned, "companies")
    profit_loss = _optional_dataset(cleaned, "profitandloss")
    balance_sheet = _optional_dataset(cleaned, "balancesheet")
    cash_flow = _optional_dataset(cleaned, "cashflow")
    analysis = _optional_dataset(cleaned, "analysis")

    dim_company = build_dim_company(companies, default_sector_name)
    dim_sector = build_dim_sector(dim_company)
    dim_year = build_dim_year([profit_loss, balance_sheet, cash_flow])

    return WarehouseTables(
        dim_sector=dim_sector,
        dim_company=dim_company,
        dim_year=dim_year,
        fact_profit_loss=build_fact_profit_loss(profit_loss),
        fact_balance_sheet=build_fact_balance_sheet(balance_sheet),
        fact_cash_flow=build_fact_cash_flow(cash_flow),
        fact_analysis=build_fact_analysis(analysis),
    )


def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize column names, strings, and null-like values."""
    cleaned = df.copy()
    cleaned.columns = [_normalize_column_name(column) for column in cleaned.columns]

    for column in cleaned.columns:
        cleaned[column] = cleaned[column].map(_clean_cell)

    return cleaned.dropna(how="all").reset_index(drop=True)


def build_dim_sector(companies: pd.DataFrame) -> pd.DataFrame:
    """Build the sector dimension from company records."""
    return (
        companies[["sector_name"]]
        .dropna()
        .drop_duplicates()
        .sort_values("sector_name")
        .reset_index(drop=True)
    )


def build_dim_company(companies: pd.DataFrame, default_sector_name: str) -> pd.DataFrame:
    """Build the company dimension from company source data."""
    required = {"id", "company_name"}
    missing = required - set(companies.columns)
    if missing:
        raise ValueError(f"companies dataset missing required columns: {sorted(missing)}")

    sector_column = _first_existing_column(companies, ["sector_name", "sector", "industry"])
    sector_value = default_sector_name.strip()
    result = pd.DataFrame(
        {
            "source_company_id": companies["id"].map(normalize_symbol),
            "company_name": companies["company_name"].map(normalize_company_name),
            "ticker_symbol": companies["id"].map(normalize_symbol),
            "isin": _column_or_none(companies, "isin"),
            "nse_symbol": _extract_nse_symbol(companies),
            "bse_code": _extract_bse_code(companies),
            "sector_name": (
                companies[sector_column].map(normalize_company_name)
                if sector_column
                else sector_value
            ),
        }
    )
    result["sector_name"] = result["sector_name"].fillna(sector_value)

    return (
        result.dropna(subset=["source_company_id", "company_name", "ticker_symbol"])
        .drop_duplicates(subset=["ticker_symbol"])
        .sort_values("ticker_symbol")
        .reset_index(drop=True)
    )


def build_dim_year(fact_sources: list[pd.DataFrame]) -> pd.DataFrame:
    """Build the fiscal year dimension from all yearly fact sources."""
    years: set[int] = set()
    for df in fact_sources:
        if "year" not in df.columns or df.empty:
            continue
        years.update(year for year in df["year"].map(parse_fiscal_year).dropna().astype(int))

    records = [
        {
            "fiscal_year": fiscal_year,
            "year_start_date": date(fiscal_year - 1, 4, 1),
            "year_end_date": date(fiscal_year, 3, 31),
        }
        for fiscal_year in sorted(years)
    ]
    return pd.DataFrame(records)


def build_fact_profit_loss(df: pd.DataFrame) -> pd.DataFrame:
    """Build profit and loss fact records."""
    if df.empty:
        return pd.DataFrame()

    result = pd.DataFrame(
        {
            "source_company_id": df["company_id"].map(normalize_symbol),
            "fiscal_year": df["year"].map(parse_fiscal_year),
            "revenue": to_numeric(_column_or_none(df, "sales")),
            "other_income": to_numeric(_column_or_none(df, "other_income")),
            "total_income": (
                to_numeric(_column_or_none(df, "sales"))
                + to_numeric(_column_or_none(df, "other_income")).fillna(0)
            ),
            "finance_costs": to_numeric(_column_or_none(df, "interest")),
            "depreciation_and_amortization": to_numeric(_column_or_none(df, "depreciation")),
            "other_expenses": to_numeric(_column_or_none(df, "expenses")),
            "profit_before_tax": to_numeric(_column_or_none(df, "profit_before_tax")),
            "tax_expense": _tax_expense(df),
            "profit_after_tax": to_numeric(_column_or_none(df, "net_profit")),
            "basic_eps": to_numeric(_column_or_none(df, "eps")),
            "diluted_eps": None,
        }
    )
    return _dedupe_fact(result, ["source_company_id", "fiscal_year"])


def build_fact_balance_sheet(df: pd.DataFrame) -> pd.DataFrame:
    """Build balance sheet fact records."""
    if df.empty:
        return pd.DataFrame()

    equity_capital = to_numeric(_column_or_none(df, "equity_capital"))
    reserves = to_numeric(_column_or_none(df, "reserves"))
    result = pd.DataFrame(
        {
            "source_company_id": df["company_id"].map(normalize_symbol),
            "fiscal_year": df["year"].map(parse_fiscal_year),
            "share_capital": equity_capital,
            "reserves_and_surplus": reserves,
            "total_equity": equity_capital.fillna(0) + reserves.fillna(0),
            "long_term_borrowings": to_numeric(_column_or_none(df, "borrowings")),
            "short_term_borrowings": None,
            "total_liabilities": to_numeric(_column_or_none(df, "total_liabilities")),
            "property_plant_equipment": to_numeric(_column_or_none(df, "fixed_assets")),
            "capital_work_in_progress": to_numeric(_column_or_none(df, "cwip")),
            "investments": to_numeric(_column_or_none(df, "investments")),
            "inventories": None,
            "trade_receivables": None,
            "cash_and_cash_equivalents": None,
            "total_assets": to_numeric(_column_or_none(df, "total_assets")),
        }
    )
    return _dedupe_fact(result, ["source_company_id", "fiscal_year"])


def build_fact_cash_flow(df: pd.DataFrame) -> pd.DataFrame:
    """Build cash flow fact records."""
    if df.empty:
        return pd.DataFrame()

    result = pd.DataFrame(
        {
            "source_company_id": df["company_id"].map(normalize_symbol),
            "fiscal_year": df["year"].map(parse_fiscal_year),
            "cash_flow_from_operating_activities": to_numeric(
                _column_or_none(df, "operating_activity")
            ),
            "cash_flow_from_investing_activities": to_numeric(
                _column_or_none(df, "investing_activity")
            ),
            "cash_flow_from_financing_activities": to_numeric(
                _column_or_none(df, "financing_activity")
            ),
            "net_increase_in_cash": to_numeric(_column_or_none(df, "net_cash_flow")),
            "opening_cash_and_cash_equivalents": None,
            "closing_cash_and_cash_equivalents": None,
        }
    )
    return _dedupe_fact(result, ["source_company_id", "fiscal_year"])


def build_fact_analysis(df: pd.DataFrame) -> pd.DataFrame:
    """Build analysis fact records."""
    if df.empty:
        return pd.DataFrame()

    rows: list[dict[str, Any]] = []
    for _, source in df.iterrows():
        sales_period, sales_value = parse_period_percent(source.get("compounded_sales_growth"))
        profit_period, profit_value = parse_period_percent(source.get("compounded_profit_growth"))
        cagr_period, cagr_value = parse_period_percent(source.get("stock_price_cagr"))
        roe_period, roe_value = parse_period_percent(source.get("roe"))
        period = sales_period or profit_period or cagr_period or roe_period
        if not period:
            continue

        rows.append(
            {
                "source_company_id": normalize_symbol(source.get("company_id")),
                "analysis_period": period,
                "compounded_sales_growth_pct": sales_value,
                "compounded_profit_growth_pct": profit_value,
                "stock_price_cagr_pct": cagr_value,
                "roe_pct": roe_value,
            }
        )

    result = pd.DataFrame(rows)
    if result.empty:
        return result
    return _dedupe_fact(result, ["source_company_id", "analysis_period"])


def normalize_symbol(value: Any) -> str | None:
    """Normalize a source company symbol."""
    if value is None or pd.isna(value):
        return None
    symbol = re.sub(r"\s+", "", str(value).strip().upper())
    return symbol or None


def normalize_company_name(value: Any) -> str | None:
    """Normalize company and sector names."""
    if value is None or pd.isna(value):
        return None
    name = re.sub(r"\s+", " ", str(value).replace("\n", " ").strip())
    return name or None


def parse_fiscal_year(value: Any) -> int | None:
    """Convert year-like values into a four-digit fiscal year."""
    if value is None or pd.isna(value):
        return None

    text = str(value).strip()
    match = YEAR_RE.search(text)
    if not match:
        return None

    year = int(match.group("year"))
    if year < 100:
        year += 2000 if year < 70 else 1900
    return year


def parse_period_percent(value: Any) -> tuple[str | None, float | None]:
    """Extract a period label and percentage value from analysis text."""
    if value is None or pd.isna(value):
        return None, None

    text = normalize_company_name(value)
    if not text:
        return None, None

    matches = list(PERCENT_RE.finditer(text))
    match = matches[-1] if matches else None
    if not match:
        return text, None

    period_text = text[: match.start()].rstrip(" :")
    period = normalize_company_name(period_text)
    numeric_value = float(match.group("value").replace(",", ""))
    return period, numeric_value


def to_numeric(series: pd.Series) -> pd.Series:
    """Convert a series to numeric values."""
    return pd.to_numeric(
        series.astype("string").str.replace(",", "", regex=False).str.replace("%", "", regex=False),
        errors="coerce",
    )


def _required_dataset(sources: dict[str, pd.DataFrame], name: str) -> pd.DataFrame:
    if name not in sources:
        raise ValueError(f"Missing required dataset: {name}")
    return sources[name]


def _optional_dataset(sources: dict[str, pd.DataFrame], name: str) -> pd.DataFrame:
    return sources.get(name, pd.DataFrame())


def _normalize_column_name(column: Any) -> str:
    text = str(column).strip().lower()
    text = text.replace("&", "and")
    text = re.sub(r"[^a-z0-9]+", "_", text)
    return text.strip("_")


def _clean_cell(value: Any) -> Any:
    if value is None or pd.isna(value):
        return None
    if isinstance(value, str):
        cleaned = re.sub(r"\s+", " ", value.strip())
        return None if cleaned.lower() in NULL_VALUES else cleaned
    return value


def _column_or_none(df: pd.DataFrame, column: str) -> pd.Series:
    if column in df.columns:
        return df[column]
    return pd.Series([None] * len(df), index=df.index)


def _first_existing_column(df: pd.DataFrame, candidates: list[str]) -> str | None:
    for candidate in candidates:
        if candidate in df.columns:
            return candidate
    return None


def _extract_nse_symbol(companies: pd.DataFrame) -> pd.Series:
    if "nse_profile" not in companies.columns:
        return companies["id"].map(normalize_symbol)

    extracted = companies["nse_profile"].astype("string").str.extract(r"symbol=([^&/]+)", expand=False)
    return extracted.fillna(companies["id"]).map(normalize_symbol)


def _extract_bse_code(companies: pd.DataFrame) -> pd.Series:
    if "bse_profile" not in companies.columns:
        return _column_or_none(companies, "bse_code")

    return companies["bse_profile"].astype("string").str.extract(r"/(\d{3,})/?$", expand=False)


def _tax_expense(df: pd.DataFrame) -> pd.Series:
    pbt = to_numeric(_column_or_none(df, "profit_before_tax"))
    tax_percentage = to_numeric(_column_or_none(df, "tax_percentage"))
    return (pbt * tax_percentage / 100).round(2)


def _dedupe_fact(df: pd.DataFrame, subset: list[str]) -> pd.DataFrame:
    result = (
        df.dropna(subset=subset)
        .drop_duplicates(subset=subset, keep="last")
        .reset_index(drop=True)
    )
    if "fiscal_year" in result.columns:
        result["fiscal_year"] = result["fiscal_year"].astype(int)
    return result
