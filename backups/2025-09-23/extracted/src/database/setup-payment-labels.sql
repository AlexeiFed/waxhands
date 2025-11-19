-- Настройка меток платежей для существующих счетов
-- Метка формируется как: INV-{invoice_id}-{timestamp}

-- Обновляем существующие счета, добавляя уникальные метки платежей
UPDATE invoices 
SET payment_label = CONCAT('INV-', id, '-', EXTRACT(EPOCH FROM created_at)::bigint)
WHERE payment_label IS NULL OR payment_label = '';

-- Создаем функцию для генерации меток платежей для новых счетов
CREATE OR REPLACE FUNCTION generate_payment_label()
RETURNS TRIGGER AS $$
BEGIN
    -- Генерируем метку только если она не задана
    IF NEW.payment_label IS NULL OR NEW.payment_label = '' THEN
        NEW.payment_label := CONCAT('INV-', NEW.id, '-', EXTRACT(EPOCH FROM NEW.created_at)::bigint);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер для автоматической генерации меток
DROP TRIGGER IF EXISTS trigger_generate_payment_label ON invoices;
CREATE TRIGGER trigger_generate_payment_label
    BEFORE INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION generate_payment_label();

-- Проверяем результат
SELECT 
    id,
    payment_label,
    status,
    amount,
    created_at
FROM invoices 
WHERE payment_label IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 10;

-- Создаем индекс для быстрого поиска по метке
CREATE INDEX IF NOT EXISTS idx_invoices_payment_label_lookup ON invoices(payment_label) WHERE payment_label IS NOT NULL;

-- Комментарий к функции
COMMENT ON FUNCTION generate_payment_label() IS 'Автоматически генерирует уникальную метку платежа для новых счетов';

