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

        // 1. Заголовок
        XLSX.utils.sheet_add_aoa(worksheet, [['ОТЧЕТ ПО МАСТЕР-КЛАССУ']], { origin: { r: currentRow, c: 0 } });
        currentRow += 2;

        // 2. Информация о мастер классе
        XLSX.utils.sheet_add_aoa(worksheet, [
            ['Параметр', 'Значение'],
            ['Название мастер класса', service.name],
            ['Дата', new Date(masterClass.date).toLocaleDateString('ru-RU')],
            ['Время', masterClass.time],
            ['Школа', masterClass.schoolName],
            ['Город', masterClass.city],
            ['Группа', masterClass.classGroup],
            ['Всего участников', participants.length],
            ['Оплачено', participants.filter(p => p.isPaid).length],
            ['Ожидает оплаты', participants.filter(p => !p.isPaid).length],
            ['Получили услугу', participants.filter(p => p.hasReceived).length],
            ['Общая сумма', participants.reduce((sum, p) => sum + p.totalAmount, 0)],
            ['Оплаченная сумма', participants.filter(p => p.isPaid).reduce((sum, p) => sum + p.totalAmount, 0)]
        ], { origin: { r: currentRow, c: 0 } });
        currentRow += 14;

        // 3. Статистика по стилям
        if (service.styles.length > 0) {
            XLSX.utils.sheet_add_aoa(worksheet, [['СТАТИСТИКА ВАРИАНТОВ РУЧЕК']], { origin: { r: currentRow, c: 0 } });
            currentRow += 1;

            const styleStats = service.styles.map(style => {
                const count = participants.filter(p =>
                    p.selectedStyles.some(selected =>
                        typeof selected === 'string' ? selected === style.id : (selected as { id: string }).id === style.id
                    )
                ).length;
                return [style.name, count];
            });

            XLSX.utils.sheet_add_aoa(worksheet, [
                ['Вариант ручки', 'Количество выборов']
            ], { origin: { r: currentRow, c: 0 } });
            currentRow += 1;

            XLSX.utils.sheet_add_aoa(worksheet, styleStats, { origin: { r: currentRow, c: 0 } });
            currentRow += service.styles.length + 2;
        }

        // 4. Статистика по опциям
        if (service.options.length > 0) {
            XLSX.utils.sheet_add_aoa(worksheet, [['СТАТИСТИКА ДОПОЛНИТЕЛЬНЫХ УСЛУГ']], { origin: { r: currentRow, c: 0 } });
            currentRow += 1;

            const optionStats = service.options.map(option => {
                const count = participants.filter(p =>
                    p.selectedOptions.some(selected =>
                        typeof selected === 'string' ? selected === option.id : (selected as { id: string }).id === option.id
                    )
                ).length;
                return [option.name, count];
            });

            XLSX.utils.sheet_add_aoa(worksheet, [
                ['Дополнительная услуга', 'Количество выборов']
            ], { origin: { r: currentRow, c: 0 } });
            currentRow += 1;

            XLSX.utils.sheet_add_aoa(worksheet, optionStats, { origin: { r: currentRow, c: 0 } });
            currentRow += service.options.length + 2;
        }

        // 5. Таблица участников
        XLSX.utils.sheet_add_aoa(worksheet, [['ТАБЛИЦА УЧАСТНИКОВ']], { origin: { r: currentRow, c: 0 } });
        currentRow += 1;

        // Заголовки таблицы участников
        const headers = [
            'Участник',
            'Родитель'
        ];

        // Добавляем заголовки для стилей (без префикса "Стиль:")
        service.styles.forEach(style => {
            headers.push(style.name);
        });

        // Добавляем заголовки для опций (без префикса "Опция:")
        service.options.forEach(option => {
            headers.push(option.name);
        });

        // Добавляем остальные столбцы в конец
        headers.push(
            'Сумма',
            'Статус оплаты',
            'Получил услугу',
            'Дата оплаты',
            'Способ оплаты',
            'Примечания'
        );

        XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: { r: currentRow, c: 0 } });
        currentRow += 1;

        // Данные участников
        const tableData = participants.map(participant => {
            const row = [
                participant.childName,
                participant.parentName
            ];

            // Добавляем стили
            service.styles.forEach(style => {
                const isSelected = participant.selectedStyles.some(selected =>
                    typeof selected === 'string' ? selected === style.id : (selected as { id: string }).id === style.id
                );
                row.push(isSelected ? '1' : '');
            });

            // Добавляем опции
            service.options.forEach(option => {
                const isSelected = participant.selectedOptions.some(selected =>
                    typeof selected === 'string' ? selected === option.id : (selected as { id: string }).id === option.id
                );
                row.push(isSelected ? '1' : '');
            });

            // Добавляем остальные данные в конец
            row.push(
                String(participant.totalAmount),
                participant.isPaid ? 'Оплачено' : 'Ожидает',
                participant.hasReceived ? 'Да' : 'Нет',
                participant.paymentDate || '-',
                participant.paymentMethod === 'cash' ? 'Наличные' :
                    participant.paymentMethod === 'transfer' ? 'Перевод' : '-',
                participant.notes || '-'
            );

            return row;
        });

        XLSX.utils.sheet_add_aoa(worksheet, tableData, { origin: { r: currentRow, c: 0 } });

        // Настраиваем ширину столбцов
        const columnWidths = [
            { wch: 20 }, // Участник
            { wch: 25 }, // Родитель
        ];

        // Добавляем ширину для стилей и опций
        service.styles.forEach(() => columnWidths.push({ wch: 15 }));
        service.options.forEach(() => columnWidths.push({ wch: 15 }));

        // Добавляем ширину для остальных столбцов
        columnWidths.push(
            { wch: 12 }, // Сумма
            { wch: 15 }, // Статус оплаты
            { wch: 15 }, // Получил услугу
            { wch: 15 }, // Дата оплаты
            { wch: 15 }, // Способ оплаты
            { wch: 30 }  // Примечания
        );

        worksheet['!cols'] = columnWidths;

        // Добавляем лист в книгу
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Отчет');

        // Генерируем имя файла
        const fileName = `Мастер-класс_${service.name}_${new Date(masterClass.date).toLocaleDateString('ru-RU')}.xlsx`;

        // Скачиваем файл
        XLSX.writeFile(workbook, fileName);

        console.log('✅ Excel файл успешно экспортирован:', fileName);
    } catch (error) {
        console.error('❌ Ошибка при экспорте в Excel:', error);
        throw new Error('Не удалось экспортировать данные в Excel');
    }
};
