from rest_framework import serializers


class RevenueTrendResultSerializer(serializers.Serializer):
    direction = serializers.ChoiceField(choices=["growing", "declining", "flat"])
    slope = serializers.FloatField()
    r2_score = serializers.FloatField()
    years_analyzed = serializers.IntegerField()


class ProfitMarginYearSerializer(serializers.Serializer):
    year = serializers.IntegerField()
    revenue = serializers.FloatField(allow_null=True)
    profit_after_tax = serializers.FloatField(allow_null=True)
    margin_pct = serializers.FloatField(allow_null=True)
    trend = serializers.CharField(allow_null=True)


class ProfitMarginResultSerializer(serializers.Serializer):
    overall_trend = serializers.ChoiceField(choices=["improving", "deteriorating", "flat"])
    average_margin_pct = serializers.FloatField(allow_null=True)
    yearly_margins = ProfitMarginYearSerializer(many=True)


class EPSGrowthYearSerializer(serializers.Serializer):
    year = serializers.IntegerField()
    eps = serializers.FloatField(allow_null=True)
    growth_pct = serializers.FloatField(allow_null=True)


class GrowthPointSerializer(serializers.Serializer):
    year = serializers.IntegerField()
    growth_pct = serializers.FloatField(allow_null=True)


class EPSGrowthResultSerializer(serializers.Serializer):
    yearly_growth = EPSGrowthYearSerializer(many=True)
    best_year = GrowthPointSerializer()
    worst_year = GrowthPointSerializer()


class AnomalyPointSerializer(serializers.Serializer):
    year = serializers.IntegerField()
    value = serializers.FloatField(allow_null=True)
    z_score = serializers.FloatField(allow_null=True)


class AnomalyMetricsSerializer(serializers.Serializer):
    revenue = AnomalyPointSerializer(many=True)
    profit_after_tax = AnomalyPointSerializer(many=True)
    basic_eps = AnomalyPointSerializer(many=True)


class AnomaliesResultSerializer(serializers.Serializer):
    threshold = serializers.FloatField()
    anomaly_count = serializers.IntegerField()
    metrics = AnomalyMetricsSerializer()


class ScreenerScoreComponentsSerializer(serializers.Serializer):
    revenue_growth_trend = serializers.FloatField()
    profit_margin_average = serializers.FloatField()
    eps_consistency = serializers.FloatField()
    absence_of_anomalies = serializers.FloatField()


class ScreenerScoreSummarySerializer(serializers.Serializer):
    revenue_direction = serializers.CharField()
    average_margin_pct = serializers.FloatField(allow_null=True)
    anomaly_count = serializers.IntegerField()


class ScreenerScoreResultSerializer(serializers.Serializer):
    score = serializers.FloatField()
    components = ScreenerScoreComponentsSerializer()
    summary = ScreenerScoreSummarySerializer()


class RevenueTrendResponseSerializer(serializers.Serializer):
    company = serializers.CharField()
    metric = serializers.CharField()
    result = RevenueTrendResultSerializer()
    computed_at = serializers.DateTimeField()


class ProfitMarginResponseSerializer(serializers.Serializer):
    company = serializers.CharField()
    metric = serializers.CharField()
    result = ProfitMarginResultSerializer()
    computed_at = serializers.DateTimeField()


class EPSGrowthResponseSerializer(serializers.Serializer):
    company = serializers.CharField()
    metric = serializers.CharField()
    result = EPSGrowthResultSerializer()
    computed_at = serializers.DateTimeField()


class AnomaliesResponseSerializer(serializers.Serializer):
    company = serializers.CharField()
    metric = serializers.CharField()
    result = AnomaliesResultSerializer()
    computed_at = serializers.DateTimeField()


class ScreenerScoreResponseSerializer(serializers.Serializer):
    company = serializers.CharField()
    metric = serializers.CharField()
    result = ScreenerScoreResultSerializer()
    computed_at = serializers.DateTimeField()

