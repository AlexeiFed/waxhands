/**
 * @file: upload.ts
 * @description: Контроллер для загрузки файлов
 * @dependencies: express, path
 * @created: 2024-12-19
 */
export const uploadFiles = async (req, res) => {
    try {
        console.log('Upload files request - req.files:', req.files);
        console.log('Upload files request - req.body:', req.body);
        console.log('Upload files request - headers:', req.headers);
        if (!req.files) {
            console.log('No files received in request');
            res.status(400).json({
                success: false,
                error: 'Файлы не были загружены'
            });
            return;
        }
        const files = req.files;
        console.log('Upload files - parsed files structure:', JSON.stringify(files, null, 2));
        const uploadedFiles = {};
        // Обрабатываем аватар
        if (files.avatar && files.avatar[0]) {
            console.log('Processing avatar:', files.avatar[0].filename);
            uploadedFiles.avatar = `/uploads/avatars/${files.avatar[0].filename}`;
        }
        // Обрабатываем изображения
        if (files.images && files.images.length > 0) {
            console.log(`Processing ${files.images.length} images:`, files.images.map(f => f.filename));
            uploadedFiles.images = files.images.map(file => `/uploads/images/${file.filename}`);
        }
        // Обрабатываем видео
        if (files.videos && files.videos.length > 0) {
            console.log(`Processing ${files.videos.length} videos:`, files.videos.map(f => f.filename));
            uploadedFiles.videos = files.videos.map(file => `/uploads/videos/${file.filename}`);
        }
        console.log('Files uploaded successfully:', uploadedFiles);
        res.status(200).json({
            success: true,
            data: uploadedFiles
        });
    }
    catch (error) {
        console.error('Upload files error:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        res.status(500).json({
            success: false,
            error: 'Ошибка при загрузке файлов'
        });
    }
};
//# sourceMappingURL=upload.js.map