const pool = require('./backend/database/connection.js');

async function checkMasterClass() {
    try {
        const result = await pool.query('SELECT * FROM master_class_events WHERE date = $1', ['2025-09-02']);
        console.log('Мастер-классы на 2 сентября 2025:');
        console.log(JSON.stringify(result.rows, null, 2));
        console.log(`Всего найдено: ${result.rows.length}`);

        if (result.rows.length > 0) {
            console.log('\nДетали первого мастер-класса:');
            const mc = result.rows[0];
            console.log(`ID: ${mc.id}`);
            console.log(`Дата: ${mc.date}`);
            console.log(`Время: ${mc.time}`);
            console.log(`Школа ID: ${mc.school_id}`);
            console.log(`Класс: ${mc.class_group}`);
            console.log(`Услуга ID: ${mc.service_id}`);
            console.log(`Исполнители: ${mc.executors}`);
            console.log(`Создан: ${mc.created_at}`);
        }

        process.exit(0);
    } catch (err) {
        console.error('Ошибка:', err);
        process.exit(1);
    }
}

checkMasterClass();
