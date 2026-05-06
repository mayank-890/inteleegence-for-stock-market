"""Extraction layer for Nifty 100 source files."""

from __future__ import annotations

import logging
from pathlib import Path

import pandas as pd


SUPPORTED_EXTENSIONS = {".csv", ".xlsx", ".xls"}
LOGGER = logging.getLogger(__name__)


def read_source_files(data_dir: Path) -> dict[str, pd.DataFrame]:
    """Read all supported source files from the configured data directory."""
    if not data_dir.exists() or not data_dir.is_dir():
        raise FileNotFoundError(f"Data directory does not exist: {data_dir}")

    files = sorted(
        path for path in data_dir.iterdir() if path.suffix.lower() in SUPPORTED_EXTENSIONS
    )
    if not files:
        raise FileNotFoundError(f"No CSV or Excel files found in: {data_dir}")

    datasets: dict[str, pd.DataFrame] = {}
    for path in files:
        dataset_name = _dataset_name(path)
        datasets[dataset_name] = _read_table(path)
        LOGGER.info("Extracted %s with %s rows", path.name, len(datasets[dataset_name]))

    return datasets


def _dataset_name(path: Path) -> str:
    """Return a normalized dataset key for a source file."""
    return path.stem.lower().replace(" ", "_").replace("&", "and")


def _read_table(path: Path) -> pd.DataFrame:
    """Read one source file and normalize its header row."""
    suffix = path.suffix.lower()
    if suffix == ".csv":
        raw = pd.read_csv(path, header=None, dtype=object)
    elif suffix in {".xlsx", ".xls"}:
        raw = pd.read_excel(path, header=None, dtype=object)
    else:
        raise ValueError(f"Unsupported file extension: {path.suffix}")

    header_index = _find_header_row(raw)
    header = raw.iloc[header_index].astype(str).str.strip().tolist()
    data = raw.iloc[header_index + 1 :].copy()
    data.columns = header
    data = data.dropna(how="all").reset_index(drop=True)
    data = data.loc[:, ~data.columns.duplicated()]

    return data


def _find_header_row(raw: pd.DataFrame) -> int:
    """Locate the row containing column names in exports with title rows."""
    for index, row in raw.iterrows():
        values = {str(value).strip().lower() for value in row.dropna().tolist()}
        if {"id", "company_id"} & values:
            return int(index)

    raise ValueError("Unable to detect header row in source file")
