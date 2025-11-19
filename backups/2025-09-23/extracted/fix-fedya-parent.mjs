import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'waxhands',
    password: 'N1fQZhaT',
    port: 5432,
});

(async () => {
    try {
        const client = await pool.connect();

        // Назначаем Федору родителя (возьмем первого родителя из списка)
        const parentId = '137fbe93-afd4-4758-8c3e-7fb666eec59a'; // Демьян
        const fedyaId = '2b430f63-7b77-4b87-8c73-7979c4ee7e34';

        console.log('🔄 Назначаем Федору родителя...');

        const result = await client.query(`
      UPDATE users 
      SET parent_id = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
      RETURNING id, name, surname, parent_id
    `, [parentId, fedyaId]);

        if (result.rows.length > 0) {
            const child = result.rows[0];
            console.log('✅ Успешно обновлено:');
            console.log(`   Ребенок: ${child.name} ${child.surname}`);
            console.log(`   ID ребенка: ${child.id}`);
            console.log(`   Parent ID: ${child.parent_id}`);
        } else {
            console.log('❌ Не удалось обновить');
        }

        client.release();
        process.exit(0);
    } catch (error) {
        console.error('❌ Ошибка:', error);
        process.exit(1);
    }
})();
