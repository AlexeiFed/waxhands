import pool from './connection.js';
import { UserRole } from '../types/index.js';
import { addParentIdField } from './add-parent-id-field.js';
import { addAgeField } from './add-age-field.js';
import { addCityField } from './add-city-field.js';
import { migrateAboutData } from './migrate-about-data.js';

const createTables = async () => {
  const client = await pool.connect();
  console.log('🔌 Connected to database');

  try {
    await client.query('BEGIN');
    console.log('📝 Starting table creation...');

    // Создание таблицы школ
    console.log('🏫 Creating schools table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS schools (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        classes JSONB NOT NULL DEFAULT '[]',
        teacher VARCHAR(255),
        teacher_phone VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Schools table created');

    // Создание таблицы пользователей
    console.log('👥 Creating users table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        surname VARCHAR(255),
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'parent', 'child', 'executor')),
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(50) UNIQUE,
        password_hash VARCHAR(255),
        school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
        school_name VARCHAR(255),
        class VARCHAR(50),
        class_group VARCHAR(50),
        shift VARCHAR(10),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');

    // Создание таблицы услуг
    console.log('🛠️ Creating services table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        short_description TEXT,
        full_description TEXT,
        styles JSONB DEFAULT '[]',
        options JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Services table created');

    // Создание таблицы событий мастер-классов
    console.log('📅 Creating master_class_events table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS master_class_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        date DATE NOT NULL,
        time TIME NOT NULL,
        school_id UUID NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
        class_group VARCHAR(100) NOT NULL,
        service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
        city VARCHAR(100) DEFAULT 'Не указан',
        executors JSONB NOT NULL DEFAULT '[]',
        notes TEXT,
        participants JSONB NOT NULL DEFAULT '[]',
        statistics JSONB NOT NULL DEFAULT '{"totalParticipants":0,"totalAmount":0,"paidAmount":0,"unpaidAmount":0,"stylesStats":{},"optionsStats":{}}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Master class events table created');

    // Таблица master_classes удалена - больше не используется

    // Создание таблицы заказов
    console.log('📦 Creating orders table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        service_id UUID REFERENCES services(id) ON DELETE SET NULL,
        master_class_id UUID REFERENCES master_class_events(id) ON DELETE SET NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
        total_price DECIMAL(10,2) NOT NULL,
        scheduled_date TIMESTAMP WITH TIME ZONE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Orders table created');

    // Создание таблицы заявок на мастер-классы
    console.log('📝 Creating workshop_requests table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS workshop_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        school_name VARCHAR(255) NOT NULL,
        class_group VARCHAR(100) NOT NULL,
        desired_date DATE NOT NULL,
        notes TEXT,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        admin_notes TEXT,
        admin_id UUID REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Workshop requests table created');

    // Создаем индексы для workshop_requests
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_workshop_requests_parent_id ON workshop_requests(parent_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_workshop_requests_status ON workshop_requests(status)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_workshop_requests_created_at ON workshop_requests(created_at)
    `);
    console.log('✅ Workshop requests indexes created');

    // Создание таблицы записей на мастер-классы
    console.log('📝 Creating workshop_registrations table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS workshop_registrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workshop_id UUID NOT NULL REFERENCES master_class_events(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        style VARCHAR(100) NOT NULL,
        options JSONB NOT NULL DEFAULT '[]',
        total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(workshop_id, user_id)
      )
    `);
    console.log('✅ Workshop registrations table created');

    // Создание таблицы счетов
    console.log('💰 Creating invoices table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        master_class_id UUID NOT NULL REFERENCES master_class_events(id) ON DELETE CASCADE,
        workshop_date DATE NOT NULL,
        city VARCHAR(100) NOT NULL,
        school_name VARCHAR(255) NOT NULL,
        class_group VARCHAR(100) NOT NULL,
        participant_name VARCHAR(255) NOT NULL,
        participant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'cancelled')),
        selected_styles JSONB DEFAULT '[]',
        selected_options JSONB DEFAULT '[]',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Invoices table created');

    // Создание индексов для оптимизации
    console.log('📊 Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
      CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);
      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);
      -- Удалено - таблица master_classes больше не используется
      CREATE INDEX IF NOT EXISTS idx_master_class_events_date ON master_class_events(date);
      CREATE INDEX IF NOT EXISTS idx_master_class_events_school ON master_class_events(school_id);
      CREATE INDEX IF NOT EXISTS idx_workshop_registrations_workshop_id ON workshop_registrations(workshop_id);
      CREATE INDEX IF NOT EXISTS idx_workshop_registrations_user_id ON workshop_registrations(user_id);
      CREATE INDEX IF NOT EXISTS idx_workshop_registrations_status ON workshop_registrations(status);
      CREATE INDEX IF NOT EXISTS idx_workshop_requests_parent_id ON workshop_requests(parent_id);
      CREATE INDEX IF NOT EXISTS idx_workshop_requests_status ON workshop_requests(status);
      CREATE INDEX IF NOT EXISTS idx_workshop_requests_created_at ON workshop_requests(created_at);
      CREATE INDEX IF NOT EXISTS idx_invoices_master_class_id ON invoices(master_class_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
      CREATE INDEX IF NOT EXISTS idx_invoices_workshop_date ON invoices(workshop_date);
      CREATE INDEX IF NOT EXISTS idx_invoices_city ON invoices(city);
      CREATE INDEX IF NOT EXISTS idx_invoices_school_name ON invoices(school_name);
      CREATE INDEX IF NOT EXISTS idx_invoices_class_group ON invoices(class_group);
      CREATE INDEX IF NOT EXISTS idx_invoices_participant_id ON invoices(participant_id);
    `);
    console.log('✅ Indexes created');

    // Создание триггера для автоматического обновления updated_at
    console.log('🔄 Creating triggers...');
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Применение триггера ко всем таблицам
    const tables = ['users', 'schools', 'services', 'orders', 'master_class_events', 'workshop_registrations', 'invoices'];
    for (const table of tables) {
      console.log(`🔄 Creating trigger for ${table} table...`);
      await client.query(`
        DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table};
        CREATE TRIGGER update_${table}_updated_at
          BEFORE UPDATE ON ${table}
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `);
    }
    console.log('✅ Triggers created');

    await client.query('COMMIT');
    console.log('✅ Database tables created successfully');

    // Проверяем, что таблицы действительно созданы
    console.log('🔍 Verifying tables...');
    const tablesCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'schools', 'services', 'master_classes', 'orders', 'master_class_events', 'workshop_registrations', 'invoices')
      ORDER BY table_name
    `);

    console.log('📋 Created tables:', tablesCheck.rows.map(row => row.table_name));

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
    console.log('🔌 Database connection released');
  }
};

