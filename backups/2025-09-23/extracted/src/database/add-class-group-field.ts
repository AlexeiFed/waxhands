/**
 * @file: add-class-group-field.ts
 * @description: Миграция для добавления поля class_group в таблицу users
 * @dependencies: connection.ts
 * @created: 2024-12-19
 */

import pool from './connection.js';

const addClassGroupField = async () => {
    const client = await pool.connect();
    console.log('🔌 Connected to database for class_group field migration');

    try {
        await client.query('BEGIN');
        console.log('📝 Starting class_group field migration...');

        // Проверяем, существует ли уже поле class_group
        const columnExists = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'class_group'
    `);

        if (columnExists.rows.length === 0) {
            // Добавляем поле class_group
            console.log('➕ Adding class_group field to users table...');
            await client.query(`
        ALTER TABLE users 
        ADD COLUMN class_group VARCHAR(50)
      `);
            console.log('✅ class_group field added successfully');

            // Копируем данные из поля class в class_group для существующих записей
            await client.query(`
        UPDATE users 
        SET class_group = class 
        WHERE class_group IS NULL AND class IS NOT NULL
      `);
            console.log('✅ Existing class data copied to class_group');
        } else {
            console.log('ℹ️ class_group field already exists, skipping...');
        }

        await client.query('COMMIT');
        console.log('✅ class_group field migration completed successfully');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error adding class_group field:', error);
        throw error;
    } finally {
        client.release();
        console.log('🔌 Database connection released');
    }
};

// Запуск миграции если файл выполняется напрямую
if (process.argv[1] && process.argv[1].includes('add-class-group-field.ts')) {
    console.log('🚀 Starting class_group field migration...');
    addClassGroupField()
        .then(() => {
            console.log('🎉 Migration completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Migration failed:', error);
            process.exit(1);
        });
}

export { addClassGroupField };
