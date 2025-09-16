/**
 * @file: generate-maskable-icons.js
 * @description: Генерирует maskable версии иконок с правильным padding для PWA
 * @dependencies: sharp, fs, path
 * @created: 2025-09-13
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Функция для создания maskable иконки с padding
async function createMaskableIcon(inputPath, outputPath, size) {
    try {
        // Читаем исходную иконку
        const image = sharp(inputPath);
        const metadata = await image.metadata();

        // Вычисляем размер безопасной зоны (20% от размера иконки)
        const safeZoneSize = Math.floor(size * 0.2);
        const iconSize = size - (safeZoneSize * 2);

        // Создаем новый canvas с прозрачным фоном
        const canvas = sharp({
            create: {
                width: size,
                height: size,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
        });

        // Ресайзим иконку до размера с учетом безопасной зоны
        const resizedIcon = await image
            .resize(iconSize, iconSize, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png()
            .toBuffer();

        // Композируем иконку на canvas с отступами
        const result = await canvas
            .composite([{
                input: resizedIcon,
                left: safeZoneSize,
                top: safeZoneSize
            }])
            .png()
            .toBuffer();

        // Сохраняем результат
        fs.writeFileSync(outputPath, result);
        console.log(`✅ Создана maskable иконка: ${outputPath}`);

    } catch (error) {
        console.error(`❌ Ошибка при создании ${outputPath}:`, error.message);
    }
}

// Основная функция
async function generateMaskableIcons() {
    const publicDir = path.join(__dirname, '..', 'public');
    const iconsDir = path.join(publicDir, 'icons');

    // Размеры для maskable иконок
    const sizes = [192, 512];

    console.log('🚀 Начинаем генерацию maskable иконок...');

    for (const size of sizes) {
        const inputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
        const outputPath = path.join(iconsDir, `icon-${size}x${size}-maskable.png`);

        if (fs.existsSync(inputPath)) {
            await createMaskableIcon(inputPath, outputPath, size);
        } else {
            console.warn(`⚠️ Исходная иконка не найдена: ${inputPath}`);
        }
    }

    console.log('✨ Генерация maskable иконок завершена!');
}

// Запускаем если файл выполняется напрямую
if (require.main === module) {
    generateMaskableIcons().catch(console.error);
}

module.exports = { generateMaskableIcons, createMaskableIcon };

