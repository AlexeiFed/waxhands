# Упрощенный скрипт для обновления backend
$server = "root@147.45.161.83"
$archive = "backend-update-20250922-145652.zip"

Write-Host "🚀 Обновляю backend на сервере..."

# Выполняем команды на сервере
$commands = @(
    "cd /var/www/waxhands-app/backend",
    "rm -rf dist",
    "unzip /tmp/$archive -d .",
    "pm2 restart waxhands-backend",
    "pm2 status"
)

$commandString = $commands -join " && "

Write-Host "Выполняю: $commandString"

ssh $server $commandString

Write-Host "✅ Обновление завершено!"