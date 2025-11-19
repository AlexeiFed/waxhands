#!/usr/bin/env node

// Простой скрипт для проверки БД через psql
const { exec } = require('child_process');

const query = `SELECT id, robokassa_invoice_id, amount, status FROM invoices WHERE id = '246e6167-0663-4bf5-a21a-2da0bd8dd4e9';`;

exec(`psql -h localhost -U waxhands_user -d waxhands -c "${query}"`, (error, stdout, stderr) => {
    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Query result:');
    console.log(stdout);

    if (stderr) {
        console.error('Stderr:', stderr);
    }
});
