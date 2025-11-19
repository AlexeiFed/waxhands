/**
 * @file: update-dates.ts
 * @description: Обновляет даты мастер-классов на будущие
 * @dependencies: connection.ts
 * @created: 2024-12-19
 */

import pool from './connection.js';

const updateDates = async () => {
    const client = await pool.connect();
    console.log('🔌 Connected to database for updating dates');

    try {
        await client.query('BEGIN');
        console.log('📝 Starting dates update...');

        // Получаем текущую дату + 1 день
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const futureDates = [
            new Date(tomorrow.getTime() + 0 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // завтра
            new Date(tomorrow.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // послезавтра
            new Date(tomorrow.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +2 дня
            new Date(tomorrow.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +3 дня
            new Date(tomorrow.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +4 дня
        ];

        console.log('Future dates to set:', futureDates);

        // Получаем все мастер-классы в порядке создания
        const eventsResult = await client.query(`
      SELECT id, notes 
      FROM master_class_events 
      ORDER BY created_at ASC
    `);

        console.log(`Found ${eventsResult.rows.length} events to update`);

        // Обновляем даты
        for (let i = 0; i < eventsResult.rows.length && i < futureDates.length; i++) {
            const event = eventsResult.rows[i];
            const newDate = futureDates[i];

            await client.query(`
        UPDATE master_class_events 
        SET date = $1 
        WHERE id = $2
      `, [newDate, event.id]);

            console.log(`✅ Updated "${event.notes}" to date: ${newDate}`);
        }

        await client.query('COMMIT');
        console.log('✅ Dates update completed successfully');

        // Показываем обновленные мастер-классы
        const result = await client.query(`
      SELECT mce.*, s.name as school_name, srv.name as service_name
      FROM master_class_events mce
      LEFT JOIN schools s ON mce.school_id = s.id
      LEFT JOIN services srv ON mce.service_id = srv.id
      WHERE mce.date >= CURRENT_DATE
      ORDER BY mce.date ASC
    `);

        console.log('\n📋 Updated master class events (future only):');
        result.rows.forEach((event, index) => {
            console.log(`${index + 1}. ${event.notes}`);
            console.log(`   📅 Date: ${event.date} ${event.time}`);
            console.log(`   🏫 School: ${event.school_name}`);
            console.log(`   📚 Class: ${event.class_group}`);
            console.log(`   🛠️ Service: ${event.service_name}`);
            console.log('');
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error updating dates:', error);
        throw error;
    } finally {
        client.release();
        console.log('🔌 Database connection released');
    }
};

// Запуск update если файл выполняется напрямую
if (process.argv[1] && process.argv[1].includes('update-dates.ts')) {
    console.log('🚀 Starting dates update...');
    updateDates()
        .then(() => {
            console.log('🎉 Update completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Update failed:', error);
            process.exit(1);
        });
}

export { updateDates };
