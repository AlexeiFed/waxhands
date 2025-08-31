/**
 * @file: upload.ts
 * @description: Middleware для загрузки файлов с использованием multer
 * @dependencies: multer, path, fs
 * @created: 2024-12-19
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Создаем директории если их нет
const uploadsDir = path.join(process.cwd(), 'uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');
const imagesDir = path.join(uploadsDir, 'images');
const videosDir = path.join(uploadsDir, 'videos');

[uploadsDir, avatarsDir, imagesDir, videosDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
    }
});

// Настройка хранения файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = uploadsDir;

        // Определяем папку по типу файла
        if (file.fieldname === 'avatar') {
            uploadPath = avatarsDir;
        } else if (file.fieldname === 'images') {
            uploadPath = imagesDir;
        } else if (file.fieldname === 'videos') {
            uploadPath = videosDir;
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Генерируем уникальное имя файла
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// Фильтр файлов
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    console.log('=== FILE FILTER DEBUG ===');
    console.log('Field name:', file.fieldname);
    console.log('MIME type:', file.mimetype);
    console.log('Original name:', file.originalname);
    console.log('File size:', file.size);
    console.log('=========================');

    // Проверяем допустимые поля
    const validFields = ['avatar', 'images', 'videos'];
    if (!validFields.includes(file.fieldname)) {
        console.log('❌ REJECTED - Invalid field name:', file.fieldname);
        console.log('Valid fields are:', validFields);
        cb(new Error(`Неизвестный тип поля: ${file.fieldname}. Допустимые: ${validFields.join(', ')}`));
        return;
    }

    if (file.fieldname === 'avatar' || file.fieldname === 'images') {
        // Проверяем что это изображение
        if (file.mimetype.startsWith('image/')) {
            console.log('✅ ACCEPTED as image:', file.originalname);
            cb(null, true);
        } else {
            console.log('❌ REJECTED - not an image. MIME type:', file.mimetype);
            cb(new Error(`Только изображения разрешены для ${file.fieldname}. Получен: ${file.mimetype}`));
        }
    } else if (file.fieldname === 'videos') {
        // Проверяем что это видео
        if (file.mimetype.startsWith('video/')) {
            console.log('✅ ACCEPTED as video:', file.originalname);
            cb(null, true);
        } else {
            console.log('❌ REJECTED - not a video. MIME type:', file.mimetype);
            cb(new Error(`Только видео файлы разрешены. Получен: ${file.mimetype}`));
        }
    }
};

// Создаем multer instance
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600'), // 100MB по умолчанию
        files: 20 // максимум 20 файлов за раз (1 аватар + 10 изображений + 5 видео + запас)
    }
});

// Middleware для загрузки файлов для стилей/опций
export const uploadServiceFiles = upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'images', maxCount: 10 }, // Увеличено до 10 изображений
    { name: 'videos', maxCount: 5 }   // Увеличено до 5 видео
]);