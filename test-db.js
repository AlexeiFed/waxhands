import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'waxhands',
    user: 'waxhands_user',
    password: 'waxhands123'
});

async function testDatabase() {
    try {
        console.log('Testing database connection...');
        const result = await pool.query('SELECT NOW()');
        console.log('Database connected:', result.rows[0]);
        
        // Test chat_messages table
        console.log('Testing chat_messages table...');
        const chatResult = await pool.query('SELECT COUNT(*) FROM chat_messages');
        console.log('chat_messages count:', chatResult.rows[0]);
        
        // Test table structure
        console.log('Testing table structure...');
        const structureResult = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'chat_messages'
            ORDER BY ordinal_position
        `);
        console.log('chat_messages structure:', structureResult.rows);
        
    } catch (error) {
        console.error('Database error:', error);
    } finally {
        await pool.end();
    }
}

testDatabase();
