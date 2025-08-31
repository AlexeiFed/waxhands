/**
 * @file: monitor-webhooks.js
 * @description: Скрипт для мониторинга webhook'ов платежных систем
 * @dependencies: fs, path
 * @created: 2025-01-27
 */

const fs = require('fs');
const path = require('path');

// Пути к логам
const backendLogPath = 'C:\\projects\\waxhands-playful-pwa\\backend.log';
const webhookLogPath = '/var/www/waxhands-app/backend/webhook.log'; // на сервере

function monitorBackendLog() {
    console.log('🔍 Мониторинг webhook\'ов запущен...');
    console.log('Запишите ребенка на мастер-класс, затем попробуйте оплату');
    console.log('Я буду отслеживать все webhook события\n');

    // Создаем временный файл для логов
    const tempLogFile = path.join(__dirname, 'webhook-monitor.log');

    // Команда для отслеживания логов webhook'ов
    const { spawn } = require('child_process');

    const sshProcess = spawn('ssh', [
        'root@147.45.161.83',
        `'tail -f /var/www/waxhands-app/backend/backend.log | grep -E "(webhook|payment|yoomoney|label)"'`
    ]);

    sshProcess.stdout.on('data', (data) => {
        const logLine = data.toString().trim();
        if (logLine) {
            const timestamp = new Date().toLocaleTimeString();
            console.log(`[${timestamp}] WEBHOOK: ${logLine}`);

            // Сохраняем в файл
            fs.appendFileSync(tempLogFile, `[${timestamp}] ${logLine}\n`);
        }
    });

    sshProcess.stderr.on('data', (data) => {
        console.error(`SSH Error: ${data}`);
    });

    sshProcess.on('close', (code) => {
        console.log(`\n🛑 Мониторинг завершен с кодом ${code}`);
    });

    // Обработка Ctrl+C
    process.on('SIGINT', () => {
        console.log('\n🛑 Останавливаю мониторинг...');
        sshProcess.kill();
        process.exit(0);
    });
}

// Запускаем мониторинг
monitorBackendLog();
