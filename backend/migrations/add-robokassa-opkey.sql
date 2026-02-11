-- Миграция: Добавление поля robokassa_op_key в таблицу invoices
-- Дата: 2025-10-17
-- Описание: Добавляет поле для хранения OpKey операции Robokassa для возвратов

-- Проверяем и добавляем поле robokassa_op_key
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'invoices' 
        AND column_name = 'robokassa_op_key'
    ) THEN
        ALTER TABLE invoices ADD COLUMN robokassa_op_key VARCHAR(255);
        COMMENT ON COLUMN invoices.robokassa_op_key IS 'OpKey операции Robokassa для возвратов (GUID из XML API)';
        
        -- Создаем индекс для быстрого поиска
        CREATE INDEX idx_invoices_robokassa_op_key 
        ON invoices(robokassa_op_key)
        WHERE robokassa_op_key IS NOT NULL;
        
        RAISE NOTICE 'Поле robokassa_op_key добавлено успешно';
    ELSE
        RAISE NOTICE 'Поле robokassa_op_key уже существует';
    END IF;
END $$;












