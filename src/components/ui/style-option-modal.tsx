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
    avatar?: string;
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
        avatar: data?.avatar || undefined,
        images: data?.images || [],
        videos: data?.videos || []
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [uploading, setUploading] = useState(false);
    const { toast } = useToast();

    // Обновляем данные формы при изменении входящих данных
    useEffect(() => {
        console.log('StyleOptionModal: useEffect triggered with data:', data);
        if (data) {
            console.log('StyleOptionModal: updating form data with:', data);
            const newFormData = {
                name: data.name || '',
                shortDescription: data.shortDescription || '',
                fullDescription: data.fullDescription || '',
                price: data.price || 0,
                avatar: data.avatar || undefined,
                images: data.images || [],
                videos: data.videos || []
            };
            console.log('StyleOptionModal: new form data:', newFormData);
            setFormData(newFormData);
        } else {
            // Очищаем форму если данных нет (новый элемент)
            const emptyFormData = {
                name: '',
                shortDescription: '',
                fullDescription: '',
                price: 0,
                avatar: undefined,
                images: [],
                videos: []
            };
            console.log('StyleOptionModal: clearing form with:', emptyFormData);
            setFormData(emptyFormData);
        }
    }, [data]);

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const imagesInputRef = useRef<HTMLInputElement>(null);
    const videosInputRef = useRef<HTMLInputElement>(null);

    const isStyle = type === 'style';
    const title = data
        ? `Редактировать ${isStyle ? 'стиль' : 'опцию'}`
        : `Добавить ${isStyle ? 'стиль' : 'опцию'}`;

    const handleInputChange = (field: keyof FormData, value: string | number) => {
        console.log('StyleOptionModal: изменение поля', field, 'на значение', value);
        setFormData(prev => {
            const newData = {
                ...prev,
                [field]: value
            };
            console.log('StyleOptionModal: новые данные формы', newData);
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

    const handleFileUpload = async (files: FileList, type: 'avatar' | 'images' | 'videos') => {
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

            const uploadData: { avatar?: File; images?: File[]; videos?: File[] } = {};

            if (type === 'avatar') {
                uploadData.avatar = fileArray[0];
            } else if (type === 'images') {
                uploadData.images = fileArray;
            } else if (type === 'videos') {
                uploadData.videos = fileArray;
            }

            console.log('StyleOptionModal: загружаем файлы на сервер:', uploadData);
            console.log('StyleOptionModal: количество файлов по типам:', {
                avatar: uploadData.avatar ? 1 : 0,
                images: uploadData.images?.length || 0,
                videos: uploadData.videos?.length || 0
            });
            const uploadedFiles = await uploadAPI.uploadServiceFiles(uploadData);
            console.log('StyleOptionModal: файлы загружены:', uploadedFiles);
            console.log('StyleOptionModal: количество загруженных файлов:', {
                avatar: uploadedFiles.avatar ? 1 : 0,
                images: uploadedFiles.images?.length || 0,
                videos: uploadedFiles.videos?.length || 0
            });

            // Обновляем данные формы с серверными ссылками
            if (type === 'avatar' && uploadedFiles.avatar) {
                setFormData(prev => ({ ...prev, avatar: uploadedFiles.avatar }));
            } else if (type === 'images' && uploadedFiles.images) {
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
        console.log('StyleOptionModal: удаление файла', type, 'индекс', index);
        setFormData(prev => {
            const currentFiles = prev[type] || [];
            const fileToRemove = currentFiles[index];

            // Освобождаем blob URL если это blob
            if (fileToRemove && fileToRemove.startsWith('blob:')) {
                URL.revokeObjectURL(fileToRemove);
            }

            const newFiles = currentFiles.filter((_, i) => i !== index);
            console.log('StyleOptionModal: новый массив файлов', type, newFiles);
            return {
                ...prev,
                [type]: newFiles
            };
        });
    };

    const removeAvatar = () => {
        console.log('StyleOptionModal: удаление аватара');
        setFormData(prev => {
            // Освобождаем blob URL если это blob
            if (prev.avatar && prev.avatar.startsWith('blob:')) {
                URL.revokeObjectURL(prev.avatar);
            }
            return { ...prev, avatar: undefined };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        console.log('StyleOptionModal: отправка формы с данными:', formData);

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
                if (!submitData.avatar) {
                    delete submitData.avatar;
                }
                if (!submitData.images || submitData.images.length === 0) {
                    delete submitData.images;
                }
                if (!submitData.videos || submitData.videos.length === 0) {
                    delete submitData.videos;
                }
            }

            console.log('StyleOptionModal: данные для отправки с обработанной ценой:', submitData);
            console.log('StyleOptionModal: проверка медиафайлов в submitData:', {
                avatar: submitData.avatar,
                images: submitData.images?.length || 0,
                videos: submitData.videos?.length || 0
            });

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
            avatar: undefined,
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
                                    console.log('StyleOptionModal: изменение цены, новое значение:', value);
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

                    {/* Аватар */}
                    <div className="space-y-2">
                        <Label>Аватар</Label>
                        <div className="flex items-center gap-4">
                            {formData.avatar ? (
                                <div className="relative">
                                    <img
                                        src={getFileUrl(formData.avatar || '')}
                                        alt="Avatar"
                                        className="w-20 h-20 object-cover rounded-lg border cursor-pointer"
                                        onClick={() => window.open(getFileUrl(formData.avatar || ''), '_blank')}
                                        title="Кликните для просмотра в полном размере"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        className="absolute -top-2 -right-2 w-6 h-6 p-0"
                                        onClick={removeAvatar}
                                    >
                                        <X className="w-3 h-3" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="w-20 h-20 border border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                                    <ImageIcon className="w-6 h-6 text-gray-400" />
                                </div>
                            )}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => avatarInputRef.current?.click()}
                                disabled={uploading}
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Загрузить аватар
                            </Button>
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/*"
                                onChange={(e) => e.target.files && handleFileUpload(e.target.files, 'avatar')}
                                className="hidden"
                            />
                        </div>
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
                                            <img
                                                src={getFileUrl(image)}
                                                alt={`Image ${index + 1}`}
                                                className="w-20 h-20 object-cover rounded border cursor-pointer"
                                                onClick={() => window.open(getFileUrl(image), '_blank')}
                                                title="Кликните для просмотра в полном размере"
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