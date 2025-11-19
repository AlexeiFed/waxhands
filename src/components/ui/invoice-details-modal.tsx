/**
 * @file: invoice-details-modal.tsx
 * @description: Модальное окно с деталями счета участника мастер-класса
 * @dependencies: Dialog, Card, Button, Badge, Invoice interface
 * @created: 2024-12-19
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Invoice } from '@/types';
import { Calendar, MapPin, Users, CreditCard, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { RobokassaPayment } from '@/components/payment/RobokassaPayment';
import { useDeleteInvoice } from '@/hooks/use-invoices';
import { useToast } from '@/hooks/use-toast';
import { MobileBottomSheet } from '@/components/ui/mobile-bottom-sheet';

interface InvoiceDetailsModalProps {
    invoice: Invoice | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onPaymentClick?: (invoiceId: string) => void;
    onInvoiceDeleted?: (invoiceId: string) => void;
}

const InvoiceDetailsModal = ({ invoice, isOpen, onOpenChange, onPaymentClick, onInvoiceDeleted }: InvoiceDetailsModalProps) => {
    const { toast } = useToast();
    const deleteInvoiceMutation = useDeleteInvoice();

    if (!invoice) return null;

    const handleDeleteInvoice = async () => {
        if (!confirm('Вы уверены, что хотите удалить этот счет? Это действие нельзя отменить.')) {
            return;
        }

        try {
            await deleteInvoiceMutation.mutateAsync(invoice.id);
            toast({
                title: "Счет удален",
                description: "Счет успешно удален",
                variant: "default",
            });
            onInvoiceDeleted?.(invoice.id);
            onOpenChange(false);
        } catch (error) {
            toast({
                title: "Ошибка",
                description: "Не удалось удалить счет",
                variant: "destructive",
            });
        }
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'paid':
                return {
                    label: 'Оплачено',
                    color: 'bg-green-500',
                    icon: <CheckCircle className="w-4 h-4" />
                };
            case 'pending':
                return {
                    label: 'Ожидает оплаты',
                    color: 'bg-yellow-500',
                    icon: <Clock className="w-4 h-4" />
                };
            case 'cancelled':
                return {
                    label: 'Отменено',
                    color: 'bg-red-500',
                    icon: <Clock className="w-4 h-4" />
                };
            default:
                return {
                    label: 'Неизвестно',
                    color: 'bg-gray-500',
                    icon: <Clock className="w-4 h-4" />
                };
        }
    };

    const statusInfo = getStatusInfo(invoice.status);

    return (
        <MobileBottomSheet
            open={isOpen}
            onOpenChange={onOpenChange}
            title="Детали участия"
            description="Информация по счету и оплате"
            className="bg-gradient-to-br from-yellow-50 via-pink-50 to-blue-50"
            dialogClassName="bg-gradient-to-br from-yellow-50 via-pink-50 to-blue-50 border-0 shadow-2xl p-6"
        >
            <div className="space-y-6">
                {/* Информация о мастер-классе */}
                <Card className="bg-white/90 backdrop-blur-sm border-orange-200 shadow-card mb-6">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-xl font-bold text-orange-500">
                            Мастер-класс
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex items-center space-x-2 p-2 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
                                <MapPin className="w-4 h-4 text-orange-600 flex-shrink-0" />
                                <span className="text-gray-700 font-medium">{invoice.city}</span>
                            </div>
                            <div className="flex items-center space-x-2 p-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                                <Users className="w-4 h-4 text-purple-600 flex-shrink-0" />
                                <span className="text-gray-700 font-medium">{invoice.school_name}</span>
                            </div>
                            <div className="flex items-center space-x-2 p-2 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                                <Users className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                <span className="text-gray-700 font-medium">Класс: {invoice.class_group}</span>
                            </div>
                            <div className="flex items-center space-x-2 p-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                                <Calendar className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <span className="text-gray-700 font-medium">
                                    {new Date(invoice.workshop_date).toLocaleDateString('ru-RU')}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Выбранные стили */}
                <Card className="bg-white/90 backdrop-blur-sm border-purple-200 shadow-card mb-6">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-bold text-gray-800">
                            Выбранные стили
                        </CardTitle>
                        <CardDescription>
                            Стили для вашей восковой ручки
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {invoice.selected_styles.map((style, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                                <div className="flex items-center space-x-2">
                                    <span className="text-2xl">✋</span>
                                    <span className="font-medium text-gray-800">{style.name}</span>
                                </div>
                                <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white border-0 px-3 py-1">
                                    {style.price} Р
                                </Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Выбранные опции */}
                {invoice.selected_options.length > 0 && (
                    <Card className="bg-white/90 backdrop-blur-sm border-blue-200 shadow-card mb-6">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-bold text-gray-800">
                                Дополнительные опции
                            </CardTitle>
                            <CardDescription>
                                Дополнительные опции для вашей восковой ручки
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {invoice.selected_options.map((option, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-2xl">✨</span>
                                        <span className="font-medium text-gray-800">{option.name}</span>
                                    </div>
                                    <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 px-3 py-1">
                                        {option.price} Р
                                    </Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Статус и сумма */}
                <Card className="bg-white/90 backdrop-blur-sm border-green-200 shadow-card mb-6">
                    <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-center sm:text-left">
                                <p className="text-lg text-gray-600 mb-2">Статус:</p>
                                <Badge className={`${statusInfo.color} text-white border-0 px-3 py-2 text-sm font-semibold flex items-center space-x-2`}>
                                    {statusInfo.icon}
                                    <span>{statusInfo.label}</span>
                                </Badge>
                            </div>
                            <div className="text-center sm:text-right">
                                <p className="text-lg text-gray-600 mb-2">Общая стоимость:</p>
                                <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                                    {invoice.amount} Р
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Компонент оплаты Robokassa */}
                <RobokassaPayment
                    invoiceId={invoice.id}
                    onPaymentSuccess={() => {
                        onOpenChange(false);
                        // Обновляем страницу для отображения нового статуса
                        window.location.reload();
                    }}
                    onPaymentError={(error) => {
                        console.error('Ошибка оплаты:', error);
                    }}
                    onRefundSuccess={() => {
                        onOpenChange(false);
                        // Обновляем страницу для отображения нового статуса
                        window.location.reload();
                    }}
                />

                {/* Кнопки действий */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t-2 border-gradient-to-r from-orange-200 via-purple-200 to-blue-200">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="w-full sm:w-auto min-w-[140px] py-3 px-6 text-lg border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
                    >
                        Закрыть
                    </Button>
                    
                    {invoice.status !== 'paid' && (
                        <Button
                            variant="destructive"
                            onClick={handleDeleteInvoice}
                            disabled={deleteInvoiceMutation.isPending}
                            className="w-full sm:w-auto min-w-[140px] py-3 px-6 text-lg bg-red-500 hover:bg-red-600 text-white border-0 transition-all duration-300 flex items-center justify-center space-x-2"
                        >
                            <Trash2 className="w-5 h-5" />
                            <span>{deleteInvoiceMutation.isPending ? 'Удаление...' : 'Удалить счет'}</span>
                        </Button>
                    )}
                </div>
            </div>
        </MobileBottomSheet>
    );
};

export default InvoiceDetailsModal;
