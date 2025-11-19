/**
 * @file: debug-query.ts
 * @description: Отладочный скрипт для проверки SQL запросов
 * @dependencies: connection.ts
 * @created: 2024-12-19
 */
import pool from './connection.js';
const debugQuery = async () => {
    const client = await pool.connect();
    console.log('🔌 Connected to database for debugging');
    try {
        const userId = 'd8748283-e5b9-4c0f-814c-bbe5b51ddd69';
        // Получаем данные пользователя
        console.log('\n👤 User data:');
        const userResult = await client.query(`
      SELECT id, name, school_id, school_name, class, class_group 
      FROM users 
      WHERE id = $1
    `, [userId]);
        if (userResult.rows.length === 0) {
            console.log('❌ User not found!');
            return;
        }
        const user = userResult.rows[0];
        console.log(user);
        // Получаем мастер-классы без фильтра
        console.log('\n📅 All master classes:');
        const allEventsResult = await client.query(`
      SELECT mce.*, s.name as school_name
      FROM master_class_events mce
      LEFT JOIN schools s ON mce.school_id = s.id
      ORDER BY mce.date ASC
    `);
        console.log(`Found ${allEventsResult.rows.length} master classes:`);
        allEventsResult.rows.forEach((event, index) => {
            console.log(`${index + 1}. ${event.notes}`);
            console.log(`   School ID: ${event.school_id}`);
            console.log(`   School Name: ${event.school_name}`);
            console.log(`   Class Group: ${event.class_group}`);
            console.log(`   Date: ${event.date}`);
            console.log('');
        });
        // Выполняем тот же запрос что и в контроллере
        console.log('\n🎯 Filtered query (like controller):');
        const userSchoolId = user.school_id;
        const userClassGroup = user.class_group;
        console.log('Filter parameters:', { userSchoolId, userClassGroup });
        const filteredResult = await client.query(`
      SELECT mce.*, 
             s.name as school_name,
             srv.name as service_name,
             s.address as school_address
      FROM master_class_events mce
      LEFT JOIN schools s ON mce.school_id = s.id
      LEFT JOIN services srv ON mce.service_id = srv.id
      WHERE mce.date >= CURRENT_DATE
      ORDER BY 
          CASE 
              WHEN mce.school_id = $1 AND mce.class_group = $2 THEN 1
              WHEN mce.school_id = $1 THEN 2
              ELSE 3
          END,
          mce.date ASC, mce.time ASC
    `, [userSchoolId, userClassGroup]);
        console.log(`Found ${filteredResult.rows.length} filtered master classes:`);
        filteredResult.rows.forEach((event, index) => {
            console.log(`${index + 1}. ${event.notes}`);
            console.log(`   School ID: ${event.school_id} (matches: ${event.school_id === userSchoolId})`);
            console.log(`   Class Group: ${event.class_group} (matches: ${event.class_group === userClassGroup})`);
            const eventDate = event.date || '';
            const todayStr = new Date().toISOString().split('T')[0] || '';
            console.log(`   Date: ${eventDate} (>= today: ${eventDate >= todayStr})`);
            console.log('');
        });
        // Проверяем текущую дату
        console.log('\n📆 Date check:');
        const dateResult = await client.query('SELECT CURRENT_DATE');
        console.log('Current database date:', dateResult.rows[0].current_date);
        console.log('Current JS date:', new Date().toISOString().split('T')[0]);
    }
    catch (error) {
        console.error('❌ Error in debug query:', error);
    }
    finally {
        client.release();
        console.log('🔌 Database connection released');
    }
};
// Запуск debug если файл выполняется напрямую
if (process.argv[1] && process.argv[1].includes('debug-query.ts')) {
    console.log('🚀 Starting debug query...');
    debugQuery()
        .then(() => {
        console.log('🎉 Debug completed');
        process.exit(0);
    })
        .catch((error) => {
        console.error('💥 Debug failed:', error);
        process.exit(1);
    });
}
export { debugQuery };
//# sourceMappingURL=debug-query.js.map