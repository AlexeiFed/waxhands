#!/bin/bash

# Скрипт генерации секретных ключей для production
# Запускайте на сервере timeweb.cloud

echo "🔐 Генерация секретных ключей для Wax Hands PWA"
echo "=================================================="

# Проверяем наличие openssl
if ! command -v openssl &> /dev/null; then
    echo "❌ OpenSSL не установлен. Устанавливаем..."
    apt update && apt install -y openssl
fi

echo ""
echo "📝 Генерируем секретные ключи:"
echo ""

# JWT Secret (64 символа)
JWT_SECRET=$(openssl rand -hex 32)
echo "JWT_SECRET=$JWT_SECRET"

# JWT Refresh Secret (64 символа)  
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"

# Webhook Secret (32 символа)
WEBHOOK_SECRET=$(openssl rand -hex 16)
echo "WEBHOOK_SECRET=$WEBHOOK_SECRET"

echo ""
echo "🔑 Скопируйте эти значения в backend/.env.production:"
echo ""

# Создаем временный файл с секретами
cat > /tmp/secrets.txt << EOF
# Секретные ключи для backend/.env.production
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
WEBHOOK_SECRET=$WEBHOOK_SECRET

# Инструкции:
# 1. JWT_SECRET - замените в backend/.env.production
# 2. JWT_REFRESH_SECRET - добавьте в backend/.env.production если нужно
# 3. WEBHOOK_SECRET - замените в backend/.env.production
# 4. YUMONEY_SECRET_KEY - получите в личном кабинете ЮMoney
EOF

echo "📄 Секреты сохранены в /tmp/secrets.txt"
echo "📋 Просмотр: cat /tmp/secrets.txt"
echo ""
echo "⚠️  ВАЖНО: YUMONEY_SECRET_KEY нужно получить вручную!"
echo "🌐 https://yoomoney.ru/ → Настройки → API → Создать токен"
echo ""
echo "✅ Генерация завершена!"
