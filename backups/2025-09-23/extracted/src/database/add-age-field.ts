/**
 * @file: add-age-field.ts
 * @description: Миграция для добавления столбца age в таблицу users
 * @dependencies: connection.ts
 * @created: 2024-12-19
 */

import pool from './connection.js';

// Тестовая функция для проверки подключения
const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('🔌 Test connection successful');
        await client.query('SELECT NOW()');
        client.release();
        return true;
    } catch (error) {
        console.error('❌ Test connection failed:', error);
        return false;
    }
};

export const addAgeField = async (): Promise<void> => {
    console.log('🚀 Starting age field migration...');

    // Сначала тестируем подключение
    const isConnected = await testConnection();
    if (!isConnected) {
        throw new Error('Database connection failed');
    }

    const client = await pool.connect();
    console.log('🔌 Connected to database for adding age field');

    try {
        await client.query('BEGIN');
        console.log('📝 Starting age field addition...');

        // Проверяем, существует ли уже столбец age
        const checkColumn = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'age'
        `);

        if (checkColumn.rows.length === 0) {
            // Добавляем столбец age
            console.log('➕ Adding age column to users table...');
            await client.query(`
                ALTER TABLE users 
                ADD COLUMN age INTEGER CHECK (age >= 0 AND age <= 120)
            `);
            console.log('✅ Age column added to users table');
        } else {
            console.log('ℹ️ Age column already exists in users table');
        }

        await client.query('COMMIT');
        console.log('✅ Age field migration completed successfully');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error adding age field:', error);
        throw error;
    } finally {
        client.release();
    }
};

// Запуск миграции, если файл выполняется напрямую
addAgeField()
    .then(() => {
        console.log('🎉 Age field migration completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Age field migration failed:', error);
        process.exit(1);
    });
