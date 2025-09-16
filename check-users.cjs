const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'waxhands',
    user: 'waxhands_user',
    password: 'waxhands123'
});

async function checkUsers() {
    try {
        console.log('🔍 Checking admin users...');

        const result = await pool.query("SELECT id, email, name, role FROM users WHERE role = 'admin' LIMIT 5");
        console.log('Admin users found:', result.rows.length);

        result.rows.forEach((user, index) => {
            console.log(`\nAdmin ${index + 1}:`);
            console.log('  ID:', user.id);
            console.log('  Email:', user.email);
            console.log('  Name:', user.name);
            console.log('  Role:', user.role);
        });

        // Check if there are any users at all
        const allUsersResult = await pool.query("SELECT COUNT(*) as count FROM users");
        console.log(`\nTotal users in database: ${allUsersResult.rows[0].count}`);

        await pool.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        await pool.end();
    }
}

checkUsers();
