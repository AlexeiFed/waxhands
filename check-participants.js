const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'waxhands',
    user: 'waxhands_user',
    password: 'waxhands123'
});

async function checkParticipants() {
    try {
        console.log('🔍 Проверяем мастер-классы с участниками...');

        const result = await pool.query(`
      SELECT id, participants 
      FROM master_class_events 
      WHERE participants IS NOT NULL 
      AND jsonb_array_length(participants) > 0 
      LIMIT 3
    `);

        console.log(`📊 Найдено мастер-классов с участниками: ${result.rows.length}`);

        result.rows.forEach((row, index) => {
            console.log(`\n--- Мастер-класс ${index + 1} ---`);
            console.log('ID мастер-класса:', row.id);
            console.log('Количество участников:', row.participants.length);

            row.participants.forEach((participant, pIndex) => {
                console.log(`\nУчастник ${pIndex + 1}:`);
                console.log('  ID участника:', participant.id);
                console.log('  childId:', participant.childId);
                console.log('  childName:', participant.childName);
                console.log('  parentId:', participant.parentId);
                console.log('  totalAmount:', participant.totalAmount);
                console.log('  isPaid:', participant.isPaid);
                console.log('  notes:', participant.notes);
            });
        });

        await pool.end();
    } catch (error) {
        console.error('❌ Ошибка:', error);
        await pool.end();
    }
}

checkParticipants();
