# Полный скрипт для обновления backend на сервере
$server = "root@147.45.161.83"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$archive = "backend-update-$timestamp.zip"

Write-Host "🚀 Начинаю обновление backend на сервере..."

# Создаем архив с папки dist
Write-Host "📦 Создаю архив из папки dist..."
if (Test-Path "backend\dist") {
    Compress-Archive -Path "backend\dist\*" -DestinationPath $archive -Force
    Write-Host "✅ Архив создан: $archive"
} else {
    Write-Host "❌ Папка backend\dist не найдена!"
    exit 1
}

# Загружаем архив на сервер
Write-Host "📤 Загружаю архив на сервер..."
scp $archive "$server`:/tmp/"

# Выполняем команды на сервере
Write-Host "🔄 Обновляю backend на сервере..."
$commands = @(
    "cd /var/www/waxhands-app/backend",
    "if [ -d dist ]; then cp -r dist dist.backup-$timestamp; fi",
    "rm -rf dist",
    "mkdir -p dist",
    "unzip /tmp/$archive -d dist/",
    "pm2 restart waxhands-backend",
    "pm2 status"
)

$commandString = $commands -join " && "

Write-Host "Выполняю команды: $commandString"

ssh $server $commandString

# Удаляем локальный архив
Remove-Item $archive -Force

Write-Host "✅ Обновление завершено!"

