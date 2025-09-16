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

    // Создаем новый canvas с белым фоном
    const canvas = sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    });

    // Ресайзим иконку до размера с учетом безопасной зоны
    const resizedIcon = await image
      .resize(iconSize, iconSize, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
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

// Функция для создания обычной иконки с белым фоном
async function createIconWithWhiteBackground(inputPath, outputPath, size) {
  try {
    // Читаем исходную иконку
    const image = sharp(inputPath);

    // Создаем новую иконку с белым фоном
    const result = await image
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toBuffer();

    // Сохраняем результат
    fs.writeFileSync(outputPath, result);
    console.log(`✅ Создана иконка с белым фоном: ${outputPath}`);

  } catch (error) {
    console.error(`❌ Ошибка при создании ${outputPath}:`, error.message);
  }
}

// Основная функция
async function generateMaskableIcons() {
  const publicDir = path.join(__dirname, '..', 'public');
  const iconsDir = path.join(publicDir, 'icons');

  // Размеры для всех иконок
  const allSizes = [72, 96, 128, 144, 152, 180, 192, 384, 512, 1024];
  const maskableSizes = [192, 512];

  console.log('🚀 Начинаем генерацию иконок...');

  // Создаем обычные иконки с белым фоном
  console.log('📱 Создание обычных иконок с белым фоном...');
  for (const size of allSizes) {
    const inputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    const outputPath = path.join(iconsDir, `icon-${size}x${size}-white.png`);

    if (fs.existsSync(inputPath)) {
      await createIconWithWhiteBackground(inputPath, outputPath, size);
    } else {
      console.warn(`⚠️ Исходная иконка не найдена: ${inputPath}`);
    }
  }

  // Создаем maskable иконки
  console.log('🎯 Создание maskable иконок...');
  for (const size of maskableSizes) {
    const inputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    const outputPath = path.join(iconsDir, `icon-${size}x${size}-maskable.png`);

    if (fs.existsSync(inputPath)) {
      await createMaskableIcon(inputPath, outputPath, size);
    } else {
      console.warn(`⚠️ Исходная иконка не найдена: ${inputPath}`);
    }
  }

  console.log('✨ Генерация всех иконок завершена!');
}

// Запускаем если файл выполняется напрямую
if (require.main === module) {
  generateMaskableIcons().catch(console.error);
}

module.exports = { generateMaskableIcons, createMaskableIcon };
