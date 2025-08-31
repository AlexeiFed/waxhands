-- Проверка последних счетов
SELECT 
    id, 
    amount, 
    status, 
    payment_label, 
    created_at 
FROM invoices 
ORDER BY created_at DESC 
LIMIT 3;
