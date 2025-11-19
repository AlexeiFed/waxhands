/**
 * @file: export-utils.ts
 * @description: Утилиты для экспорта данных мастер класса в Excel формате
 * @dependencies: xlsx
 * @created: 2024-12-19
 */

import * as XLSX from 'xlsx';
import { MasterClassEvent, MasterClassParticipant, Service } from '@/types/services';

/**
 * Экспорт данных мастер класса в Excel
 */
export const exportToExcel = (
    masterClass: MasterClassEvent,
    service: Service,
    participants: MasterClassParticipant[]
): void => {
    try {
        // Создаем рабочую книгу
        const workbook = XLSX.utils.book_new();

        // Создаем лист с данными
        const worksheet = XLSX.utils.aoa_to_sheet([]);

        let currentRow = 0;

        // 1. Упрощенный заголовок
        XLSX.utils.sheet_add_aoa(worksheet, [
            [`Школа: ${masterClass.schoolName}`],
            [`Класс: ${masterClass.classGroup}`],
            [`Дата: ${new Date(masterClass.date).toLocaleDateString('ru-RU')}`],
            [`Примечание: ${masterClass.notes || 'Нет'}`]
        ], { origin: { r: currentRow, c: 0 } });
        currentRow += 5;

        // 2. Таблица участников

        // Заголовки таблицы участников в новом порядке
        const headers = [
            'Сумма',     // 1. Сумма заказа
            'Участник',  // 2. Имя участника
            'Статус',    // 3. Статус оплаты
            '2об',       // 4. Двойные ручки
            '2св',       // 5. Двойные световые ручки
            '1об',       // 6. Обычная ручка
            '1св',       // 7. Световая ручка
            'Кор',       // 8. Коробочка
            'Л.об',      // 9. Лакировка
            'Л.бл',      // 10. Лакировка с блестками
            'Н.об',      // 11. Надпись
            'Н.св',      // 12. Световая надпись
            'Нак.О',     // 13. Наклейка
            'Нак.ОБ',    // 14. Наклейка объемная
            'Примечания' // 15. Примечания к заказу
        ];

        // Добавляем цены к заголовкам стилей и опций (обновленные ключи)
        const stylePrices = {
            '1об': service.styles.find(s => s.name.toLowerCase().includes('обычная'))?.price || 0,
            '1св': service.styles.find(s => s.name.toLowerCase().includes('световая') && !s.name.toLowerCase().includes('двойные'))?.price || 0,
            '2об': service.styles.find(s => s.name.toLowerCase().includes('двойные') && !s.name.toLowerCase().includes('световые'))?.price || 0,
            '2св': service.styles.find(s => s.name.toLowerCase().includes('двойные') && s.name.toLowerCase().includes('световые'))?.price || 0
        };

        const optionPrices = {
            'Л.об': service.options.find(o => o.name.toLowerCase().includes('лакировка') && !o.name.toLowerCase().includes('блестк'))?.price || 0,
            'Л.бл': service.options.find(o => o.name.toLowerCase().includes('лакировка') && o.name.toLowerCase().includes('блестк'))?.price || 0,
            'Н.об': service.options.find(o => o.name.toLowerCase().includes('надпись') && !o.name.toLowerCase().includes('световая'))?.price || 0,
            'Н.св': service.options.find(o => o.name.toLowerCase().includes('надпись') && o.name.toLowerCase().includes('световая'))?.price || 0,
            'Нак.О': service.options.find(o => o.name.toLowerCase().includes('наклейка') && !o.name.toLowerCase().includes('объемная'))?.price || 0,
            'Нак.ОБ': service.options.find(o => o.name.toLowerCase().includes('наклейка') && o.name.toLowerCase().includes('объемная'))?.price || 0,
            'Кор': service.options.find(o => o.name.toLowerCase().includes('коробочк'))?.price || 0
        };

        // Создаем строку с ценами в новом порядке
        const priceRow = [
            '', // Сумма - пустая
            '', // Участник - пустая
            '', // Статус - пустая
            `${stylePrices['2об']}₽`,
            `${stylePrices['2св']}₽`,
            `${stylePrices['1об']}₽`,
            `${stylePrices['1св']}₽`,
            `${optionPrices['Кор']}₽`,
            `${optionPrices['Л.об']}₽`,
            `${optionPrices['Л.бл']}₽`,
            `${optionPrices['Н.об']}₽`,
            `${optionPrices['Н.св']}₽`,
            `${optionPrices['Нак.О']}₽`,
            `${optionPrices['Нак.ОБ']}₽`,
            '' // Примечания - пустая
        ];

        XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: { r: currentRow, c: 0 } });

        // Делаем заголовки жирными с переносом текста (xlsx не поддерживает стили)
        headers.forEach((_, index) => {
            const cellRef = XLSX.utils.encode_cell({ r: currentRow, c: index });
            if (!worksheet[cellRef]) worksheet[cellRef] = {};
            // xlsx не поддерживает стили, только данные
        });

        currentRow += 1;

        // Добавляем строку с ценами
        XLSX.utils.sheet_add_aoa(worksheet, [priceRow], { origin: { r: currentRow, c: 0 } });

        // xlsx не поддерживает стили, только данные

        currentRow += 1;

        // Данные участников
        const tableData = participants.map(participant => {
            // Инициализируем счетчики для стилей и опций (обновленные ключи)
            const counts = {
                '1об': 0, '1св': 0, '2об': 0, '2св': 0,
                'Л.об': 0, 'Л.бл': 0, 'Н.об': 0, 'Н.св': 0, 'Нак.О': 0, 'Нак.ОБ': 0, 'Кор': 0
            };
            const amounts = {
                '1об': 0, '1св': 0, '2об': 0, '2св': 0,
                'Л.об': 0, 'Л.бл': 0, 'Н.об': 0, 'Н.св': 0, 'Нак.О': 0, 'Нак.ОБ': 0, 'Кор': 0
            };

            // Подсчитываем стили
            (participant.selectedStyles || []).forEach(styleItem => {
                if (!styleItem) return;
                const styleId = typeof styleItem === 'string' ? styleItem : (styleItem as { id: string, quantity?: number })?.id;
                const quantity = typeof styleItem === 'object' && styleItem && 'quantity' in styleItem ? (styleItem as { quantity: number }).quantity : 1;
                const styleObj = service.styles.find(s => s.id === styleId);
                if (styleObj) {
                    const styleName = styleObj.name.toLowerCase();
                    if (styleName.includes('обычная')) {
                        counts['1об'] += quantity;
                        amounts['1об'] += styleObj.price * quantity;
                    } else if (styleName.includes('световая') && !styleName.includes('двойные')) {
                        counts['1св'] += quantity;
                        amounts['1св'] += styleObj.price * quantity;
                    } else if (styleName.includes('двойные') && !styleName.includes('световые')) {
                        counts['2об'] += quantity;
                        amounts['2об'] += styleObj.price * quantity;
                    } else if (styleName.includes('двойные') && styleName.includes('световые')) {
                        counts['2св'] += quantity;
                        amounts['2св'] += styleObj.price * quantity;
                    }
                }
            });

            // Подсчитываем опции
            (participant.selectedOptions || []).forEach(optionItem => {
                if (!optionItem) return;
                const optionId = typeof optionItem === 'string' ? optionItem : (optionItem as { id: string, quantity?: number })?.id;
                const quantity = typeof optionItem === 'object' && optionItem && 'quantity' in optionItem ? (optionItem as { quantity: number }).quantity : 1;
                const optionObj = service.options.find(o => o.id === optionId);
                if (optionObj) {
                    const optionName = optionObj.name.toLowerCase();
                    if (optionName.includes('лакировка') && !optionName.includes('блестк')) {
                        counts['Л.об'] += quantity;
                        amounts['Л.об'] += optionObj.price * quantity;
                    } else if (optionName.includes('лакировка') && optionName.includes('блестк')) {
                        counts['Л.бл'] += quantity;
                        amounts['Л.бл'] += optionObj.price * quantity;
                    } else if (optionName.includes('надпись') && !optionName.includes('световая')) {
                        counts['Н.об'] += quantity;
                        amounts['Н.об'] += optionObj.price * quantity;
                    } else if (optionName.includes('надпись') && optionName.includes('световая')) {
                        counts['Н.св'] += quantity;
                        amounts['Н.св'] += optionObj.price * quantity;
                    } else if (optionName.includes('наклейка') && !optionName.includes('объемная')) {
                        counts['Нак.О'] += quantity;
                        amounts['Нак.О'] += optionObj.price * quantity;
                    } else if (optionName.includes('наклейка') && optionName.includes('объемная')) {
                        counts['Нак.ОБ'] += quantity;
                        amounts['Нак.ОБ'] += optionObj.price * quantity;
                    } else if (optionName.includes('коробочк')) {
                        counts['Кор'] += quantity;
                        amounts['Кор'] += optionObj.price * quantity;
                    }
                }
            });

            // Создаем строку в новом порядке: Сумма, Участник, Статус, 2об, 2св, 1об, 1св, Кор, Л.об, Л.бл, Н.об, Н.св, Нак.О, Нак.ОБ, Примечания
            const row = [
                participant.totalAmount.toLocaleString('ru-RU') + ' ₽', // Сумма
                participant.childName, // Участник
                participant.isPaid ? 'опл.' : 'ожд', // Статус
                counts['2об'] > 0 ? counts['2об'].toString() : '', // 2об
                counts['2св'] > 0 ? counts['2св'].toString() : '', // 2св
                counts['1об'] > 0 ? counts['1об'].toString() : '', // 1об
                counts['1св'] > 0 ? counts['1св'].toString() : '', // 1св
                counts['Кор'] > 0 ? counts['Кор'].toString() : '', // Кор
                counts['Л.об'] > 0 ? counts['Л.об'].toString() : '', // Л.об
                counts['Л.бл'] > 0 ? counts['Л.бл'].toString() : '', // Л.бл
                counts['Н.об'] > 0 ? counts['Н.об'].toString() : '', // Н.об
                counts['Н.св'] > 0 ? counts['Н.св'].toString() : '', // Н.св
                counts['Нак.О'] > 0 ? counts['Нак.О'].toString() : '', // Нак.О
                counts['Нак.ОБ'] > 0 ? counts['Нак.ОБ'].toString() : '', // Нак.ОБ
                participant.notes || '' // Примечания
            ];

            return row;
        });

        XLSX.utils.sheet_add_aoa(worksheet, tableData, { origin: { r: currentRow, c: 0 } });

        // xlsx не поддерживает стили, только данные

        currentRow += tableData.length;

        // Добавляем строку "Итого"
        const totalRow = ['Итого', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];

        // Подсчитываем общие суммы и количества
        const totalAmount = participants.reduce((sum, p) => sum + p.totalAmount, 0);
        const totalCounts = {
            '2об': 0, '2св': 0, '1об': 0, '1св': 0,
            'Л.об': 0, 'Л.бл': 0, 'Н.об': 0, 'Н.св': 0, 'Нак.О': 0, 'Нак.ОБ': 0, 'Кор': 0
        };

        participants.forEach(participant => {
            // Подсчитываем стили
            (participant.selectedStyles || []).forEach(styleItem => {
                if (!styleItem) return;
                const styleId = typeof styleItem === 'string' ? styleItem : (styleItem as { id: string, quantity?: number })?.id;
                const quantity = typeof styleItem === 'object' && styleItem && 'quantity' in styleItem ? (styleItem as { quantity: number }).quantity : 1;
                const styleObj = service.styles.find(s => s.id === styleId);
                if (styleObj) {
                    const styleName = styleObj.name.toLowerCase();
                    if (styleName.includes('обычная')) {
                        totalCounts['1об'] += quantity;
                    } else if (styleName.includes('световая') && !styleName.includes('двойные')) {
                        totalCounts['1св'] += quantity;
                    } else if (styleName.includes('двойные') && !styleName.includes('световые')) {
                        totalCounts['2об'] += quantity;
                    } else if (styleName.includes('двойные') && styleName.includes('световые')) {
                        totalCounts['2св'] += quantity;
                    }
                }
            });

            // Подсчитываем опции
            (participant.selectedOptions || []).forEach(optionItem => {
                if (!optionItem) return;
                const optionId = typeof optionItem === 'string' ? optionItem : (optionItem as { id: string, quantity?: number })?.id;
                const quantity = typeof optionItem === 'object' && optionItem && 'quantity' in optionItem ? (optionItem as { quantity: number }).quantity : 1;
                const optionObj = service.options.find(o => o.id === optionId);
                if (optionObj) {
                    const optionName = optionObj.name.toLowerCase();
                    if (optionName.includes('лакировка') && !optionName.includes('блестк')) {
                        totalCounts['Л.об'] += quantity;
                    } else if (optionName.includes('лакировка') && optionName.includes('блестк')) {
                        totalCounts['Л.бл'] += quantity;
                    } else if (optionName.includes('надпись') && !optionName.includes('световая')) {
                        totalCounts['Н.об'] += quantity;
                    } else if (optionName.includes('надпись') && optionName.includes('световая')) {
                        totalCounts['Н.св'] += quantity;
                    } else if (optionName.includes('наклейка') && !optionName.includes('объемная')) {
                        totalCounts['Нак.О'] += quantity;
                    } else if (optionName.includes('наклейка') && optionName.includes('объемная')) {
                        totalCounts['Нак.ОБ'] += quantity;
                    } else if (optionName.includes('коробочк')) {
                        totalCounts['Кор'] += quantity;
                    }
                }
            });
        });

        // Заполняем строку "Итого"
        totalRow[0] = totalAmount.toLocaleString('ru-RU') + ' ₽'; // Сумма
        totalRow[3] = totalCounts['2об'] > 0 ? totalCounts['2об'].toString() : ''; // 2об
        totalRow[4] = totalCounts['2св'] > 0 ? totalCounts['2св'].toString() : ''; // 2св
        totalRow[5] = totalCounts['1об'] > 0 ? totalCounts['1об'].toString() : ''; // 1об
        totalRow[6] = totalCounts['1св'] > 0 ? totalCounts['1св'].toString() : ''; // 1св
        totalRow[7] = totalCounts['Кор'] > 0 ? totalCounts['Кор'].toString() : ''; // Кор
        totalRow[8] = totalCounts['Л.об'] > 0 ? totalCounts['Л.об'].toString() : ''; // Л.об
        totalRow[9] = totalCounts['Л.бл'] > 0 ? totalCounts['Л.бл'].toString() : ''; // Л.бл
        totalRow[10] = totalCounts['Н.об'] > 0 ? totalCounts['Н.об'].toString() : ''; // Н.об
        totalRow[11] = totalCounts['Н.св'] > 0 ? totalCounts['Н.св'].toString() : ''; // Н.св
        totalRow[12] = totalCounts['Нак.О'] > 0 ? totalCounts['Нак.О'].toString() : ''; // Нак.О
        totalRow[13] = totalCounts['Нак.ОБ'] > 0 ? totalCounts['Нак.ОБ'].toString() : ''; // Нак.ОБ

        XLSX.utils.sheet_add_aoa(worksheet, [totalRow], { origin: { r: currentRow, c: 0 } });

        // xlsx не поддерживает стили, только данные

        // Настраиваем ширину столбцов (минимальные размеры)
        const columnWidths = [
            { wch: 12 }, // Сумма
            { wch: 15 }, // Участник
            { wch: 8 },  // Статус
            { wch: 6 },  // 2об
            { wch: 6 },  // 2св
            { wch: 6 },  // 1об
            { wch: 6 },  // 1св
            { wch: 6 },  // Л.об
            { wch: 6 },  // Л.бл
            { wch: 6 },  // Н.об
            { wch: 6 },  // Н.св
            { wch: 6 },  // Нак.О
            { wch: 6 },  // Нак.ОБ
            { wch: 6 },  // Кор
            { wch: 20 }  // Примечания
        ];

        worksheet['!cols'] = columnWidths;

        // Добавляем лист в книгу
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Отчет');

        // Генерируем имя файла: школа + класс + дата
        const fileName = `${masterClass.schoolName}_${masterClass.classGroup}_${new Date(masterClass.date).toLocaleDateString('ru-RU')}.xlsx`;

        // Скачиваем файл
        XLSX.writeFile(workbook, fileName);
    } catch (error) {
        console.error('❌ Ошибка при экспорте в Excel:', error);
        throw new Error('Не удалось экспортировать данные в Excel');
    }
};
