import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import routes from './routes/index.js';
import { errorHandler, logRequest } from './middleware/auth.js';
import { testConnection } from './database/connection.js';
import { initializeWebSocketManager } from './websocket-server.js';
// Загружаем переменные окружения
dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env' });
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || 'localhost';
// Middleware безопасности
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "wss:", "ws:"],
        },
    },
}));
// CORS настройки для production
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? [process.env.CORS_ORIGIN || 'https://your-domain.com']
        : [
            'http://localhost:8080',
            'http://localhost:8081',
            'http://localhost:8082',
            'http://localhost:8083',
            'http://localhost:8084',
            'http://localhost:8085',
            'http://localhost:3000',
            'http://localhost:3001'
        ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));
// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 минут
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // максимум 100 запросов
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.'
    }
});
app.use(limiter);
// Логирование
if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined'));
}
else {
    app.use(morgan('dev'));
}
app.use(logRequest);
// Парсинг JSON
app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '10mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.MAX_FILE_SIZE || '10mb' }));
// Статические файлы с CORS заголовками
app.use('/uploads', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Range');
    res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    }
    else {
        next();
    }
}, express.static(process.env.UPLOAD_PATH || 'uploads'));
// API маршруты
app.use('/api', routes);
// Обработка ошибок
app.use(errorHandler);
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});
// Запуск сервера
const startServer = async () => {
    try {
        // Проверяем подключение к базе данных
        const isConnected = await testConnection();
        if (!isConnected) {
            console.error('❌ Failed to connect to database');
            process.exit(1);
        }
        // Инициализируем WebSocket сервер
        initializeWebSocketManager(server);
        server.listen(parseInt(PORT.toString()), HOST, () => {
            console.log(`🚀 Server running on ${HOST}:${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 CORS Origin: ${corsOptions.origin}`);
            console.log(`🔌 WebSocket Path: ${process.env.WS_PATH || '/api/chat/ws'}`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=index.js.map