/**
 * @file: workshop-application-modal.tsx
 * @description: Модальное окно для записи ребенка на мастер-класс с выбором стилей и опций
 * @dependencies: Dialog, Card, Button, Checkbox, useAuth, useServices
 * @created: 2025-08-10
 */
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useServices } from '@/hooks/use-services';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import {
    Calendar,
    Clock,
    MapPin,
    Users,
    Palette,
    Sparkles,
    CheckCircle,
    CreditCard
} from 'lucide-react';

interface WorkshopCardData {
    id: string;
    title: string;
    date: string;
    time: string;
    classGroup: string;
    schoolName?: string;
}

interface WorkshopApplicationModalProps {
    workshop: WorkshopCardData;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

interface SelectedOptions {
    styles: string[];
    options: string[];
}

const WorkshopApplicationModal = ({ workshop, isOpen, onOpenChange }: WorkshopApplicationModalProps) => {
    const { user } = useAuth();
    const { services } = useServices();
    const { toast } = useToast();

    const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({ styles: [], options: [] });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [currentService, setCurrentService] = useState<any>(null);
    const [totalAmount, setTotalAmount] = useState(0);

    // Находим сервис для текущего мастер-класса
    useEffect(() => {
        if (workshop && services.length > 0) {
            // Ищем сервис по названию мастер-класса
            const service = services.find(s => s.name === workshop.title);
            setCurrentService(service);
        }
    }, [workshop, services]);

    // Вычисляем общую стоимость
    useEffect(() => {
        if (!currentService) return;

        let total = 0;

        // Добавляем стоимость выбранных стилей
        selectedOptions.styles.forEach(styleId => {
            const style = currentService.styles.find((s: any) => s.id === styleId);
            if (style) total += style.price;
        });

        // Добавляем стоимость выбранных опций
        selectedOptions.options.forEach(optionId => {
            const option = currentService.options.find((o: any) => o.id === optionId);
            if (option) total += option.price;
        });

        setTotalAmount(total);
    }, [selectedOptions, currentService]);

    const handleStyleToggle = (styleId: string) => {
        setSelectedOptions(prev => ({
            ...prev,
            styles: prev.styles.includes(styleId)
                ? prev.styles.filter(id => id !== styleId)
                : [...prev.styles, styleId]
        }));
    };

    const handleOptionToggle = (optionId: string) => {
        setSelectedOptions(prev => ({
            ...prev,
            options: prev.options.includes(optionId)
                ? prev.options.filter(id => id !== optionId)
                : [...prev.options, optionId]
        }));
    };

    const handleSubmit = async () => {
        if (selectedOptions.styles.length === 0) {
            toast({
                title: "Выберите стиль!",
                description: "Необходимо выбрать хотя бы один стиль для участия",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);

        try {
            // Создаем участника мастер-класса
            const participantData = {
                childId: user?.id,
                childName: user?.name,
                parentId: user?.id, // Временно, потом нужно получить ID родителя
                parentName: user?.name, // Временно
                selectedStyles: selectedOptions.styles,
                selectedOptions: selectedOptions.options,
                totalAmount: totalAmount,
                isPaid: false
            };

            // Здесь должен быть API вызов для добавления участника
            // await api.masterClassEvents.addParticipant(workshop.id, participantData);

            console.log('Participant data:', participantData);

            // Показываем успешное сообщение
            setIsSuccess(true);

            toast({
                title: "Успешно записались! 🎉",
                description: "Вы записались на мастер-класс",
            });

        } catch (error) {
            console.error('Error submitting application:', error);
            toast({
                title: "Ошибка записи",
                description: "Не удалось записаться на мастер-класс. Попробуйте еще раз.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePayment = () => {
        // Здесь будет логика оплаты
        toast({
            title: "Оплата",
            description: "Функция оплаты будет доступна позже",
        });
    };

    if (isSuccess) {
        return (
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-md">
                    <DialogHeader className="text-center">
                        <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <DialogTitle className="text-xl">Вы успешно записались! 🎉</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 text-center">
                        <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">
                                Мастер-класс: <strong>{workshop.title}</strong>
                            </p>
                            <p className="text-sm text-gray-600">
                                Дата: <strong>{new Date(workshop.date).toLocaleDateString('ru-RU')}</strong>
                            </p>
                            <p className="text-sm text-gray-600">
                                Время: <strong>{workshop.time}</strong>
                            </p>
                        </div>

                        <Button
                            onClick={handlePayment}
                            className="w-full bg-gradient-to-r from-orange-500 to-purple-500 text-white"
                        >
                            <CreditCard className="w-4 h-4 mr-2" />
                            Оплатить
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="w-full"
                        >
                            Закрыть
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-orange-600">
                        Заявка на участие в мастер-классе
                    </DialogTitle>
                    <DialogDescription className="text-gray-600">
                        Заполните форму для регистрации вашего ребенка на мастер-класс
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Информация о мастер-классе */}
                    <Card className="bg-gradient-to-r from-orange-50 to-purple-50 border-orange-200">
                        <CardHeader>
                            <CardTitle className="text-lg text-orange-600">{workshop.title}</CardTitle>
                            <CardDescription>Информация о мастер-классе</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-500" />
                                    <span>{workshop.schoolName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-gray-500" />
                                    <span>Класс: {workshop.classGroup}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    <span>{new Date(workshop.date).toLocaleDateString('ru-RU')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-500" />
                                    <span>{workshop.time}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Выбор стилей */}
                    {currentService && (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Palette className="w-5 h-5 text-purple-600" />
                                        Выберите свой стиль
                                    </CardTitle>
                                    <CardDescription>
                                        Выберите один или несколько стилей для вашей восковой ручки
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {currentService.styles.map((style: any) => (
                                        <div key={style.id} className="flex items-center space-x-3">
                                            <Checkbox
                                                id={`style-${style.id}`}
                                                checked={selectedOptions.styles.includes(style.id)}
                                                onCheckedChange={() => handleStyleToggle(style.id)}
                                            />
                                            <label
                                                htmlFor={`style-${style.id}`}
                                                className="flex-1 cursor-pointer"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium">{style.name}</span>
                                                    <Badge variant="secondary">{style.price} ₽</Badge>
                                                </div>
                                                <p className="text-sm text-gray-600">{style.shortDescription}</p>
                                            </label>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Выбор опций */}
                            {currentService.options.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-blue-600" />
                                            Дополнительные опции
                                        </CardTitle>
                                        <CardDescription>
                                            Выберите дополнительные опции для украшения
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {currentService.options.map((option: any) => (
                                            <div key={option.id} className="flex items-center space-x-3">
                                                <Checkbox
                                                    id={`option-${option.id}`}
                                                    checked={selectedOptions.options.includes(option.id)}
                                                    onCheckedChange={() => handleOptionToggle(option.id)}
                                                />
                                                <label
                                                    htmlFor={`option-${option.id}`}
                                                    className="flex-1 cursor-pointer"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium">{option.name}</span>
                                                        <Badge variant="secondary">{option.price} ₽</Badge>
                                                    </div>
                                                    <p className="text-sm text-gray-600">{option.shortDescription}</p>
                                                </label>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Итоговая стоимость */}
                            <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                                <CardHeader>
                                    <CardTitle className="text-lg text-green-700">Итоговая стоимость</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-700 text-center">
                                        {totalAmount} ₽
                                    </div>
                                    <p className="text-sm text-gray-600 text-center mt-2">
                                        {selectedOptions.styles.length > 0
                                            ? `Выбрано стилей: ${selectedOptions.styles.length}`
                                            : 'Выберите стиль для участия'
                                        }
                                    </p>
                                </CardContent>
                            </Card>
                        </>
                    )}

                    {/* Кнопки действий */}
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                        >
                            Отмена
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || selectedOptions.styles.length === 0}
                            className="flex-1 bg-gradient-to-r from-orange-500 to-purple-500 text-white"
                        >
                            {isSubmitting ? (
                                <>Записываемся...</>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Записаться на мастер-класс
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default WorkshopApplicationModal; 