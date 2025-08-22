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
    
    // Проверяем Федора Афанасьева
    const result = await client.query(`
      SELECT u.id, u.name, u.surname, u.parent_id, p.name as parent_name
      FROM users u 
      LEFT JOIN users p ON u.parent_id = p.id 
      WHERE u.name = 'Федор' AND u.surname = 'Афанасьев'
    `);
    
    console.log('📋 Данные Федора:');
    if (result.rows.length > 0) {
      const child = result.rows[0];
      console.log(`ID: ${child.id}`);
      console.log(`Имя: ${child.name} ${child.surname}`);
      console.log(`Parent ID: ${child.parent_id || 'НЕТ'}`);
      console.log(`Имя родителя: ${child.parent_name || 'НЕТ'}`);
    } else {
      console.log('Ребенок не найден');
    }
    
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
})();
