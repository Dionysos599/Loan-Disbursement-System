-- init database tables
CREATE TABLE IF NOT EXISTS loans (
    loan_id VARCHAR(50) PRIMARY KEY,
    loan_amount DECIMAL(18,2) NOT NULL,
    start_date DATE NOT NULL,
    maturity_date DATE NOT NULL,
    extended_date DATE,
    property_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loan_progress (
    id SERIAL PRIMARY KEY,
    loan_id VARCHAR(50) REFERENCES loans(loan_id),
    as_of_date DATE NOT NULL,
    percent_complete DECIMAL(5,4) CHECK (percent_complete >= 0 AND percent_complete <= 1),
    outstanding_balance DECIMAL(18,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loan_schedule (
    id SERIAL PRIMARY KEY,
    loan_id VARCHAR(50) REFERENCES loans(loan_id),
    month DATE NOT NULL,
    cum_amount DECIMAL(18,2),
    monthly_amount DECIMAL(18,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_loan_progress_loan_id ON loan_progress(loan_id);
CREATE INDEX idx_loan_schedule_loan_id ON loan_schedule(loan_id);