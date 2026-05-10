from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler


class AnalyticsError(ValueError):
    """Base exception for analytics computation failures."""


class InsufficientDataError(AnalyticsError):
    """Raised when there is not enough historical data to compute a metric."""


@dataclass(frozen=True)
class DataRequirement:
    columns: tuple[str, ...]
    minimum_rows: int = 3


def compute_revenue_trend(frame: pd.DataFrame) -> dict:
    prepared = _prepare_frame(frame, DataRequirement(("year", "revenue")))

    model = LinearRegression()
    x_values = prepared[["year"]].to_numpy(dtype=float)
    y_values = prepared["revenue"].to_numpy(dtype=float)
    model.fit(x_values, y_values)

    slope = float(model.coef_[0])
    r2_score = float(model.score(x_values, y_values))
    average_revenue = float(np.mean(np.abs(y_values))) if len(y_values) else 0.0
    slope_ratio = (slope / average_revenue) if average_revenue else 0.0

    if abs(slope_ratio) < 0.01:
        direction = "flat"
    elif slope > 0:
        direction = "growing"
    else:
        direction = "declining"

    return {
        "direction": direction,
        "slope": round(slope, 4),
        "r2_score": round(r2_score, 4),
        "years_analyzed": int(len(prepared)),
    }


def compute_profit_margin_analysis(frame: pd.DataFrame) -> dict:
    prepared = _prepare_frame(frame, DataRequirement(("year", "revenue", "profit_after_tax")))
    prepared = prepared[prepared["revenue"] != 0].copy()
    _ensure_minimum_rows(prepared, 3, "Profit margin analysis requires at least 3 years of non-zero revenue data.")

    prepared["margin_pct"] = (prepared["profit_after_tax"] / prepared["revenue"]) * 100.0
    prepared["yoy_change"] = prepared["margin_pct"].diff()
    prepared["trend"] = prepared["yoy_change"].apply(_margin_direction)

    overall_change = float(prepared["margin_pct"].iloc[-1] - prepared["margin_pct"].iloc[0])
    if abs(overall_change) < 0.5:
        overall_trend = "flat"
    elif overall_change > 0:
        overall_trend = "improving"
    else:
        overall_trend = "deteriorating"

    yearly_margins = []
    for row in prepared.itertuples(index=False):
        yearly_margins.append(
            {
                "year": int(row.year),
                "revenue": _round_or_none(row.revenue),
                "profit_after_tax": _round_or_none(row.profit_after_tax),
                "margin_pct": _round_or_none(row.margin_pct),
                "trend": row.trend,
            }
        )

    return {
        "overall_trend": overall_trend,
        "average_margin_pct": _round_or_none(prepared["margin_pct"].mean()),
        "yearly_margins": yearly_margins,
    }


def compute_eps_growth(frame: pd.DataFrame) -> dict:
    prepared = _prepare_frame(frame, DataRequirement(("year", "basic_eps")))
    prepared["growth_pct"] = prepared["basic_eps"].pct_change() * 100.0

    yearly_growth = []
    for row in prepared.itertuples(index=False):
        yearly_growth.append(
            {
                "year": int(row.year),
                "eps": _round_or_none(row.basic_eps),
                "growth_pct": _round_or_none(row.growth_pct),
            }
        )

    growth_rows = prepared.dropna(subset=["growth_pct"]).copy()
    if growth_rows.empty:
        raise InsufficientDataError("EPS growth analysis requires changes across at least 3 years of EPS data.")

    best_row = growth_rows.loc[growth_rows["growth_pct"].idxmax()]
    worst_row = growth_rows.loc[growth_rows["growth_pct"].idxmin()]

    return {
        "yearly_growth": yearly_growth,
        "best_year": {
            "year": int(best_row["year"]),
            "growth_pct": _round_or_none(best_row["growth_pct"]),
        },
        "worst_year": {
            "year": int(worst_row["year"]),
            "growth_pct": _round_or_none(worst_row["growth_pct"]),
        },
    }


