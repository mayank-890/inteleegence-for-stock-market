CREATE TABLE IF NOT EXISTS dim_sector (
    sector_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sector_name VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_dim_sector_sector_name UNIQUE (sector_name)
);

CREATE TABLE IF NOT EXISTS dim_company (
    company_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sector_id BIGINT NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    ticker_symbol VARCHAR(32) NOT NULL,
    isin VARCHAR(12),
    nse_symbol VARCHAR(32),
    bse_code VARCHAR(16),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_dim_company_sector
        FOREIGN KEY (sector_id)
        REFERENCES dim_sector (sector_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT uq_dim_company_ticker_symbol UNIQUE (ticker_symbol),
    CONSTRAINT uq_dim_company_isin UNIQUE (isin),
    CONSTRAINT chk_dim_company_isin_format
        CHECK (isin IS NULL OR isin ~ '^[A-Z]{2}[A-Z0-9]{9}[0-9]$')
);

CREATE TABLE IF NOT EXISTS dim_year (
    year_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fiscal_year INTEGER NOT NULL,
    year_start_date DATE NOT NULL,
    year_end_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_dim_year_fiscal_year UNIQUE (fiscal_year),
    CONSTRAINT chk_dim_year_fiscal_year_range
        CHECK (fiscal_year BETWEEN 1900 AND 2100),
    CONSTRAINT chk_dim_year_date_range
        CHECK (year_start_date < year_end_date)
);

CREATE TABLE IF NOT EXISTS fact_profit_loss (
    profit_loss_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id BIGINT NOT NULL,
    year_id BIGINT NOT NULL,
    revenue NUMERIC(20, 2),
    other_income NUMERIC(20, 2),
    total_income NUMERIC(20, 2),
    cost_of_materials_consumed NUMERIC(20, 2),
    employee_benefit_expense NUMERIC(20, 2),
    finance_costs NUMERIC(20, 2),
    depreciation_and_amortization NUMERIC(20, 2),
    other_expenses NUMERIC(20, 2),
    profit_before_tax NUMERIC(20, 2),
    tax_expense NUMERIC(20, 2),
    profit_after_tax NUMERIC(20, 2),
    basic_eps NUMERIC(12, 4),
    diluted_eps NUMERIC(12, 4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_fact_profit_loss_company
        FOREIGN KEY (company_id)
        REFERENCES dim_company (company_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_fact_profit_loss_year
        FOREIGN KEY (year_id)
        REFERENCES dim_year (year_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT uq_fact_profit_loss_company_year UNIQUE (company_id, year_id)
);

CREATE TABLE IF NOT EXISTS fact_balance_sheet (
    balance_sheet_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id BIGINT NOT NULL,
    year_id BIGINT NOT NULL,
    share_capital NUMERIC(20, 2),
    reserves_and_surplus NUMERIC(20, 2),
    total_equity NUMERIC(20, 2),
    long_term_borrowings NUMERIC(20, 2),
    short_term_borrowings NUMERIC(20, 2),
    total_liabilities NUMERIC(20, 2),
    property_plant_equipment NUMERIC(20, 2),
    capital_work_in_progress NUMERIC(20, 2),
    investments NUMERIC(20, 2),
    inventories NUMERIC(20, 2),
    trade_receivables NUMERIC(20, 2),
    cash_and_cash_equivalents NUMERIC(20, 2),
    total_assets NUMERIC(20, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_fact_balance_sheet_company
        FOREIGN KEY (company_id)
        REFERENCES dim_company (company_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_fact_balance_sheet_year
        FOREIGN KEY (year_id)
        REFERENCES dim_year (year_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT uq_fact_balance_sheet_company_year UNIQUE (company_id, year_id)
);

CREATE TABLE IF NOT EXISTS fact_cash_flow (
    cash_flow_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id BIGINT NOT NULL,
    year_id BIGINT NOT NULL,
    cash_flow_from_operating_activities NUMERIC(20, 2),
    cash_flow_from_investing_activities NUMERIC(20, 2),
    cash_flow_from_financing_activities NUMERIC(20, 2),
    net_increase_in_cash NUMERIC(20, 2),
    opening_cash_and_cash_equivalents NUMERIC(20, 2),
    closing_cash_and_cash_equivalents NUMERIC(20, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_fact_cash_flow_company
        FOREIGN KEY (company_id)
        REFERENCES dim_company (company_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_fact_cash_flow_year
        FOREIGN KEY (year_id)
        REFERENCES dim_year (year_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT uq_fact_cash_flow_company_year UNIQUE (company_id, year_id)
);

CREATE TABLE IF NOT EXISTS fact_analysis (
    analysis_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id BIGINT NOT NULL,
    analysis_period VARCHAR(50) NOT NULL,
    compounded_sales_growth_pct NUMERIC(10, 2),
    compounded_profit_growth_pct NUMERIC(10, 2),
    stock_price_cagr_pct NUMERIC(10, 2),
    roe_pct NUMERIC(10, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_fact_analysis_company
        FOREIGN KEY (company_id)
        REFERENCES dim_company (company_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT uq_fact_analysis_company_period UNIQUE (company_id, analysis_period)
);

CREATE INDEX IF NOT EXISTS idx_dim_company_sector_id
    ON dim_company (sector_id);

CREATE INDEX IF NOT EXISTS idx_fact_profit_loss_company_id
    ON fact_profit_loss (company_id);

CREATE INDEX IF NOT EXISTS idx_fact_profit_loss_year_id
    ON fact_profit_loss (year_id);

CREATE INDEX IF NOT EXISTS idx_fact_balance_sheet_company_id
    ON fact_balance_sheet (company_id);

CREATE INDEX IF NOT EXISTS idx_fact_balance_sheet_year_id
    ON fact_balance_sheet (year_id);

CREATE INDEX IF NOT EXISTS idx_fact_cash_flow_company_id
    ON fact_cash_flow (company_id);

CREATE INDEX IF NOT EXISTS idx_fact_cash_flow_year_id
    ON fact_cash_flow (year_id);

CREATE INDEX IF NOT EXISTS idx_fact_analysis_company_id
    ON fact_analysis (company_id);
