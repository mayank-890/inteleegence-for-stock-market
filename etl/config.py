"""Configuration helpers for the Nifty 100 ETL pipeline."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def load_env_file(env_path: Path | None = None) -> None:
    """Load key-value pairs from a local .env file without overriding env vars."""
    path = env_path or PROJECT_ROOT / ".env"
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


@dataclass(frozen=True)
class DatabaseConfig:
    """PostgreSQL connection settings."""

    dbname: str
    user: str
    password: str
    host: str
    port: int


@dataclass(frozen=True)
class EtlConfig:
    """Runtime settings for the ETL pipeline."""

    data_dir: Path
    schema_path: Path
    default_sector_name: str
    database: DatabaseConfig


def get_config() -> EtlConfig:
    """Build ETL configuration from environment variables."""
    load_env_file()

    required_vars = ("DB_NAME", "DB_USER", "DB_PASSWORD", "DB_HOST", "DB_PORT")
    missing = [name for name in required_vars if not os.getenv(name)]
    if missing:
        missing_names = ", ".join(missing)
        raise ValueError(f"Missing required database environment variables: {missing_names}")

    data_dir = Path(os.getenv("DATA_DIR", PROJECT_ROOT / "data" / "n100")).resolve()
    schema_path = Path(os.getenv("SCHEMA_PATH", PROJECT_ROOT / "schema.sql")).resolve()

    return EtlConfig(
        data_dir=data_dir,
        schema_path=schema_path,
        default_sector_name=os.getenv("DEFAULT_SECTOR_NAME", "Unclassified"),
        database=DatabaseConfig(
            dbname=os.environ["DB_NAME"],
            user=os.environ["DB_USER"],
            password=os.environ["DB_PASSWORD"],
            host=os.environ["DB_HOST"],
            port=int(os.environ["DB_PORT"]),
        ),
    )
