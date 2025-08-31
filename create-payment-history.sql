-- Создание таблицы истории платежей
CREATE TABLE IF NOT EXISTS payment_history (
    id SERIAL PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    payment_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT '643',
    payment_method VARCHAR(100),
    payment_date TIMESTAMP,
    sender VARCHAR(255),
    operation_id VARCHAR(255),
    label VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_payment_history_invoice_id ON payment_history(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_payment_id ON payment_history(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_operation_id ON payment_history(operation_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_label ON payment_history(label);

-- Комментарии
COMMENT ON TABLE payment_history IS 'История платежей для счетов';
COMMENT ON COLUMN payment_history.invoice_id IS 'ID счета';
COMMENT ON COLUMN payment_history.payment_id IS 'ID платежа от платежной системы';
COMMENT ON COLUMN payment_history.amount IS 'Сумма платежа';
COMMENT ON COLUMN payment_history.currency IS 'Валюта (643 = RUB)';
COMMENT ON COLUMN payment_history.payment_method IS 'Метод оплаты (P2P, Card и т.д.)';
COMMENT ON COLUMN payment_history.payment_date IS 'Дата и время платежа';
COMMENT ON COLUMN payment_history.sender IS 'Отправитель/номер кошелька';
COMMENT ON COLUMN payment_history.operation_id IS 'ID операции от ЮMoney';
COMMENT ON COLUMN payment_history.label IS 'Метка платежа';
