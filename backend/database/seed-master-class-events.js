/**
 * @file: seed-master-class-events.ts
 * @description: Скрипт для добавления тестовых данных мастер-классов
 * @dependencies: connection.ts
 * @created: 2024-12-19
 */
import pool from './connection.js';
const seedMasterClassEvents = async () => {
    const client = await pool.connect();
    console.log('🔌 Connected to database for seeding master class events');
    try {
        await client.query('BEGIN');
        console.log('📝 Starting master class events seeding...');
        // Получаем ID школ и услуг для создания мастер-классов
        const schoolsResult = await client.query('SELECT id, name FROM schools LIMIT 3');
        const servicesResult = await client.query('SELECT id, name FROM services LIMIT 2');
        if (schoolsResult.rows.length === 0 || servicesResult.rows.length === 0) {
            console.log('❌ No schools or services found. Please seed schools and services first.');
            return;
        }
        const schools = schoolsResult.rows;
        const services = servicesResult.rows;
        console.log(`🏫 Found ${schools.length} schools`);
        console.log(`🛠️ Found ${services.length} services`);
        // Очищаем существующие мастер-классы
        await client.query('DELETE FROM master_class_events');
        console.log('🗑️ Cleared existing master class events');
        // Создаем тестовые мастер-классы
        const masterClassEvents = [
            {
                date: '2024-12-25',
                time: '10:00',
                schoolId: schools[0].id,
                classGroup: '1А',
                serviceId: services[0].id,
                notes: 'Новогодний мастер-класс для первоклассников'
            },
            {
                date: '2024-12-26',
                time: '14:00',
                schoolId: schools[0].id,
                classGroup: '2Б',
                serviceId: services[0].id,
                notes: 'Зимние поделки для второго класса'
            },
            {
                date: '2024-12-27',
                time: '11:00',
                schoolId: schools[1]?.id || schools[0].id,
                classGroup: '1А',
                serviceId: services[1]?.id || services[0].id,
                notes: 'Творческий мастер-класс'
            },
            {
                date: '2024-12-28',
                time: '15:00',
                schoolId: schools[1]?.id || schools[0].id,
                classGroup: '3В',
                serviceId: services[0].id,
                notes: 'Мастер-класс для третьеклассников'
            },
            {
                date: '2024-12-30',
                time: '12:00',
                schoolId: schools[2]?.id || schools[0].id,
                classGroup: '1А',
                serviceId: services[1]?.id || services[0].id,
                notes: 'Предновогодний творческий урок'
            }
        ];
        for (const event of masterClassEvents) {
            const defaultStats = {
                totalParticipants: 0,
                totalAmount: 0,
                paidAmount: 0,
                unpaidAmount: 0,
                stylesStats: {},
                optionsStats: {}
            };
            await client.query(`
        INSERT INTO master_class_events (date, time, school_id, class_group, service_id, executors, notes, participants, statistics)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
                event.date,
                event.time,
                event.schoolId,
                event.classGroup,
                event.serviceId,
                JSON.stringify([]), // executors
                event.notes,
                JSON.stringify([]), // participants
                JSON.stringify(defaultStats) // statistics
            ]);
            console.log(`✅ Created master class: ${event.notes} on ${event.date} at ${event.time}`);
        }
        await client.query('COMMIT');
        console.log('✅ Master class events seeding completed successfully');
        // Показываем созданные мастер-классы
        const result = await client.query(`
      SELECT mce.*, s.name as school_name, srv.name as service_name
      FROM master_class_events mce
      LEFT JOIN schools s ON mce.school_id = s.id
      LEFT JOIN services srv ON mce.service_id = srv.id
      ORDER BY mce.date ASC
    `);
        console.log('\n📋 Created master class events:');
        result.rows.forEach((event, index) => {
            console.log(`${index + 1}. ${event.notes}`);
            console.log(`   📅 Date: ${event.date} ${event.time}`);
            console.log(`   🏫 School: ${event.school_name}`);
            console.log(`   📚 Class: ${event.class_group}`);
            console.log(`   🛠️ Service: ${event.service_name}`);
            console.log('');
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error seeding master class events:', error);
        throw error;
    }
    finally {
        client.release();
        console.log('🔌 Database connection released');
    }
};
// Запуск seeding если файл выполняется напрямую
if (process.argv[1] && process.argv[1].includes('seed-master-class-events.ts')) {
    console.log('🚀 Starting master class events seeding...');
    seedMasterClassEvents()
        .then(() => {
        console.log('🎉 Seeding completed');
        process.exit(0);
    })
        .catch((error) => {
        console.error('💥 Seeding failed:', error);
        process.exit(1);
    });
}
export { seedMasterClassEvents };
//# sourceMappingURL=seed-master-class-events.js.map