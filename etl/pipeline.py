"""Runnable ETL pipeline for the Nifty 100 warehouse."""

from __future__ import annotations

import argparse
import logging
import sys

from etl.config import get_config
from etl.extract import read_source_files
from etl.load import connect, ensure_schema, load_warehouse_tables
from etl.transform import transform_sources


LOGGER = logging.getLogger(__name__)


def configure_logging() -> None:
    """Configure process logging."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s - %(message)s",
    )


def parse_args() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Load Nifty 100 financial data into PostgreSQL.")
    parser.add_argument(
        "--skip-schema",
        action="store_true",
        help="Do not apply schema.sql before loading data.",
    )
    return parser.parse_args()


def run(skip_schema: bool = False) -> None:
    """Run extract, transform, and load steps."""
    config = get_config()
    LOGGER.info("Starting ETL from %s", config.data_dir)

    sources = read_source_files(config.data_dir)
    tables = transform_sources(sources, config.default_sector_name)

    connection = connect(config.database)
    try:
        if not skip_schema:
            ensure_schema(connection, config.schema_path)
        load_warehouse_tables(connection, tables)
    finally:
        connection.close()

    LOGGER.info("ETL completed successfully")


def main() -> int:
    """CLI entrypoint."""
    configure_logging()
    args = parse_args()
    try:
        run(skip_schema=args.skip_schema)
    except Exception:
        LOGGER.exception("ETL failed")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
