/**
 * @file: child-profile-edit-modal.tsx
 * @description: Модальное окно для редактирования профиля ребенка
 * @dependencies: Dialog, Form, Input, Label, Button, useAuth, useSchools
 * @created: 2024-12-19
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useSchools } from '@/hooks/use-schools';
import { useToast } from '@/hooks/use-toast';
import { Edit, Save, X } from 'lucide-react';
import { User } from '@/types';

interface ChildProfileEditModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ChildProfileEditModal = ({ isOpen, onClose }: ChildProfileEditModalProps) => {
    const { user, updateProfile } = useAuth();
    const { schools } = useSchools();
    const { toast } = useToast();

    const [formData, setFormData] = useState<Partial<User>>({
        name: '',
        surname: '',
        age: undefined,
        schoolId: '',
        class: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [availableClasses, setAvailableClasses] = useState<string[]>([]);

    // Инициализируем форму данными пользователя
    useEffect(() => {
        if (user && isOpen) {
            setFormData({
                name: user.name || '',
                surname: user.surname || '',
                age: user.age || undefined,
                schoolId: user.schoolId || '',
                class: user.class || ''
            });

            // Если у пользователя есть schoolName, но нет schoolId, 
            // пытаемся найти школу по названию
            if (!user.schoolId && user.schoolName) {
                const school = schools.find(s => s.name === user.schoolName);
                if (school) {
                    setFormData(prev => ({ ...prev, schoolId: school.id }));
                }
            }
        }
    }, [user, isOpen, schools]);

    // Обновляем доступные классы при изменении школы
    useEffect(() => {
        if (formData.schoolId) {
            const school = schools.find(s => s.id === formData.schoolId);
            setAvailableClasses(school?.classes || []);
        }
    }, [formData.schoolId, schools]);

    const handleInputChange = (field: keyof User, value: string | number | undefined) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSchoolChange = (schoolId: string) => {
        setFormData(prev => ({ ...prev, schoolId, class: '' }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user?.id) return;

        try {
            setIsLoading(true);

            // Валидация
            if (!formData.name || !formData.age || !formData.schoolId || !formData.class) {
                toast({
                    title: "Ошибка",
                    description: "Заполните все обязательные поля",
                    variant: "destructive",
                });
                return;
            }

            if (formData.age && (formData.age < 3 || formData.age > 18)) {
                toast({
                    title: "Ошибка",
                    description: "Возраст должен быть от 3 до 18 лет",
                    variant: "destructive",
                });
                return;
            }

            console.log('📝 Submitting profile update with data:', formData);

            // Обновляем профиль
            await updateProfile(formData);

            toast({
                title: "Успешно! 🎉",
                description: "Профиль обновлен",
            });

            onClose();
        } catch (error) {
            console.error('Error updating profile:', error);
            toast({
                title: "Ошибка",
                description: "Не удалось обновить профиль",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        // Возвращаем исходные данные
        if (user) {
            setFormData({
                name: user.name || '',
                surname: user.surname || '',
                age: user.age || undefined,
                schoolId: user.schoolId || '',
                class: user.class || ''
            });
        }
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Edit className="w-5 h-5 text-orange-600" />
                        Редактировать профиль
                    </DialogTitle>
                    <DialogDescription>
                        Измените свои данные
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Имя *</Label>
                        <Input
                            id="name"
                            value={formData.name || ''}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="Введите имя"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="surname">Фамилия</Label>
                        <Input
                            id="surname"
                            value={formData.surname || ''}
                            onChange={(e) => handleInputChange('surname', e.target.value)}
                            placeholder="Введите фамилию"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="age">Возраст *</Label>
                        <Input
                            id="age"
                            type="number"
                            min="3"
                            max="18"
                            value={formData.age || ''}
                            onChange={(e) => handleInputChange('age', e.target.value ? parseInt(e.target.value) : undefined)}
                            placeholder="Введите возраст"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="school">Школа/садик *</Label>
                        <Select value={formData.schoolId || ''} onValueChange={handleSchoolChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Выберите школу/садик" />
                            </SelectTrigger>
                            <SelectContent>
                                {schools.map((school) => (
                                    <SelectItem key={school.id} value={school.id}>
                                        {school.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="class">Класс/группа *</Label>
                        <Select
                            value={formData.class || ''}
                            onValueChange={(value) => handleInputChange('class', value)}
                            disabled={!formData.schoolId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Выберите класс/группу" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableClasses.map((className) => (
                                    <SelectItem key={className} value={className}>
                                        {className}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isLoading}
                            className="flex-1"
                        >
                            <X className="w-4 h-4 mr-2" />
                            Отмена
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 bg-gradient-to-r from-orange-500 to-purple-500"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {isLoading ? 'Сохранение...' : 'Сохранить'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
