/**
 * @file: BonusesTab.tsx
 * @description: Вкладка админ-панели для управления бонусами
 * @dependencies: React, API hooks, UI components
 * @created: 2025-01-25
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Upload, Save, Trash2, Plus, Image as ImageIcon, X } from 'lucide-react';

interface BonusData {
    id: string;
    title: string;
    media: string[];
    created_at: string;
    updated_at: string;
}

const BonusesTab: React.FC = () => {
    const [title, setTitle] = useState('');
    const [media, setMedia] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Загружаем данные о бонусах
    const { data: bonusesResponse, isLoading } = useQuery({
        queryKey: ['bonuses'],
        queryFn: async () => {

            const response = await api.get('/bonuses');

            return response.data;
        },
    });

    // Мутация для обновления бонусов
    const updateBonusesMutation = useMutation({
        mutationFn: async (data: { title: string; media: string[] }) => {
            const response = await api.put('/bonuses', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bonuses'] });
            toast({
                title: 'Успешно!',
                description: 'Данные о бонусах обновлены',
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Ошибка',
                description: error.response?.data?.error || 'Не удалось обновить данные',
                variant: 'destructive',
            });
        },
    });

    // Инициализация данных
    useEffect(() => {

        if (bonusesResponse?.success && bonusesResponse.data) {

            setTitle(bonusesResponse.data.title || '');
            // Обрабатываем media как массив, если это строка - парсим JSON
            const mediaArray = typeof bonusesResponse.data.media === 'string'
                ? JSON.parse(bonusesResponse.data.media)
                : (bonusesResponse.data.media || []);

            setMedia(mediaArray);
        } else if (bonusesResponse && !bonusesResponse.success) {
            // Если API вернул данные напрямую (без success обертки)

            setTitle(bonusesResponse.title || '');
            const mediaArray = typeof bonusesResponse.media === 'string'
                ? JSON.parse(bonusesResponse.media)
                : (bonusesResponse.media || []);
            console.log('BonusesTab: Media array (direct):', mediaArray);
            setMedia(mediaArray);
        } else {

        }
    }, [bonusesResponse]);

    const handleSave = () => {

        if (!title.trim()) {
            toast({
                title: 'Ошибка',
                description: 'Заголовок не может быть пустым',
                variant: 'destructive',
            });
            return;
        }

        const saveData = {
            title: title.trim(),
            media: media,
        };

        updateBonusesMutation.mutate(saveData, {
            onSuccess: (response) => {

                // Принудительно обновляем кэш
                queryClient.invalidateQueries({ queryKey: ['bonuses'] });
                queryClient.refetchQueries({ queryKey: ['bonuses'] });
            },
            onError: (error) => {
                console.error('BonusesTab: Ошибка при сохранении:', error);
            }
        });
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Проверяем тип файла
        if (!file.type.startsWith('image/')) {
            toast({
                title: 'Ошибка',
                description: 'Пожалуйста, выберите изображение',
                variant: 'destructive',
            });
            return;
        }

        // Проверяем размер файла (максимум 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: 'Ошибка',
                description: 'Размер файла не должен превышать 5MB',
                variant: 'destructive',
            });
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('images', file);

            const response = await api.post('/upload', formData);

            // Проверяем разные форматы ответа
            let imageUrl = null;
            if (response.data.success && response.data.data?.images?.length > 0) {
                imageUrl = response.data.data.images[0];
            } else if (response.data.images?.length > 0) {
                imageUrl = response.data.images[0];
            }

            if (imageUrl) {

                setMedia(prev => [...prev, imageUrl]);
                toast({
                    title: 'Успешно!',
                    description: 'Изображение загружено',
                });
            } else {
                console.error('Upload failed:', response.data);
                throw new Error(response.data.error || 'Ошибка загрузки - нет изображений в ответе');
            }
        } catch (error: any) {
            console.error('Ошибка загрузки файла:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Не удалось загрузить изображение';
            toast({
                title: 'Ошибка',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setUploading(false);
            // Очищаем input
            event.target.value = '';
        }
    };

    const handleRemoveMedia = (index: number) => {
        const newMedia = media.filter((_, i) => i !== index);
        setMedia(newMedia);
        toast({
            title: 'Успешно!',
            description: 'Изображение удалено',
        });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Управление бонусами</h2>
                    <p className="text-muted-foreground">
                        Настройте информацию о бонусах для участников мастер-классов
                    </p>
                </div>
            </div>

            <div className="grid gap-6">
                {/* Основные настройки */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ImageIcon className="w-5 h-5" />
                            Основная информация
                        </CardTitle>
                        <CardDescription>
                            Заголовок и описание бонусов, которые будут отображаться на главной странице
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Заголовок бонусов</Label>
                            <Textarea
                                id="title"
                                placeholder="Введите текст о бонусах..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="min-h-[100px]"
                            />
                            <p className="text-sm text-muted-foreground">
                                Этот текст будет отображаться с переливающимся эффектом
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Управление медиа */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Upload className="w-5 h-5" />
                            Постеры и изображения
                        </CardTitle>
                        <CardDescription>
                            Добавьте изображения-постеры, которые будут отображаться под заголовком
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Загрузка изображений */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Label htmlFor="file-upload" className="cursor-pointer">
                                    <div className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors">
                                        <Upload className="w-4 h-4" />
                                        <span>Выберите изображение</span>
                                    </div>
                                </Label>
                                <input
                                    id="file-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    disabled={uploading}
                                />
                                {uploading && (
                                    <div className="flex items-center gap-2 text-blue-600">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                        <span>Загрузка...</span>
                                    </div>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Поддерживаемые форматы: JPG, PNG, GIF. Максимальный размер: 5MB
                            </p>
                        </div>

                        {/* Список изображений */}
                        {media.length > 0 && (
                            <div className="space-y-2">
                                <Label>Текущие изображения ({media.length})</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {(media || []).map((url, index) => (
                                        <div key={index} className="relative group">
                                            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                                <img
                                                    src={url}
                                                    alt={`Постер ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleRemoveMedia(index)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {media.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>Изображения не добавлены</p>
                                <p className="text-sm">Добавьте URL изображений выше</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Предварительный просмотр */}
                {title && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Предварительный просмотр</CardTitle>
                            <CardDescription>
                                Как будет выглядеть блок бонусов на главной странице
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 rounded-2xl p-6 shadow-2xl">
                                <div className="text-center">
                                    <h3 className="text-2xl font-bold text-white mb-4">
                                        <span className="bg-gradient-to-r from-white via-yellow-100 to-white bg-clip-text text-transparent bg-[length:200%_100%] animate-shimmer">
                                            {title}
                                        </span>
                                    </h3>
                                    <div className="text-lg text-white/90 font-semibold">
                                        🎉 Специальное предложение для участников мастер-классов! 🎉
                                    </div>
                                </div>

                                {media.length > 0 && (
                                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {(media || []).slice(0, 2).map((url, index) => (
                                            <div key={index} className="aspect-video bg-white/20 rounded-lg overflow-hidden">
                                                <img
                                                    src={url}
                                                    alt={`Постер ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Кнопка сохранения */}
                <div className="flex justify-end">
                    <Button
                        onClick={handleSave}
                        disabled={updateBonusesMutation.isPending || !title.trim()}
                        className="min-w-[120px]"
                    >
                        {updateBonusesMutation.isPending ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        Сохранить
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default BonusesTab;
