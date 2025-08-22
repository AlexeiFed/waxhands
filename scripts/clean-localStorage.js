#!/usr/bin/env node

/**
 * Скрипт для очистки кода от использования localStorage
 * Заменяет localStorage на API вызовы
 */

const fs = require('fs');
const path = require('path');

// Файлы, которые нужно очистить от localStorage
const filesToClean = [
    'src/contexts/AuthContext.tsx',
    'src/pages/auth/Login.tsx',
    'src/pages/auth/Register.tsx',
    'src/pages/admin/Dashboard.tsx'
];

// Паттерны для замены
const replacements = [
    {
        pattern: /localStorage\.getItem\("users"\)/g,
        replacement: 'await api.getUsers()'
    },
    {
        pattern: /localStorage\.setItem\("users", JSON\.stringify\(([^)]+)\)\)/g,
        replacement: 'await api.createUser($1)'
    },
    {
        pattern: /localStorage\.getItem\("schools"\)/g,
        replacement: 'await api.getSchools()'
    },
    {
        pattern: /localStorage\.setItem\("schools", JSON\.stringify\(([^)]+)\)\)/g,
        replacement: 'await api.updateSchools($1)'
    },
    {
        pattern: /localStorage\.getItem\("services"\)/g,
        replacement: 'await api.getServices()'
    },
    {
        pattern: /localStorage\.setItem\("services", JSON\.stringify\(([^)]+)\)\)/g,
        replacement: 'await api.updateServices($1)'
    },
    {
        pattern: /localStorage\.getItem\("masterClasses"\)/g,
        replacement: 'await api.getMasterClasses()'
    },
    {
        pattern: /localStorage\.setItem\("masterClasses", JSON\.stringify\(([^)]+)\)\)/g,
        replacement: 'await api.updateMasterClasses($1)'
    },
    {
        pattern: /localStorage\.getItem\("currentUser"\)/g,
        replacement: 'await api.getCurrentUser()'
    },
    {
        pattern: /localStorage\.setItem\("currentUser", JSON\.stringify\(([^)]+)\)\)/g,
        replacement: 'await api.setCurrentUser($1)'
    },
    {
        pattern: /localStorage\.removeItem\("currentUser"\)/g,
        replacement: 'await api.logout()'
    }
];

function cleanFile(filePath) {
    try {
        const fullPath = path.join(process.cwd(), filePath);

        if (!fs.existsSync(fullPath)) {
            console.log(`⚠️  Файл не найден: ${filePath}`);
            return;
        }

        let content = fs.readFileSync(fullPath, 'utf8');
        let modified = false;

        // Применяем замены
        replacements.forEach(({ pattern, replacement }) => {
            if (pattern.test(content)) {
                content = content.replace(pattern, replacement);
                modified = true;
            }
        });

        if (modified) {
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log(`✅ Очищен файл: ${filePath}`);
        } else {
            console.log(`ℹ️  Файл не требует изменений: ${filePath}`);
        }

    } catch (error) {
        console.error(`❌ Ошибка при обработке файла ${filePath}:`, error.message);
    }
}

function main() {
    console.log('🧹 Начинаю очистку кода от localStorage...\n');

    filesToClean.forEach(cleanFile);

    console.log('\n📝 Рекомендации по дальнейшей работе:');
    console.log('1. Создайте API клиент для работы с бэкендом');
    console.log('2. Замените прямые вызовы localStorage на API вызовы');
    console.log('3. Обновите AuthContext для работы с JWT токенами');
    console.log('4. Добавьте обработку ошибок для API запросов');
    console.log('5. Обновите компоненты для работы с новым API');

    console.log('\n🔗 API endpoints:');
    console.log('- POST /api/auth/login');
    console.log('- POST /api/auth/register');
    console.log('- GET /api/schools');
    console.log('- GET /api/services');
    console.log('- GET /api/master-classes');

    console.log('\n✅ Очистка завершена!');
}

if (require.main === module) {
    main();
}

module.exports = { cleanFile, replacements }; 