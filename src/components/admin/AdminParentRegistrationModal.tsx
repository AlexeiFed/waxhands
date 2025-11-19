/**
 * @file: AdminParentRegistrationModal.tsx
 * @description: Модальное окно для регистрации родителя и детей администратором
 * @dependencies: Dialog, Form components, useSchools, api
 * @created: 2025-01-27
 */

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSchools } from '@/hooks/use-schools';
import { api } from '@/lib/api';
import { Plus, X, UserPlus, Users } from 'lucide-react';

interface ChildData {
    name: string;
    surname: string;
    age?: number;
    schoolId: string;
    class: string;
}

interface ParentData {
    name: string;
    surname: string;
    phone: string;
    children: ChildData[];
}

interface RegisteredParentData {
    parent: {
        id: string;
        name: string;
        surname: string;
        phone: string;
    };
    children: Array<{
        id: string;
        name: string;
        surname: string;
        age?: number;
        school_id: string;
        school_name: string;
        class: string;
    }>;
}

interface AdminParentRegistrationModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    masterClassId: string;
    schoolId?: string; // ID школы из мастер-класса
    classGroup?: string; // Класс из мастер-класса
    onSuccess: (parentData: RegisteredParentData) => void;
}

export const AdminParentRegistrationModal: React.FC<AdminParentRegistrationModalProps> = ({
    isOpen,
    onOpenChange,
    masterClassId,
    schoolId: defaultSchoolId,
    classGroup: defaultClassGroup,
    onSuccess,
}) => {
    const { toast } = useToast();
    const { schools } = useSchools();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'parent' | 'children'>('parent');

    const [parentData, setParentData] = useState<Omit<ParentData, 'children'>>({
        name: '',
        surname: '',
        phone: '',
    });

    const [children, setChildren] = useState<ChildData[]>([]);
    const [currentChild, setCurrentChild] = useState<ChildData>({
        name: '',
        surname: '',
        age: undefined,
        schoolId: defaultSchoolId || '',
        class: defaultClassGroup || '',
    });
    const [showSecondChild, setShowSecondChild] = useState(false);

    const [selectedSchoolId, setSelectedSchoolId] = useState(defaultSchoolId || '');
    const [availableClasses, setAvailableClasses] = useState<string[]>([]);

    // Обновляем доступные классы при выборе школы
    useEffect(() => {
        if (selectedSchoolId) {
            const selectedSchool = schools.find(s => s.id === selectedSchoolId);
            if (selectedSchool && selectedSchool.classes) {
                const classes = Array.from(new Set(selectedSchool.classes)).filter(Boolean);
                setAvailableClasses(classes);
            }
        } else {
            setAvailableClasses([]);
        }
    }, [selectedSchoolId, schools]);

    // Сброс формы при закрытии
    useEffect(() => {
        if (!isOpen) {
            setStep('parent');
            setParentData({ name: '', surname: '', phone: '' });
            setChildren([]);
            setCurrentChild({
                name: '',
                surname: '',
                age: undefined,
                schoolId: defaultSchoolId || '',
                class: defaultClassGroup || '',
            });
            setSelectedSchoolId(defaultSchoolId || '');
        }
    }, [isOpen, defaultSchoolId, defaultClassGroup]);

    const handleSchoolChange = (schoolId: string) => {
        setSelectedSchoolId(schoolId);
        setCurrentChild(prev => ({ ...prev, schoolId, class: '' }));
    };

    const handleAddChild = () => {
        if (!currentChild.name || !currentChild.surname || !currentChild.schoolId || !currentChild.class) {
            toast({
                title: 'Ошибка',
                description: 'Заполните все обязательные поля ребенка',
                variant: 'destructive',
            });
            return;
        }

        setChildren(prev => [...prev, currentChild]);
        setCurrentChild({
            name: '',
            surname: '',
            age: undefined,
            schoolId: defaultSchoolId || '',
            class: defaultClassGroup || '',
        });
        setSelectedSchoolId(defaultSchoolId || '');

        toast({
            title: 'Ребенок добавлен',
            description: `${currentChild.name} ${currentChild.surname} добавлен в список`,
        });
    };

    const handleAddSecondChild = () => {
        if (!currentChild.name || !currentChild.surname || !currentChild.schoolId || !currentChild.class) {
            toast({
                title: 'Ошибка',
                description: 'Заполните все обязательные поля ребенка',
                variant: 'destructive',
            });
            return;
        }

        setChildren(prev => [...prev, currentChild]);
        setCurrentChild({
            name: '',
            surname: '',
            age: undefined,
            schoolId: defaultSchoolId || '',
            class: defaultClassGroup || '',
        });
        setSelectedSchoolId(defaultSchoolId || '');
        setShowSecondChild(false);

        toast({
            title: 'Ребенок добавлен',
            description: `${currentChild.name} ${currentChild.surname} добавлен в список`,
        });
    };

    const handleRemoveChild = (index: number) => {
        setChildren(prev => prev.filter((_, i) => i !== index));
    };

    const handleNextStep = () => {
        if (!parentData.name || !parentData.surname || !parentData.phone) {
            toast({
                title: 'Ошибка',
                description: 'Заполните все поля родителя',
                variant: 'destructive',
            });
            return;
        }

        setStep('children');
    };

    const handleSubmit = async () => {
        // Собираем всех детей для регистрации
        const allChildren = [...children];

        // Если есть незаполненные поля первого ребенка, добавляем его
        if (currentChild.name && currentChild.surname && currentChild.schoolId && currentChild.class) {
            allChildren.push(currentChild);
        }

        if (allChildren.length === 0) {
            toast({
                title: 'Ошибка',
                description: 'Добавьте хотя бы одного ребенка',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);

        try {
            const requestData = {
                ...parentData,
                role: 'parent',
                children: allChildren.map(child => ({
                    ...child,
                    age: child.age || undefined,
                })),
            };

            const response = await api.post<{ success: boolean; data: RegisteredParentData; message?: string }>('/admin/register-parent', requestData);

            // ApiResponse<T> имеет структуру { success, data, error }
            if (response.success && response.data) {
                const registeredData = response.data;

                console.log('✅ Данные регистрации получены:', registeredData);

                toast({
                    title: 'Успешно! ✅',
                    description: `Родитель и ${allChildren.length} ${allChildren.length === 1 ? 'ребенок' : 'детей'} зарегистрированы`,
                });

                // Вызываем onSuccess с правильной структурой данных
                onSuccess(registeredData);

                // Закрываем модальное окно
                onOpenChange(false);
            } else {
                throw new Error(response.error || 'Некорректный ответ от сервера');
            }
        } catch (error) {
            console.error('❌ Ошибка регистрации:', error);
            const err = error as Error & { response?: { data?: { error?: string; details?: unknown } } };

            // Проверяем сообщение ошибки
            const errorMessage = err.message || err.response?.data?.error || 'Неизвестная ошибка';

            // Проверяем, если это ошибка дубликата телефона
            if (errorMessage.includes('User with this phone number already exists')) {
                toast({
                    title: 'Пользователь уже существует',
                    description: 'Родитель с таким номером телефона уже зарегистрирован в системе',
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'Ошибка регистрации',
                    description: errorMessage,
                    variant: 'destructive',
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <UserPlus className="h-6 w-6 text-primary" />
                        Регистрация родителя и детей
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'parent'
                            ? 'Шаг 1: Введите данные родителя'
                            : 'Шаг 2: Добавьте детей для записи на мастер-класс'}
                    </DialogDescription>
                </DialogHeader>

                {step === 'parent' ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="parentName">Имя родителя *</Label>
                                <Input
                                    id="parentName"
                                    value={parentData.name}
                                    onChange={(e) => setParentData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Введите имя"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="parentSurname">Фамилия родителя *</Label>
                                <Input
                                    id="parentSurname"
                                    value={parentData.surname}
                                    onChange={(e) => setParentData(prev => ({ ...prev, surname: e.target.value }))}
                                    placeholder="Введите фамилию"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="parentPhone">Телефон родителя *</Label>
                            <Input
                                id="parentPhone"
                                value={parentData.phone}
                                onChange={(e) => {
                                    let value = e.target.value;
                                    // Автоматически добавляем +7 если пользователь начинает вводить
                                    if (value && !value.startsWith('+7')) {
                                        value = '+7' + value.replace(/^\+?7?/, '');
                                    }
                                    setParentData(prev => ({ ...prev, phone: value }));
                                }}
                                onFocus={(e) => {
                                    // При фокусе добавляем +7 если поле пустое
                                    if (!e.target.value) {
                                        setParentData(prev => ({ ...prev, phone: '+7' }));
                                    }
                                }}
                                placeholder="+7 (___) ___-__-__"
                                type="tel"
                            />
                        </div>

                        <div className="flex justify-end space-x-2 pt-4">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Отмена
                            </Button>
                            <Button onClick={handleNextStep}>
                                Далее
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Список добавленных детей */}
                        {children.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        Добавленные дети ({children.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {children.map((child, index) => {
                                        const school = schools.find(s => s.id === child.schoolId);
                                        return (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                            >
                                                <div className="flex-1">
                                                    <p className="font-medium">
                                                        {child.name} {child.surname}
                                                        {child.age && <span className="text-muted-foreground ml-2">({child.age} лет)</span>}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {school?.name || 'Школа не указана'} • {child.class}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveChild(index)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-100"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        )}

                        {/* Форма добавления первого ребенка */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Данные ребенка</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="childName">Имя ребенка *</Label>
                                        <Input
                                            id="childName"
                                            value={currentChild.name}
                                            onChange={(e) => setCurrentChild(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Введите имя"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="childSurname">Фамилия ребенка *</Label>
                                        <Input
                                            id="childSurname"
                                            value={currentChild.surname}
                                            onChange={(e) => setCurrentChild(prev => ({ ...prev, surname: e.target.value }))}
                                            placeholder="Введите фамилию"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="childAge">Возраст</Label>
                                    <Input
                                        id="childAge"
                                        type="number"
                                        min="1"
                                        max="18"
                                        value={currentChild.age || ''}
                                        onChange={(e) => setCurrentChild(prev => ({ ...prev, age: parseInt(e.target.value) || undefined }))}
                                        placeholder="Введите возраст"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="childSchool">Школа/сад *</Label>
                                    <Select
                                        onValueChange={handleSchoolChange}
                                        value={selectedSchoolId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Выберите школу или сад" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(schools || []).map((school) => (
                                                <SelectItem key={school.id} value={school.id}>
                                                    <div>
                                                        <div className="font-medium">{school.name}</div>
                                                        <div className="text-sm text-gray-500">{school.address}</div>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="childClass">Класс/группа *</Label>
                                    <Select
                                        onValueChange={(value) => setCurrentChild(prev => ({ ...prev, class: value }))}
                                        value={currentChild.class}
                                        disabled={!selectedSchoolId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Выберите класс или группу" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(availableClasses || []).map((className) => (
                                                <SelectItem key={className} value={className}>
                                                    {className}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {!selectedSchoolId && (
                                        <p className="text-sm text-gray-500">Сначала выберите школу</p>
                                    )}
                                </div>

                                {!showSecondChild && children.length === 0 && (
                                    <Button
                                        onClick={() => setShowSecondChild(true)}
                                        className="w-full"
                                        variant="outline"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Добавить еще одного ребенка
                                    </Button>
                                )}
                            </CardContent>
                        </Card>

                        {/* Форма добавления второго ребенка */}
                        {showSecondChild && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Данные второго ребенка</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="child2Name">Имя ребенка *</Label>
                                            <Input
                                                id="child2Name"
                                                value={currentChild.name}
                                                onChange={(e) => setCurrentChild(prev => ({ ...prev, name: e.target.value }))}
                                                placeholder="Введите имя"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="child2Surname">Фамилия ребенка *</Label>
                                            <Input
                                                id="child2Surname"
                                                value={currentChild.surname}
                                                onChange={(e) => setCurrentChild(prev => ({ ...prev, surname: e.target.value }))}
                                                placeholder="Введите фамилию"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="child2Age">Возраст</Label>
                                        <Input
                                            id="child2Age"
                                            type="number"
                                            min="1"
                                            max="18"
                                            value={currentChild.age || ''}
                                            onChange={(e) => setCurrentChild(prev => ({ ...prev, age: parseInt(e.target.value) || undefined }))}
                                            placeholder="Введите возраст"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="child2School">Школа/сад *</Label>
                                        <Select
                                            onValueChange={handleSchoolChange}
                                            value={selectedSchoolId}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Выберите школу или сад" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(schools || []).map((school) => (
                                                    <SelectItem key={school.id} value={school.id}>
                                                        <div>
                                                            <div className="font-medium">{school.name}</div>
                                                            <div className="text-sm text-gray-500">{school.address}</div>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="child2Class">Класс/группа *</Label>
                                        <Select
                                            onValueChange={(value) => setCurrentChild(prev => ({ ...prev, class: value }))}
                                            value={currentChild.class}
                                            disabled={!selectedSchoolId}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Выберите класс или группу" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(availableClasses || []).map((className) => (
                                                    <SelectItem key={className} value={className}>
                                                        {className}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {!selectedSchoolId && (
                                            <p className="text-sm text-gray-500">Сначала выберите школу</p>
                                        )}
                                    </div>

                                    <div className="flex space-x-2">
                                        <Button
                                            onClick={handleAddSecondChild}
                                            className="flex-1"
                                            variant="outline"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Добавить ребенка
                                        </Button>
                                        <Button
                                            onClick={() => setShowSecondChild(false)}
                                            variant="outline"
                                        >
                                            Отмена
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <div className="flex justify-between space-x-2 pt-4">
                            <Button variant="outline" onClick={() => setStep('parent')}>
                                Назад
                            </Button>
                            <div className="flex space-x-2">
                                <Button variant="outline" onClick={() => onOpenChange(false)}>
                                    Отмена
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                >
                                    {loading ? 'Регистрация...' : 'Зарегистрировать'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