def compute_anomalies(frame: pd.DataFrame) -> dict:
    prepared = _prepare_frame(
        frame,
        DataRequirement(("year", "revenue", "profit_after_tax", "basic_eps")),
    )

    metrics = ("revenue", "profit_after_tax", "basic_eps")
    anomalies: dict[str, list[dict]] = {}
    anomaly_count = 0

    for metric in metrics:
        metric_frame = prepared[["year", metric]].dropna().copy()
        if len(metric_frame) < 3:
            anomalies[metric] = []
            continue

        z_scores = StandardScaler().fit_transform(metric_frame[[metric]]).ravel()
        metric_frame["z_score"] = z_scores
        metric_anomalies = metric_frame[np.abs(metric_frame["z_score"]) > 2]

        anomalies[metric] = [
            {
                "year": int(row.year),
                "value": _round_or_none(row.__getattribute__(metric)),
                "z_score": _round_or_none(row.z_score),
            }
            for row in metric_anomalies.itertuples(index=False)
        ]
        anomaly_count += len(anomalies[metric])

    return {
        "threshold": 2.0,
        "anomaly_count": anomaly_count,
        "metrics": anomalies,
    }


def compute_screener_score(frame: pd.DataFrame) -> dict:
    revenue_trend = compute_revenue_trend(frame)
    profit_margin = compute_profit_margin_analysis(frame)
    eps_growth = compute_eps_growth(frame)
    anomalies = compute_anomalies(frame)

    revenue_score = _score_revenue_trend(revenue_trend)
    margin_score = _clamp(profit_margin["average_margin_pct"] or 0.0, 0.0, 25.0)
    eps_score = _score_eps_consistency(eps_growth)
    anomaly_score = _score_anomaly_absence(anomalies, frame)

    total_score = revenue_score + margin_score + eps_score + anomaly_score

    return {
        "score": round(total_score, 2),
        "components": {
            "revenue_growth_trend": round(revenue_score, 2),
            "profit_margin_average": round(margin_score, 2),
            "eps_consistency": round(eps_score, 2),
            "absence_of_anomalies": round(anomaly_score, 2),
        },
        "summary": {
            "revenue_direction": revenue_trend["direction"],
            "average_margin_pct": profit_margin["average_margin_pct"],
            "anomaly_count": anomalies["anomaly_count"],
        },
    }


def _prepare_frame(frame: pd.DataFrame, requirement: DataRequirement) -> pd.DataFrame:
    prepared = frame.copy()
    for column in requirement.columns:
        prepared[column] = pd.to_numeric(prepared[column], errors="coerce")

    prepared = prepared.dropna(subset=requirement.columns).sort_values("year").reset_index(drop=True)
    _ensure_minimum_rows(
        prepared,
        requirement.minimum_rows,
        f"At least {requirement.minimum_rows} years of data are required for this analysis.",
    )
    return prepared


def _ensure_minimum_rows(frame: pd.DataFrame, minimum_rows: int, message: str) -> None:
    if len(frame) < minimum_rows:
        raise InsufficientDataError(message)


def _margin_direction(change: float | None) -> str | None:
    if pd.isna(change):
        return None
    if abs(change) < 0.5:
        return "flat"
    if change > 0:
        return "improving"
    return "deteriorating"


def _score_revenue_trend(revenue_trend: dict) -> float:
    direction = revenue_trend["direction"]
    r2_score = revenue_trend["r2_score"]

    if direction == "growing":
        base_score = 18.0
    elif direction == "flat":
        base_score = 10.0
    else:
        base_score = 3.0

    return _clamp(base_score + (r2_score * 7.0), 0.0, 25.0)


def _score_eps_consistency(eps_growth: dict) -> float:
    growth_values = [
        entry["growth_pct"]
        for entry in eps_growth["yearly_growth"]
        if entry["growth_pct"] is not None
    ]
    if not growth_values:
        return 0.0

    volatility = float(np.std(growth_values))
    if volatility <= 10:
        return 25.0
    if volatility <= 20:
        return 20.0
    if volatility <= 35:
        return 15.0
    if volatility <= 50:
        return 10.0
    return 5.0


def _score_anomaly_absence(anomalies: dict, frame: pd.DataFrame) -> float:
    total_points = max(len(frame) * 3, 1)
    anomaly_ratio = anomalies["anomaly_count"] / total_points
    return _clamp(25.0 * (1.0 - anomaly_ratio), 0.0, 25.0)


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, float(value)))


def _round_or_none(value: float | int | None, digits: int = 4) -> float | None:
    if value is None or pd.isna(value):
        return None
    return round(float(value), digits)

