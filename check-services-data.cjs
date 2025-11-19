const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'waxhands',
    user: 'waxhands_user',
    password: 'waxhands123'
});

async function checkServicesData() {
    try {
        console.log('🔍 Проверяем данные услуг...\n');

        const result = await pool.query('SELECT id, name, styles, options FROM services');

        result.rows.forEach((service, index) => {
            console.log(`\n--- Услуга ${index + 1}: ${service.name} ---`);
            console.log('ID:', service.id);

            if (service.styles) {
                console.log('\n📋 Стили:');
                service.styles.forEach((style, styleIndex) => {
                    console.log(`  Стиль ${styleIndex + 1}: ${style.name}`);
                    if (style.images && Array.isArray(style.images)) {
                        console.log(`    Изображения (${style.images.length}):`);
                        style.images.forEach((img, imgIndex) => {
                            console.log(`      ${imgIndex + 1}. ${img}`);
                        });
                    }
                    if (style.videos && Array.isArray(style.videos)) {
                        console.log(`    Видео (${style.videos.length}):`);
                        style.videos.forEach((vid, vidIndex) => {
                            console.log(`      ${vidIndex + 1}. ${vid}`);
                        });
                    }
                });
            }

            if (service.options) {
                console.log('\n📋 Опции:');
                service.options.forEach((option, optionIndex) => {
                    console.log(`  Опция ${optionIndex + 1}: ${option.name}`);
                    if (option.images && Array.isArray(option.images)) {
                        console.log(`    Изображения (${option.images.length}):`);
                        option.images.forEach((img, imgIndex) => {
                            console.log(`      ${imgIndex + 1}. ${img}`);
                        });
                    }
                    if (option.videos && Array.isArray(option.videos)) {
                        console.log(`    Видео (${option.videos.length}):`);
                        option.videos.forEach((vid, vidIndex) => {
                            console.log(`      ${vidIndex + 1}. ${vid}`);
                        });
                    }
                });
            }
        });

    } catch (error) {
        console.error('❌ Ошибка:', error);
    } finally {
        await pool.end();
    }
}

checkServicesData();


