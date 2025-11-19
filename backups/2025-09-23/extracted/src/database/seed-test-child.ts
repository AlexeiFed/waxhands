/**
 * @file: seed-test-child.ts
 * @description: Скрипт для создания тестового ребенка
 * @dependencies: connection.ts
 * @created: 2024-12-19
 */

import pool from './connection.js';

const seedTestChild = async () => {
    const client = await pool.connect();
    console.log('🔌 Connected to database for seeding test child');

    try {
        await client.query('BEGIN');
        console.log('📝 Starting test child seeding...');

        // Получаем первую школу
        const schoolsResult = await client.query('SELECT id, name FROM schools LIMIT 1');

        if (schoolsResult.rows.length === 0) {
            console.log('❌ No schools found. Please seed schools first.');
            return;
        }

        const school = schoolsResult.rows[0];

        // Создаем или обновляем тестового ребенка
        const childId = 'd8748283-e5b9-4c0f-814c-bbe5b51ddd69'; // ID из консоли

        // Проверяем, существует ли пользователь
        const existingUser = await client.query('SELECT id FROM users WHERE id = $1', [childId]);

        if (existingUser.rows.length > 0) {
            // Обновляем существующего пользователя
            await client.query(`
        UPDATE users 
        SET school_id = $1, 
            school_name = $2, 
            class = $3,
            class_group = $4
        WHERE id = $5
      `, [school.id, school.name, '1А', '1А', childId]);

            console.log(`✅ Updated existing child user: ${childId}`);
        } else {
            // Создаем нового пользователя
            await client.query(`
        INSERT INTO users (id, name, surname, role, school_id, school_name, class, class_group)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [childId, 'Тест', 'Ребенок', 'child', school.id, school.name, '1А', '1А']);

            console.log(`✅ Created new child user: ${childId}`);
        }

        await client.query('COMMIT');
        console.log('✅ Test child seeding completed successfully');

        // Показываем созданного/обновленного пользователя
        const result = await client.query(`
      SELECT id, name, surname, role, school_id, school_name, class, class_group
      FROM users 
      WHERE id = $1
    `, [childId]);

        console.log('\n👶 Test child user:');
        const user = result.rows[0];
        console.log(`   ID: ${user.id}`);
        console.log(`   Name: ${user.name} ${user.surname}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   School: ${user.school_name} (ID: ${user.school_id})`);
        console.log(`   Class: ${user.class}`);
        console.log(`   Class Group: ${user.class_group}`);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error seeding test child:', error);
        throw error;
    } finally {
        client.release();
        console.log('🔌 Database connection released');
    }
};

// Запуск seeding если файл выполняется напрямую
if (process.argv[1] && process.argv[1].includes('seed-test-child.ts')) {
    console.log('🚀 Starting test child seeding...');
    seedTestChild()
        .then(() => {
            console.log('🎉 Seeding completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Seeding failed:', error);
            process.exit(1);
        });
}

export { seedTestChild };
