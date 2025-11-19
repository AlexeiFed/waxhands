/**
 * @file: check-user-relations.mjs
 * @description: Диагностика связей между родителями и детьми
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

async function checkUserRelations() {
    const client = await pool.connect();

    try {
        console.log('\n=== ПРОВЕРКА РОДИТЕЛЕЙ ===');
        const parents = await client.query(`
            SELECT id, name, surname, school_id, school_name
            FROM users 
            WHERE role = 'parent'
            ORDER BY name
        `);

        console.log(`\nВсего родителей: ${parents.rows.length}`);
        let parentsWithoutSchool = 0;

        for (const parent of parents.rows) {
            if (!parent.school_id) {
                parentsWithoutSchool++;
                console.log(`❌ Родитель без школы: ${parent.name} ${parent.surname || ''} (ID: ${parent.id})`);
            }
        }

        console.log(`\nРодителей без школы: ${parentsWithoutSchool} из ${parents.rows.length}`);

        console.log('\n=== ПРОВЕРКА ДЕТЕЙ ===');
        const children = await client.query(`
            SELECT id, name, surname, school_id, school_name, parent_id
            FROM users 
            WHERE role = 'child'
            ORDER BY name
        `);

        console.log(`\nВсего детей: ${children.rows.length}`);
        let childrenWithoutParent = 0;
        let childrenWithoutSchool = 0;

        for (const child of children.rows) {
            if (!child.parent_id) {
                childrenWithoutParent++;
                console.log(`❌ Ребенок без родителя: ${child.name} ${child.surname || ''} (ID: ${child.id})`);
            }
            if (!child.school_id) {
                childrenWithoutSchool++;
                console.log(`❌ Ребенок без школы: ${child.name} ${child.surname || ''} (ID: ${child.id})`);
            }
        }

        console.log(`\nДетей без родителя: ${childrenWithoutParent} из ${children.rows.length}`);
        console.log(`Детей без школы: ${childrenWithoutSchool} из ${children.rows.length}`);

        console.log('\n=== СВЯЗИ РОДИТЕЛЬ-РЕБЕНОК ===');
        for (const parent of parents.rows) {
            const parentChildren = await client.query(`
                SELECT id, name, surname, school_id, school_name
                FROM users 
                WHERE parent_id = $1
                ORDER BY name
            `, [parent.id]);

            if (parentChildren.rows.length > 0) {
                console.log(`\n${parent.name} ${parent.surname || ''} (школа: ${parent.school_name || 'НЕТ'}):`);
                for (const child of parentChildren.rows) {
                    console.log(`  - ${child.name} ${child.surname || ''} (школа: ${child.school_name || 'НЕТ'})`);
                }
            }
        }

    } catch (error) {
        console.error('Ошибка:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

checkUserRelations();



