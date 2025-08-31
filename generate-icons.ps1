# Скрипт для генерации иконок разных размеров для мобильных устройств
# Алексей - 2025-01-27

Write-Host "🎨 Генерация иконок для мобильных устройств" -ForegroundColor Green

# Проверяем наличие исходной иконки
if (-not (Test-Path "public\icon-512x512.png")) {
    Write-Host "❌ Исходная иконка icon-512x512.png не найдена!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Исходная иконка найдена" -ForegroundColor Green

# Размеры иконок для мобильных устройств
$sizes = @(72, 96, 128, 144, 152, 192, 384)

# Создаем папку для иконок если её нет
if (-not (Test-Path "public\icons")) {
    New-Item -ItemType Directory -Path "public\icons" -Force
    Write-Host "📁 Создана папка public\icons" -ForegroundColor Yellow
}

# Генерируем иконки разных размеров
foreach ($size in $sizes) {
    $outputPath = "public\icon-${size}x${size}.png"
    
    Write-Host "🔄 Генерация иконки ${size}x${size}..." -ForegroundColor Yellow
    
    # Используем ImageMagick если установлен, иначе копируем существующую
    if (Get-Command magick -ErrorAction SilentlyContinue) {
        magick "public\icon-512x512.png" -resize "${size}x${size}" "$outputPath"
        Write-Host "✅ Иконка ${size}x${size} создана (ImageMagick)" -ForegroundColor Green
    }
    else {
        # Если ImageMagick не установлен, копируем существующую иконку
        Copy-Item "public\icon-512x512.png" "$outputPath" -Force
        Write-Host "⚠️  Иконка ${size}x${size} скопирована (ImageMagick не найден)" -ForegroundColor Yellow
    }
}

# Создаем иконку для shortcuts
$shortcutPath = "public\icons\shortcut-96x96.png"
if (-not (Test-Path $shortcutPath)) {
    if (Get-Command magick -ErrorAction SilentlyContinue) {
        magick "public\icon-512x512.png" -resize "96x96" "$shortcutPath"
    }
    else {
        Copy-Item "public\icon-96x96.png" "$shortcutPath" -Force
    }
    Write-Host "✅ Иконка для shortcuts создана" -ForegroundColor Green
}

Write-Host "`n🎯 Размеры иконок для разных устройств:" -ForegroundColor Cyan
Write-Host "• 72x72   - Старые Android устройства" -ForegroundColor White
Write-Host "• 96x96   - Android устройства среднего размера" -ForegroundColor White
Write-Host "• 128x128 - Стандартные Android устройства" -ForegroundColor White
Write-Host "• 144x144 - Retina дисплеи" -ForegroundColor White
Write-Host "• 152x152 - iPad (iOS)" -ForegroundColor White
Write-Host "• 192x192 - Android устройства высокого разрешения" -ForegroundColor White
Write-Host "• 384x384 - Android устройства 3x DPI" -ForegroundColor White
Write-Host "• 512x512 - Android устройства 4x DPI" -ForegroundColor White

Write-Host "`n✅ Генерация иконок завершена!" -ForegroundColor Green
Write-Host "📱 Теперь приложение будет корректно отображаться на всех мобильных устройствах" -ForegroundColor Cyan
