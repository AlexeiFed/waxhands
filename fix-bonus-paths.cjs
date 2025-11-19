const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'waxhands',
    user: 'waxhands_user',
    password: 'waxhands123'
});

async function fixBonusPaths() {
    try {
        // Получаем все бонусы
        const result = await pool.query('SELECT id, title, image_url FROM bonuses');
        console.log('Найдено бонусов:', result.rows.length);

        // Получаем список доступных файлов
        const imagesDir = '/var/www/waxhands-app/uploads/images/';
        const availableFiles = fs.readdirSync(imagesDir).filter(file => file.endsWith('.jpg') || file.endsWith('.png'));
        console.log('Доступных файлов:', availableFiles.length);

        for (const bonus of result.rows) {
            console.log(`\nБонус ID ${bonus.id}:`);
            console.log('Текущий путь:', bonus.image_url);

            if (bonus.image_url && bonus.image_url.includes('/uploads/images/')) {
                const fileName = path.basename(bonus.image_url);
                console.log('Имя файла:', fileName);

                // Проверяем, существует ли файл
                const filePath = path.join(imagesDir, fileName);
                if (fs.existsSync(filePath)) {
                    console.log('✅ Файл существует');
                } else {
                    console.log('❌ Файл не найден');

                    // Ищем похожий файл
                    const similarFile = availableFiles.find(file =>
                        file.includes(fileName.split('-')[1]) || // По timestamp
                        file.includes(fileName.split('-')[2])    // По random part
                    );

                    if (similarFile) {
                        console.log('🔍 Найден похожий файл:', similarFile);
                        const newPath = `/uploads/images/${similarFile}`;

                        // Обновляем путь в базе данных
                        await pool.query('UPDATE bonuses SET image_url = $1 WHERE id = $2', [newPath, bonus.id]);
                        console.log('✅ Обновлен путь на:', newPath);
                    } else {
                        console.log('⚠️ Похожий файл не найден, оставляем как есть');
                    }
                }
            }
        }

        console.log('\n✅ Проверка завершена');
    } catch (err) {
        console.error('Ошибка:', err);
    } finally {
        await pool.end();
    }
}

fixBonusPaths();


