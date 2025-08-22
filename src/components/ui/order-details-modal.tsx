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
import YandexPaymentButton from '@/components/ui/yandex-payment-button';
import { WorkshopCardData, Service, ServiceStyle, ServiceOption, Invoice } from '@/types';
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
    X
} from 'lucide-react';

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
        return workshop.childrenWithStatus
            .filter(child => child.invoice && child.invoice.status === 'pending')
            .map(child => child.invoice)
            .filter(Boolean) as Invoice[];
    };

    const unpaidInvoices = getUnpaidInvoices();

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-orange-600 flex items-center space-x-3">
                        <Palette className="w-8 h-8" />
                        <span>Детали заказа</span>
                    </DialogTitle>
                    <DialogDescription className="text-lg text-gray-600">
                        Мастер-класс "{workshop.title}"
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Основная информация о мастер-классе */}
                    <Card className="bg-gradient-to-br from-orange-50 to-purple-50 border-orange-200">
                        <CardHeader>
                            <CardTitle className="text-xl text-orange-700 flex items-center space-x-2">
                                <Palette className="w-6 h-6" />
                                <span>{workshop.title}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        <CardHeader>
                            <CardTitle className="text-xl text-blue-700 flex items-center space-x-2">
                                <Baby className="w-6 h-6" />
                                <span>Участники мастер-класса</span>
                            </CardTitle>
                            <CardDescription>
                                Дети и их выборы стилей и опций
                            </CardDescription>
                        </CardHeader>

                        {/* Предупреждение если данные о счете не загружены */}
                        {workshop.childrenWithStatus.some(child => !child.invoice) && (
                            <div className="mx-6 mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-center space-x-2 text-yellow-800">
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="text-sm font-medium">
                                        ⚠️ Внимание: Данные о выбранных стилях и опциях не загружены для некоторых участников.
                                        Возможно, требуется обновить страницу или проверить подключение к серверу.
                                    </span>
                                </div>
                            </div>
                        )}
                        <CardContent className="space-y-4">
                            {workshop.childrenWithStatus.map((child) => {
                                const childInvoice = child.invoice;
                                const isPaid = childInvoice?.status === 'paid';

                                // Отладочная информация
                                console.log('🔍 OrderDetailsModal: Данные ребенка:', {
                                    childName: child.childName,
                                    childInvoice,
                                    selectedStyles: childInvoice?.selected_styles,
                                    selectedOptions: childInvoice?.selected_options,
                                    currentService: currentService,
                                    workshop: {
                                        id: workshop.id,
                                        title: workshop.title,
                                        serviceId: workshop.serviceId
                                    }
                                });

                                return (
                                    <div key={child.childId} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-lg font-semibold text-gray-800">
                                                {child.childName}
                                            </h4>
                                            <Badge
                                                variant={isPaid ? "default" : "secondary"}
                                                className={isPaid ? "bg-green-500 text-white" : "bg-yellow-100 text-yellow-800"}
                                            >
                                                {isPaid ? 'Оплачено' : 'Ожидает оплаты'}
                                            </Badge>
                                        </div>

                                        {/* Выбранные стили */}
                                        <div className="mb-3">
                                            <h5 className="font-medium text-gray-700 mb-2 flex items-center space-x-2">
                                                <Palette className="w-4 h-4 text-purple-500" />
                                                <span>Выбранные стили:</span>
                                            </h5>
                                            <div className="space-y-2">
                                                {childInvoice?.selected_styles && childInvoice.selected_styles.length > 0 ? (
                                                    childInvoice.selected_styles.map((style, index) => {
                                                        // Обрабатываем случай когда style может быть строкой или объектом
                                                        let styleData: { id: string; name: string; price: number };

                                                        if (typeof style === 'string') {
                                                            // Если это строка (ID), ищем название в сервисе
                                                            const foundStyle = currentService.styles.find(s => s.id === style);
                                                            styleData = {
                                                                id: style,
                                                                name: foundStyle?.name || style,
                                                                price: foundStyle?.price || 0
                                                            };
                                                        } else {
                                                            // Если это объект, используем его данные
                                                            styleData = style;
                                                        }

                                                        return (
                                                            <div key={styleData.id || index} className="flex items-center justify-between p-2 bg-white rounded border">
                                                                <div className="flex items-center space-x-2">
                                                                    <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                                                                        <Palette className="w-4 h-4 text-white" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-medium text-gray-800">{styleData.name}</div>
                                                                        <div className="text-sm text-gray-600">{getStyleDescription(styleData.name)}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="font-bold text-purple-600">{styleData.price} ₽</div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                ) : childInvoice ? (
                                                    <div className="text-gray-500 text-sm italic p-2">Стили не выбраны</div>
                                                ) : (
                                                    <div className="text-yellow-600 text-sm italic p-2">⚠️ Данные о стилях не загружены</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Выбранные опции */}
                                        <div className="mb-3">
                                            <h5 className="font-medium text-gray-700 mb-2 flex items-center space-x-2">
                                                <Sparkles className="w-4 h-4 text-blue-500" />
                                                <span>Дополнительные опции:</span>
                                            </h5>
                                            <div className="space-y-2">
                                                {childInvoice?.selected_options && childInvoice.selected_options.length > 0 ? (
                                                    childInvoice.selected_options.map((option, index) => {
                                                        // Обрабатываем случай когда option может быть строкой или объектом
                                                        let optionData: { id: string; name: string; price: number };

                                                        if (typeof option === 'string') {
                                                            // Если это строка (ID), ищем название в сервисе
                                                            const foundOption = currentService.options.find(o => o.id === option);
                                                            optionData = {
                                                                id: option,
                                                                name: foundOption?.name || option,
                                                                price: foundOption?.price || 0
                                                            };
                                                        } else {
                                                            // Если это объект, используем его данные
                                                            optionData = option;
                                                        }

                                                        return (
                                                            <div key={optionData.id || index} className="flex items-center justify-between p-2 bg-white rounded border">
                                                                <div className="flex items-center space-x-2">
                                                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center">
                                                                        <Sparkles className="w-4 h-4 text-white" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-medium text-gray-800">{optionData.name}</div>
                                                                        <div className="text-sm text-gray-600">{getOptionDescription(optionData.name)}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="font-bold text-blue-600">{optionData.price} ₽</div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                ) : childInvoice ? (
                                                    <div className="text-gray-500 text-sm italic p-2">Опции не выбраны</div>
                                                ) : (
                                                    <div className="text-yellow-600 text-sm italic p-2">⚠️ Данные об опциях не загружены</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Итого по ребенку */}
                                        <div className="border-t pt-3">
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-gray-700">Итого за {child.childName}:</span>
                                                <span className="text-xl font-bold text-green-600">
                                                    {childInvoice ?
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
                                                        : childInvoice ? '0' : '⚠️ Не загружено'
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
                            <CardHeader>
                                <CardTitle className="text-xl text-blue-700 flex items-center space-x-2">
                                    <CreditCard className="w-6 h-6" />
                                    <span>Оплата участия</span>
                                </CardTitle>
                                <CardDescription>
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

                                        <YandexPaymentButton
                                            invoiceId={invoice.id}
                                            amount={invoice.amount}
                                            description={`Участие в мастер-классе "${workshop.title}" для ${invoice.participant_name}`}
                                            children={[{
                                                id: invoice.participant_id || '',
                                                name: invoice.participant_name || '',
                                                selectedServices: ['Мастер-класс'],
                                                totalAmount: invoice.amount
                                            }]}
                                            masterClassName={workshop.title}
                                            eventDate={workshop.date}
                                            eventTime={workshop.time}
                                            onPaymentSuccess={() => {
                                                toast({
                                                    title: "Оплата успешна! 🎉",
                                                    description: "Статус счета обновлен. Спасибо за оплату!",
                                                });
                                                onOpenChange(false);
                                            }}
                                            onPaymentError={(error) => {
                                                console.error('Ошибка оплаты:', error);
                                                toast({
                                                    title: "Ошибка оплаты",
                                                    description: "Не удалось обработать оплату. Попробуйте еще раз.",
                                                    variant: "destructive"
                                                });
                                            }}
                                            className="w-full"
                                            variant="default"
                                            size="lg"
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
