/**
 * @file: src/components/admin/AboutTab.tsx
 * @description: Вкладка управления контентом страницы "О нас" для админа с возможностью редактирования медиа
 * @dependencies: use-about-api.ts, shadcn/ui, lucide-react
 * @created: 2024-12-19
 * @updated: 2024-12-19
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAboutContent, useAboutMedia, useAboutWebSocket, type AboutContent, type AboutMedia } from '@/hooks/use-about-api';
import { useServices } from '@/hooks/use-services';
import { Trash2, Edit, Save, X, Plus, Upload, GripVertical, FileImage, FileVideo, Eye } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import ProcessStepsEditor from './ProcessStepsEditor';

const AboutTab: React.FC = () => {
    const { toast } = useToast();
    const { content, loading: contentLoading, updateContent } = useAboutContent();
    const { media, loading: mediaLoading, addMedia, updateMedia, deleteMedia, reorderMedia } = useAboutMedia();
    const { lastUpdate } = useAboutWebSocket();
    const { services, loading: servicesLoading, fetchServices, updateService } = useServices();

    const [editingField, setEditingField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [isAddingMedia, setIsAddingMedia] = useState(false);
    const [newMediaFile, setNewMediaFile] = useState<File | null>(null);
    const [newMediaData, setNewMediaData] = useState({
        title: '',
        description: '',
        type: 'image' as 'image' | 'video'
    });

    // Состояние для редактирования медиа
    const [editingMedia, setEditingMedia] = useState<AboutMedia | null>(null);
    const [editMediaData, setEditMediaData] = useState({
        title: '',
        description: ''
    });

    // Drag & Drop состояние
    const [draggedItem, setDraggedItem] = useState<AboutMedia | null>(null);

    // Состояние для просмотра медиа
    const [viewingMedia, setViewingMedia] = useState<AboutMedia | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // Автоматическое обновление при получении WebSocket уведомлений
    React.useEffect(() => {
        if (lastUpdate > 0) {
            console.log('🔄 Получено обновление about через WebSocket, перезагружаем данные');
        }
    }, [lastUpdate]);

    // Загружаем услуги при монтировании компонента
    React.useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    const handleEdit = (field: string, value: string) => {
        setEditingField(field);
        setEditValue(value);
    };

    const handleSave = async (field: keyof AboutContent) => {
        if (!content) return;

        const success = await updateContent(content.id, { [field]: editValue });
        if (success) {
            setEditingField(null);
            setEditValue('');
        }
    };

    const handleCancel = () => {
        setEditingField(null);
        setEditValue('');
    };

    const handleSaveService = async (serviceId: string, field: 'name' | 'shortDescription' | 'fullDescription', value: string) => {
        try {
            await updateService(serviceId, { [field]: value });
            setEditingField(null);
            setEditValue('');
            toast({
                title: "Успешно",
                description: "Услуга обновлена",
            });
        } catch (error) {
            toast({
                title: "Ошибка",
                description: "Не удалось обновить услугу",
                variant: "destructive",
            });
        }
    };

    // Функции для редактирования медиа
    const handleEditMedia = (item: AboutMedia) => {
        setEditingMedia(item);
        setEditMediaData({
            title: item.title,
            description: item.description || ''
        });
    };

    const handleSaveMedia = async () => {
        if (!editingMedia) return;

        const success = await updateMedia(editingMedia.id, editMediaData);
        if (success) {
            setEditingMedia(null);
            setEditMediaData({ title: '', description: '' });
            toast({
                title: "Успешно",
                description: "Медиа обновлено",
            });
        }
    };

    const handleCancelMedia = () => {
        setEditingMedia(null);
        setEditMediaData({ title: '', description: '' });
    };

    // Функция для просмотра медиа
    const handleViewMedia = (media: AboutMedia) => {
        console.log('🔍 Просмотр медиа:', {
            id: media.id,
            title: media.title,
            type: media.type,
            filename: media.filename,
            file_path: media.file_path
        });
        setViewingMedia(media);
        setIsViewModalOpen(true);
    };

    // Функция для формирования правильного URL медиа файла
    const getMediaUrl = (filePath: string) => {
        // Если это относительный путь uploads, используем основной домен
        if (filePath.startsWith('/uploads/')) {
            return `https://waxhands.ru${filePath}`;
        }
        // Если это уже полный URL, возвращаем как есть
        if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
            return filePath;
        }
        // Fallback - добавляем базовый URL
        return `https://waxhands.ru${filePath}`;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Проверяем размер файла в зависимости от типа
            const isVideo = file.type.startsWith('video/');
            const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB для видео, 10MB для изображений

            if (file.size > maxSize) {
                toast({
                    title: "Ошибка",
                    description: `Файл слишком большой. Максимальный размер для ${isVideo ? 'видео' : 'изображений'}: ${maxSize / 1024 / 1024}MB`,
                    variant: "destructive",
                });
                return;
            }

            setNewMediaFile(file);
            setNewMediaData(prev => ({
                ...prev,
                type: file.type.startsWith('image/') ? 'image' : 'video',
                title: prev.title || file.name.split('.')[0]
            }));
        }
    };

    const handleAddMedia = async () => {
        if (!newMediaFile) return;

        try {
            // Сначала загружаем файл через upload API
            const formData = new FormData();
            const fieldName = newMediaData.type === 'image' ? 'images' : 'videos';
            formData.append(fieldName, newMediaFile);

            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Токен авторизации не найден');
            }

            // Загружаем файл через service-files endpoint (как в услугах)
            const uploadResponse = await fetch(`${process.env.VITE_API_URL || 'https://waxhands.ru/api'}/upload/service-files`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!uploadResponse.ok) {
                throw new Error(`Ошибка загрузки файла: ${uploadResponse.status}`);
            }

            const uploadResult = await uploadResponse.json();
            console.log('Upload result:', uploadResult);

            // Получаем file_path из результата загрузки
            let filePath = '';
            if (newMediaData.type === 'image' && uploadResult.data.images && uploadResult.data.images.length > 0) {
                filePath = uploadResult.data.images[0];
            } else if (newMediaData.type === 'video' && uploadResult.data.videos && uploadResult.data.videos.length > 0) {
                filePath = uploadResult.data.videos[0];
            } else {
                throw new Error('Файл не был загружен');
            }

            // Генерируем filename из file_path
            const filename = filePath.split('/').pop() || newMediaFile.name;

            // Сохраняем метаданные в базу данных
            const success = await addMedia({
                filename,
                original_name: newMediaFile.name,
                type: newMediaData.type,
                title: newMediaData.title,
                description: newMediaData.description,
                file_path: filePath
            });

            if (success) {
                setIsAddingMedia(false);
                setNewMediaFile(null);
                setNewMediaData({ title: '', description: '', type: 'image' });
                toast({
                    title: "Успешно",
                    description: "Медиа добавлено",
                });
            }
        } catch (error) {
            console.error('Error adding media:', error);
            toast({
                title: "Ошибка",
                description: error instanceof Error ? error.message : 'Ошибка добавления медиа',
                variant: "destructive",
            });
        }
    };

    const handleDeleteMedia = async (id: number) => {
        const success = await deleteMedia(id);
        if (success) {
            toast({
                title: "Успешно",
                description: "Медиа удалено",
            });
        }
    };

    // Drag & Drop функции
    const handleDragStart = (e: React.DragEvent, item: AboutMedia) => {
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, targetItem: AboutMedia) => {
        e.preventDefault();
        if (!draggedItem || draggedItem.id === targetItem.id) return;

        const draggedIndex = media.findIndex(item => item.id === draggedItem.id);
        const targetIndex = media.findIndex(item => item.id === targetItem.id);

        if (draggedIndex !== -1 && targetIndex !== -1) {
            const newOrder = [...media];
            const [removed] = newOrder.splice(draggedIndex, 1);
            newOrder.splice(targetIndex, 0, removed);

            // Обновляем order_index для всех элементов
            const updatedOrder = newOrder.map((item, index) => ({
                ...item,
                order_index: index + 1
            }));

            // Отправляем только ID элементов в правильном порядке
            const mediaIds = updatedOrder.map(item => item.id);
            await reorderMedia(mediaIds);
        }

        setDraggedItem(null);
    };

    if (contentLoading || mediaLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                    <p>Загрузка контента...</p>
                </div>
            </div>
        );
    }

    if (!content) {
        return (
            <div className="text-center py-8">
                <p className="text-red-500">Ошибка загрузки контента</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Левая колонка - Основной контент */}
                <div className="space-y-6">
                    {/* Основная информация */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Основная информация</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Заголовок</Label>
                                {editingField === 'title' ? (
                                    <div className="flex gap-2 mt-1">
                                        <Input
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="flex-1"
                                        />
                                        <Button size="sm" onClick={() => handleSave('title')}>
                                            <Save className="w-4 h-4" />
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={handleCancel}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-lg font-medium">{content.title}</span>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleEdit('title', content.title)}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div>
                                <Label>Подзаголовок</Label>
                                {editingField === 'subtitle' ? (
                                    <div className="flex gap-2 mt-1">
                                        <Input
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="flex-1"
                                        />
                                        <Button size="sm" onClick={() => handleSave('subtitle')}>
                                            <Save className="w-4 h-4" />
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={handleCancel}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-gray-600">{content.subtitle}</span>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleEdit('subtitle', content.subtitle)}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div>
                                <Label>Описание</Label>
                                {editingField === 'description' ? (
                                    <div className="flex gap-2 mt-1">
                                        <Textarea
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="flex-1"
                                            rows={4}
                                        />
                                        <div className="flex flex-col gap-2">
                                            <Button size="sm" onClick={() => handleSave('description')}>
                                                <Save className="w-4 h-4" />
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={handleCancel}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start justify-between mt-1">
                                        <p className="text-gray-600 flex-1">{content.description}</p>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleEdit('description', content.description)}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Карточка "О нашей студии" */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Карточка "О нашей студии"</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Заголовок карточки</Label>
                                {editingField === 'studio_title' ? (
                                    <div className="flex gap-2 mt-1">
                                        <Input
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="flex-1"
                                        />
                                        <Button size="sm" onClick={() => handleSave('studio_title')}>
                                            <Save className="w-4 h-4" />
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={handleCancel}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-gray-600">{content.studio_title}</span>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleEdit('studio_title', content.studio_title)}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div>
                                <Label>Описание студии</Label>
                                {editingField === 'studio_description' ? (
                                    <div className="flex gap-2 mt-1">
                                        <Textarea
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="flex-1"
                                            rows={3}
                                        />
                                        <div className="flex flex-col gap-2">
                                            <Button size="sm" onClick={() => handleSave('studio_description')}>
                                                <Save className="w-4 h-4" />
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={handleCancel}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start justify-between mt-1">
                                        <p className="text-gray-600 flex-1">{content.studio_description}</p>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleEdit('studio_description', content.studio_description)}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Карточка "Наши преимущества" */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Карточка "Наши преимущества"</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Заголовок карточки</Label>
                                {editingField === 'advantages_title' ? (
                                    <div className="flex gap-2 mt-1">
                                        <Input
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="flex-1"
                                        />
                                        <Button size="sm" onClick={() => handleSave('advantages_title')}>
                                            <Save className="w-4 h-4" />
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={handleCancel}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-gray-600">{content.advantages_title}</span>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleEdit('advantages_title', content.advantages_title)}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div>
                                <Label>Список преимуществ</Label>
                                {editingField === 'advantages_list' ? (
                                    <div className="space-y-4 mt-1">
                                        <div className="text-sm text-gray-500 mb-2">
                                            Редактируйте каждое преимущество отдельно. Нажмите "Добавить преимущество" для создания нового.
                                        </div>

                                        {/* Список преимуществ для редактирования */}
                                        {(content?.advantages_list || []).map((advantage, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <Input
                                                    value={advantage}
                                                    onChange={(e) => {
                                                        const newAdvantages = [...(content?.advantages_list || [])];
                                                        newAdvantages[index] = e.target.value;
                                                        updateContent(content.id, { advantages_list: newAdvantages });
                                                    }}
                                                    placeholder="Например: Быстрое создание"
                                                    className="flex-1"
                                                />
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        const newAdvantages = [...(content?.advantages_list || [])];
                                                        newAdvantages.splice(index, 1);
                                                        updateContent(content.id, { advantages_list: newAdvantages });
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}

                                        {/* Кнопка добавления нового преимущества */}
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                const newAdvantages = [...(content?.advantages_list || []), ''];
                                                updateContent(content.id, { advantages_list: newAdvantages });
                                            }}
                                            className="w-full"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Добавить преимущество
                                        </Button>

                                        <div className="flex gap-2">
                                            <Button onClick={() => setEditingField(null)}>
                                                Готово
                                            </Button>
                                            <Button variant="outline" onClick={handleCancel}>
                                                Отмена
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start justify-between mt-1">
                                        <div className="flex-1">
                                            <div className="space-y-2">
                                                {(content?.advantages_list || []).map((advantage, index) => (
                                                    <div key={index} className="border-l-2 border-purple-500 pl-3">
                                                        <div className="text-sm text-gray-600">{advantage}</div>
                                                    </div>
                                                ))}
                                                {(!content?.advantages_list || content.advantages_list.length === 0) && (
                                                    <div className="text-sm text-gray-400 italic">
                                                        Список преимуществ пуст
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setEditingField('advantages_list')}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Карточка "Как проходит мастер-класс" */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Карточка "Как проходит мастер-класс"</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Заголовок карточки</Label>
                                {editingField === 'process_title' ? (
                                    <div className="flex gap-2 mt-1">
                                        <Input
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="flex-1"
                                        />
                                        <Button size="sm" onClick={() => handleSave('process_title')}>
                                            <Save className="w-4 h-4" />
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={handleCancel}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-gray-600">{content.process_title}</span>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleEdit('process_title', content.process_title)}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div>
                                <Label>Шаги процесса</Label>
                                {editingField === 'process_steps' ? (
                                    <div className="space-y-4 mt-1">
                                        <div className="text-sm text-gray-500 mb-2">
                                            Редактируйте каждый шаг отдельно. Нажмите "Добавить шаг" для создания нового шага.
                                        </div>
                                        <ProcessStepsEditor
                                            content={content}
                                            onSave={async (steps) => {
                                                await updateContent(content.id, { process_steps: steps });
                                                setEditingField(null);
                                                toast({
                                                    title: "Успешно",
                                                    description: "Шаги процесса обновлены",
                                                });
                                            }}
                                            onCancel={() => setEditingField(null)}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-start justify-between mt-1">
                                        <div className="flex-1">
                                            <div className="space-y-2">
                                                {(content?.process_steps || []).map((step, index) => (
                                                    <div key={index} className="border-l-2 border-blue-500 pl-3">
                                                        <div className="font-medium text-gray-800">{step.title}</div>
                                                        <div className="text-sm text-gray-600">{step.description}</div>
                                                    </div>
                                                ))}
                                                {(!content?.process_steps || content.process_steps.length === 0) && (
                                                    <div className="text-sm text-gray-400 italic">
                                                        Шаги процесса не настроены
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setEditingField('process_steps')}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Карточка "Безопасность и качество" */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Карточка "Безопасность и качество"</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Заголовок карточки</Label>
                                {editingField === 'safety_title' ? (
                                    <div className="flex gap-2 mt-1">
                                        <Input
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="flex-1"
                                        />
                                        <Button size="sm" onClick={() => handleSave('safety_title')}>
                                            <Save className="w-4 h-4" />
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={handleCancel}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-gray-600">{content.safety_title}</span>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleEdit('safety_title', content.safety_title)}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div>
                                <Label>Описание безопасности</Label>
                                {editingField === 'safety_description' ? (
                                    <div className="flex gap-2 mt-1">
                                        <Textarea
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="flex-1"
                                            rows={3}
                                        />
                                        <div className="flex flex-col gap-2">
                                            <Button size="sm" onClick={() => handleSave('safety_description')}>
                                                <Save className="w-4 h-4" />
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={handleCancel}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start justify-between mt-1">
                                        <p className="text-gray-600 flex-1">{content.safety_description}</p>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleEdit('safety_description', content.safety_description)}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Правая колонка - Медиа управление */}
                <div className="space-y-6">
                    {/* Управление медиа */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Upload className="w-5 h-5" />
                                Медиа-контент
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Управляйте фото и видео для страницы "О нас"
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button
                                onClick={() => setIsAddingMedia(true)}
                                className="w-full bg-gradient-to-r from-blue-500 to-purple-500"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Добавить медиа
                            </Button>

                            {/* Список медиа */}
                            <div className="space-y-3">
                                {media && media.length > 0 ? (
                                    (media || []).map((item) => (
                                        <div
                                            key={item.id}
                                            className={`flex items-center gap-3 p-3 border rounded-lg ${draggedItem?.id === item.id ? 'opacity-50' : ''}`}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, item)}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, item)}
                                        >
                                            <div className="flex-shrink-0 cursor-move">
                                                <GripVertical className="w-4 h-4 text-gray-400" />
                                            </div>

                                            <div className="flex-shrink-0">
                                                {item.type === 'image' ? (
                                                    <FileImage className="w-8 h-8 text-blue-500" />
                                                ) : (
                                                    <FileVideo className="w-8 h-8 text-purple-500" />
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                {editingMedia?.id === item.id ? (
                                                    <div className="space-y-2">
                                                        <Input
                                                            value={editMediaData.title}
                                                            onChange={(e) => setEditMediaData(prev => ({ ...prev, title: e.target.value }))}
                                                            placeholder="Название"
                                                            size={1}
                                                        />
                                                        <Textarea
                                                            value={editMediaData.description}
                                                            onChange={(e) => setEditMediaData(prev => ({ ...prev, description: e.target.value }))}
                                                            placeholder="Описание"
                                                            rows={2}
                                                        />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="font-medium truncate">{item.title}</div>
                                                        <div className="text-sm text-gray-500 truncate">
                                                            {item.description || 'Без описания'}
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            {item.filename}
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            <Badge variant="secondary">
                                                {item.order_index}
                                            </Badge>

                                            <div className="flex gap-1">
                                                {editingMedia?.id === item.id ? (
                                                    <>
                                                        <Button size="sm" onClick={handleSaveMedia}>
                                                            <Save className="w-4 h-4" />
                                                        </Button>
                                                        <Button size="sm" variant="outline" onClick={handleCancelMedia}>
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Button size="sm" variant="ghost" onClick={() => handleViewMedia(item)}>
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        <Button size="sm" variant="ghost" onClick={() => handleEditMedia(item)}>
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Удалить медиа?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Это действие нельзя отменить. Медиа-файл будет удален навсегда.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => handleDeleteMedia(item.id)}
                                                                        className="bg-red-500 hover:bg-red-600"
                                                                    >
                                                                        Удалить
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <FileImage className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                        <p>Медиа-файлы не найдены</p>
                                        <p className="text-sm">Добавьте первый медиа-файл для начала</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Управление услугами для раздела "О нашем мастер-классе" */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="text-2xl">🎨</span>
                                Управление услугами для раздела "О нашем мастер-классе"
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Редактируйте названия и описания услуг, которые отображаются родителям
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {servicesLoading ? (
                                <div className="text-center py-4">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto mb-2"></div>
                                    <p>Загрузка услуг...</p>
                                </div>
                            ) : services.length > 0 ? (
                                <div className="space-y-4">
                                    {services.map((service) => (
                                        <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                                            <div className="space-y-3">
                                                <div>
                                                    <Label className="text-sm font-medium text-gray-600">Название услуги</Label>
                                                    {editingField === `service_name_${service.id}` ? (
                                                        <div className="flex gap-2 mt-1">
                                                            <Input
                                                                value={editValue}
                                                                onChange={(e) => setEditValue(e.target.value)}
                                                                className="flex-1"
                                                            />
                                                            <Button size="sm" onClick={() => handleSaveService(service.id, 'name', editValue)}>
                                                                <Save className="w-4 h-4" />
                                                            </Button>
                                                            <Button size="sm" variant="outline" onClick={handleCancel}>
                                                                <X className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-between mt-1">
                                                            <span className="text-gray-800">{service.name}</span>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleEdit(`service_name_${service.id}`, service.name)}
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>

                                                <div>
                                                    <Label className="text-sm font-medium text-gray-600">Краткое описание</Label>
                                                    {editingField === `service_short_${service.id}` ? (
                                                        <div className="flex gap-2 mt-1">
                                                            <Textarea
                                                                value={editValue}
                                                                onChange={(e) => setEditValue(e.target.value)}
                                                                className="flex-1"
                                                                rows={2}
                                                            />
                                                            <div className="flex flex-col gap-2">
                                                                <Button size="sm" onClick={() => handleSaveService(service.id, 'shortDescription', editValue)}>
                                                                    <Save className="w-4 h-4" />
                                                                </Button>
                                                                <Button size="sm" variant="outline" onClick={handleCancel}>
                                                                    <X className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-start justify-between mt-1">
                                                            <p className="text-gray-600 flex-1">{service.shortDescription}</p>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleEdit(`service_short_${service.id}`, service.shortDescription)}
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>

                                                <div>
                                                    <Label className="text-sm font-medium text-gray-600">Полное описание</Label>
                                                    {editingField === `service_full_${service.id}` ? (
                                                        <div className="flex gap-2 mt-1">
                                                            <Textarea
                                                                value={editValue}
                                                                onChange={(e) => setEditValue(e.target.value)}
                                                                className="flex-1"
                                                                rows={3}
                                                            />
                                                            <div className="flex flex-col gap-2">
                                                                <Button size="sm" onClick={() => handleSaveService(service.id, 'fullDescription', editValue)}>
                                                                    <Save className="w-4 h-4" />
                                                                </Button>
                                                                <Button size="sm" variant="outline" onClick={handleCancel}>
                                                                    <X className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-start justify-between mt-1">
                                                            <p className="text-gray-600 flex-1">{service.fullDescription}</p>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleEdit(`service_full_${service.id}`, service.fullDescription)}
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p>Услуги не найдены</p>
                                    <p className="text-sm">Добавьте услуги на вкладке "Услуги"</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Модальное окно просмотра медиа */}
            {isViewModalOpen && viewingMedia && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Просмотр медиа</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsViewModalOpen(false)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {/* Заголовок и описание */}
                            <div>
                                <h4 className="font-medium text-lg">{viewingMedia.title}</h4>
                                {viewingMedia.description && (
                                    <p className="text-gray-600 mt-1">{viewingMedia.description}</p>
                                )}
                                <p className="text-sm text-gray-400 mt-1">Файл: {viewingMedia.filename}</p>
                            </div>

                            {/* Отображение медиа */}
                            <div className="flex justify-center">
                                {viewingMedia.type === 'image' ? (
                                    <img
                                        src={getMediaUrl(viewingMedia.file_path)}
                                        alt={viewingMedia.title}
                                        className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = '/placeholder.svg';
                                            target.alt = 'Ошибка загрузки изображения';
                                        }}
                                    />
                                ) : (
                                    <video
                                        src={getMediaUrl(viewingMedia.file_path)}
                                        controls
                                        preload="metadata"
                                        className="max-w-full max-h-[60vh] rounded-lg shadow-lg"
                                        onError={(e) => {
                                            const target = e.target as HTMLVideoElement;
                                            target.poster = '/placeholder.svg';
                                        }}
                                    >
                                        Ваш браузер не поддерживает воспроизведение видео.
                                    </video>
                                )}
                            </div>

                            {/* Кнопка закрытия */}
                            <div className="flex justify-end pt-4 border-t">
                                <Button onClick={() => setIsViewModalOpen(false)}>
                                    Закрыть
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно добавления медиа */}
            {isAddingMedia && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Добавить медиа</h3>

                        <div className="space-y-4">
                            <div>
                                <Label>Файл</Label>
                                <Input
                                    type="file"
                                    accept="image/*,video/*"
                                    onChange={handleFileChange}
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label>Название</Label>
                                <Input
                                    value={newMediaData.title}
                                    onChange={(e) => setNewMediaData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Введите название"
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label>Описание</Label>
                                <Textarea
                                    value={newMediaData.description}
                                    onChange={(e) => setNewMediaData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Введите описание (необязательно)"
                                    rows={3}
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label>Тип</Label>
                                <select
                                    value={newMediaData.type}
                                    onChange={(e) => setNewMediaData(prev => ({ ...prev, type: e.target.value as 'image' | 'video' }))}
                                    className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                                >
                                    <option value="image">Фото</option>
                                    <option value="video">Видео</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-6">
                            <Button onClick={handleAddMedia} className="flex-1">
                                Добавить
                            </Button>
                            <Button variant="outline" onClick={() => setIsAddingMedia(false)} className="flex-1">
                                Отмена
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AboutTab;
