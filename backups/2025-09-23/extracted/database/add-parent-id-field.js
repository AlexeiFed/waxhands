/**
 * @file: add-parent-id-field.ts
 * @description: Миграция для добавления поля parent_id в таблицу users
 * @dependencies: database connection
 * @created: 2024-12-19
 */
import pool from './connection.js';
export const addParentIdField = async () => {
    const client = await pool.connect();
    try {
        console.log('Начинаю миграцию: добавление поля parent_id...');
        // Проверяем, существует ли уже поле parent_id
        const checkField = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'parent_id'
        `);
        if (checkField.rows.length > 0) {
            console.log('Поле parent_id уже существует, пропускаю миграцию');
            return;
        }
        // Добавляем поле parent_id
        await client.query(`
            ALTER TABLE users 
            ADD COLUMN parent_id UUID REFERENCES users(id) ON DELETE CASCADE
        `);
        // Добавляем индекс для улучшения производительности
        await client.query(`
            CREATE INDEX idx_users_parent_id ON users(parent_id)
        `);
        console.log('✅ Миграция успешно завершена: поле parent_id добавлено');
    }
    catch (error) {
        console.error('❌ Ошибка при выполнении миграции:', error);
        throw error;
    }
    finally {
        client.release();
    }
};
// Запускаем миграцию если файл выполняется напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
    addParentIdField()
        .then(() => {
        console.log('Миграция завершена');
        process.exit(0);
    })
        .catch((error) => {
        console.error('Миграция не удалась:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=add-parent-id-field.js.map