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

// Функция для проверки существования файла
function fileExists(filePath) {
    if (!filePath || typeof filePath !== 'string') return false;

    // Убираем ведущий слеш и добавляем полный путь
    const fullPath = path.join('/var/www/waxhands-app', filePath.startsWith('/') ? filePath : '/' + filePath);

    try {
        return fs.existsSync(fullPath);
    } catch (error) {
        return false;
    }
}

// Функция для очистки массива файлов от несуществующих
function cleanFileArray(fileArray) {
    if (!Array.isArray(fileArray)) return [];

    return fileArray.filter(filePath => {
        const exists = fileExists(filePath);
        if (!exists) {
            console.log(`❌ Удаляем несуществующий файл: ${filePath}`);
        }
        return exists;
    });
}

async function cleanupMissingFiles() {
    try {
        console.log('🔍 Начинаем очистку базы данных от несуществующих файлов...\n');

        // Получаем все услуги
        const servicesResult = await pool.query('SELECT id, name, images, videos FROM services');
        console.log(`📋 Найдено услуг: ${servicesResult.rows.length}`);

        let updatedServices = 0;
        let updatedStyles = 0;
        let updatedOptions = 0;

        // Очищаем файлы в услугах
        for (const service of servicesResult.rows) {
            let needsUpdate = false;
            const updates = {};

            if (service.images && Array.isArray(service.images)) {
                const cleanedImages = cleanFileArray(service.images);
                if (cleanedImages.length !== service.images.length) {
                    updates.images = cleanedImages;
                    needsUpdate = true;
                }
            }

            if (service.videos && Array.isArray(service.videos)) {
                const cleanedVideos = cleanFileArray(service.videos);
                if (cleanedVideos.length !== service.videos.length) {
                    updates.videos = cleanedVideos;
                    needsUpdate = true;
                }
            }

            if (needsUpdate) {
                const setClause = Object.keys(updates).map(key => `${key} = $${Object.keys(updates).indexOf(key) + 1}`).join(', ');
                const values = Object.values(updates);
                values.push(service.id);

                await pool.query(`UPDATE services SET ${setClause} WHERE id = $${values.length}`, values);
                console.log(`✅ Обновлена услуга: ${service.name}`);
                updatedServices++;
            }
        }

        // Получаем все стили (если таблица существует)
        try {
            const stylesResult = await pool.query('SELECT id, name, images, videos FROM service_styles');
            console.log(`📋 Найдено стилей: ${stylesResult.rows.length}`);

            for (const style of stylesResult.rows) {
                let needsUpdate = false;
                const updates = {};

                if (style.images && Array.isArray(style.images)) {
                    const cleanedImages = cleanFileArray(style.images);
                    if (cleanedImages.length !== style.images.length) {
                        updates.images = cleanedImages;
                        needsUpdate = true;
                    }
                }

                if (style.videos && Array.isArray(style.videos)) {
                    const cleanedVideos = cleanFileArray(style.videos);
                    if (cleanedVideos.length !== style.videos.length) {
                        updates.videos = cleanedVideos;
                        needsUpdate = true;
                    }
                }

                if (needsUpdate) {
                    const setClause = Object.keys(updates).map(key => `${key} = $${Object.keys(updates).indexOf(key) + 1}`).join(', ');
                    const values = Object.values(updates);
                    values.push(style.id);

                    await pool.query(`UPDATE service_styles SET ${setClause} WHERE id = $${values.length}`, values);
                    console.log(`✅ Обновлен стиль: ${style.name}`);
                    updatedStyles++;
                }
            }
        } catch (error) {
            console.log('⚠️ Таблица service_styles не найдена, пропускаем...');
        }

        // Получаем все опции (если таблица существует)
        try {
            const optionsResult = await pool.query('SELECT id, name, images, videos FROM service_options');
            console.log(`📋 Найдено опций: ${optionsResult.rows.length}`);

            for (const option of optionsResult.rows) {
                let needsUpdate = false;
                const updates = {};

                if (option.images && Array.isArray(option.images)) {
                    const cleanedImages = cleanFileArray(option.images);
                    if (cleanedImages.length !== option.images.length) {
                        updates.images = cleanedImages;
                        needsUpdate = true;
                    }
                }

                if (option.videos && Array.isArray(option.videos)) {
                    const cleanedVideos = cleanFileArray(option.videos);
                    if (cleanedVideos.length !== option.videos.length) {
                        updates.videos = cleanedVideos;
                        needsUpdate = true;
                    }
                }

                if (needsUpdate) {
                    const setClause = Object.keys(updates).map(key => `${key} = $${Object.keys(updates).indexOf(key) + 1}`).join(', ');
                    const values = Object.values(updates);
                    values.push(option.id);

                    await pool.query(`UPDATE service_options SET ${setClause} WHERE id = $${values.length}`, values);
                    console.log(`✅ Обновлена опция: ${option.name}`);
                    updatedOptions++;
                }
            }
        } catch (error) {
            console.log('⚠️ Таблица service_options не найдена, пропускаем...');
        }

        console.log('\n🎉 Очистка завершена!');
        console.log(`📊 Статистика:`);
        console.log(`   - Обновлено услуг: ${updatedServices}`);
        console.log(`   - Обновлено стилей: ${updatedStyles}`);
        console.log(`   - Обновлено опций: ${updatedOptions}`);

    } catch (error) {
        console.error('❌ Ошибка при очистке:', error);
    } finally {
        await pool.end();
    }
}

cleanupMissingFiles();


