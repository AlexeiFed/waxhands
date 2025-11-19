# PowerShell скрипт для применения миграции normalize_user_data.sql
# Использование: .\apply-migration.ps1

Write-Host "🔄 Применение миграции normalize_user_data.sql..." -ForegroundColor Cyan

# Параметры подключения к базе данных
$DB_NAME = "waxhands"
$DB_USER = "postgres"
$MIGRATION_FILE = "normalize_user_data.sql"

# Проверяем существование файла миграции
if (-not (Test-Path $MIGRATION_FILE)) {
    Write-Host "❌ Файл миграции не найден: $MIGRATION_FILE" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Файл миграции найден: $MIGRATION_FILE" -ForegroundColor Green

# Спрашиваем подтверждение
$confirmation = Read-Host "Применить миграцию к базе $DB_NAME? (y/n)"
if ($confirmation -ne 'y') {
    Write-Host "❌ Миграция отменена" -ForegroundColor Yellow
    exit 0
}

# Применяем миграцию
Write-Host "⏳ Применение миграции..." -ForegroundColor Yellow

try {
    # Запускаем psql с файлом миграции
    $env:PGPASSWORD = ""  # Оставляем пустым, psql спросит пароль
    psql -U $DB_USER -d $DB_NAME -f $MIGRATION_FILE
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Миграция успешно применена!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Рекомендуемые действия:" -ForegroundColor Cyan
        Write-Host "1. Проверьте логи для дубликатов телефонов (см. вывод выше)"
        Write-Host "2. Перезапустите backend: cd .. && npm run build && (перезапустите приложение)"
        Write-Host "3. Протестируйте вход проблемных пользователей"
    }
    else {
        Write-Host "❌ Ошибка при применении миграции" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "❌ Ошибка: $_" -ForegroundColor Red
    exit 1
}



