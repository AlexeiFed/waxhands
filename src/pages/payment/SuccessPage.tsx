/**
 * @file: SuccessPage.tsx
 * @description: Страница успешной оплаты
 * @dependencies: React, useNavigate
 * @created: 2025-01-26
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home } from 'lucide-react';

const SuccessPage: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Автоматически перенаправляем на главную через 10 секунд
        const timer = setTimeout(() => {
            navigate('/parent');
        }, 10000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-green-600">
                        Оплата успешно завершена!
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                        Спасибо за оплату. Ваш счет обработан и вы получите уведомление на email.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-gray-500">
                        Вы будете автоматически перенаправлены на главную страницу через 10 секунд.
                    </p>
                    <div className="flex justify-center">
                        <Button
                            onClick={() => navigate('/parent')}
                            className="w-full sm:w-auto"
                        >
                            <Home className="w-4 h-4 mr-2" />
                            На главную
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default SuccessPage;
