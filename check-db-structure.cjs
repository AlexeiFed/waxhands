const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'waxhands',
    user: 'waxhands_user',
    password: 'waxhands123'
});

async function checkDatabaseStructure() {
    try {
        console.log('🔍 Проверяем структуру базы данных...\n');

        // Получаем все таблицы
        const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

        console.log('📋 Найденные таблицы:');
        tablesResult.rows.forEach(row => console.log(`  - ${row.table_name}`));

        // Проверяем структуру каждой таблицы
        for (const table of tablesResult.rows) {
            const tableName = table.table_name;
            console.log(`\n--- Структура таблицы: ${tableName} ---`);

            const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);

            columnsResult.rows.forEach(col => {
                console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
            });

            // Проверяем, есть ли данные в таблице
            const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
            console.log(`  Записей в таблице: ${countResult.rows[0].count}`);
        }

    } catch (error) {
        console.error('❌ Ошибка:', error);
    } finally {
        await pool.end();
    }
}

checkDatabaseStructure();


