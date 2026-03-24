-- Section: Tables
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    currency TEXT DEFAULT 'IDR',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE fund_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INT NOT NULL,
    name TEXT NOT NULL,
    detail TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_fund_sources_user
        FOREIGN KEY(user_id) 
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INT NOT NULL,
    fund_source_id UUID,
    transaction_date DATE NOT NULL,
    amount NUMERIC NOT NULL,
    category TEXT,
    description TEXT,
    telegram_message_id BIGINT,
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_transactions_user
        FOREIGN KEY(user_id) 
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_transactions_fund_source
        FOREIGN KEY(fund_source_id) 
        REFERENCES fund_sources(id)
        ON DELETE SET NULL
);

CREATE TABLE fund_source_balances (
    fund_source_id UUID PRIMARY KEY,
    total_income NUMERIC NOT NULL DEFAULT 0,
    total_expense NUMERIC NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_balance_fund_source
        FOREIGN KEY(fund_source_id) 
        REFERENCES fund_sources(id)
        ON DELETE CASCADE
);

-- End Section: Tables

-- Section: Indexes
CREATE INDEX idx_fund_sources_user_id 
ON fund_sources(user_id);

CREATE INDEX idx_transactions_user_id 
ON transactions(user_id);

CREATE INDEX idx_transactions_fund_source_id 
ON transactions(fund_source_id);

CREATE INDEX idx_transactions_date 
ON transactions(transaction_date);

-- End Section: Indexes

-- Section: Functions
CREATE OR REPLACE FUNCTION update_fund_balance()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO fund_source_balances (fund_source_id, total_income, total_expense)
    VALUES (
        NEW.fund_source_id,
        CASE WHEN NEW.amount > 0 THEN NEW.amount ELSE 0 END,
        CASE WHEN NEW.amount < 0 THEN ABS(NEW.amount) ELSE 0 END
    )
    ON CONFLICT (fund_source_id)
    DO UPDATE SET
        total_income = fund_source_balances.total_income
            + CASE WHEN NEW.amount > 0 THEN NEW.amount ELSE 0 END,
        total_expense = fund_source_balances.total_expense
            + CASE WHEN NEW.amount < 0 THEN ABS(NEW.amount) ELSE 0 END,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_balance
AFTER INSERT ON transactions
FOR EACH ROW
WHEN (NEW.fund_source_id IS NOT NULL)
EXECUTE FUNCTION update_fund_balance();
-- End Section: Functions