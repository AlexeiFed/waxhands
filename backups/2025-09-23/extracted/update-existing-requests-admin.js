/**
 * @file: backend/update-existing-requests-admin.ts
 * @description: Скрипт для обновления существующих заявок с admin_id
 * @dependencies: database/connection.ts
 * @created: 2024-12-19
 */

import { db } from './src/database/connection';

async function updateExistingRequests() {
    try {
        console.log('🔍 Начинаем обновление существующих заявок...');

        // Получаем ID админа
        const adminQuery = `
            SELECT id FROM users 
            WHERE role = 'admin' 
            ORDER BY created_at ASC 
            LIMIT 1
        `;

        const adminResult = await db.query(adminQuery);

        if (adminResult.rows.length === 0) {
            console.error('❌ Админ не найден в системе');
            return;
        }

        const adminId = adminResult.rows[0].id;
        console.log('✅ Найден админ с ID:', adminId);

        // Обновляем все заявки без admin_id
        const updateQuery = `
            UPDATE workshop_requests 
            SET admin_id = $1, updated_at = CURRENT_TIMESTAMP
            WHERE admin_id IS NULL
        `;

        const updateResult = await db.query(updateQuery, [adminId]);
        console.log('✅ Обновлено заявок:', updateResult.rowCount);

        // Проверяем результат
        const checkQuery = `
            SELECT COUNT(*) as total,
                   COUNT(admin_id) as with_admin
            FROM workshop_requests
        `;

        const checkResult = await db.query(checkQuery);
        const stats = checkResult.rows[0];

        console.log('📊 Статистика заявок:');
        console.log('- Всего заявок:', stats.total);
        console.log('- С назначенным админом:', stats.with_admin);

        if (stats.total === stats.with_admin) {
            console.log('🎉 Все заявки успешно обновлены!');
        } else {
            console.warn('⚠️ Некоторые заявки остались без админа');
        }

    } catch (error) {
        console.error('❌ Ошибка при обновлении заявок:', error);
    } finally {
        process.exit(0);
    }
}

updateExistingRequests();
