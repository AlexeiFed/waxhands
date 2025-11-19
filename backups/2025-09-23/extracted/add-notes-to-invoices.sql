-- Добавляем поле notes в таблицу invoices
ALTER TABLE invoices ADD COLUMN notes TEXT;
COMMENT ON COLUMN invoices.notes IS 'Примечания к заказу от родителя';


