-- Проверка статуса счета
SELECT 
    id, 
    amount, 
    status, 
    payment_id 
FROM invoices 
WHERE id = '68a62bbe-8c27-40a2-ac85-a71d9412932e';
