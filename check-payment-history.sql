-- Проверка истории платежей
SELECT 
    id,
    invoice_id,
    payment_id,
    amount,
    payment_method,
    created_at
FROM payment_history 
WHERE invoice_id = '87af4bc1-d87e-4508-b874-64b3303592c7'
ORDER BY created_at DESC;
