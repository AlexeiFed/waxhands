const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'waxhands',
    user: 'waxhands_user',
    password: 'waxhands123'
});

async function checkStyleImages() {
    try {
        // Ищем стили с "двойные" в названии
        const result = await pool.query(`
      SELECT id, name, images, videos 
      FROM service_styles 
      WHERE name ILIKE '%двойные%' OR name ILIKE '%двойные ручки%'
    `);

        console.log('Найденные стили:');
        result.rows.forEach((row, index) => {
            console.log(`\n--- Стиль ${index + 1} ---`);
            console.log(`ID: ${row.id}`);
            console.log(`Название: ${row.name}`);
            console.log('Изображения:', JSON.stringify(row.images, null, 2));
            console.log('Видео:', JSON.stringify(row.videos, null, 2));
        });

        // Ищем все стили с изображениями
        const allStyles = await pool.query(`
      SELECT id, name, images 
      FROM service_styles 
      WHERE images IS NOT NULL AND jsonb_array_length(images) > 0
    `);

        console.log('\n=== Все стили с изображениями ===');
        allStyles.rows.forEach((row, index) => {
            console.log(`\n--- Стиль ${index + 1} ---`);
            console.log(`ID: ${row.id}`);
            console.log(`Название: ${row.name}`);
            console.log('Изображения:', JSON.stringify(row.images, null, 2));
        });

    } catch (err) {
        console.error('Ошибка:', err);
    } finally {
        await pool.end();
    }
}

checkStyleImages();


