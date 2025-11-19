/**
 * @file: migrate-invoice-data.ts
 * @description: Миграция для обновления данных в таблице invoices
 * @dependencies: connection.ts, types/index.ts
 * @created: 2024-12-19
 */
import pool from './connection.js';
const migrateInvoiceData = async () => {
    const client = await pool.connect();
    try {
        console.log('🔄 Начинаем миграцию данных счетов...');
        await client.query('BEGIN');
        // Получаем все счета
        const invoicesResult = await client.query('SELECT id, selected_styles, selected_options FROM invoices');
        const invoices = invoicesResult.rows;
        console.log(`📊 Найдено ${invoices.length} счетов для обновления`);
        for (const invoice of invoices) {
            let needsUpdate = false;
            let updatedStyles = invoice.selected_styles;
            let updatedOptions = invoice.selected_options;
            // Проверяем и обновляем стили
            if (Array.isArray(invoice.selected_styles)) {
                updatedStyles = invoice.selected_styles.map((style) => {
                    if (typeof style === 'string') {
                        // Если это строка (ID), преобразуем в объект
                        needsUpdate = true;
                        return {
                            id: style,
                            name: style, // Временно используем ID как название
                            price: 0
                        };
                    }
                    return style;
                });
            }
            // Проверяем и обновляем опции
            if (Array.isArray(invoice.selected_options)) {
                updatedOptions = invoice.selected_options.map((option) => {
                    if (typeof option === 'string') {
                        // Если это строка (ID), преобразуем в объект
                        needsUpdate = true;
                        return {
                            id: option,
                            name: option, // Временно используем ID как название
                            price: 0
                        };
                    }
                    return option;
                });
            }
            // Обновляем запись если нужно
            if (needsUpdate) {
                console.log(`🔄 Обновляем счет ${invoice.id}`);
                await client.query('UPDATE invoices SET selected_styles = $1, selected_options = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3', [JSON.stringify(updatedStyles), JSON.stringify(updatedOptions), invoice.id]);
            }
        }
        await client.query('COMMIT');
        console.log('✅ Миграция данных счетов завершена успешно');
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Ошибка при миграции данных счетов:', error);
        throw error;
    }
    finally {
        client.release();
    }
};
// Запускаем миграцию если файл вызван напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
    migrateInvoiceData()
        .then(() => {
        console.log('🎉 Миграция завершена');
        process.exit(0);
    })
        .catch((error) => {
        console.error('💥 Ошибка миграции:', error);
        process.exit(1);
    });
}
export default migrateInvoiceData;
//# sourceMappingURL=migrate-invoice-data.js.map