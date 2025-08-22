# 🚀 Деплой Wax Hands PWA на timeweb.cloud

## 📋 Предварительные требования

- ✅ Сервер на timeweb.cloud с доступом SSH root
- ✅ Домен, настроенный на сервер
- ✅ SSL сертификат (Let's Encrypt)
- ✅ PostgreSQL база данных

## 🔧 Подготовка сервера

### 1. Обновление системы
```bash
# Подключение к серверу
ssh root@your-server-ip

# Обновление системы
apt update && apt upgrade -y

# Установка необходимых пакетов
apt install -y curl wget git nginx postgresql postgresql-contrib certbot python3-certbot-nginx
```

### 2. Настройка PostgreSQL
```bash
# Переключение на пользователя postgres
sudo -u postgres psql

# Создание базы данных и пользователя
CREATE DATABASE waxhands;
CREATE USER waxhands_user WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE waxhands TO waxhands_user;
\q

# Проверка подключения
psql -h localhost -U waxhands_user -d waxhands
```

### 3. Установка Node.js
```bash
# Установка Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Проверка версии
node --version
npm --version
```

## 📁 Развертывание приложения

### 1. Клонирование репозитория
```bash
# Создание директории для приложения
mkdir -p /var/www/waxhands
cd /var/www/waxhands

# Клонирование репозитория
git clone https://github.com/your-username/waxhands-playful-pwa.git .

# Установка зависимостей
npm install
cd backend && npm install
```

### 2. Настройка переменных окружения

#### 2.1 Генерация секретных ключей

Сначала сгенерируйте все необходимые секреты:

```bash
# Запустите скрипт генерации секретов
chmod +x scripts/generate-secrets.sh
./scripts/generate-secrets.sh

# Скопируйте сгенерированные секреты
cat /tmp/secrets.txt
```

#### 2.2 Создание .env файлов

**Вариант A: Полный деплой с платежами**
```bash
# Frontend
cp .env.production .env
nano .env

# Backend
cd backend
cp .env.production .env
nano .env
```

**Вариант B: Тестирование без платежей (рекомендуется для начала)**
```bash
# Frontend
cp .env.production .env
nano .env

# Backend
cd backend
cp .env.testing .env
nano .env
```

**Важно:** Замените в `.env` файлах:
- `REPLACE_WITH_OPENSSL_RAND_HEX_32` на сгенерированный JWT_SECRET
- `your-domain.com` на ваш реальный домен
- `your_secure_password_here` на безопасный пароль для базы данных

**Примечание:** При использовании `.env.testing` платежи будут отключены, но все остальные функции будут работать.

### 3. Сборка frontend
```bash
# Сборка для production
npm run build

# Проверка сборки
ls -la dist/
```

### 4. Настройка backend
```bash
cd backend

# Сборка TypeScript
npm run build

# Создание директории для uploads
mkdir -p uploads/avatars uploads/images uploads/videos

# Установка прав
chown -R www-data:www-data uploads/
chmod -R 755 uploads/
```

## 🌐 Настройка Nginx

### 1. Создание конфигурации
```bash
nano /etc/nginx/sites-available/waxhands
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Редирект на HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL сертификаты
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL настройки
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Frontend (статичные файлы)
    location / {
        root /var/www/waxhands/dist;
        try_files $uri $uri/ /index.html;
        
        # Кэширование статических файлов
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket
    location /api/chat/ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Загрузки файлов
    location /uploads/ {
        alias /var/www/waxhands/backend/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }
    
    # PWA manifest и service worker
    location = /manifest.json {
        add_header Cache-Control "no-cache";
    }
    
    location = /sw.js {
        add_header Cache-Control "no-cache";
    }
}
```

### 2. Активация конфигурации
```bash
# Создание символической ссылки
ln -s /etc/nginx/sites-available/waxhands /etc/nginx/sites-enabled/

# Удаление дефолтной конфигурации
rm /etc/nginx/sites-enabled/default

# Проверка конфигурации
nginx -t

# Перезапуск Nginx
systemctl restart nginx
```

## 🔒 Настройка SSL сертификата

```bash
# Получение SSL сертификата
certbot --nginx -d your-domain.com -d www.your-domain.com

# Автоматическое обновление
crontab -e
# Добавить строку:
0 12 * * * /usr/bin/certbot renew --quiet
```

## 🚀 Настройка systemd сервисов

### 1. Backend сервис
```bash
nano /etc/systemd/system/waxhands-backend.service
```

```ini
[Unit]
Description=Wax Hands Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/waxhands/backend
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
```

### 2. Frontend сервис (опционально)
```bash
nano /etc/systemd/system/waxhands-frontend.service
```

```ini
[Unit]
Description=Wax Hands Frontend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/waxhands
ExecStart=/usr/bin/npm run preview
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=8080

[Install]
WantedBy=multi-user.target
```

### 3. Активация сервисов
```bash
# Перезагрузка systemd
systemctl daemon-reload

# Включение автозапуска
systemctl enable waxhands-backend
systemctl enable waxhands-frontend

# Запуск сервисов
systemctl start waxhands-backend
systemctl start waxhands-frontend

# Проверка статуса
systemctl status waxhands-backend
systemctl status waxhands-frontend
```

## 📊 Мониторинг и логи

### 1. Просмотр логов
```bash
# Backend логи
journalctl -u waxhands-backend -f

# Nginx логи
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Системные логи
journalctl -f
```

### 2. Мониторинг ресурсов
```bash
# Установка htop
apt install htop

# Мониторинг в реальном времени
htop
```

## 🔄 Обновление приложения

### 1. Автоматическое обновление
```bash
# Создание скрипта обновления
nano /var/www/waxhands/update.sh
```

```bash
#!/bin/bash
cd /var/www/waxhands

# Остановка сервисов
systemctl stop waxhands-backend
systemctl stop waxhands-frontend

# Получение обновлений
git pull origin main

# Установка зависимостей
npm install
cd backend && npm install

# Сборка
cd ..
npm run build
cd backend && npm run build

# Запуск сервисов
systemctl start waxhands-backend
systemctl start waxhands-frontend

echo "Обновление завершено!"
```

```bash
# Установка прав на выполнение
chmod +x /var/www/waxhands/update.sh

# Запуск обновления
./update.sh
```

## 🛡️ Безопасность

### 1. Firewall
```bash
# Установка ufw
apt install ufw

# Настройка правил
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80
ufw allow 443
ufw enable
```

### 2. Обновление системы
```bash
# Автоматические обновления безопасности
apt install unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

## 📱 PWA настройки

### 1. Проверка PWA
- Откройте сайт в браузере
- Проверьте установку на устройство
- Проверьте offline функциональность

### 2. Обновление Service Worker
```bash
# При обновлении приложения
# Service Worker автоматически обновится
# Пользователи получат уведомление о новой версии
```

## 🚨 Устранение неполадок

### 1. Проверка статуса сервисов
```bash
systemctl status waxhands-backend
systemctl status waxhands-frontend
systemctl status nginx
systemctl status postgresql
```

### 2. Проверка портов
```bash
netstat -tlnp | grep :3001
netstat -tlnp | grep :80
netstat -tlnp | grep :443
```

### 3. Проверка логов
```bash
# Backend ошибки
journalctl -u waxhands-backend -n 50

# Nginx ошибки
tail -n 50 /var/log/nginx/error.log
```

## 🔄 Включение платежей после тестирования

### 1. Получение YUMONEY_SECRET_KEY
```bash
# 1. Зайдите на https://yoomoney.ru/
# 2. Авторизуйтесь в личном кабинете
# 3. Перейдите в "Настройки" → "API"
# 4. Создайте новый токен
# 5. Скопируйте Secret Key
```

### 2. Обновление конфигурации
```bash
cd /var/www/waxhands/backend

# Создаем полную production конфигурацию
cp .env.production .env

# Редактируем файл
nano .env

# Заменяем:
# - DISABLED_FOR_TESTING на реальные секреты
# - your-domain.com на ваш домен
# - your_secure_password_here на пароль БД
```

### 3. Перезапуск сервисов
```bash
# Перезапуск backend
systemctl restart waxhands-backend

# Проверка статуса
systemctl status waxhands-backend

# Проверка логов
journalctl -u waxhands-backend -f
```

### 4. Тестирование платежей
- Проверьте кнопки оплаты в приложении
- Создайте тестовую заявку
- Попробуйте пройти процесс оплаты
- Проверьте webhook обработку

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи сервисов
2. Проверьте конфигурацию Nginx
3. Проверьте переменные окружения
4. Проверьте права доступа к файлам
5. Проверьте подключение к базе данных

---

**Последнее обновление:** 2024-12-19  
**Автор:** Алексей  
**Версия:** 1.0.0
