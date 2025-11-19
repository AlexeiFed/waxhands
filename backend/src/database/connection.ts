import { Pool, PoolConfig } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const dbConfig: PoolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'waxhands',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'waxhands123', // Явно указываем строку по умолчанию
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 40, // Увеличен с 20 до 40 для предотвращения timeout
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000, // Увеличен с 2000 до 5000ms
    // Принудительно используем TCP подключение вместо Unix socket
    connectionString: undefined
};

console.log('🔍 Настройки подключения к БД:', {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
    hasPassword: !!dbConfig.password,
    ssl: dbConfig.ssl
});

const pool = new Pool(dbConfig);

// Экспорт db для совместимости с существующим кодом
export const db = pool;

// Обработка ошибок подключения
pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle client', err);
    process.exit(-1);
});

pool.on('connect', () => {
    console.log('✅ Подключение к БД установлено');
});

pool.on('acquire', () => {
    console.log('🔗 Получено соединение из пула');
});

pool.on('remove', () => {
    console.log('🔌 Соединение удалено из пула');
});

// Проверка подключения
export const testConnection = async (): Promise<boolean> => {
    try {
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        console.log('✅ Database connection successful');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
};

// Функция для выполнения запросов
export const query = async (text: string, params?: unknown[]) => {
    const client = await pool.connect();
    try {
        const result = await client.query(text, params);
        return result;
    } finally {
        client.release();
    }
};

export default pool; 