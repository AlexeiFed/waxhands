-- Проверка последнего счета
SELECT 
    id, 
    amount, 
    status, 
    payment_id 
FROM invoices 
WHERE id = '7de0b22d-525e-455e-8fbb-cd5c195e73f7';
