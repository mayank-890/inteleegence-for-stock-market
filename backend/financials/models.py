"""Unmanaged Django models for financial warehouse tables."""

from django.db import models


class DimYear(models.Model):
    year_id = models.BigAutoField(primary_key=True)
    fiscal_year = models.IntegerField(unique=True)
    year_start_date = models.DateField()
    year_end_date = models.DateField()
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = "dim_year"

    def __str__(self) -> str:
        return str(self.fiscal_year)


class FactProfitLoss(models.Model):
    profit_loss_id = models.BigAutoField(primary_key=True)
    company = models.ForeignKey(
        "companies.DimCompany",
        on_delete=models.RESTRICT,
        db_column="company_id",
        related_name="profit_loss_records",
    )
    year = models.ForeignKey(
        "financials.DimYear",
        on_delete=models.RESTRICT,
        db_column="year_id",
        related_name="profit_loss_records",
    )
    revenue = models.DecimalField(max_digits=20, decimal_places=2, blank=True, null=True)
    other_income = models.DecimalField(max_digits=20, decimal_places=2, blank=True, null=True)
    total_income = models.DecimalField(max_digits=20, decimal_places=2, blank=True, null=True)
    cost_of_materials_consumed = models.DecimalField(
        max_digits=20,
        decimal_places=2,
        blank=True,
        null=True,
    )
    employee_benefit_expense = models.DecimalField(
        max_digits=20,
        decimal_places=2,
        blank=True,
        null=True,
    )
    finance_costs = models.DecimalField(max_digits=20, decimal_places=2, blank=True, null=True)
    depreciation_and_amortization = models.DecimalField(
        max_digits=20,
        decimal_places=2,
        blank=True,
        null=True,
    )
    other_expenses = models.DecimalField(max_digits=20, decimal_places=2, blank=True, null=True)
    profit_before_tax = models.DecimalField(max_digits=20, decimal_places=2, blank=True, null=True)
    tax_expense = models.DecimalField(max_digits=20, decimal_places=2, blank=True, null=True)
    profit_after_tax = models.DecimalField(max_digits=20, decimal_places=2, blank=True, null=True)
    basic_eps = models.DecimalField(max_digits=12, decimal_places=4, blank=True, null=True)
    diluted_eps = models.DecimalField(max_digits=12, decimal_places=4, blank=True, null=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = "fact_profit_loss"
        constraints = [
            models.UniqueConstraint(
                fields=["company", "year"],
                name="uq_fact_profit_loss_company_year",
            )
        ]

    def __str__(self) -> str:
        return f"{self.company_id} - {self.year_id}"


class FactBalanceSheet(models.Model):
    balance_sheet_id = models.BigAutoField(primary_key=True)
    company = models.ForeignKey(
        "companies.DimCompany",
        on_delete=models.RESTRICT,
        db_column="company_id",
        related_name="balance_sheet_records",
    )
    year = models.ForeignKey(
        "financials.DimYear",
        on_delete=models.RESTRICT,
        db_column="year_id",
        related_name="balance_sheet_records",
    )
    share_capital = models.DecimalField(max_digits=20, decimal_places=2, blank=True, null=True)
    reserves_and_surplus = models.DecimalField(max_digits=20, decimal_places=2, blank=True, null=True)
    total_equity = models.DecimalField(max_digits=20, decimal_places=2, blank=True, null=True)
    long_term_borrowings = models.DecimalField(max_digits=20, decimal_places=2, blank=True, null=True)
    short_term_borrowings = models.DecimalField(max_digits=20, decimal_places=2, blank=True, null=True)
    total_liabilities = models.DecimalField(max_digits=20, decimal_places=2, blank=True, null=True)
    property_plant_equipment = models.DecimalField(max_digits=20, decimal_places=2, blank=True, null=True)
    capital_work_in_progress = models.DecimalField(max_digits=20, decimal_places=2, blank=True, null=True)
    investments = models.DecimalField(max_digits=20, decimal_places=2, blank=True, null=True)
    inventories = models.DecimalField(max_digits=20, decimal_places=2, blank=True, null=True)
    trade_receivables = models.DecimalField(max_digits=20, decimal_places=2, blank=True, null=True)
    cash_and_cash_equivalents = models.DecimalField(max_digits=20, decimal_places=2, blank=True, null=True)
    total_assets = models.DecimalField(max_digits=20, decimal_places=2, blank=True, null=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = "fact_balance_sheet"
        constraints = [
            models.UniqueConstraint(
                fields=["company", "year"],
                name="uq_fact_balance_sheet_company_year",
            )
        ]

    def __str__(self) -> str:
        return f"{self.company_id} - {self.year_id}"


class FactCashFlow(models.Model):
    cash_flow_id = models.BigAutoField(primary_key=True)
    company = models.ForeignKey(
        "companies.DimCompany",
        on_delete=models.RESTRICT,
        db_column="company_id",
        related_name="cash_flow_records",
    )
    year = models.ForeignKey(
        "financials.DimYear",
        on_delete=models.RESTRICT,
        db_column="year_id",
        related_name="cash_flow_records",
    )
    cash_flow_from_operating_activities = models.DecimalField(
        max_digits=20,
        decimal_places=2,
        blank=True,
        null=True,
    )
    cash_flow_from_investing_activities = models.DecimalField(
        max_digits=20,
        decimal_places=2,
        blank=True,
        null=True,
    )
    cash_flow_from_financing_activities = models.DecimalField(
        max_digits=20,
        decimal_places=2,
        blank=True,
        null=True,
    )
    net_increase_in_cash = models.DecimalField(max_digits=20, decimal_places=2, blank=True, null=True)
    opening_cash_and_cash_equivalents = models.DecimalField(
        max_digits=20,
        decimal_places=2,
        blank=True,
        null=True,
    )
    closing_cash_and_cash_equivalents = models.DecimalField(
        max_digits=20,
        decimal_places=2,
        blank=True,
        null=True,
    )
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = "fact_cash_flow"
        constraints = [
            models.UniqueConstraint(
                fields=["company", "year"],
                name="uq_fact_cash_flow_company_year",
            )
        ]

    def __str__(self) -> str:
        return f"{self.company_id} - {self.year_id}"


class FactAnalysis(models.Model):
    analysis_id = models.BigAutoField(primary_key=True)
    company = models.ForeignKey(
        "companies.DimCompany",
        on_delete=models.RESTRICT,
        db_column="company_id",
        related_name="analysis_records",
    )
    analysis_period = models.CharField(max_length=50)
    compounded_sales_growth_pct = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
    )
    compounded_profit_growth_pct = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
    )
    stock_price_cagr_pct = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    roe_pct = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = "fact_analysis"
        constraints = [
            models.UniqueConstraint(
                fields=["company", "analysis_period"],
                name="uq_fact_analysis_company_period",
            )
        ]

    def __str__(self) -> str:
        return f"{self.company_id} - {self.analysis_period}"