const dropTables = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Удаление таблиц в правильном порядке (с учетом внешних ключей)
    await client.query('DROP TABLE IF EXISTS orders CASCADE');
    await client.query('DROP TABLE IF EXISTS master_classes CASCADE');
    await client.query('DROP TABLE IF EXISTS services CASCADE');
    await client.query('DROP TABLE IF EXISTS users CASCADE');
    await client.query('DROP TABLE IF EXISTS schools CASCADE');

    await client.query('COMMIT');
    console.log('✅ Database tables dropped successfully');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error dropping tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Функция для выполнения миграций
const runMigrations = async () => {
  try {
    console.log('🔄 Starting database migrations...');

    // Проверяем подключение к базе данных
    console.log('🔌 Testing database connection...');
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection successful');

    await createTables();

    // Выполняем дополнительные миграции
    console.log('🔄 Running additional migrations...');
    await addParentIdField();
    await addAgeField(); // Добавляем миграцию для поля возраста
    await addCityField(); // Добавляем миграцию для поля city

    // Миграция данных about
    console.log('🔄 Migrating about data...');
    await migrateAboutData();

    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('🔌 Database pool closed');
  }
};

// Запуск миграций если файл выполняется напрямую
if (process.argv[1] && process.argv[1].includes('migrate.ts')) {
  console.log('🚀 Starting migration script...');
  runMigrations();
}

export { createTables, dropTables, runMigrations }; 