/**
 * @file: check-schools.ts
 * @description: Скрипт для проверки таблицы schools и данных в ней
 * @dependencies: connection.ts
 * @created: 2024-12-19
 */
import pool from './connection.js';
const checkSchools = async () => {
    const client = await pool.connect();
    try {
        console.log('🔍 Проверяем таблицу schools...');
        // Проверяем структуру таблицы schools
        const schemaResult = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'schools'
            ORDER BY ordinal_position
        `);
        console.log('📋 Структура таблицы schools:');
        schemaResult.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
        });
        // Проверяем количество записей
        const countResult = await client.query(`SELECT COUNT(*) FROM schools`);
        console.log(`\n📊 Количество школ в таблице: ${countResult.rows[0].count}`);
        // Проверяем образцы данных
        if (parseInt(countResult.rows[0].count) > 0) {
            console.log('\n🔍 Образцы данных школ:');
            const dataResult = await client.query(`
                SELECT id, name, address, classes
                FROM schools 
                LIMIT 5
            `);
            dataResult.rows.forEach((row, index) => {
                console.log(`  ${index + 1}. ID: ${row.id}`);
                console.log(`     Название: ${row.name}`);
                console.log(`     Адрес: ${row.address || 'NULL'}`);
                console.log(`     Классы: ${row.classes ? JSON.stringify(row.classes) : 'NULL'}`);
                console.log('');
            });
        }
        // Проверяем, есть ли школы с адресами
        const addressResult = await client.query(`
            SELECT COUNT(*) 
            FROM schools 
            WHERE address IS NOT NULL AND address != ''
        `);
        console.log(`🏫 Школ с адресами: ${addressResult.rows[0].count}`);
        // Проверяем, есть ли школы с классами
        const classesResult = await client.query(`
            SELECT COUNT(*) 
            FROM schools 
            WHERE classes IS NOT NULL AND array_length(classes, 1) > 0
        `);
        console.log(`📚 Школ с классами: ${classesResult.rows[0].count}`);
    }
    catch (error) {
        console.error('❌ Ошибка при проверке школ:', error);
        throw error;
    }
    finally {
        client.release();
    }
};
// Запуск проверки, если файл выполняется напрямую
checkSchools()
    .then(() => {
    console.log('✅ Проверка школ завершена');
    process.exit(0);
})
    .catch((error) => {
    console.error('❌ Ошибка проверки школ:', error);
    process.exit(1);
});
export { checkSchools };
//# sourceMappingURL=check-schools.js.map