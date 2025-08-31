const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Размеры иконок для PWA
const sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512, 1024];

// Создаем папку для иконок если её нет
const iconsDir = path.join(__dirname, '../public');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

function generateIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Фон
    ctx.fillStyle = '#fef7e0';
    ctx.fillRect(0, 0, size, size);

    // Безопасная зона (80% от размера)
    const safeZone = size * 0.8;
    const safeZoneX = (size - safeZone) / 2;
    const safeZoneY = (size - safeZone) / 2;

    ctx.fillStyle = '#ff8c00';
    ctx.beginPath();
    roundRect(ctx, safeZoneX, safeZoneY, safeZone, safeZone, size * 0.12);
    ctx.fill();

    // Основное изображение (60% от размера)
    const mainSize = size * 0.6;
    const mainX = (size - mainSize) / 2;
    const mainY = (size - mainSize) / 2;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    roundRect(ctx, mainX, mainY, mainSize, mainSize, size * 0.08);
    ctx.fill();

    // Символ воска (свеча)
    const candleWidth = mainSize * 0.67;
    const candleHeight = mainSize * 0.4;
    const candleX = mainX + (mainSize - candleWidth) / 2;
    const candleY = mainY + mainSize * 0.2;

    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    roundRect(ctx, candleX, candleY, candleWidth, candleHeight, size * 0.05);
    ctx.fill();

    // Пламя
    const flameWidth = size * 0.12;
    const flameHeight = size * 0.16;
    const flameX = size / 2 - flameWidth / 2;
    const flameY = mainY + mainSize * 0.1;

    ctx.fillStyle = '#ff4500';
    ctx.beginPath();
    ctx.ellipse(flameX + flameWidth / 2, flameY + flameHeight / 2, flameWidth / 2, flameHeight / 2, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Декоративные элементы по углам
    const cornerSize = size * 0.04;
    const cornerOffset = size * 0.08;

    ctx.fillStyle = '#ff6347';
    ctx.beginPath();
    ctx.arc(mainX + cornerOffset, mainY + cornerOffset, cornerSize, 0, 2 * Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(mainX + mainSize - cornerOffset, mainY + cornerOffset, cornerSize, 0, 2 * Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(mainX + cornerOffset, mainY + mainSize - cornerOffset, cornerSize, 0, 2 * Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(mainX + mainSize - cornerOffset, mainY + mainSize - cornerOffset, cornerSize, 0, 2 * Math.PI);
    ctx.fill();

    // Центральный элемент
    const centerSize = size * 0.08;
    ctx.fillStyle = '#ffa500';
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, centerSize, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalAlpha = 1;

    return canvas;
}

function roundRect(ctx, x, y, width, height, radius) {
    if (width < 2 * radius) radius = width / 2;
    if (height < 2 * radius) radius = height / 2;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
}

function generateAllIcons() {
    console.log('🎨 Генерация иконок PWA...');

    sizes.forEach(size => {
        try {
            const canvas = generateIcon(size);
            const buffer = canvas.toBuffer('image/png');
            const filename = `icon-${size}x${size}.png`;
            const filepath = path.join(iconsDir, filename);

            fs.writeFileSync(filepath, buffer);
            console.log(`✅ Создана иконка: ${filename}`);
        } catch (error) {
            console.error(`❌ Ошибка создания иконки ${size}x${size}:`, error.message);
        }
    });

    console.log('🎉 Все иконки созданы!');
}

// Запускаем генерацию
generateAllIcons();

