-- Проверка результата оплаты
SELECT 
    id, 
    amount, 
    status, 
    payment_label, 
    payment_status, 
    payment_id 
FROM invoices 
WHERE id = '852d5753-1214-40a4-86f6-36f20d8f8a98';
