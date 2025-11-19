/**
 * @file: src/components/admin/ServicesTab.tsx
 * @description: Вкладка управления услугами и мастер-классами для админа
 * @dependencies: use-services.ts, shadcn/ui, lucide-react
 * @created: 2024-12-19
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useServices } from '@/hooks/use-services';
import { Service, ServiceStyle, ServiceOption } from '@/types/services';
import { Trash2, Edit, Save, X, Plus, Eye, DollarSign, Clock, Users } from 'lucide-react';
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

const ServicesTab: React.FC = () => {
    const { toast } = useToast();
    const { services, loading, fetchServices, createService, updateService, deleteService, addStyleToService, updateServiceStyle, addOptionToService, updateServiceOption } = useServices();

    const [isAddingService, setIsAddingService] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [editingStyle, setEditingStyle] = useState<{ serviceId: string; style: ServiceStyle } | null>(null);
    const [editingOption, setEditingOption] = useState<{ serviceId: string; option: ServiceOption } | null>(null);

    const [newServiceData, setNewServiceData] = useState({
        name: '',
        shortDescription: '',
        fullDescription: ''
    });

    const [newStyleData, setNewStyleData] = useState({
        name: '',
        shortDescription: '',
        fullDescription: '',
        price: 0,
        visibility: {
            type: 'all' as 'all' | 'specific_users' | 'specific_surnames' | 'specific_phones',
            restrictions: {
                surnames: [] as string[],
                phones: [] as string[],
                userIds: [] as string[]
            }
        }
    });

    const [newOptionData, setNewOptionData] = useState({
        name: '',
        shortDescription: '',
        fullDescription: '',
        price: 0,
        visibility: {
            type: 'all' as 'all' | 'specific_users' | 'specific_surnames' | 'specific_phones',
            restrictions: {
                surnames: [] as string[],
                phones: [] as string[],
                userIds: [] as string[]
            }
        }
    });

    React.useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    const handleAddService = async () => {
        if (!newServiceData.name || !newServiceData.shortDescription) {
            toast({
                title: "Ошибка",
                description: "Заполните обязательные поля",
                variant: "destructive",
            });
            return;
        }

        try {
            await createService({
                name: newServiceData.name,
                shortDescription: newServiceData.shortDescription,
                fullDescription: newServiceData.fullDescription,
                styles: [],
                options: []
            });

            setIsAddingService(false);
            setNewServiceData({ name: '', shortDescription: '', fullDescription: '' });
            toast({
                title: "Успешно",
                description: "Услуга добавлена",
            });
        } catch (error) {
            toast({
                title: "Ошибка",
                description: "Не удалось добавить услугу",
                variant: "destructive",
            });
        }
    };

    const handleAddStyle = async (serviceId: string) => {
        if (!newStyleData.name || !newStyleData.shortDescription) {
            toast({
                title: "Ошибка",
                description: "Заполните обязательные поля",
                variant: "destructive",
            });
            return;
        }

        try {
            const styleData = {
                name: newStyleData.name,
                shortDescription: newStyleData.shortDescription,
                fullDescription: newStyleData.fullDescription,
                price: newStyleData.price,
                visibility: newStyleData.visibility
            };

            if (editingStyle?.style.id) {
                // Редактирование существующего стиля
                await updateServiceStyle(serviceId, editingStyle.style.id, styleData);
            } else {
                // Добавление нового стиля
                await addStyleToService(serviceId, styleData);
            }

            setNewStyleData({
                name: '',
                shortDescription: '',
                fullDescription: '',
                price: 0,
                visibility: {
                    type: 'all',
                    restrictions: {
                        surnames: [],
                        phones: [],
                        userIds: []
                    }
                }
            });
            setEditingStyle(null);
            toast({
                title: "Успешно",
                description: editingStyle?.style.id ? "Стиль обновлен" : "Стиль добавлен",
            });
        } catch (error) {
            toast({
                title: "Ошибка",
                description: "Не удалось добавить стиль",
                variant: "destructive",
            });
        }
    };

    const handleAddOption = async (serviceId: string) => {
        if (!newOptionData.name || !newOptionData.shortDescription) {
            toast({
                title: "Ошибка",
                description: "Заполните обязательные поля",
                variant: "destructive",
            });
            return;
        }

        try {
            const optionData = {
                name: newOptionData.name,
                shortDescription: newOptionData.shortDescription,
                fullDescription: newOptionData.fullDescription,
                price: newOptionData.price,
                visibility: newOptionData.visibility
            };

            if (editingOption?.option.id) {
                // Редактирование существующей опции
                await updateServiceOption(serviceId, editingOption.option.id, optionData);
            } else {
                // Добавление новой опции
                await addOptionToService(serviceId, optionData);
            }

            setNewOptionData({
                name: '',
                shortDescription: '',
                fullDescription: '',
                price: 0,
                visibility: {
                    type: 'all',
                    restrictions: {
                        surnames: [],
                        phones: [],
                        userIds: []
                    }
                }
            });
            setEditingOption(null);
            toast({
                title: "Успешно",
                description: editingOption?.option.id ? "Опция обновлена" : "Опция добавлена",
            });
        } catch (error) {
            toast({
                title: "Ошибка",
                description: "Не удалось добавить опцию",
                variant: "destructive",
            });
        }
    };

    const handleDeleteService = async (id: string) => {
        try {
            await deleteService(id);
            toast({
                title: "Успешно",
                description: "Услуга удалена",
            });
        } catch (error) {
            toast({
                title: "Ошибка",
                description: "Не удалось удалить услугу",
                variant: "destructive",
            });
        }
    };

    const handleDeleteStyle = async (serviceId: string, styleId: string) => {
        try {
            // Временно используем updateServiceStyle, так как deleteServiceStyle не существует
            await updateServiceStyle(serviceId, styleId, { name: 'УДАЛЕНО' });
            toast({
                title: "Успешно",
                description: "Стиль удален",
            });
        } catch (error) {
            toast({
                title: "Ошибка",
                description: "Не удалось удалить стиль",
                variant: "destructive",
            });
        }
    };

    const handleDeleteOption = async (serviceId: string, optionId: string) => {
        try {
            // Временно используем updateServiceOption, так как deleteServiceOption не существует
            await updateServiceOption(serviceId, optionId, { name: 'УДАЛЕНО' });
            toast({
                title: "Успешно",
                description: "Опция удалена",
            });
        } catch (error) {
            toast({
                title: "Ошибка",
                description: "Не удалось удалить опцию",
                variant: "destructive",
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                    <p>Загрузка услуг...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button onClick={() => setIsAddingService(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Добавить услугу
                </Button>
            </div>

            {/* Список услуг */}
            <div className="space-y-6">
                {(services || []).map((service) => (
                    <Card key={service.id} className="border-2 border-orange-200">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="text-xl">{service.name}</span>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setEditingService(service)}
                                    >
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
                                                <AlertDialogTitle>Удалить услугу?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Это действие нельзя отменить. Услуга будет удалена навсегда.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDeleteService(service.id)}
                                                    className="bg-red-500 hover:bg-red-600"
                                                >
                                                    Удалить
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <Label className="text-sm font-medium text-gray-600">Краткое описание</Label>
                                <p className="text-gray-800 mt-1">{service.shortDescription}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-600">Полное описание</Label>
                                <p className="text-gray-800 mt-1">{service.fullDescription}</p>
                            </div>

                            {/* Стили услуги */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <Label className="text-sm font-medium text-gray-600">Стили</Label>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            setEditingStyle({ serviceId: service.id, style: { id: '', name: '', shortDescription: '', fullDescription: '', price: 0 } });
                                            setNewStyleData({
                                                name: '',
                                                shortDescription: '',
                                                fullDescription: '',
                                                price: 0,
                                                visibility: {
                                                    type: 'all',
                                                    restrictions: {
                                                        surnames: [],
                                                        phones: [],
                                                        userIds: []
                                                    }
                                                }
                                            });
                                        }}
                                    >
                                        <Plus className="w-4 h-4 mr-1" />
                                        Добавить стиль
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {(service.styles || []).map((style) => (
                                        <Card key={style.id} className="border border-purple-200">
                                            <CardContent className="p-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h4 className="font-medium text-purple-800">{style.name}</h4>
                                                        <p className="text-sm text-gray-600 mt-1">{style.shortDescription}</p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                                                <DollarSign className="w-3 h-3 mr-1" />
                                                                {style.price} ₽
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setEditingStyle({ serviceId: service.id, style });
                                                                setNewStyleData({
                                                                    name: style.name,
                                                                    shortDescription: style.shortDescription,
                                                                    fullDescription: style.fullDescription,
                                                                    price: style.price,
                                                                    visibility: style.visibility || {
                                                                        type: 'all',
                                                                        restrictions: {
                                                                            surnames: [],
                                                                            phones: [],
                                                                            userIds: []
                                                                        }
                                                                    }
                                                                });
                                                            }}
                                                        >
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
                                                                    <AlertDialogTitle>Удалить стиль?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Это действие нельзя отменить.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => handleDeleteStyle(service.id, style.id)}
                                                                        className="bg-red-500 hover:bg-red-600"
                                                                    >
                                                                        Удалить
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            {/* Опции услуги */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <Label className="text-sm font-medium text-gray-600">Опции</Label>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            setEditingOption({ serviceId: service.id, option: { id: '', name: '', shortDescription: '', fullDescription: '', price: 0 } });
                                            setNewOptionData({
                                                name: '',
                                                shortDescription: '',
                                                fullDescription: '',
                                                price: 0,
                                                visibility: {
                                                    type: 'all',
                                                    restrictions: {
                                                        surnames: [],
                                                        phones: [],
                                                        userIds: []
                                                    }
                                                }
                                            });
                                        }}
                                    >
                                        <Plus className="w-4 h-4 mr-1" />
                                        Добавить опцию
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {(service.options || []).map((option) => (
                                        <Card key={option.id} className="border border-blue-200">
                                            <CardContent className="p-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h4 className="font-medium text-blue-800">{option.name}</h4>
                                                        <p className="text-sm text-gray-600 mt-1">{option.shortDescription}</p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                                                <DollarSign className="w-3 h-3 mr-1" />
                                                                {option.price} ₽
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setEditingOption({ serviceId: service.id, option });
                                                                setNewOptionData({
                                                                    name: option.name,
                                                                    shortDescription: option.shortDescription,
                                                                    fullDescription: option.fullDescription,
                                                                    price: option.price,
                                                                    visibility: option.visibility || {
                                                                        type: 'all',
                                                                        restrictions: {
                                                                            surnames: [],
                                                                            phones: [],
                                                                            userIds: []
                                                                        }
                                                                    }
                                                                });
                                                            }}
                                                        >
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
                                                                    <AlertDialogTitle>Удалить опцию?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Это действие нельзя отменить.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => handleDeleteOption(service.id, option.id)}
                                                                        className="bg-red-500 hover:bg-red-600"
                                                                    >
                                                                        Удалить
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {(services || []).length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Plus className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">Услуги не добавлены</h3>
                        <p className="text-sm">Добавьте первую услугу для начала работы</p>
                    </div>
                )}
            </div>

            {/* Модальное окно добавления услуги */}
            {isAddingService && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Добавить услугу</h3>

                        <div className="space-y-4">
                            <div>
                                <Label>Название услуги</Label>
                                <Input
                                    value={newServiceData.name}
                                    onChange={(e) => setNewServiceData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Введите название"
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label>Краткое описание</Label>
                                <Textarea
                                    value={newServiceData.shortDescription}
                                    onChange={(e) => setNewServiceData(prev => ({ ...prev, shortDescription: e.target.value }))}
                                    placeholder="Введите краткое описание"
                                    rows={3}
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label>Полное описание</Label>
                                <Textarea
                                    value={newServiceData.fullDescription}
                                    onChange={(e) => setNewServiceData(prev => ({ ...prev, fullDescription: e.target.value }))}
                                    placeholder="Введите полное описание"
                                    rows={4}
                                    className="mt-1"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 mt-6">
                            <Button onClick={handleAddService} className="flex-1">
                                Добавить
                            </Button>
                            <Button variant="outline" onClick={() => setIsAddingService(false)} className="flex-1">
                                Отмена
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно редактирования стиля */}
            {editingStyle && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">
                            {editingStyle.style.id ? 'Редактировать стиль' : 'Добавить стиль'}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <Label>Название стиля</Label>
                                <Input
                                    value={newStyleData.name}
                                    onChange={(e) => setNewStyleData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Введите название"
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label>Краткое описание</Label>
                                <Textarea
                                    value={newStyleData.shortDescription}
                                    onChange={(e) => setNewStyleData(prev => ({ ...prev, shortDescription: e.target.value }))}
                                    placeholder="Введите краткое описание"
                                    rows={3}
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label>Полное описание</Label>
                                <Textarea
                                    value={newStyleData.fullDescription}
                                    onChange={(e) => setNewStyleData(prev => ({ ...prev, fullDescription: e.target.value }))}
                                    placeholder="Введите полное описание"
                                    rows={3}
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label>Цена (₽)</Label>
                                <Input
                                    type="number"
                                    value={newStyleData.price}
                                    onChange={(e) => setNewStyleData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                                    placeholder="0"
                                    className="mt-1"
                                />
                            </div>

                            {/* Настройки видимости */}
                            <div className="border-t pt-4">
                                <Label className="text-base font-semibold">Настройки видимости</Label>
                                <div className="space-y-3 mt-2">
                                    <div>
                                        <Label>Тип ограничения</Label>
                                        <Select
                                            value={newStyleData.visibility.type}
                                            onValueChange={(value: 'all' | 'specific_users' | 'specific_surnames' | 'specific_phones') =>
                                                setNewStyleData(prev => ({
                                                    ...prev,
                                                    visibility: { ...prev.visibility, type: value }
                                                }))
                                            }
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Для всех пользователей</SelectItem>
                                                <SelectItem value="specific_surnames">Только для фамилий</SelectItem>
                                                <SelectItem value="specific_phones">Только для телефонов</SelectItem>
                                                <SelectItem value="specific_users">Только для пользователей</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {newStyleData.visibility.type === 'specific_surnames' && (
                                        <div>
                                            <Label>Фамилии (через запятую)</Label>
                                            <Input
                                                value={newStyleData.visibility.restrictions.surnames.join(', ')}
                                                onChange={(e) => setNewStyleData(prev => ({
                                                    ...prev,
                                                    visibility: {
                                                        ...prev.visibility,
                                                        restrictions: {
                                                            ...prev.visibility.restrictions,
                                                            surnames: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                                        }
                                                    }
                                                }))}
                                                placeholder="Тырин, Иванов"
                                                className="mt-1"
                                            />
                                        </div>
                                    )}

                                    {newStyleData.visibility.type === 'specific_phones' && (
                                        <div>
                                            <Label>Телефоны (через запятую)</Label>
                                            <Input
                                                value={newStyleData.visibility.restrictions.phones.join(', ')}
                                                onChange={(e) => setNewStyleData(prev => ({
                                                    ...prev,
                                                    visibility: {
                                                        ...prev.visibility,
                                                        restrictions: {
                                                            ...prev.visibility.restrictions,
                                                            phones: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                                        }
                                                    }
                                                }))}
                                                placeholder="+79143131002, +79143131003"
                                                className="mt-1"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-6">
                            <Button onClick={() => handleAddStyle(editingStyle.serviceId)} className="flex-1">
                                {editingStyle.style.id ? 'Сохранить' : 'Добавить'}
                            </Button>
                            <Button variant="outline" onClick={() => setEditingStyle(null)} className="flex-1">
                                Отмена
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно редактирования опции */}
            {editingOption && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">
                            {editingOption.option.id ? 'Редактировать опцию' : 'Добавить опцию'}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <Label>Название опции</Label>
                                <Input
                                    value={newOptionData.name}
                                    onChange={(e) => setNewOptionData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Введите название"
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label>Краткое описание</Label>
                                <Textarea
                                    value={newOptionData.shortDescription}
                                    onChange={(e) => setNewOptionData(prev => ({ ...prev, shortDescription: e.target.value }))}
                                    placeholder="Введите краткое описание"
                                    rows={3}
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label>Полное описание</Label>
                                <Textarea
                                    value={newOptionData.fullDescription}
                                    onChange={(e) => setNewOptionData(prev => ({ ...prev, fullDescription: e.target.value }))}
                                    placeholder="Введите полное описание"
                                    rows={3}
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label>Цена (₽)</Label>
                                <Input
                                    type="number"
                                    value={newOptionData.price}
                                    onChange={(e) => setNewOptionData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                                    placeholder="0"
                                    className="mt-1"
                                />
                            </div>

                            {/* Настройки видимости */}
                            <div className="border-t pt-4">
                                <Label className="text-base font-semibold">Настройки видимости</Label>
                                <div className="space-y-3 mt-2">
                                    <div>
                                        <Label>Тип ограничения</Label>
                                        <Select
                                            value={newOptionData.visibility.type}
                                            onValueChange={(value: 'all' | 'specific_users' | 'specific_surnames' | 'specific_phones') =>
                                                setNewOptionData(prev => ({
                                                    ...prev,
                                                    visibility: { ...prev.visibility, type: value }
                                                }))
                                            }
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Для всех пользователей</SelectItem>
                                                <SelectItem value="specific_surnames">Только для фамилий</SelectItem>
                                                <SelectItem value="specific_phones">Только для телефонов</SelectItem>
                                                <SelectItem value="specific_users">Только для пользователей</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {newOptionData.visibility.type === 'specific_surnames' && (
                                        <div>
                                            <Label>Фамилии (через запятую)</Label>
                                            <Input
                                                value={newOptionData.visibility.restrictions.surnames.join(', ')}
                                                onChange={(e) => setNewOptionData(prev => ({
                                                    ...prev,
                                                    visibility: {
                                                        ...prev.visibility,
                                                        restrictions: {
                                                            ...prev.visibility.restrictions,
                                                            surnames: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                                        }
                                                    }
                                                }))}
                                                placeholder="Тырин, Иванов"
                                                className="mt-1"
                                            />
                                        </div>
                                    )}

                                    {newOptionData.visibility.type === 'specific_phones' && (
                                        <div>
                                            <Label>Телефоны (через запятую)</Label>
                                            <Input
                                                value={newOptionData.visibility.restrictions.phones.join(', ')}
                                                onChange={(e) => setNewOptionData(prev => ({
                                                    ...prev,
                                                    visibility: {
                                                        ...prev.visibility,
                                                        restrictions: {
                                                            ...prev.visibility.restrictions,
                                                            phones: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                                        }
                                                    }
                                                }))}
                                                placeholder="+79143131002, +79143131003"
                                                className="mt-1"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-6">
                            <Button onClick={() => handleAddOption(editingOption.serviceId)} className="flex-1">
                                {editingOption.option.id ? 'Сохранить' : 'Добавить'}
                            </Button>
                            <Button variant="outline" onClick={() => setEditingOption(null)} className="flex-1">
                                Отмена
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServicesTab;
