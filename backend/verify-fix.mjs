/**
 * @file: verify-fix.mjs
 * @description: Проверка результатов исправления
 * @created: 2025-10-13
 */

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'waxhands',
    user: 'waxhands_user',
    password: 'waxhands123'
});

async function verifyFix() {
    const client = await pool.connect();

    try {
        const result = await client.query(`
            SELECT 
                COUNT(*) as total_parents,
                COUNT(school_id) as parents_with_school
            FROM users 
            WHERE role = 'parent'
        `);

        console.log('\n=== РЕЗУЛЬТАТЫ ПРОВЕРКИ ===');
        console.log(`Всего родителей: ${result.rows[0].total_parents}`);
        console.log(`Родителей со школой: ${result.rows[0].parents_with_school}`);
        console.log(`Родителей без школы: ${result.rows[0].total_parents - result.rows[0].parents_with_school}`);

        if (result.rows[0].total_parents === result.rows[0].parents_with_school) {
            console.log('\n✅ ВСЕ РОДИТЕЛИ ИМЕЮТ ШКОЛУ!');
        } else {
            console.log('\n❌ Есть родители без школы');
        }

    } catch (error) {
        console.error('Ошибка:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

verifyFix();



