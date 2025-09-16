/**
 * @file: PrivacyPolicy.tsx
 * @description: Страница политики конфиденциальности для родителя
 * @dependencies: Card, Button, useAuth, api
 * @created: 2024-12-25
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { PrivacyPolicy } from '@/types';
import { Shield, Download, AlertCircle, Loader2, FileText } from 'lucide-react';

export default function PrivacyPolicy() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [privacyPolicy, setPrivacyPolicy] = useState<PrivacyPolicy | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const fetchPrivacyPolicy = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const currentPolicy = await api.privacyPolicy.getCurrentPolicy();
            setPrivacyPolicy(currentPolicy);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Не удалось загрузить политику конфиденциальности');
            toast({
                title: "Ошибка",
                description: "Не удалось загрузить политику конфиденциальности. Попробуйте обновить страницу.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchPrivacyPolicy();
    }, [fetchPrivacyPolicy]);

    const handleDownloadPDF = async () => {
        try {
            setIsDownloading(true);
            const blob = await api.privacyPolicy.downloadCurrentPdf();

            // Создаем ссылку для скачивания
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `privacy-policy-${privacyPolicy?.version || 'current'}-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast({
                title: 'PDF скачан',
                description: 'Политика конфиденциальности успешно скачана в формате PDF',
            });
        } catch (err) {
            toast({
                title: 'Ошибка',
                description: 'Не удалось скачать PDF политики конфиденциальности',
                variant: 'destructive',
            });
        } finally {
            setIsDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-50 p-4">
                <div className="max-w-4xl mx-auto">
                    <Card className="bg-white shadow-lg">
                        <CardContent className="p-8">
                            <div className="flex items-center justify-center space-x-2">
                                <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                                <span className="text-lg text-gray-600">Загрузка политики конфиденциальности...</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (error || !privacyPolicy) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-50 p-4">
                <div className="max-w-4xl mx-auto">
                    <Card className="bg-white shadow-lg">
                        <CardContent className="p-8">
                            <div className="text-center">
                                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                                    Ошибка загрузки политики конфиденциальности
                                </h2>
                                <p className="text-gray-600 mb-4">
                                    {error || 'Политика конфиденциальности не найдена'}
                                </p>
                                <Button onClick={fetchPrivacyPolicy} variant="outline">
                                    Попробовать снова
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-50 p-4">
            <div className="max-w-4xl mx-auto">
                {/* Заголовок */}
                <div className="mb-6">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="bg-gradient-to-r from-orange-500 to-purple-500 rounded-full p-2">
                            <Shield className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800">
                            Политика конфиденциальности
                        </h1>
                    </div>
                    <p className="text-gray-600">
                        Обработка персональных данных в соответствии с 152-ФЗ
                    </p>
                </div>

                {/* Информация о версии */}
                <Card className="bg-white shadow-lg mb-6">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xl text-orange-700">
                                {privacyPolicy.title}
                            </CardTitle>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500">
                                    Версия {privacyPolicy.version}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDownloadPDF}
                                    disabled={isDownloading}
                                    className="text-blue-600 hover:text-blue-700"
                                >
                                    {isDownloading ? (
                                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                    ) : (
                                        <Download className="h-4 w-4 mr-1" />
                                    )}
                                    {isDownloading ? 'Скачивание...' : 'PDF'}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Содержимое политики конфиденциальности */}
                <Card className="bg-white shadow-lg">
                    <CardContent className="p-6">
                        <div
                            className="prose prose-lg max-w-none prose-headings:text-orange-700 prose-headings:font-semibold prose-p:text-gray-700 prose-ul:text-gray-700 prose-li:text-gray-700"
                            dangerouslySetInnerHTML={{ __html: privacyPolicy.content }}
                        />
                    </CardContent>
                </Card>

                {/* Кнопка возврата */}
                <div className="mt-6 text-center">
                    <Button
                        onClick={() => window.history.back()}
                        variant="outline"
                        className="text-gray-600 hover:text-gray-800"
                    >
                        ← Назад
                    </Button>
                </div>
            </div>
        </div>
    );
}
