/**
 * @file: parent-profile-edit-modal.tsx
 * @description: Модальное окно для редактирования профиля родителя
 * @dependencies: Dialog, Form, Input, Label, Button, useAuth, useToast
 * @created: 2024-12-19
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Edit, Save, X, User, Phone, Mail } from 'lucide-react';
import { User as UserType } from '@/types';

interface ParentProfileEditModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ParentProfileEditModal = ({ isOpen, onClose }: ParentProfileEditModalProps) => {
    const { user, updateProfile } = useAuth();
    const { toast } = useToast();

    const [formData, setFormData] = useState<Partial<UserType>>({
        name: '',
        surname: '',
        email: '',
        phone: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    // Инициализируем форму данными пользователя
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                surname: user.surname || '',
                email: user.email || '',
                phone: user.phone || ''
            });
        }
    }, [user]);

    const handleInputChange = (field: keyof UserType, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user?.id) return;

        try {
            setIsLoading(true);

            // Валидация
            if (!formData.name) {
                toast({
                    title: "Ошибка",
                    description: "Имя обязательно для заполнения",
                    variant: "destructive",
                });
                return;
            }

            // Валидация email если он указан
            if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                toast({
                    title: "Ошибка",
                    description: "Введите корректный email адрес",
                    variant: "destructive",
                });
                return;
            }

            // Валидация телефона если он указан
            if (formData.phone && !/^\+?[\d\s\-()]+$/.test(formData.phone)) {
                toast({
                    title: "Ошибка",
                    description: "Введите корректный номер телефона",
                    variant: "destructive",
                });
                return;
            }

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
                email: user.email || '',
                phone: user.phone || ''
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
                        <Label htmlFor="name" className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Имя *
                        </Label>
                        <Input
                            id="name"
                            value={formData.name || ''}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="Введите имя"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="surname" className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Фамилия
                        </Label>
                        <Input
                            id="surname"
                            value={formData.surname || ''}
                            onChange={(e) => handleInputChange('surname', e.target.value)}
                            placeholder="Введите фамилию"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email || ''}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            placeholder="example@email.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Телефон
                        </Label>
                        <Input
                            id="phone"
                            type="tel"
                            value={formData.phone || ''}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="+7 (999) 123-45-67"
                        />
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
