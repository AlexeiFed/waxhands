/**
 * @file: migrate-workshop-registrations.ts
 * @description: Миграция для создания таблицы записей на мастер-классы
 * @dependencies: database connection
 * @created: 2024-12-19
 */

import pool from './connection.js';

export const migrateWorkshopRegistrations = async () => {
    try {
        console.log('Creating workshop_registrations table...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS workshop_registrations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                workshop_id UUID NOT NULL,
                user_id UUID NOT NULL,
                style VARCHAR(100) NOT NULL,
                options JSONB NOT NULL DEFAULT '[]',
                total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
                status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (workshop_id) REFERENCES master_class_events (id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                UNIQUE(workshop_id, user_id)
            )
        `);

        // Создаем индексы для оптимизации
        await pool.query('CREATE INDEX IF NOT EXISTS idx_workshop_registrations_workshop_id ON workshop_registrations(workshop_id)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_workshop_registrations_user_id ON workshop_registrations(user_id)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_workshop_registrations_status ON workshop_registrations(status)');

        console.log('✅ Workshop registrations table created successfully');
    } catch (error) {
        console.error('❌ Error creating workshop registrations table:', error);
        throw error;
    }
};

// Запуск миграции если файл выполняется напрямую
if (require.main === module) {
    migrateWorkshopRegistrations()
        .then(() => {
            console.log('Migration completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Migration failed:', error);
            process.exit(1);
        });
}
