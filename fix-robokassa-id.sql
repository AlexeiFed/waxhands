-- Исправляем robokassa_invoice_id для возврата
UPDATE invoices 
SET robokassa_invoice_id = '448122652' 
WHERE id = '246e6167-0663-4bf5-a21a-2da0bd8dd4e9';

-- Проверяем результат
SELECT id, robokassa_invoice_id, status, refund_status 
FROM invoices 
WHERE id = '246e6167-0663-4bf5-a21a-2da0bd8dd4e9';
