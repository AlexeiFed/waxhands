import pool from './database/connection.js';

async function checkAboutId() {
    try {
        console.log('Checking about table for ID...');
        const result = await pool.query('SELECT id FROM about ORDER BY id DESC LIMIT 1');
        console.log('About ID:', result.rows[0]?.id);
        
        pool.end();
    } catch (err) {
        console.error('Error:', err);
        pool.end();
    }
}

checkAboutId();
