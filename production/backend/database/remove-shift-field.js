/**
 * @file: remove-shift-field.ts
 * @description: Миграция для удаления поля shift из таблицы users
 * @dependencies: connection.ts
 * @created: 2024-12-19
 */
import pool from './connection.js';
const removeShiftField = async () => {
    const client = await pool.connect();
    console.log('🔌 Connected to database for shift field removal');
    try {
        await client.query('BEGIN');
        console.log('📝 Starting shift field removal...');
        // Проверяем, существует ли поле shift
        const columnExists = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'shift'
        `);
        if (columnExists.rows.length > 0) {
            // Удаляем поле shift
            console.log('➖ Removing shift field from users table...');
            await client.query(`
                ALTER TABLE users 
                DROP COLUMN shift
            `);
            console.log('✅ shift field removed successfully');
        }
        else {
            console.log('ℹ️ shift field does not exist, skipping...');
        }
        await client.query('COMMIT');
        console.log('✅ shift field removal completed successfully');
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error removing shift field:', error);
        throw error;
    }
    finally {
        client.release();
        console.log('🔌 Database connection released');
    }
};
// Запуск миграции если файл выполняется напрямую
if (process.argv[1] && process.argv[1].includes('remove-shift-field.ts')) {
    console.log('🚀 Starting shift field removal...');
    removeShiftField()
        .then(() => {
        console.log('🎉 Migration completed');
        process.exit(0);
    })
        .catch((error) => {
        console.error('💥 Migration failed:', error);
        process.exit(1);
    });
}
export { removeShiftField };
//# sourceMappingURL=remove-shift-field.js.map