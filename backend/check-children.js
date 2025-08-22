const { Pool } = require('pg');

// Настройки подключения к базе данных
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'waxhands_db',
    password: process.env.DB_PASSWORD || 'postgres',
    port: parseInt(process.env.DB_PORT || '5432'),
});

(async () => {
  try {
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT u.*, s.name as school_name 
      FROM users u 
      LEFT JOIN schools s ON u.school_id = s.id 
      WHERE u.role = 'child' 
      ORDER BY u.created_at DESC 
      LIMIT 3
    `);
    
    console.log('📋 Найденные дети в БД:');
    result.rows.forEach((child, index) => {
      console.log(`${index + 1}. ${child.name} ${child.surname || ''} (${child.school_name}, ${child.class})`);
      console.log(`   ID: ${child.id}`);
      console.log(`   School ID: ${child.school_id}`);
    });
    
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
})();
