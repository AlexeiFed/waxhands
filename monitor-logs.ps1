# Скрипт мониторинга логов
Write-Host "🔍 Начинаем мониторинг логов..." -ForegroundColor Yellow
Write-Host "Запишите ребенка на мастер-класс, я буду отслеживать логи" -ForegroundColor Cyan

# Функция для мониторинга backend логов
function Monitor-BackendLogs {
    Write-Host "📊 Backend логи:" -ForegroundColor Green
    ssh root@147.45.161.83 "tail -f /var/www/waxhands-app/backend/backend.log" 2>$null
}

# Функция для мониторинга Nginx логов
function Monitor-NginxLogs {
    Write-Host "🌐 Nginx логи:" -ForegroundColor Blue
    ssh root@147.45.161.83 "tail -f /var/log/nginx/waxhands-access.log" 2>$null
}

# Запускаем мониторинг в фоне
$backendJob = Start-Job -ScriptBlock { ssh root@147.45.161.83 "tail -f /var/www/waxhands-app/backend/backend.log" }
$nginxJob = Start-Job -ScriptBlock { ssh root@147.45.161.83 "tail -f /var/log/nginx/waxhands-access.log" }

Write-Host "✅ Мониторинг запущен. Теперь записывайте ребенка на мастер-класс!" -ForegroundColor Green
Write-Host "Для остановки нажмите Ctrl+C" -ForegroundColor Yellow

try {
    while ($true) {
        # Проверяем новые записи в backend
        $backendOutput = Receive-Job -Job $backendJob -ErrorAction SilentlyContinue
        if ($backendOutput) {
            Write-Host "[BACKEND] $($backendOutput -join "`n")" -ForegroundColor Green
        }
        
        # Проверяем новые записи в nginx
        $nginxOutput = Receive-Job -Job $nginxJob -ErrorAction SilentlyContinue
        if ($nginxOutput) {
            Write-Host "[NGINX] $($nginxOutput -join "`n")" -ForegroundColor Blue
        }
        
        Start-Sleep -Seconds 1
    }
}
catch {
    Write-Host "`n🛑 Мониторинг остановлен" -ForegroundColor Red
}
finally {
    Stop-Job -Job $backendJob, $nginxJob -ErrorAction SilentlyContinue
    Remove-Job -Job $backendJob, $nginxJob -ErrorAction SilentlyContinue
}
