import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'waxhands',
    user: 'waxhands_user',
    password: 'waxhands123'
});

async function testSQLFixed() {
    try {
        console.log('Testing FIXED SQL query from markMessageAsRead...');

        // Test the FIXED SQL query from markMessageAsRead
        const sqlQuery = `
            UPDATE chat_messages 
            SET is_read = true
            WHERE id = $1 AND chat_id = $2
        `;

        const params = ['test-message-id', 'test-chat-id'];

        console.log('SQL Query:', sqlQuery);
        console.log('Parameters:', params);

        // First, let's check if we can read from the table
        console.log('Testing SELECT query...');
        const selectResult = await pool.query('SELECT id, chat_id, is_read FROM chat_messages LIMIT 1');
        console.log('SELECT result:', selectResult.rows[0]);

        // Now test the FIXED UPDATE query
        console.log('Testing FIXED UPDATE query...');
        const updateResult = await pool.query(sqlQuery, params);
        console.log('UPDATE result:', updateResult);

        // Check row count
        console.log('Rows affected:', updateResult.rowCount);

    } catch (error) {
        console.error('SQL error:', error);
    } finally {
        await pool.end();
    }
}

testSQLFixed();
