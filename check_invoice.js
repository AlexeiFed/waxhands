import pool from './dist/database/connection.js';

async function checkInvoice() {
    try {
        const result = await pool.query(
            'SELECT id, robokassa_invoice_id, amount, status FROM invoices WHERE id = $1',
            ['246e6167-0663-4bf5-a21a-2da0bd8dd4e9']
        );

        console.log('Invoice data:');
        console.log(JSON.stringify(result.rows, null, 2));

        if (result.rows.length > 0) {
            const invoice = result.rows[0];
            console.log('\nParsing robokassa_invoice_id:', invoice.robokassa_invoice_id);
            const robokassaId = parseInt(invoice.robokassa_invoice_id);
            console.log('Parsed as number:', robokassaId);
            console.log('Is NaN:', isNaN(robokassaId));
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkInvoice();
