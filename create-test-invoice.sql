-- Создание тестового счета
INSERT INTO invoices (
    id, 
    master_class_id, 
    participant_id, 
    workshop_date,
    city,
    school_name,
    class_group,
    participant_name,
    amount, 
    status, 
    payment_label, 
    created_at, 
    updated_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM master_class_events LIMIT 1),
    (SELECT id FROM workshop_registrations LIMIT 1),
    NOW()::date,
    'Москва',
    'Тестовая школа',
    '5А',
    'Тестовый участник',
    5.00,
    'pending',
    CONCAT('INV-', gen_random_uuid(), '-', EXTRACT(EPOCH FROM NOW())::bigint),
    NOW(),
    NOW()
) 
RETURNING id, payment_label, amount, status;
