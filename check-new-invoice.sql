-- Проверка нового счета
SELECT 
    id, 
    master_class_id, 
    participant_id, 
    workshop_date, 
    city, 
    school_name, 
    participant_name, 
    amount, 
    status, 
    payment_label 
FROM invoices 
WHERE id = '852d5753-1214-40a4-86f6-36f20d8f8a98';
