# Инструкция по деплою на сервер timeweb.cloud

## 1. Копирование файлов на сервер

Скопируйте папку `production/` на сервер timeweb.cloud.

## 2. Структура на сервере

```
/var/www/waxhands.ru/
├── frontend/          # Frontend файлы (React build)
│   ├── index.html
│   ├── assets/
│   ├── sw.js
│   └── manifest.json
├── backend/           # Backend приложение
│   ├── index.js
│   ├── controllers/
│   ├── routes/
│   ├── database/
│   ├── middleware/
│   ├── types/
│   ├── scripts/
│   ├── websocket-server.js
│   ├── package.json
│   └── node_modules/
└── uploads/           # Загруженные файлы
    ├── avatars/
    ├── images/
    └── videos/
```

## 3. Настройка backend

```bash
cd /var/www/waxhands.ru/backend
npm install --only=production
```

## 4. Environment переменные

Отредактируйте `.env` файл в корне:
- `DB_PASSWORD` - пароль от PostgreSQL
- `YUMONEY_SECRET_KEY` - секретный ключ ЮMoney
- `WEBHOOK_SECRET` - секрет для webhook'ов

## 5. Запуск backend

```bash
cd /var/www/waxhands.ru/backend
NODE_ENV=production node index.js
```

## 6. Nginx конфигурация

```nginx
server {
    listen 80;
    server_name waxhands.ru www.waxhands.ru;
    
    # Frontend
    location / {
        root /var/www/waxhands.ru/frontend;
        try_files $uri $uri/ /index.html;
    }
    
    # Uploads
    location /uploads/ {
        alias /var/www/waxhands.ru/uploads/;
    }
    
    # API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket
    location /api/chat/ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## 7. SSL сертификат

```bash
certbot --nginx -d waxhands.ru -d www.waxhands.ru
```

## 8. Автозапуск backend

Создайте systemd сервис:

```bash
sudo nano /etc/systemd/system/waxhands.service
```

```ini
[Unit]
Description=Wax Hands Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/waxhands.ru/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node index.js
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable waxhands
sudo systemctl start waxhands
```

## Готово! 🚀

Ваш сайт будет доступен по адресу: https://waxhands.ru
