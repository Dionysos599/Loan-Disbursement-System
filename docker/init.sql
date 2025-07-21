-- Create database if not exists
SELECT 'CREATE DATABASE loan_forecast'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'loan_forecast')\gexec

-- Create user if not exists
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'loan_user') THEN

      CREATE ROLE loan_user LOGIN PASSWORD 'loan_password';
   END IF;
END
$do$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE loan_forecast TO loan_user;

-- Connect to the new database
\c loan_forecast;

-- Create upload_history table
CREATE TABLE IF NOT EXISTS upload_history (
    id BIGSERIAL PRIMARY KEY,
    batch_id VARCHAR(255) UNIQUE NOT NULL,
    original_filename VARCHAR(255),
    file_size BIGINT,
    upload_status VARCHAR(50),
    total_records INTEGER,
    processed_records INTEGER,
    failed_records INTEGER,
    uploaded_at TIMESTAMP,
    processed_at TIMESTAMP,
    forecast_start_date VARCHAR(255),
    error_message TEXT,
    original_file_path VARCHAR(500),
    forecast_csv_path VARCHAR(500)
);

-- Grant table privileges
GRANT ALL PRIVILEGES ON TABLE upload_history TO loan_user;
GRANT ALL PRIVILEGES ON SEQUENCE upload_history_id_seq TO loan_user;