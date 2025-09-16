/**
 * @file: workshop-registration-modal.tsx
 * @description: Модальное окно для записи ребенка на мастер-класс
 * @dependencies: workshop-application-modal.tsx, ui components
 * @created: 2024-12-19
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './dialog';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Separator } from './separator';
import { useWorkshopRegistrations } from '../../hooks/use-workshop-registrations';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from './use-toast';

interface CreateRegistrationData {
    workshopId: string;
    userId: string;
    style: string;
    options: string[];
    totalPrice: number;
    userName: string;
    userClass: string;
    schoolName: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    notes?: string;
}

interface WorkshopRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    workshop: {
        id: string;
        title: string;
        description: string;
        price: number;
        duration: string;
        maxParticipants: number;
        currentParticipants: number;
        date: string;
        time: string;
        location: string;
        image?: string;
        styles?: string[];
        options?: string[];
        serviceId?: string;
    };
}

export const WorkshopRegistrationModal: React.FC<WorkshopRegistrationModalProps> = ({
    isOpen,
    onClose,
    workshop,
}) => {
    const { user } = useAuth();
    const { createRegistration } = useWorkshopRegistrations();

    const [selectedStyle, setSelectedStyle] = useState<string>('');
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [notes, setNotes] = useState<string>('');
    const [step, setStep] = useState<'registration' | 'success'>('registration');
    const [registrationData, setRegistrationData] = useState<CreateRegistrationData | null>(null);

    // Доступные стили (если не указаны в мастер-классе, используем стандартные)
    const availableStyles = workshop.styles || ['Классический', 'Современный', 'Авангардный', 'Минималистичный'];

    // Доступные опции (если не указаны в мастер-классе, используем стандартные)
    const availableOptions = workshop.options || ['Материалы включены', 'Сертификат', 'Фотосессия', 'Видеозапись'];

    const handleStyleSelect = (style: string) => {
        setSelectedStyle(style);
    };

    const handleOptionToggle = (option: string) => {
        setSelectedOptions(prev =>
            prev.includes(option)
                ? prev.filter(o => o !== option)
                : [...prev, option]
        );
    };

    const calculateTotalPrice = () => {
        let total = workshop.price;

        // Добавляем стоимость опций (примерная стоимость)
        const optionPrices: { [key: string]: number } = {
            'Материалы включены': 500,
            'Сертификат': 300,
            'Фотосессия': 800,
            'Видеозапись': 1200,
        };

        selectedOptions.forEach(option => {
            total += optionPrices[option] || 0;
        });

        return total;
    };

    const handleSubmit = async () => {
        if (!selectedStyle) {
            toast({
                title: "Ошибка",
                description: "Пожалуйста, выберите стиль",
                variant: "destructive",
            });
            return;
        }

        if (!user) {
            toast({
                title: "Ошибка",
                description: "Необходимо войти в систему",
                variant: "destructive",
            });
            return;
        }

        const registrationData: CreateRegistrationData = {
            workshopId: workshop.id,
            userId: user.id,
            style: selectedStyle,
            options: selectedOptions,
            totalPrice: calculateTotalPrice(),
            userName: user.name || 'Неизвестный пользователь',
            userClass: 'Не указано',
            schoolName: 'Не указано',
            status: 'pending' as const,
            notes: notes.trim() || undefined,
        };

        try {
            await createRegistration(registrationData);
            setRegistrationData(registrationData);
            setStep('success');
        } catch (error) {
            console.error('Registration error:', error);
            toast({
                title: "Ошибка",
                description: "Не удалось записаться на мастер-класс",
                variant: "destructive",
            });
        }
    };

    const handleClose = () => {
        setStep('registration');
        setSelectedStyle('');
        setSelectedOptions([]);
        setNotes('');
        setRegistrationData(null);
        onClose();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    if (step === 'success') {
        return (
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-center text-green-600">
                            🎉 Успешно записались!
                        </DialogTitle>
                    </DialogHeader>

                    <div className="text-center space-y-4">
                        <div className="text-2xl font-bold text-primary">
                            {workshop.title}
                        </div>

                        <div className="space-y-2 text-sm text-muted-foreground">
                            <div>Дата: {formatDate(workshop.date)}</div>
                            <div>Время: {workshop.time}</div>
                            <div>Место: {workshop.location}</div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <div className="font-semibold">Выбранный стиль:</div>
                            <Badge variant="secondary">{selectedStyle}</Badge>
                        </div>

                        {(selectedOptions || []).length > 0 && (
                            <div className="space-y-2">
                                <div className="font-semibold">Дополнительные опции:</div>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {(selectedOptions || []).map(option => (
                                        <Badge key={option} variant="outline">
                                            {option}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="text-lg font-bold">
                            Итого: {calculateTotalPrice()} ₽
                        </div>

                        <div className="space-y-2">
                            <Button
                                onClick={handleClose}
                                className="w-full"
                                variant="outline"
                            >
                                Закрыть
                            </Button>
                            <Button
                                className="w-full bg-green-600 hover:bg-green-700"
                                onClick={() => {
                                    // TODO: Интеграция с платежной системой
                                    toast({
                                        title: "Оплата",
                                        description: "Функция оплаты будет доступна в ближайшее время",
                                    });
                                }}
                            >
                                💳 Оплатить
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-orange-600">
                        Регистрация на мастер-класс
                    </DialogTitle>
                    <DialogDescription className="text-gray-600">
                        Заполните форму для регистрации на мастер-класс
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Информация о мастер-классе */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">{workshop.title}</CardTitle>
                            <CardDescription>{workshop.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-semibold">Дата:</span> {formatDate(workshop.date)}
                                </div>
                                <div>
                                    <span className="font-semibold">Время:</span> {workshop.time}
                                </div>
                                <div>
                                    <span className="font-semibold">Место:</span> {workshop.location}
                                </div>
                                <div>
                                    <span className="font-semibold">Длительность:</span> {workshop.duration}
                                </div>
                                <div>
                                    <span className="font-semibold">Участники:</span> {workshop.currentParticipants}/{workshop.maxParticipants}
                                </div>
                                <div>
                                    <span className="font-semibold">Базовая цена:</span> {workshop.price} ₽
                                </div>
                            </div>

                            {workshop.image && (
                                <div className="mt-4">
                                    <img
                                        src={workshop.image}
                                        alt={workshop.title}
                                        className="w-full h-48 object-cover rounded-lg"
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Выбор стиля */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Выберите свой стиль</CardTitle>
                            <CardDescription>
                                Выберите стиль, в котором хотите работать на мастер-классе
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-3">
                                {availableStyles.map(style => (
                                    <Button
                                        key={style}
                                        variant={selectedStyle === style ? "default" : "outline"}
                                        onClick={() => handleStyleSelect(style)}
                                        className="h-16 text-sm"
                                    >
                                        {style}
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Дополнительные опции */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Дополнительные опции</CardTitle>
                            <CardDescription>
                                Выберите дополнительные услуги (необязательно)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {availableOptions.map(option => (
                                    <div key={option} className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            id={option}
                                            checked={selectedOptions.includes(option)}
                                            onChange={() => handleOptionToggle(option)}
                                            className="w-4 h-4 text-primary"
                                        />
                                        <label htmlFor={option} className="text-sm font-medium">
                                            {option}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Итоговая стоимость */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Итоговая стоимость</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Базовая цена:</span>
                                    <span>{workshop.price} ₽</span>
                                </div>
                                {(selectedOptions || []).length > 0 && (
                                    <>
                                        <Separator />
                                        {(selectedOptions || []).map(option => {
                                            const optionPrices: { [key: string]: number } = {
                                                'Материалы включены': 500,
                                                'Сертификат': 300,
                                                'Фотосессия': 800,
                                                'Видеозапись': 1200,
                                            };
                                            return (
                                                <div key={option} className="flex justify-between text-sm">
                                                    <span>{option}:</span>
                                                    <span>+{optionPrices[option] || 0} ₽</span>
                                                </div>
                                            );
                                        })}
                                    </>
                                )}
                                <Separator />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Итого:</span>
                                    <span>{calculateTotalPrice()} ₽</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Примечания к заказу */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Примечания к заказу</CardTitle>
                            <CardDescription>
                                Опишите, как вы хотите украсить ручку или добавьте особые пожелания
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Например: Хочу добавить блестки, сделать ручку в виде цветка..."
                                className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                maxLength={500}
                            />
                            <div className="text-right text-sm text-gray-500 mt-1">
                                {notes.length}/500 символов
                            </div>
                        </CardContent>
                    </Card>

                    {/* Кнопки действий */}
                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={handleClose}>
                            Отмена
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={!selectedStyle}
                            className="min-w-[150px]"
                        >
                            Записаться на мастер-класс
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
