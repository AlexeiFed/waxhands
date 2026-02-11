-- Проверка участника и счета
SELECT 
    i.id as invoice_id,
    i.participant_id,
    i.participant_name,
    u.name,
    u.surname,
    u.phone,
    u.role
FROM invoices i
LEFT JOIN users u ON i.participant_id = u.id
WHERE i.id = 'aade5d0b-a937-408e-b424-83ff18cd3587';












