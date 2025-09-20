/**
 * @file: src/pages/PaymentSuccess.tsx
 * @description: Страница успешной оплаты
 * @dependencies: React, useSearchParams, useNavigate
 * @created: 2025-08-26
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Home, Receipt, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface PaymentSuccessData {
    invoice_id: string;
    amount: number;
    participant_name: string;
    master_class_name: string;
    payment_date: string;
}

const PaymentSuccess: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [paymentData, setPaymentData] = useState<PaymentSuccessData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Получаем данные из URL параметров
        const invoiceId = searchParams.get('invoice_id');
        const amount = searchParams.get('amount');
        const participantName = searchParams.get('participant_name');
        const masterClassName = searchParams.get('master_class_name');

        if (invoiceId && amount) {
            setPaymentData({
                invoice_id: invoiceId,
                amount: parseFloat(amount),
                participant_name: participantName || 'Участник',
                master_class_name: masterClassName || 'Мастер-класс',
                payment_date: new Date().toLocaleString('ru-RU')
            });
        }

        setLoading(false);

        // Показываем уведомление об успешной оплате
        toast({
            title: "Оплата успешна! 🎉",
            description: "Спасибо за оплату мастер-класса!",
        });
    }, [searchParams, toast]);

    const handleGoHome = () => {
        navigate('/');
    };

    const handleViewInvoices = () => {
        navigate('/parent');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-wax-hands flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Загружаем данные об оплате...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-wax-hands py-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Заголовок */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Оплата прошла успешно! 🎉
                    </h1>
                    <p className="text-lg text-gray-600">
                        Спасибо за оплату мастер-класса
                    </p>
                </div>

                {/* Карточка с деталями оплаты */}
                {paymentData && (
                    <Card className="mb-8 shadow-lg">
                        <CardHeader className="bg-green-50 border-b">
                            <CardTitle className="flex items-center gap-2 text-green-800">
                                <Receipt className="w-5 h-5" />
                                Детали оплаты
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="font-medium text-gray-700">Номер счета:</span>
                                    <span className="text-gray-900 font-mono">{paymentData.invoice_id}</span>
                                </div>

                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="font-medium text-gray-700">Мастер-класс:</span>
                                    <span className="text-gray-900">{paymentData.master_class_name}</span>
                                </div>

                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="font-medium text-gray-700">Участник:</span>
                                    <span className="text-gray-900">{paymentData.participant_name}</span>
                                </div>

                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="font-medium text-gray-700">Сумма:</span>
                                    <span className="text-2xl font-bold text-green-600">
                                        {paymentData.amount} ₽
                                    </span>
                                </div>

                                <div className="flex justify-between items-center py-2">
                                    <span className="font-medium text-gray-700">Дата оплаты:</span>
                                    <span className="text-gray-900">{paymentData.payment_date}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Информационная карточка */}
                <Card className="mb-8 bg-blue-50 border-blue-200">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-3">
                            <Users className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold text-blue-900 mb-2">
                                    Что дальше?
                                </h3>
                                <ul className="text-blue-800 space-y-2">
                                    <li>• Статус вашей заявки автоматически обновлен на "Оплачено"</li>
                                    <li>• Мы уведомим вас о деталях мастер-класса</li>
                                    <li>• Вы можете отслеживать все заявки в личном кабинете</li>
                                    <li>• При возникновении вопросов свяжитесь с нами</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Кнопки действий */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        onClick={handleGoHome}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3"
                    >
                        <Home className="w-5 h-5 mr-2" />
                        На главную
                    </Button>

                    <Button
                        onClick={handleViewInvoices}
                        variant="outline"
                        className="border-orange-300 text-orange-700 hover:bg-orange-50 px-8 py-3"
                    >
                        <Receipt className="w-5 h-5 mr-2" />
                        Мои заявки
                    </Button>
                </div>

                {/* Дополнительная информация */}
                <div className="mt-12 text-center text-sm text-gray-500">
                    <p>
                        Если у вас есть вопросы по оплате, свяжитесь с нами:<br />
                        <a href="mailto:pavelt80@mail.ru" className="text-orange-600 hover:underline">
                            pavelt80@mail.ru
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccess;
