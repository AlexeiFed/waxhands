/**
 * @file: clean-blob-urls.ts
 * @description: Скрипт для очистки blob URL'ов из стилей и опций услуг
 * @created: 2024-12-19
 */
import pool from './connection.js';
const cleanBlobUrls = async () => {
    const client = await pool.connect();
    console.log('🔌 Connected to database for cleaning blob URLs');
    try {
        await client.query('BEGIN');
        console.log('📝 Starting blob URLs cleanup...');
        // Получаем все услуги
        const servicesResult = await client.query('SELECT id, name, styles, options FROM services');
        console.log(`📋 Found ${servicesResult.rows.length} services to check`);
        for (const service of servicesResult.rows) {
            let stylesUpdated = false;
            let optionsUpdated = false;
            // Очищаем стили
            let styles = service.styles || [];
            if (Array.isArray(styles)) {
                styles = styles.map((style) => {
                    let styleUpdated = false;
                    // Очищаем blob URLs в аватаре
                    if (style.avatar && style.avatar.startsWith('blob:')) {
                        console.log(`🧹 Cleaning blob avatar in style ${style.name}`);
                        style.avatar = undefined;
                        styleUpdated = true;
                    }
                    // Очищаем blob URLs в изображениях
                    if (style.images && Array.isArray(style.images)) {
                        const cleanImages = style.images.filter((img) => !img.startsWith('blob:'));
                        if (cleanImages.length !== style.images.length) {
                            console.log(`🧹 Cleaning ${style.images.length - cleanImages.length} blob images in style ${style.name}`);
                            style.images = cleanImages;
                            styleUpdated = true;
                        }
                    }
                    // Очищаем blob URLs в видео
                    if (style.videos && Array.isArray(style.videos)) {
                        const cleanVideos = style.videos.filter((vid) => !vid.startsWith('blob:'));
                        if (cleanVideos.length !== style.videos.length) {
                            console.log(`🧹 Cleaning ${style.videos.length - cleanVideos.length} blob videos in style ${style.name}`);
                            style.videos = cleanVideos;
                            styleUpdated = true;
                        }
                    }
                    if (styleUpdated)
                        stylesUpdated = true;
                    return style;
                });
            }
            // Очищаем опции
            let options = service.options || [];
            if (Array.isArray(options)) {
                options = options.map((option) => {
                    let optionUpdated = false;
                    // Очищаем blob URLs в аватаре
                    if (option.avatar && option.avatar.startsWith('blob:')) {
                        console.log(`🧹 Cleaning blob avatar in option ${option.name}`);
                        option.avatar = undefined;
                        optionUpdated = true;
                    }
                    // Очищаем blob URLs в изображениях
                    if (option.images && Array.isArray(option.images)) {
                        const cleanImages = option.images.filter((img) => !img.startsWith('blob:'));
                        if (cleanImages.length !== option.images.length) {
                            console.log(`🧹 Cleaning ${option.images.length - cleanImages.length} blob images in option ${option.name}`);
                            option.images = cleanImages;
                            optionUpdated = true;
                        }
                    }
                    // Очищаем blob URLs в видео
                    if (option.videos && Array.isArray(option.videos)) {
                        const cleanVideos = option.videos.filter((vid) => !vid.startsWith('blob:'));
                        if (cleanVideos.length !== option.videos.length) {
                            console.log(`🧹 Cleaning ${option.videos.length - cleanVideos.length} blob videos in option ${option.name}`);
                            option.videos = cleanVideos;
                            optionUpdated = true;
                        }
                    }
                    if (optionUpdated)
                        optionsUpdated = true;
                    return option;
                });
            }
            // Обновляем услугу если есть изменения
            if (stylesUpdated || optionsUpdated) {
                await client.query('UPDATE services SET styles = $1, options = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3', [JSON.stringify(styles), JSON.stringify(options), service.id]);
                console.log(`✅ Updated service: ${service.name}`);
            }
        }
        await client.query('COMMIT');
        console.log('🎉 Blob URLs cleanup completed successfully!');
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Blob URLs cleanup failed:', error);
        throw error;
    }
    finally {
        client.release();
    }
};
cleanBlobUrls()
    .then(() => {
    console.log('Cleanup completed successfully');
    process.exit(0);
})
    .catch((error) => {
    console.error('Cleanup failed:', error);
    process.exit(1);
});
export default cleanBlobUrls;
//# sourceMappingURL=clean-blob-urls.js.map