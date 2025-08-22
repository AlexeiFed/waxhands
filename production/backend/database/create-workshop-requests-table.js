/**
 * @file: backend/src/database/create-workshop-requests-table.ts
 * @description: Миграция для создания таблицы заявок на проведение мастер-классов
 * @dependencies: connection.ts
 * @created: 2024-12-19
 */
import pool from './connection';
export async function createWorkshopRequestsTable() {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS workshop_requests (
                id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
                parent_id VARCHAR(36) NOT NULL,
                school_name VARCHAR(255) NOT NULL,
                class_group VARCHAR(100) NOT NULL,
                desired_date DATE NOT NULL,
                notes TEXT,
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                admin_notes TEXT,
                admin_id VARCHAR(36),
                FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `;
        await pool.query(query);
        console.log('✅ Таблица workshop_requests создана успешно');
        // Создаем индексы для оптимизации
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_workshop_requests_parent_id ON workshop_requests(parent_id)
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_workshop_requests_status ON workshop_requests(status)
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_workshop_requests_created_at ON workshop_requests(created_at)
        `);
        console.log('✅ Индексы для workshop_requests созданы успешно');
    }
    catch (error) {
        console.error('❌ Ошибка при создании таблицы workshop_requests:', error);
        throw error;
    }
}
// Экспортируем функцию для использования в других местах
export default createWorkshopRequestsTable;
//# sourceMappingURL=create-workshop-requests-table.js.map