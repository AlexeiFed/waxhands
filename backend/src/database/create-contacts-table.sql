-- Создание таблицы контактных данных
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    legal_status VARCHAR(100) NOT NULL,
    inn VARCHAR(20) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT,
    website VARCHAR(255),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at);

-- Комментарии к таблице
COMMENT ON TABLE contacts IS 'Таблица контактных данных компании';
COMMENT ON COLUMN contacts.company_name IS 'Название компании';
COMMENT ON COLUMN contacts.legal_status IS 'Правовой статус (самозанятый, ИП, ООО и т.д.)';
COMMENT ON COLUMN contacts.inn IS 'ИНН';
COMMENT ON COLUMN contacts.phone IS 'Контактный телефон';
COMMENT ON COLUMN contacts.email IS 'Контактный email';
COMMENT ON COLUMN contacts.address IS 'Адрес';
COMMENT ON COLUMN contacts.website IS 'Веб-сайт';
COMMENT ON COLUMN contacts.created_by IS 'ID пользователя, создавшего/обновившего данные';

-- Вставка начальных контактных данных
INSERT INTO contacts (company_name, legal_status, inn, phone, email, website, created_by) VALUES (
    'Студия МК «Восковые ручки»',
    'самозанятый',
    '272210695289',
    '8914-545-06-06',
    'pavelt80@mail.ru',
    'waxhands.ru',
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
) ON CONFLICT DO NOTHING;

