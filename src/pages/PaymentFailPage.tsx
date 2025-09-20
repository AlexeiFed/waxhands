/**
 * @file: PaymentFailPage.tsx
 * @description: Страница неуспешной оплаты Robokassa
 * @dependencies: React, React Router
 * @created: 2025-09-20
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PaymentFailPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [paymentData, setPaymentData] = useState<any>(null);

    useEffect(() => {
        // Получаем данные из URL параметров
        const outSum = searchParams.get('OutSum');
        const invId = searchParams.get('InvId');
        const signatureValue = searchParams.get('SignatureValue');
        const culture = searchParams.get('Culture');

        setPaymentData({
            outSum,
            invId,
            signatureValue,
            culture
        });
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <XCircle className="h-16 w-16 text-red-500" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-red-600">
                        Ошибка оплаты
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-center text-gray-600">
                        К сожалению, произошла ошибка при обработке платежа.
                        Пожалуйста, попробуйте еще раз или обратитесь в поддержку.
                    </p>

                    {paymentData && (
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                            <h3 className="font-semibold text-gray-700">Детали платежа:</h3>
                            <div className="text-sm text-gray-600">
                                <p><strong>Сумма:</strong> {paymentData.outSum} ₽</p>
                                <p><strong>Номер заказа:</strong> {paymentData.invId}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col space-y-2">
                        <Button
                            onClick={() => navigate('/parent')}
                            className="w-full"
                        >
                            <Home className="h-4 w-4 mr-2" />
                            Вернуться в личный кабинет
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => navigate(-1)}
                            className="w-full"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Попробовать снова
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => navigate(-2)}
                            className="w-full"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Назад
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default PaymentFailPage;
