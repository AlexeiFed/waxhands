import pool from './connection.js';

const migrateServicesTable = async () => {
    const client = await pool.connect();
    console.log('🔌 Connected to database for services migration');

    try {
        await client.query('BEGIN');
        console.log('📝 Starting services table migration...');

        // Удаляем старую таблицу и создаем новую с правильной структурой
        console.log('🗑️ Dropping old services table...');
        await client.query('DROP TABLE IF EXISTS services CASCADE');

        console.log('🛠️ Creating new services table...');
        await client.query(`
      CREATE TABLE services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        short_description TEXT NOT NULL,
        full_description TEXT,
        styles JSONB NOT NULL DEFAULT '[]',
        options JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('✅ New services table created');

        // Создаем триггер для автоматического обновления updated_at
        console.log('🔄 Creating update trigger...');
        await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

        await client.query(`
      DROP TRIGGER IF EXISTS update_services_updated_at ON services;
      CREATE TRIGGER update_services_updated_at
        BEFORE UPDATE ON services
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
        console.log('✅ Update trigger created');

        await client.query('COMMIT');
        console.log('🎉 Services table migration completed successfully!');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        client.release();
    }
};

// Всегда запускаем миграцию при импорте файла
migrateServicesTable()
    .then(() => {
        console.log('Migration completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });

export default migrateServicesTable;