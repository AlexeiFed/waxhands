/**
 * @file: style-option-modal.tsx
 * @description: Модальное окно для создания/редактирования стилей и опций с загрузкой медиафайлов
 * @dependencies: Dialog, Form, Button, Input, Textarea, файловые компоненты
 * @created: 2024-12-19
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './dialog';
import { ServiceStyle, ServiceOption } from '../../types';
import { Upload, X, Play, Image as ImageIcon } from 'lucide-react';
import { Badge } from './badge';
import { uploadAPI } from '../../lib/api';
import { getFileUrl } from '../../lib/config';
import { useToast } from '../../hooks/use-toast';

type StyleOptionType = 'style' | 'option';

interface StyleOptionModalProps {
    open: boolean;
    onClose: () => void;
    type: StyleOptionType;
    data?: ServiceStyle | ServiceOption | null;
    onSubmit: (data: Omit<ServiceStyle | ServiceOption, 'id'>) => Promise<void>;
    loading?: boolean;
}

interface FormData {
    name: string;
    shortDescription: string;
    fullDescription: string;
    price: number;
    images?: string[];
    videos?: string[];
}

export const StyleOptionModal: React.FC<StyleOptionModalProps> = ({
    open,
    onClose,
    type,
    data,
    onSubmit,
    loading = false
}) => {
    const [formData, setFormData] = useState<FormData>({
        name: data?.name || '',
        shortDescription: data?.shortDescription || '',
        fullDescription: data?.fullDescription || '',
        price: data?.price || 0,
        images: data?.images || [],
        videos: data?.videos || []
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [uploading, setUploading] = useState(false);
    const { toast } = useToast();

    // Обновляем данные формы при изменении входящих данных
    useEffect(() => {

        if (data) {

            const newFormData = {
                name: data.name || '',
                shortDescription: data.shortDescription || '',
                fullDescription: data.fullDescription || '',
                price: data.price || 0,
                images: data.images || [],
                videos: data.videos || []
            };

            setFormData(newFormData);
        } else {
            // Очищаем форму если данных нет (новый элемент)
            const emptyFormData = {
                name: '',
                shortDescription: '',
                fullDescription: '',
                price: 0,
                images: [],
                videos: []
            };

            setFormData(emptyFormData);
        }
    }, [data]);

    const imagesInputRef = useRef<HTMLInputElement>(null);
    const videosInputRef = useRef<HTMLInputElement>(null);

    const isStyle = type === 'style';
    const title = data
        ? `Редактировать ${isStyle ? 'стиль' : 'опцию'}`
        : `Добавить ${isStyle ? 'стиль' : 'опцию'}`;

    const handleInputChange = (field: keyof FormData, value: string | number) => {

        setFormData(prev => {
            const newData = {
                ...prev,
                [field]: value
            };

            return newData;
        });

        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Название обязательно';
        }

        if (!formData.shortDescription.trim()) {
            newErrors.shortDescription = 'Краткое описание обязательно';
        }

        if (formData.price < 0) {
            newErrors.price = 'Цена не может быть отрицательной';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleFileUpload = async (files: FileList, type: 'images' | 'videos') => {
        setUploading(true);

        try {
            const fileArray = Array.from(files);

            // Валидация количества файлов
            if (type === 'images') {
                const currentImagesCount = formData.images?.length || 0;
                const newImagesCount = fileArray.length;
                const totalImagesCount = currentImagesCount + newImagesCount;

                if (totalImagesCount > 10) {
                    toast({
                        title: "Превышен лимит изображений",
                        description: `Максимум 10 изображений. Сейчас: ${currentImagesCount}, пытаетесь добавить: ${newImagesCount}`,
                        variant: "destructive"
                    });
                    setUploading(false);
                    return;
                }
            } else if (type === 'videos') {
                const currentVideosCount = formData.videos?.length || 0;
                const newVideosCount = fileArray.length;
                const totalVideosCount = currentVideosCount + newVideosCount;

                if (totalVideosCount > 5) {
                    toast({
                        title: "Превышен лимит видео",
                        description: `Максимум 5 видео. Сейчас: ${currentVideosCount}, пытаетесь добавить: ${newVideosCount}`,
                        variant: "destructive"
                    });
                    setUploading(false);
                    return;
                }
            }

            const uploadData: { images?: File[]; videos?: File[] } = {};

            if (type === 'images') {
                uploadData.images = fileArray;
            } else if (type === 'videos') {
                uploadData.videos = fileArray;
            }

            const uploadedFiles = await uploadAPI.uploadServiceFiles(uploadData);

            // Обновляем данные формы с серверными ссылками
            if (type === 'images' && uploadedFiles.images) {
                setFormData(prev => ({
                    ...prev,
                    images: [...(prev.images || []), ...uploadedFiles.images!]
                }));
            } else if (type === 'videos' && uploadedFiles.videos) {
                setFormData(prev => ({
                    ...prev,
                    videos: [...(prev.videos || []), ...uploadedFiles.videos!]
                }));
            }
        } catch (error) {
            console.error('Error uploading files:', error);
            toast({
                title: "Ошибка загрузки файлов",
                description: error instanceof Error ? error.message : "Неизвестная ошибка при загрузке файлов",
                variant: "destructive"
            });
        } finally {
            setUploading(false);
        }
    };

    const removeFile = (type: 'images' | 'videos', index: number) => {

        setFormData(prev => {
            const currentFiles = prev[type] || [];
            const fileToRemove = currentFiles[index];

            // Освобождаем blob URL если это blob
            if (fileToRemove && fileToRemove.startsWith('blob:')) {
                URL.revokeObjectURL(fileToRemove);
            }

            const newFiles = currentFiles.filter((_, i) => i !== index);

            return {
                ...prev,
                [type]: newFiles
            };
        });
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            // Убеждаемся что цена передается как число
            const submitData: Omit<ServiceStyle | ServiceOption, 'id'> = {
                ...formData,
                price: typeof formData.price === 'string' ? parseFloat(formData.price) || 0 : formData.price
            };

            // При редактировании: не отправляем пустые медиа поля, чтобы не затереть существующие
            if (data) { // Это редактирование
                if (!submitData.images || submitData.images.length === 0) {
                    delete submitData.images;
                }
                if (!submitData.videos || submitData.videos.length === 0) {
                    delete submitData.videos;
                }
            }

            await onSubmit(submitData);
            handleClose();
        } catch (error) {
            console.error(`Error ${data ? 'updating' : 'creating'} ${type}:`, error);
        }
    };

    const handleClose = () => {
        setFormData({
            name: '',
            shortDescription: '',
            fullDescription: '',
            price: 0,
            images: [],
            videos: []
        });
        setErrors({});
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        Заполните информацию и добавьте медиафайлы
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Название <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder={`Название ${isStyle ? 'стиля' : 'опции'}`}
                                className={errors.name ? 'border-red-500' : ''}
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500">{errors.name}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="price">Цена (₽)</Label>
                            <Input
                                id="price"
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => {
                                    const value = e.target.value;

                                    handleInputChange('price', value === '' ? 0 : parseFloat(value) || 0);
                                }}
                                placeholder="0"
                                className={errors.price ? 'border-red-500' : ''}
                            />
                            {errors.price && (
                                <p className="text-sm text-red-500">{errors.price}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="shortDescription">
                            Краткое описание <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="shortDescription"
                            value={formData.shortDescription}
                            onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                            placeholder="Краткое описание"
                            rows={2}
                            className={errors.shortDescription ? 'border-red-500' : ''}
                        />
                        {errors.shortDescription && (
                            <p className="text-sm text-red-500">{errors.shortDescription}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fullDescription">Полное описание</Label>
                        <Textarea
                            id="fullDescription"
                            value={formData.fullDescription}
                            onChange={(e) => handleInputChange('fullDescription', e.target.value)}
                            placeholder="Подробное описание"
                            rows={3}
                        />
                    </div>


                    {/* Изображения */}
                    <div className="space-y-2">
                        <Label>Изображения</Label>
                        <div className="space-y-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => imagesInputRef.current?.click()}
                                disabled={uploading}
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Добавить изображения
                            </Button>
                            <p className="text-xs text-muted-foreground">
                                Максимум 10 изображений. Текущее количество: {formData.images?.length || 0}
                            </p>
                            <input
                                ref={imagesInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => e.target.files && handleFileUpload(e.target.files, 'images')}
                                className="hidden"
                            />
                            {formData.images && formData.images.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {formData.images.map((image, index) => (
                                        <div key={index} className="relative">
                                            <div className="w-32 h-24 relative">
                                                <img
                                                    src={getFileUrl(image)}
                                                    alt={`Изображение ${index + 1}`}
                                                    className="w-full h-full object-cover rounded border"
                                                    onError={async (e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        const imageUrl = getFileUrl(image);

                                                        // Проверяем существование файла перед показом ошибки
                                                        try {
                                                            const response = await fetch(imageUrl, {
                                                                method: 'HEAD',
                                                                mode: 'cors',
                                                                cache: 'no-cache'
                                                            });

                                                            if (response.ok) {
                                                                // Файл существует, возможно проблема с отображением
                                                                target.style.display = 'none';
                                                                const placeholder = document.createElement('div');
                                                                placeholder.className = 'w-full h-full bg-yellow-100 rounded border flex items-center justify-center';
                                                                placeholder.innerHTML = `
                                                                    <div class="text-center text-yellow-600">
                                                                        <svg class="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                                                        </svg>
                                                                        <div class="text-xs">Проблема отображения</div>
                                                                        <div class="text-xs">Файл: ${image.split('/').pop()}</div>
                                                                    </div>
                                                                `;
                                                                target.parentNode?.appendChild(placeholder);
                                                            } else {
                                                                // Файл действительно недоступен
                                                                target.style.display = 'none';
                                                                const placeholder = document.createElement('div');
                                                                placeholder.className = 'w-full h-full bg-red-100 rounded border flex items-center justify-center';
                                                                placeholder.innerHTML = `
                                                                    <div class="text-center text-red-600">
                                                                        <svg class="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                                        </svg>
                                                                        <div class="text-xs">Файл недоступен</div>
                                                                        <div class="text-xs">${image.split('/').pop()}</div>
                                                                    </div>
                                                                `;
                                                                target.parentNode?.appendChild(placeholder);
                                                            }
                                                        } catch (error) {
                                                            // Ошибка сети или CORS
                                                            target.style.display = 'none';
                                                            const placeholder = document.createElement('div');
                                                            placeholder.className = 'w-full h-full bg-orange-100 rounded border flex items-center justify-center';
                                                            placeholder.innerHTML = `
                                                                <div class="text-center text-orange-600">
                                                                    <svg class="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                                                    </svg>
                                                                    <div class="text-xs">Ошибка сети</div>
                                                                    <div class="text-xs">${image.split('/').pop()}</div>
                                                                </div>
                                                            `;
                                                            target.parentNode?.appendChild(placeholder);
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    className="absolute -top-2 -right-2 w-6 h-6 p-0"
                                                    onClick={() => removeFile('images', index)}
                                                >
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            </div>
                                            <p className="text-xs text-center mt-1 truncate w-32">
                                                Изображение {index + 1}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Видео */}
                    <div className="space-y-2">
                        <Label>Видео</Label>
                        <div className="space-y-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => videosInputRef.current?.click()}
                                disabled={uploading}
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Добавить видео
                            </Button>
                            <p className="text-xs text-muted-foreground">
                                Максимум 5 видео. Текущее количество: {formData.videos?.length || 0}
                            </p>
                            <input
                                ref={videosInputRef}
                                type="file"
                                accept="video/*"
                                multiple
                                onChange={(e) => e.target.files && handleFileUpload(e.target.files, 'videos')}
                                className="hidden"
                            />
                            {formData.videos && formData.videos.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {formData.videos.map((video, index) => (
                                        <div key={index} className="relative">
                                            <div className="w-32 h-24 relative">
                                                <video
                                                    src={getFileUrl(video)}
                                                    className="w-full h-full object-cover rounded border"
                                                    controls
                                                    preload="metadata"
                                                    onError={async (e) => {
                                                        const target = e.target as HTMLVideoElement;
                                                        const videoUrl = getFileUrl(video);

                                                        // Проверяем существование файла перед показом ошибки
                                                        try {
                                                            const response = await fetch(videoUrl, {
                                                                method: 'HEAD',
                                                                mode: 'cors',
                                                                cache: 'no-cache'
                                                            });

                                                            if (response.ok) {
                                                                // Файл существует, возможно проблема с воспроизведением
                                                                // Показываем предупреждение вместо ошибки
                                                                target.style.display = 'none';
                                                                const placeholder = document.createElement('div');
                                                                placeholder.className = 'w-full h-full bg-yellow-100 rounded border flex items-center justify-center';
                                                                placeholder.innerHTML = `
                                                                    <div class="text-center text-yellow-600">
                                                                        <svg class="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                                                        </svg>
                                                                        <div class="text-xs">Проблема воспроизведения</div>
                                                                        <div class="text-xs">Файл: ${video.split('/').pop()}</div>
                                                                    </div>
                                                                `;
                                                                target.parentNode?.appendChild(placeholder);
                                                            } else {
                                                                // Файл действительно недоступен
                                                                target.style.display = 'none';
                                                                const placeholder = document.createElement('div');
                                                                placeholder.className = 'w-full h-full bg-red-100 rounded border flex items-center justify-center';
                                                                placeholder.innerHTML = `
                                                                    <div class="text-center text-red-600">
                                                                        <svg class="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                                        </svg>
                                                                        <div class="text-xs">Файл недоступен</div>
                                                                        <div class="text-xs">${video.split('/').pop()}</div>
                                                                    </div>
                                                                `;
                                                                target.parentNode?.appendChild(placeholder);
                                                            }
                                                        } catch (error) {
                                                            // Ошибка сети или CORS
                                                            target.style.display = 'none';
                                                            const placeholder = document.createElement('div');
                                                            placeholder.className = 'w-full h-full bg-orange-100 rounded border flex items-center justify-center';
                                                            placeholder.innerHTML = `
                                                                <div class="text-center text-orange-600">
                                                                    <svg class="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                                                    </svg>
                                                                    <div class="text-xs">Ошибка сети</div>
                                                                    <div class="text-xs">${video.split('/').pop()}</div>
                                                                </div>
                                                            `;
                                                            target.parentNode?.appendChild(placeholder);
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    className="absolute -top-2 -right-2 w-6 h-6 p-0"
                                                    onClick={() => removeFile('videos', index)}
                                                >
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            </div>
                                            <p className="text-xs text-center mt-1 truncate w-32">
                                                Видео {index + 1}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {uploading && (
                        <div className="text-center">
                            <Badge variant="secondary">Загрузка файлов...</Badge>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={loading || uploading}
                        >
                            Отмена
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || uploading}
                            className="bg-primary hover:bg-primary/90"
                        >
                            {loading
                                ? (data ? 'Сохранение...' : 'Создание...')
                                : (data ? 'Сохранить' : 'Создать')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};