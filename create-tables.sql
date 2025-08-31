-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'parent',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    city VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы детей
CREATE TABLE IF NOT EXISTS children (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES users(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    age INTEGER,
    school_id INTEGER,
    class_group VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы школ
CREATE TABLE IF NOT EXISTS schools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы услуг
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    duration_minutes INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы мастер-классов
CREATE TABLE IF NOT EXISTS master_classes (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES services(id),
    school_id INTEGER REFERENCES schools(id),
    class_group VARCHAR(10),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы регистраций на мастер-классы
CREATE TABLE IF NOT EXISTS workshop_registrations (
    id SERIAL PRIMARY KEY,
    master_class_id INTEGER REFERENCES master_classes(id),
    child_id INTEGER REFERENCES children(id),
    parent_id INTEGER REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание админа
INSERT INTO users (email, password_hash, role, first_name, last_name) 
VALUES ('admin@waxhands.ru', '$2b$10$rQZ8K9mN2pL1vX3yJ6hF7gT4uI5oP8qR9sA0bB1cD2eE3fG4hI5jK6lM7nN8oO9pP0qQ1rR2sS3tT4uU5vV6wW7xX8yY9zZ0aA1bB2cC3dD4eE5fF6gG7hH8iI9jJ0kK1lL2mM3nN4oO5pP6qQ7rR8sS9tT0uU1vV2wW3xX4yY5zZ', 'admin', 'Администратор', 'Wax Hands')
ON CONFLICT (email) DO NOTHING;

-- Создание тестовой школы
INSERT INTO schools (name, city) 
VALUES ('Тестовая школа', 'Москва')
ON CONFLICT DO NOTHING;

-- Создание тестовой услуги
INSERT INTO services (name, description, price, duration_minutes) 
VALUES ('Тестовый мастер-класс', 'Описание тестового мастер-класса', 1000.00, 60)
ON CONFLICT DO NOTHING;
