-- Создание таблиц для системы платежей и уведомлений

-- Таблица истории платежей
CREATE TABLE IF NOT EXISTS payment_history (
    id SERIAL PRIMARY KEY,
    invoice_id VARCHAR(255) NOT NULL,
    payment_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'RUB',
    payment_method VARCHAR(100) NOT NULL,
    payment_date TIMESTAMP NOT NULL,
    sender VARCHAR(255),
    operation_id VARCHAR(255) NOT NULL,
    label VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для payment_history
CREATE INDEX IF NOT EXISTS idx_payment_history_invoice_id ON payment_history(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_payment_id ON payment_history(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_operation_id ON payment_history(operation_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_created_at ON payment_history(created_at);

-- Таблица повторных попыток платежей
CREATE TABLE IF NOT EXISTS payment_retry_attempts (
    id SERIAL PRIMARY KEY,
    operation_id VARCHAR(255) NOT NULL,
    attempt INTEGER NOT NULL DEFAULT 1,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    last_error TEXT,
    next_retry_at TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
    failure_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для payment_retry_attempts
CREATE INDEX IF NOT EXISTS idx_payment_retry_operation_id ON payment_retry_attempts(operation_id);
CREATE INDEX IF NOT EXISTS idx_payment_retry_status ON payment_retry_attempts(status);
CREATE INDEX IF NOT EXISTS idx_payment_retry_next_retry ON payment_retry_attempts(next_retry_at);

-- Таблица уведомлений пользователей
CREATE TABLE IF NOT EXISTS user_notifications (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для user_notifications
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_type ON user_notifications(type);
CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON user_notifications(read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications(created_at);

-- Добавление новых полей в таблицу invoices если их нет
DO $$ 
BEGIN
    -- Добавляем поле payment_label если его нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'payment_label') THEN
        ALTER TABLE invoices ADD COLUMN payment_label VARCHAR(500);
        CREATE INDEX IF NOT EXISTS idx_invoices_payment_label ON invoices(payment_label);
    END IF;
    
    -- Добавляем поле sender_phone если его нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'sender_phone') THEN
        ALTER TABLE invoices ADD COLUMN sender_phone VARCHAR(20);
        CREATE INDEX IF NOT EXISTS idx_invoices_sender_phone ON invoices(sender_phone);
    END IF;
    
    -- Добавляем поле payment_id если его нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'payment_id') THEN
        ALTER TABLE invoices ADD COLUMN payment_id VARCHAR(255);
        CREATE INDEX IF NOT EXISTS idx_invoices_payment_id ON invoices(payment_id);
    END IF;
    
    -- Добавляем поле payment_method если его нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'payment_method') THEN
        ALTER TABLE invoices ADD COLUMN payment_method VARCHAR(100);
    END IF;
    
    -- Добавляем поле payment_date если его нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'payment_date') THEN
        ALTER TABLE invoices ADD COLUMN payment_date TIMESTAMP;
    END IF;
END $$;

-- Комментарии к таблицам
COMMENT ON TABLE payment_history IS 'История всех платежей';
COMMENT ON TABLE payment_retry_attempts IS 'Повторные попытки обработки неудачных платежей';
COMMENT ON TABLE user_notifications IS 'Уведомления пользователей о платежах';
COMMENT ON COLUMN invoices.payment_label IS 'Метка платежа для идентификации';
COMMENT ON COLUMN invoices.sender_phone IS 'Телефон отправителя платежа';
COMMENT ON COLUMN invoices.payment_id IS 'ID платежа от платежной системы';
COMMENT ON COLUMN invoices.payment_method IS 'Метод оплаты';
COMMENT ON COLUMN invoices.payment_date IS 'Дата и время оплаты';

