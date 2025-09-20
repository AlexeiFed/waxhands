/**
 * @file: order-details-modal.tsx
 * @description: Модальное окно для отображения деталей заказа с выбранными стилями и опциями
 * @dependencies: Dialog, Card, Button, useAuth, useServices, YandexPaymentButton
 * @created: 2024-12-19
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useServices } from '@/hooks/use-services';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { RobokassaPayment } from '@/components/payment/RobokassaPayment';
import { Service, ServiceStyle, ServiceOption, Invoice } from '@/types';
import {
    Calendar,
    Clock,
    MapPin,
    Users,
    Palette,
    Sparkles,
    CheckCircle,
    AlertCircle,
    CreditCard,
    Baby,
    X,
    Edit3,
    Save,
    Plus,
    Minus
} from 'lucide-react';

interface WorkshopCardData {
    id: string;
    title: string;
    date: string;
    time: string;
    classGroup: string;
    schoolName: string;
    city: string;
    children: string[];
    invoiceId?: string;
    schoolId: string;
    serviceId: string;
    childrenWithStatus: Array<{
        childId: string;
        childName: string;
        invoice?: Invoice;
    }>;
}

interface OrderDetailsModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    workshop: WorkshopCardData | null;
}

export default function OrderDetailsModal({ isOpen, onOpenChange, workshop }: OrderDetailsModalProps) {
    const { user } = useAuth();
    const { services } = useServices();
    const { toast } = useToast();
    const [currentService, setCurrentService] = useState<Service | null>(null);

    // Состояние для редактирования заказа
    const [isEditing, setIsEditing] = useState(false);
    const [editingChildId, setEditingChildId] = useState<string | null>(null);
    const [editedStyles, setEditedStyles] = useState<Array<{ id: string; name: string; price: number; quantity: number }>>([]);
    const [editedOptions, setEditedOptions] = useState<Array<{ id: string; name: string; price: number; quantity: number }>>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Поиск сервиса по названию мастер-класса
    useEffect(() => {
        if (workshop && services) {
            const service = services.find(s => s.id === workshop.serviceId);
            setCurrentService(service || null);
        }
    }, [workshop, services]);

    if (!workshop || !currentService) return null;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (timeString: string) => {
        return timeString.slice(0, 5); // Убираем секунды
    };

    const getStyleDescription = (styleName: string) => {
        const descriptions: { [key: string]: string } = {
            'Обычная ручка': 'Классическая восковая ручка в одном цвете',
            'Двойная ручка': 'Две ручки в разных цветах, соединенные вместе',
            'Светящаяся ручка': 'Ручка со встроенным светодиодом',
            'Двойная светящаяся ручка': 'Две светящиеся ручки в разных цветах'
        };
        return descriptions[styleName] || 'Описание стиля';
    };

    const getOptionDescription = (optionName: string) => {
        const descriptions: { [key: string]: string } = {
            'Дополнительные материалы': 'Дополнительные восковые палочки и инструменты',
            'Подарочная упаковка': 'Красивая подарочная коробка для ручки',
            'Инструкция по уходу': 'Подробная инструкция по уходу за восковой ручкой',
            'Сертификат участника': 'Персональный сертификат об участии в мастер-классе'
        };
        return descriptions[optionName] || 'Описание опции';
    };

    const getUnpaidInvoices = () => {
        return (workshop.childrenWithStatus || [])
            .filter(child => child.invoice && child.invoice.status === 'pending')
            .map(child => child.invoice)
            .filter(Boolean) as Invoice[];
    };

    const unpaidInvoices = getUnpaidInvoices();

    // Функции для редактирования заказа
    const startEditing = (childId: string) => {
        const child = workshop.childrenWithStatus.find(c => c.childId === childId);
        if (!child?.invoice) return;

        setEditingChildId(childId);
        setIsEditing(true);

        // Инициализируем данные для редактирования
        const stylesWithQuantity = child.invoice.selected_styles.reduce((acc, style) => {
            const existing = acc.find(s => s.id === style.id);
            if (existing) {
                existing.quantity += 1;
            } else {
                acc.push({ ...style, quantity: 1 });
            }
            return acc;
        }, [] as Array<{ id: string; name: string; price: number; quantity: number }>);

        const optionsWithQuantity = child.invoice.selected_options.reduce((acc, option) => {
            const existing = acc.find(o => o.id === option.id);
            if (existing) {
                existing.quantity += 1;
            } else {
                acc.push({ ...option, quantity: 1 });
            }
            return acc;
        }, [] as Array<{ id: string; name: string; price: number; quantity: number }>);

        setEditedStyles(stylesWithQuantity);
        setEditedOptions(optionsWithQuantity);
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setEditingChildId(null);
        setEditedStyles([]);
        setEditedOptions([]);
    };

    const updateStyleQuantity = (styleId: string, quantity: number) => {
        if (quantity <= 0) {
            setEditedStyles(prev => prev.filter(s => s.id !== styleId));
        } else {
            setEditedStyles(prev => prev.map(s => s.id === styleId ? { ...s, quantity } : s));
        }
    };

    const updateOptionQuantity = (optionId: string, quantity: number) => {
        if (quantity <= 0) {
            setEditedOptions(prev => prev.filter(o => o.id !== optionId));
        } else {
            setEditedOptions(prev => prev.map(o => o.id === optionId ? { ...o, quantity } : o));
        }
    };

    const addStyle = (style: ServiceStyle) => {
        const existing = editedStyles.find(s => s.id === style.id);
        if (existing) {
            updateStyleQuantity(style.id, existing.quantity + 1);
        } else {
            setEditedStyles(prev => [...prev, { ...style, quantity: 1 }]);
        }
    };

    const addOption = (option: ServiceOption) => {
        const existing = editedOptions.find(o => o.id === option.id);
        if (existing) {
            updateOptionQuantity(option.id, existing.quantity + 1);
        } else {
            setEditedOptions(prev => [...prev, { ...option, quantity: 1 }]);
        }
    };

    const saveChanges = async () => {
        if (!editingChildId || !workshop) return;

        setIsSaving(true);
        try {
            // Подготавливаем данные для обновления
            const updatedStyles = editedStyles.flatMap(style =>
                Array(style.quantity).fill(0).map(() => ({
                    id: style.id,
                    name: style.name,
                    price: style.price
                }))
            );

            const updatedOptions = editedOptions.flatMap(option =>
                Array(option.quantity).fill(0).map(() => ({
                    id: option.id,
                    name: option.name,
                    price: option.price
                }))
            );

            // Вычисляем новую сумму
            const newAmount = updatedStyles.reduce((sum, style) => sum + style.price, 0) +
                updatedOptions.reduce((sum, option) => sum + option.price, 0);

            // Обновляем существующий счет
            const child = workshop.childrenWithStatus.find(c => c.childId === editingChildId);
            if (child?.invoice) {
                await api.invoices.updateInvoice(child.invoice.id, {
                    selected_styles: updatedStyles,
                    selected_options: updatedOptions,
                    amount: newAmount
                });

                toast({
                    title: "Заказ обновлен",
                    description: "Изменения в заказе сохранены.",
                });

                // Закрываем режим редактирования
                cancelEditing();

                // Обновляем страницу для получения актуальных данных
                window.location.reload();
            }
        } catch (error) {
            toast({
                title: "Ошибка",
                description: "Не удалось сохранить изменения. Попробуйте еще раз.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-[95vw] sm:w-[90vw] sm:max-w-[90vw] md:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-2 sm:p-6">
                <DialogHeader className="pb-2 sm:pb-4">
                    <DialogTitle className="text-lg sm:text-2xl font-bold text-orange-600 flex items-center space-x-2 sm:space-x-3">
                        <Palette className="w-6 h-6 sm:w-8 sm:h-8" />
                        <span>Детали заказа</span>
                    </DialogTitle>
                    <DialogDescription className="text-sm sm:text-lg text-gray-600">
                        Мастер-класс "{workshop.title}"
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 sm:space-y-6">
                    {/* Основная информация о мастер-классе */}
                    <Card className="bg-gradient-to-br from-orange-50 to-purple-50 border-orange-200">
                        <CardHeader className="pb-2 sm:pb-4">
                            <CardTitle className="text-lg sm:text-xl text-orange-700 flex items-center space-x-2">
                                <Palette className="w-5 h-5 sm:w-6 sm:h-6" />
                                <span>{workshop.title}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 sm:space-y-4">
                            <div className="grid grid-cols-1 gap-3 sm:gap-4">
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-3">
                                        <MapPin className="w-5 h-5 text-gray-500" />
                                        <span className="text-gray-700">{workshop.schoolName}</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <Users className="w-5 h-5 text-gray-500" />
                                        <span className="text-gray-700">Класс: {workshop.classGroup}</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-3">
                                        <Calendar className="w-5 h-5 text-gray-500" />
                                        <span className="text-gray-700">{formatDate(workshop.date)}</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <Clock className="w-5 h-5 text-gray-500" />
                                        <span className="text-gray-700">{formatTime(workshop.time)}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Участники и их выборы */}
                    <Card className="bg-white border-blue-200">
                        <CardHeader className="pb-2 sm:pb-4">
                            <CardTitle className="text-lg sm:text-xl text-blue-700 flex items-center space-x-2">
                                <Baby className="w-5 h-5 sm:w-6 sm:h-6" />
                                <span>Участники мастер-класса</span>
                            </CardTitle>
                            <CardDescription className="text-sm">
                                Дети и их выборы варианта ручки и дополнительных услуг
                            </CardDescription>
                        </CardHeader>

                        {/* Предупреждение если данные о счете не загружены */}
                        {workshop.childrenWithStatus.some(child => !child.invoice) && (
                            <div className="mx-6 mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-center space-x-2 text-yellow-800">
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="text-sm font-medium">
                                        ⚠️ Внимание: Данные о выбранных вариантах ручек и дополнительных услуг не загружены для некоторых участников.
                                        Возможно, требуется обновить страницу или проверить подключение к серверу.
                                    </span>
                                </div>
                            </div>
                        )}
                        <CardContent className="space-y-3 sm:space-y-4">
                            {(workshop.childrenWithStatus || []).map((child) => {
                                const childInvoice = child.invoice;
                                const isPaid = childInvoice?.status === 'paid';


                                return (
                                    <div key={child.childId} className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-gray-50">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                                            <h4 className="text-base sm:text-lg font-semibold text-gray-800">
                                                {child.childName}
                                            </h4>
                                            <Badge
                                                variant={isPaid ? "default" : "secondary"}
                                                className={`${isPaid ? "bg-green-500 text-white" : "bg-yellow-100 text-yellow-800"} text-xs sm:text-sm`}
                                            >
                                                {isPaid ? 'Оплачено' : 'Ожидает оплаты'}
                                            </Badge>
                                        </div>

                                        {/* Выбранные стили */}
                                        <div className="mb-3">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                                                <h5 className="font-medium text-gray-700 flex items-center space-x-2 text-sm sm:text-base">
                                                    <Palette className="w-4 h-4 text-purple-500" />
                                                    <span>Выбранные варианты ручек:</span>
                                                </h5>
                                                {!isPaid && !isEditing && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => startEditing(child.childId)}
                                                        className="text-purple-600 hover:text-purple-700 text-xs sm:text-sm"
                                                    >
                                                        <Edit3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                                        Редактировать
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                {isEditing && editingChildId === child.childId ? (
                                                    // Режим редактирования
                                                    <div className="space-y-3">
                                                        {editedStyles.map((style) => (
                                                            <div key={style.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white rounded border border-purple-200 gap-3">
                                                                <div className="flex items-center space-x-3">
                                                                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                                                                        <Palette className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="font-medium text-gray-800 text-sm sm:text-base truncate">{style.name}</div>
                                                                        <div className="text-xs sm:text-sm text-gray-600 truncate">{getStyleDescription(style.name)}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center justify-between sm:justify-end space-x-3">
                                                                    <div className="flex items-center space-x-2">
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => updateStyleQuantity(style.id, style.quantity - 1)}
                                                                            disabled={style.quantity <= 1}
                                                                            className="w-6 h-6 sm:w-8 sm:h-8 p-0"
                                                                        >
                                                                            <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                                                                        </Button>
                                                                        <span className="w-6 sm:w-8 text-center font-medium text-sm sm:text-base">{style.quantity}</span>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => updateStyleQuantity(style.id, style.quantity + 1)}
                                                                            className="w-6 h-6 sm:w-8 sm:h-8 p-0"
                                                                        >
                                                                            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                                                        </Button>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="font-bold text-purple-600 text-sm sm:text-base">{style.price * style.quantity} ₽</div>
                                                                        {style.quantity > 1 && (
                                                                            <div className="text-xs text-gray-500">{style.price} ₽ × {style.quantity}</div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {/* Добавление новых стилей */}
                                                        <div className="mt-4 p-3 bg-gray-50 rounded border">
                                                            <h6 className="font-medium text-gray-700 mb-2 text-sm sm:text-base">Добавить стили:</h6>
                                                            <div className="grid grid-cols-1 gap-2">
                                                                {(currentService.styles || []).map((style) => (
                                                                    <Button
                                                                        key={style.id}
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => addStyle(style)}
                                                                        className="justify-start text-left text-xs sm:text-sm h-8 sm:h-9"
                                                                    >
                                                                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                                                        <span className="truncate">{style.name} ({style.price} ₽)</span>
                                                                    </Button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : childInvoice?.selected_styles && childInvoice.selected_styles.length > 0 ? (
                                                    // Обычный режим просмотра с группировкой
                                                    (() => {
                                                        // Группируем стили по названию и считаем количество
                                                        const groupedStyles = childInvoice.selected_styles.reduce((acc, style) => {
                                                            const styleData = typeof style === 'string'
                                                                ? { id: style, name: currentService.styles.find(s => s.id === style)?.name || style, price: currentService.styles.find(s => s.id === style)?.price || 0 }
                                                                : style;

                                                            const existing = acc.find(s => s.id === styleData.id);
                                                            if (existing) {
                                                                existing.quantity += 1;
                                                                existing.totalPrice += styleData.price;
                                                            } else {
                                                                acc.push({ ...styleData, quantity: 1, totalPrice: styleData.price });
                                                            }
                                                            return acc;
                                                        }, [] as Array<{ id: string; name: string; price: number; quantity: number; totalPrice: number }>);

                                                        return groupedStyles.map((style) => (
                                                            <div key={style.id} className="flex items-center justify-between p-2 bg-white rounded border">
                                                                <div className="flex items-center space-x-2">
                                                                    <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                                                                        <Palette className="w-4 h-4 text-white" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-medium text-gray-800">
                                                                            {style.name} {style.quantity > 1 && `× ${style.quantity}`}
                                                                        </div>
                                                                        <div className="text-sm text-gray-600">{getStyleDescription(style.name)}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="font-bold text-purple-600">{style.totalPrice} ₽</div>
                                                                    {style.quantity > 1 && (
                                                                        <div className="text-xs text-gray-500">{style.price} ₽ × {style.quantity}</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ));
                                                    })()
                                                ) : childInvoice ? (
                                                    <div className="text-gray-500 text-sm italic p-2">Варианты ручек не выбраны</div>
                                                ) : (
                                                    <div className="text-yellow-600 text-sm italic p-2">⚠️ Данные о вариантах ручек не загружены</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Выбранные опции */}
                                        <div className="mb-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <h5 className="font-medium text-gray-700 flex items-center space-x-2">
                                                    <Sparkles className="w-4 h-4 text-blue-500" />
                                                    <span>Дополнительные услуги:</span>
                                                </h5>
                                                {!isPaid && !isEditing && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => startEditing(child.childId)}
                                                        className="text-blue-600 hover:text-blue-700"
                                                    >
                                                        <Edit3 className="w-4 h-4 mr-1" />
                                                        Редактировать
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                {isEditing && editingChildId === child.childId ? (
                                                    // Режим редактирования
                                                    <div className="space-y-3">
                                                        {editedOptions.map((option) => (
                                                            <div key={option.id} className="flex items-center justify-between p-3 bg-white rounded border border-blue-200">
                                                                <div className="flex items-center space-x-3">
                                                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center">
                                                                        <Sparkles className="w-4 h-4 text-white" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-medium text-gray-800">{option.name}</div>
                                                                        <div className="text-sm text-gray-600">{getOptionDescription(option.name)}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center space-x-3">
                                                                    <div className="flex items-center space-x-2">
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => updateOptionQuantity(option.id, option.quantity - 1)}
                                                                            disabled={option.quantity <= 1}
                                                                            className="w-8 h-8 p-0"
                                                                        >
                                                                            <Minus className="w-4 h-4" />
                                                                        </Button>
                                                                        <span className="w-8 text-center font-medium">{option.quantity}</span>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => updateOptionQuantity(option.id, option.quantity + 1)}
                                                                            className="w-8 h-8 p-0"
                                                                        >
                                                                            <Plus className="w-4 h-4" />
                                                                        </Button>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="font-bold text-blue-600">{option.price * option.quantity} ₽</div>
                                                                        {option.quantity > 1 && (
                                                                            <div className="text-xs text-gray-500">{option.price} ₽ × {option.quantity}</div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {/* Добавление новых опций */}
                                                        <div className="mt-4 p-3 bg-gray-50 rounded border">
                                                            <h6 className="font-medium text-gray-700 mb-2">Добавить дополнительные услуги:</h6>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                {(currentService.options || []).map((option) => (
                                                                    <Button
                                                                        key={option.id}
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => addOption(option)}
                                                                        className="justify-start text-left"
                                                                    >
                                                                        <Plus className="w-4 h-4 mr-2" />
                                                                        {option.name} ({option.price} ₽)
                                                                    </Button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : childInvoice?.selected_options && childInvoice.selected_options.length > 0 ? (
                                                    // Обычный режим просмотра с группировкой
                                                    (() => {
                                                        // Группируем опции по названию и считаем количество
                                                        const groupedOptions = childInvoice.selected_options.reduce((acc, option) => {
                                                            const optionData = typeof option === 'string'
                                                                ? { id: option, name: currentService.options.find(o => o.id === option)?.name || option, price: currentService.options.find(o => o.id === option)?.price || 0 }
                                                                : option;

                                                            const existing = acc.find(o => o.id === optionData.id);
                                                            if (existing) {
                                                                existing.quantity += 1;
                                                                existing.totalPrice += optionData.price;
                                                            } else {
                                                                acc.push({ ...optionData, quantity: 1, totalPrice: optionData.price });
                                                            }
                                                            return acc;
                                                        }, [] as Array<{ id: string; name: string; price: number; quantity: number; totalPrice: number }>);

                                                        return groupedOptions.map((option) => (
                                                            <div key={option.id} className="flex items-center justify-between p-2 bg-white rounded border">
                                                                <div className="flex items-center space-x-2">
                                                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center">
                                                                        <Sparkles className="w-4 h-4 text-white" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-medium text-gray-800">
                                                                            {option.name} {option.quantity > 1 && `× ${option.quantity}`}
                                                                        </div>
                                                                        <div className="text-sm text-gray-600">{getOptionDescription(option.name)}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="font-bold text-blue-600">{option.totalPrice} ₽</div>
                                                                    {option.quantity > 1 && (
                                                                        <div className="text-xs text-gray-500">{option.price} ₽ × {option.quantity}</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ));
                                                    })()
                                                ) : childInvoice ? (
                                                    <div className="text-gray-500 text-sm italic p-2">Дополнительные услуги не выбраны</div>
                                                ) : (
                                                    <div className="text-yellow-600 text-sm italic p-2">⚠️ Данные об дополнительных услугах не загружены</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Кнопки редактирования */}
                                        {isEditing && editingChildId === child.childId && (
                                            <div className="border-t pt-3 mb-3">
                                                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        onClick={cancelEditing}
                                                        disabled={isSaving}
                                                        className="w-full sm:w-auto text-xs sm:text-sm"
                                                    >
                                                        <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                                        Отмена
                                                    </Button>
                                                    <Button
                                                        onClick={saveChanges}
                                                        disabled={isSaving}
                                                        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                                                    >
                                                        <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                                        {isSaving ? 'Сохранение...' : 'Сохранить'}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Итого по ребенку */}
                                        <div className="border-t pt-3">
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-gray-700">Итого за {child.childName}:</span>
                                                <span className="text-xl font-bold text-green-600">
                                                    {isEditing && editingChildId === child.childId ? (
                                                        // В режиме редактирования показываем новую сумму
                                                        (editedStyles.reduce((sum, style) => sum + (style.price * style.quantity), 0) +
                                                            editedOptions.reduce((sum, option) => sum + (option.price * option.quantity), 0)) + ' ₽'
                                                    ) : childInvoice ? (
                                                        (childInvoice.selected_styles?.reduce((sum, style) => {
                                                            let stylePrice = 0;
                                                            if (typeof style === 'string') {
                                                                // Если это строка (ID), ищем цену в сервисе
                                                                const foundStyle = currentService.styles.find(s => s.id === style);
                                                                stylePrice = foundStyle?.price || 0;
                                                            } else {
                                                                // Если это объект, используем его цену
                                                                stylePrice = style.price || 0;
                                                            }
                                                            return sum + stylePrice;
                                                        }, 0) || 0) +
                                                        (childInvoice.selected_options?.reduce((sum, option) => {
                                                            let optionPrice = 0;
                                                            if (typeof option === 'string') {
                                                                // Если это строка (ID), ищем цену в сервисе
                                                                const foundOption = currentService.options.find(o => o.id === option);
                                                                optionPrice = foundOption?.price || 0;
                                                            } else {
                                                                // Если это объект, используем его цену
                                                                optionPrice = option.price || 0;
                                                            }
                                                            return sum + optionPrice;
                                                        }, 0) || 0)
                                                    ) : childInvoice ? '0' : '⚠️ Не загружено'
                                                    } ₽
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>

                    {/* Секция оплаты для неоплаченных счетов */}
                    {unpaidInvoices.length > 0 && (
                        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                            <CardHeader className="pb-2 sm:pb-4">
                                <CardTitle className="text-lg sm:text-xl text-blue-700 flex items-center space-x-2">
                                    <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
                                    <span>Оплата участия</span>
                                </CardTitle>
                                <CardDescription className="text-sm">
                                    Оплатите счета для завершения записи на мастер-класс
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {unpaidInvoices.map((invoice) => (
                                    <div key={invoice.id} className="bg-white rounded-lg p-4 border border-gray-200">
                                        <div className="flex justify-between items-center mb-3">
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    Счет №{invoice.id.slice(-8)}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {invoice.participant_name} - {formatDate(invoice.workshop_date || '')}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-green-600">
                                                    {invoice.amount} ₽
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Ожидает оплаты
                                                </p>
                                            </div>
                                        </div>

                                        <RobokassaPayment
                                            invoice={invoice}
                                            onPaymentSuccess={() => {
                                                toast({
                                                    title: "Оплата успешна! 🎉",
                                                    description: "Статус счета обновлен. Спасибо за оплату!",
                                                });
                                                onOpenChange(false);
                                                window.location.reload();
                                            }}
                                            onPaymentError={(error) => {
                                                toast({
                                                    title: "Ошибка оплаты",
                                                    description: "Не удалось обработать оплату. Попробуйте еще раз.",
                                                    variant: "destructive"
                                                });
                                            }}
                                            onRefundSuccess={() => {
                                                toast({
                                                    title: "Возврат успешен! 💰",
                                                    description: "Средства возвращены на ваш счет.",
                                                });
                                                onOpenChange(false);
                                                window.location.reload();
                                            }}
                                        />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Кнопки действий */}
                    <div className="flex justify-center space-x-4 pt-4">
                        <Button
                            onClick={() => onOpenChange(false)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        >
                            Закрыть
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
