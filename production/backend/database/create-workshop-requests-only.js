/**
 * @file: backend/src/database/create-workshop-requests-only.ts
 * @description: Скрипт для создания только таблицы workshop_requests
 * @dependencies: connection.ts
 * @created: 2024-12-19
 */
import pool from './connection.js';
export async function createWorkshopRequestsTableOnly() {
    const client = await pool.connect();
    console.log('🔌 Connected to database');
    try {
        await client.query('BEGIN');
        console.log('📝 Creating workshop_requests table...');
        // Создание таблицы заявок на мастер-классы
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
        await client.query('COMMIT');
        console.log('✅ Table creation completed successfully');
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error creating workshop_requests table:', error);
        throw error;
    }
    finally {
        client.release();
        console.log('🔌 Database connection released');
    }
}
// Запуск если файл выполняется напрямую
if (process.argv[1] && process.argv[1].includes('create-workshop-requests-only.ts')) {
    console.log('🚀 Starting workshop_requests table creation...');
    createWorkshopRequestsTableOnly()
        .then(() => {
        console.log('✅ Workshop_requests table creation completed');
        process.exit(0);
    })
        .catch((error) => {
        console.error('❌ Failed to create workshop_requests table:', error);
        process.exit(1);
    });
}
export default createWorkshopRequestsTableOnly;
//# sourceMappingURL=create-workshop-requests-only.js.map