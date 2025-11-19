/**
 * @file: fix-parent-schools.mjs
 * @description: Устанавливает school_id и school_name для родителей из данных первого ребенка
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

async function fixParentSchools() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');



        // Получаем всех родителей без школы
        const parents = await client.query(`
            SELECT id, name, surname
            FROM users 
            WHERE role = 'parent' AND school_id IS NULL
            ORDER BY name
        `);

        console.log(`Найдено родителей без школы: ${parents.rows.length}`);

        let updated = 0;
        let noChildren = 0;

        for (const parent of parents.rows) {
            // Получаем первого ребенка родителя
            const child = await client.query(`
                SELECT school_id, school_name
                FROM users 
                WHERE parent_id = $1 AND role = 'child'
                LIMIT 1
            `, [parent.id]);

            if (child.rows.length > 0 && child.rows[0].school_id) {
                // Обновляем родителя
                await client.query(`
                    UPDATE users 
                    SET school_id = $1, school_name = $2
                    WHERE id = $3
                `, [child.rows[0].school_id, child.rows[0].school_name, parent.id]);

                console.log(`✅ ${parent.name} ${parent.surname || ''} -> ${child.rows[0].school_name}`);
                updated++;
            } else {
                console.log(`❌ ${parent.name} ${parent.surname || ''} - нет детей с школой`);
                noChildren++;
            }
        }

        await client.query('COMMIT');

        console.log(`\n=== ЗАВЕРШЕНО ===`);
        console.log(`Обновлено: ${updated}`);
        console.log(`Пропущено (нет детей): ${noChildren}`);
        console.log(`Всего: ${parents.rows.length}`);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Ошибка:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

fixParentSchools();



