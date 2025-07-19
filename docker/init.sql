-- 创建用户（如果不存在）
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'loan_user') THEN
      CREATE USER loan_user WITH PASSWORD 'loan_password';
   END IF;
END
$$;

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE loan_disbursement TO loan_user;

-- 使用数据库
\c loan_disbursement;

-- 创建贷款表
CREATE TABLE IF NOT EXISTS loans (
    id BIGSERIAL PRIMARY KEY,
    loan_number VARCHAR(255) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    loan_amount DECIMAL(15,2) NOT NULL,
    outstanding_balance DECIMAL(15,2) NOT NULL,
    disbursed_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建贷款进度表
CREATE TABLE IF NOT EXISTS loan_progress (
    id BIGSERIAL PRIMARY KEY,
    loan_id BIGINT REFERENCES loans(id) ON DELETE CASCADE,
    progress_date DATE NOT NULL,
    percentage_complete DECIMAL(5,2) NOT NULL,
    actual_disbursement DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建贷款时间表
CREATE TABLE IF NOT EXISTS loan_schedule (
    id BIGSERIAL PRIMARY KEY,
    loan_id BIGINT REFERENCES loans(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    scheduled_amount DECIMAL(15,2) NOT NULL,
    actual_amount DECIMAL(15,2),
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建上传历史表
CREATE TABLE IF NOT EXISTS upload_history (
    id BIGSERIAL PRIMARY KEY,
    batch_id VARCHAR(255) UNIQUE NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size BIGINT,
    total_records INTEGER,
    processed_records INTEGER,
    failed_records INTEGER,
    upload_status VARCHAR(50) NOT NULL,
    forecast_start_date VARCHAR(20),
    uploaded_at TIMESTAMP NOT NULL,
    processed_at TIMESTAMP,
    error_message TEXT,
    output_csv_path VARCHAR(500),
    forecast_csv_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入示例数据
INSERT INTO loans (loan_number, customer_name, loan_amount, outstanding_balance, disbursed_amount, status) VALUES
('LOAN001', 'ABC Construction Corp', 1000000.00, 500000.00, 500000.00, 'ACTIVE'),
('LOAN002', 'XYZ Development LLC', 2500000.00, 750000.00, 1750000.00, 'ACTIVE'),
('LOAN003', 'DEF Holdings Inc', 1500000.00, 1500000.00, 0.00, 'PENDING')
ON CONFLICT (loan_number) DO NOTHING;

CREATE INDEX idx_loan_progress_loan_id ON loan_progress(loan_id);
CREATE INDEX idx_loan_schedule_loan_id ON loan_schedule(loan_id);

-- 授予所有表的权限给loan_user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO loan_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO loan_user;
GRANT USAGE ON SCHEMA public TO loan_user;