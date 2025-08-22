/**
 * @file: upload.ts
 * @description: Маршруты для загрузки файлов
 * @dependencies: Router, authenticateToken, upload middleware
 * @created: 2024-12-19
 */
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { uploadServiceFiles } from '../middleware/upload.js';
import { uploadFiles } from '../controllers/upload.js';
import multer from 'multer';
const router = Router();
// Обработка ошибок multer
const handleMulterError = (err, req, res, next) => {
    console.error('Multer error:', err);
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'Файл слишком большой'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: 'Превышено максимальное количество файлов. Максимум: 1 аватар, 10 изображений, 5 видео'
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                error: 'Неожиданное поле для файла. Разрешенные поля: avatar, images, videos'
            });
        }
    }
    return res.status(500).json({
        success: false,
        error: err.message || 'Ошибка при загрузке файлов'
    });
};
// Загрузка файлов для стилей/опций (требует аутентификации)
router.post('/service-files', authenticateToken, (req, res, next) => {
    uploadServiceFiles(req, res, (err) => {
        if (err) {
            return handleMulterError(err, req, res, next);
        }
        uploadFiles(req, res);
    });
});
export default router;
//# sourceMappingURL=upload.js.map