/**
 * @file: AboutTabNew.tsx
 * @description: Обновленная вкладка управления контентом "О нас" через БД
 * @dependencies: use-about-api.ts, shadcn/ui
 * @created: 2024-12-19
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

const AboutTabNew: React.FC = () => {
    const { toast } = useToast();
    const { content, loading: contentLoading, updateContent } = useAboutContent();
    const { media, loading: mediaLoading, addMedia, updateMedia, deleteMedia, reorderMedia } = useAboutMedia();
    const { lastUpdate } = useAboutWebSocket();

    const [editingField, setEditingField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [isAddingMedia, setIsAddingMedia] = useState(false);
    const [newMediaFile, setNewMediaFile] = useState<File | null>(null);
    const [newMediaData, setNewMediaData] = useState({
        title: '',
        description: '',
        type: 'image' as 'image' | 'video'
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
            // Данные автоматически обновятся через хуки
        }
    }, [lastUpdate]);

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

    // Функция для просмотра медиа
    const handleViewMedia = (media: AboutMedia) => {
        setViewingMedia(media);
        setIsViewModalOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Проверяем размер файла (5MB)
            const maxSize = 5 * 1024 * 1024;
            if (file.size > maxSize) {
                toast({
                    title: "Ошибка",
                    description: `Файл слишком большой. Максимальный размер: ${maxSize / 1024 / 1024}MB`,
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
            // Генерируем уникальное имя файла
            const filename = `${newMediaData.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${newMediaFile.name.split('.').pop()}`;
            const filePath = `/src/assets/about/${filename}`;

            // TODO: Здесь нужно реализовать копирование файла в папку assets/about
            // Пока используем существующие файлы для демонстрации
            const success = await addMedia({
                filename,
                original_name: newMediaFile.name,
                type: newMediaData.type,
                title: newMediaData.title,
                description: newMediaData.description,
                file_path: filePath
            });

            if (success) {
                setNewMediaFile(null);
                setNewMediaData({ title: '', description: '', type: 'image' });
                setIsAddingMedia(false);
            }
        } catch (error) {
            console.error('Error adding media:', error);
        }
    };

    const handleDeleteMedia = async (id: number) => {
        await deleteMedia(id);
    };

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

        const sortedMedia = [...media].sort((a, b) => a.order_index - b.order_index);
        const draggedIndex = sortedMedia.findIndex(item => item.id === draggedItem.id);
        const targetIndex = sortedMedia.findIndex(item => item.id === targetItem.id);

        // Обновляем порядок
        sortedMedia.splice(draggedIndex, 1);
        sortedMedia.splice(targetIndex, 0, draggedItem);

        // Получаем новый порядок ID
        const newOrder = sortedMedia.map(item => item.id);

        const success = await reorderMedia(newOrder);
        if (success) {
            setDraggedItem(null);
        }
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
                <Button onClick={() => window.location.reload()} className="mt-2">
                    Перезагрузить
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Управление страницей "О нас"</h2>
                    <p className="text-muted-foreground">
                        Редактируйте контент и медиа-файлы для страницы "О нас"
                    </p>
                </div>
            </div>

            {/* Основной контент */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Левая колонка - Текстовый контент */}
                <div className="space-y-6">
                    {/* Основная информация */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Edit className="w-5 h-5" />
                                Основная информация
                            </CardTitle>
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

                    {/* Дополнительная информация */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Дополнительная информация</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Контактная информация</Label>
                                {editingField === 'contact_info' ? (
                                    <div className="flex gap-2 mt-1">
                                        <Textarea
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="flex-1"
                                            rows={4}
                                        />
                                        <div className="flex flex-col gap-2">
                                            <Button size="sm" onClick={() => handleSave('contact_info')}>
                                                <Save className="w-4 h-4" />
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={handleCancel}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start justify-between mt-1">
                                        <pre className="text-gray-600 flex-1 whitespace-pre-wrap">{content.contact_info}</pre>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleEdit('contact_info', content.contact_info)}
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
                                {media.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`flex items-center gap-3 p-3 border rounded-lg ${draggedItem?.id === item.id ? 'opacity-50' : ''
                                            }`}
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
                                            <div className="font-medium truncate">{item.title}</div>
                                            <div className="text-sm text-gray-500 truncate">
                                                {item.description || 'Без описания'}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {item.filename}
                                            </div>
                                        </div>

                                        <Badge variant="secondary">
                                            {item.order_index}
                                        </Badge>

                                        <div className="flex gap-1">
                                            <Button size="sm" variant="ghost" onClick={() => handleViewMedia(item)}>
                                                <Eye className="w-4 h-4" />
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
                                        </div>
                                    </div>
                                ))}

                                {media.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        <Upload className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                        <p>Медиа-файлы не добавлены</p>
                                        <p className="text-sm">Добавьте фото и видео для страницы "О нас"</p>
                                    </div>
                                )}
                            </div>
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
                                        src={`/uploads/images/${viewingMedia.filename}`}
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
                                        src={`/uploads/videos/${viewingMedia.filename}`}
                                        controls
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
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold mb-4">Добавить медиа</h3>

                        <div className="space-y-4">
                            <div>
                                <Label>Тип медиа</Label>
                                <div className="flex gap-2 mt-2">
                                    <Button
                                        variant={newMediaData.type === 'image' ? 'default' : 'outline'}
                                        onClick={() => setNewMediaData(prev => ({ ...prev, type: 'image' }))}
                                        className="flex-1"
                                    >
                                        <FileImage className="w-4 h-4 mr-2" />
                                        Фото
                                    </Button>
                                    <Button
                                        variant={newMediaData.type === 'video' ? 'default' : 'outline'}
                                        onClick={() => setNewMediaData(prev => ({ ...prev, type: 'video' }))}
                                        className="flex-1"
                                    >
                                        <FileVideo className="w-4 h-4 mr-2" />
                                        Видео
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <Label>Файл</Label>
                                <Input
                                    type="file"
                                    accept={newMediaData.type === 'image' ? 'image/*' : 'video/*'}
                                    onChange={handleFileChange}
                                    className="mt-1"
                                />
                                {newMediaFile && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        Выбран: {newMediaFile.name} ({(newMediaFile.size / 1024 / 1024).toFixed(2)} MB)
                                    </p>
                                )}
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
                                <Label>Описание (необязательно)</Label>
                                <Textarea
                                    value={newMediaData.description}
                                    onChange={(e) => setNewMediaData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Введите описание"
                                    rows={3}
                                    className="mt-1"
                                />
                            </div>

                            <div className="flex gap-2 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsAddingMedia(false);
                                        setNewMediaFile(null);
                                        setNewMediaData({ title: '', description: '', type: 'image' });
                                    }}
                                >
                                    Отмена
                                </Button>
                                <Button
                                    onClick={handleAddMedia}
                                    disabled={!newMediaFile || !newMediaData.title}
                                    className="bg-gradient-to-r from-blue-500 to-purple-500"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Добавить
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AboutTabNew;
