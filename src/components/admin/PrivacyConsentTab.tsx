/**
 * @file: PrivacyConsentTab.tsx
 * @description: Вкладка для просмотра данных о согласиях на обработку персональных данных
 * @dependencies: Card, Button, Badge
 * @created: 2025-01-25
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Calendar, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ConsentData {
    accepted: boolean;
    date: string;
    version: string;
}

interface ConsentStats {
    total: number;
    accepted: number;
    declined: number;
    recent: ConsentData[];
}

export const PrivacyConsentTab: React.FC = () => {
    const [stats, setStats] = useState<ConsentStats>({
        total: 0,
        accepted: 0,
        declined: 0,
        recent: []
    });
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // Функция для получения данных о согласиях
    const fetchConsentData = async () => {
        setLoading(true);
        try {
            // В реальном приложении здесь был бы запрос к API
            // Пока что используем localStorage для демонстрации
            const consentData = localStorage.getItem('waxhands-privacy-consent');

            if (consentData) {
                const parsedData: ConsentData = JSON.parse(consentData);
                setStats({
                    total: 1,
                    accepted: parsedData.accepted ? 1 : 0,
                    declined: parsedData.accepted ? 0 : 1,
                    recent: [parsedData]
                });
            } else {
                setStats({
                    total: 0,
                    accepted: 0,
                    declined: 0,
                    recent: []
                });
            }
        } catch (error) {
            console.error('Error fetching consent data:', error);
            toast({
                title: "Ошибка",
                description: "Не удалось загрузить данные о согласиях",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConsentData();
    }, []);

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Неизвестная дата';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Согласия на обработку данных</h2>
                    <p className="text-gray-600 mt-1">
                        Статистика согласий пользователей на обработку персональных данных
                    </p>
                </div>
                <Button
                    onClick={fetchConsentData}
                    disabled={loading}
                    variant="outline"
                    className="flex items-center gap-2"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Обновить
                </Button>
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Всего согласий
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">
                            Общее количество
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Принято
                        </CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0}% от общего числа
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Отклонено
                        </CardTitle>
                        <XCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.declined}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.total > 0 ? Math.round((stats.declined / stats.total) * 100) : 0}% от общего числа
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Последние согласия */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Последние согласия
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {stats.recent.length > 0 ? (
                        <div className="space-y-4">
                            {stats.recent.map((consent, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex items-center gap-4">
                                        {consent.accepted ? (
                                            <CheckCircle className="h-6 w-6 text-green-600" />
                                        ) : (
                                            <XCircle className="h-6 w-6 text-red-600" />
                                        )}
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">
                                                    {consent.accepted ? 'Согласие принято' : 'Согласие отклонено'}
                                                </span>
                                                <Badge variant={consent.accepted ? 'default' : 'destructive'}>
                                                    {consent.accepted ? 'Принято' : 'Отклонено'}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Calendar className="h-4 w-4" />
                                                {formatDate(consent.date)}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Версия политики: {consent.version}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium mb-2">Нет данных о согласиях</p>
                            <p className="text-sm">Согласия пользователей будут отображаться здесь</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Информация */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <Shield className="h-6 w-6 text-blue-600 mt-1" />
                        <div>
                            <h3 className="font-semibold text-blue-900 mb-2">
                                Информация о согласиях
                            </h3>
                            <p className="text-sm text-blue-800 mb-2">
                                Данные о согласиях пользователей на обработку персональных данных сохраняются
                                локально в браузере и не передаются на сервер для обеспечения конфиденциальности.
                            </p>
                            <p className="text-sm text-blue-800">
                                В реальном приложении рекомендуется сохранять анонимизированные данные
                                о согласиях для статистики и соблюдения требований законодательства.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default PrivacyConsentTab;

