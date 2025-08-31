-- Проверка статуса конкретного счета
SELECT 
    status, 
    payment_id,
    amount,
    payment_label,
    updated_at
FROM invoices 
WHERE id = '87af4bc1-d87e-4508-b874-64b3303592c7';
