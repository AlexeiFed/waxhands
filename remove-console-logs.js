const fs = require('fs');
const path = require('path');

// Функция для удаления console.log из файла
function removeConsoleLogsFromFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');

        // Удаляем отладочные console.log (оставляем только console.error)
        // Паттерн: console.log(...) с отладочной информацией
        content = content.replace(/^\s*console\.log\([^)]*\);\s*$/gm, '');

        // Удаляем многострочные console.log
        content = content.replace(/^\s*console\.log\(\s*`[^`]*`[^)]*\);\s*$/gm, '');

        // Удаляем console.log с объектами
        content = content.replace(/^\s*console\.log\([^)]*{[^}]*}[^)]*\);\s*$/gm, '');

        // Удаляем пустые строки после удаления
        content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

        fs.writeFileSync(filePath, content);
        console.log(`✅ Очищен файл: ${filePath}`);
        return true;
    } catch (error) {
        console.error(`❌ Ошибка при обработке файла ${filePath}:`, error.message);
        return false;
    }
}

// Функция для рекурсивного обхода директорий
function processDirectory(dirPath, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
    const files = fs.readdirSync(dirPath);
    let processedCount = 0;

    files.forEach(file => {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            // Пропускаем node_modules, dist, .git
            if (!['node_modules', 'dist', '.git', 'production'].includes(file)) {
                processedCount += processDirectory(filePath, extensions);
            }
        } else if (extensions.some(ext => file.endsWith(ext))) {
            if (removeConsoleLogsFromFile(filePath)) {
                processedCount++;
            }
        }
    });

    return processedCount;
}

// Обрабатываем исходные файлы
console.log('🧹 Начинаем удаление console.log...');

const srcProcessed = processDirectory('./src');
const backendProcessed = processDirectory('./backend/src');

console.log(`\n📊 Результат:`);
console.log(`- Frontend файлов обработано: ${srcProcessed}`);
console.log(`- Backend файлов обработано: ${backendProcessed}`);
console.log(`- Всего файлов обработано: ${srcProcessed + backendProcessed}`);
console.log('\n✅ Удаление console.log завершено!');

