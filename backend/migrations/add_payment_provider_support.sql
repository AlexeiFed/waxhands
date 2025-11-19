/**
 * Миграция: Добавление поддержки нескольких платежных провайдеров
 * Дата: 2025-10-16
 * Описание: Добавляет поля для хранения данных о провайдере платежа (Robokassa, FreeKassa и др.)
 */

-- Добавляем поле для хранения названия платежного провайдера
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(50) DEFAULT 'robokassa';

-- Добавляем поле для хранения ID счета в FreeKassa
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS freekassa_invoice_id VARCHAR(255);

-- Добавляем индекс для быстрого поиска по FreeKassa ID
CREATE INDEX IF NOT EXISTS idx_invoices_freekassa_invoice_id ON invoices(freekassa_invoice_id);

-- Комментарии к полям
COMMENT ON COLUMN invoices.payment_provider IS 'Название платежного провайдера (robokassa, freekassa и т.д.)';
COMMENT ON COLUMN invoices.freekassa_invoice_id IS 'ID счета в системе FreeKassa';

-- Обновляем существующие записи (если есть robokassa_invoice_id, значит это Robokassa)
UPDATE invoices 
SET payment_provider = 'robokassa' 
WHERE robokassa_invoice_id IS NOT NULL AND payment_provider IS NULL;

-- Выводим статистику
SELECT 
    COUNT(*) as total_invoices,
    COUNT(CASE WHEN payment_provider = 'robokassa' THEN 1 END) as robokassa_count,
    COUNT(CASE WHEN payment_provider = 'freekassa' THEN 1 END) as freekassa_count,
    COUNT(CASE WHEN payment_provider IS NULL THEN 1 END) as no_provider_count
FROM invoices;


