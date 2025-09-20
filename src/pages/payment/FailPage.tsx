/**
 * @file: FailPage.tsx
 * @description: Страница неуспешной оплаты
 * @dependencies: React, useNavigate
 * @created: 2025-01-26
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, Home, RotateCcw } from 'lucide-react';

const FailPage: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Автоматически перенаправляем на главную через 15 секунд
        const timer = setTimeout(() => {
            navigate('/parent');
        }, 15000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                        <XCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-red-600">
                        Оплата не завершена
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                        К сожалению, произошла ошибка при обработке платежа. Попробуйте еще раз.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-gray-500">
                        Вы будете автоматически перенаправлены на главную страницу через 15 секунд.
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
                    <Button
                        variant="outline"
                        onClick={() => window.history.back()}
                        className="w-full"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Попробовать снова
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default FailPage;
