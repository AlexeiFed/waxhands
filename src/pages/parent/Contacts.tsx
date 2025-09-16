/**
 * @file: Contacts.tsx
 * @description: Страница контактов для родителя
 * @dependencies: Card, Button, useAuth, api
 * @created: 2025-01-13
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Phone, Mail, Building2, User, MapPin, Globe, Loader2, AlertCircle } from 'lucide-react';

interface ContactData {
    id: string;
    company_name: string;
    legal_status: string;
    inn: string;
    phone: string;
    email: string;
    address?: string;
    website?: string;
}

export default function Contacts() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [contacts, setContacts] = useState<ContactData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        try {
            setLoading(true);
            setError(null);
            const contactData = await api.contacts.getContacts();
            setContacts(contactData);
        } catch (err) {
            console.error('Ошибка при загрузке контактов:', err);
            setError(err instanceof Error ? err.message : 'Не удалось загрузить контактные данные');
            toast({
                title: "Ошибка",
                description: "Не удалось загрузить контактные данные. Попробуйте обновить страницу.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCall = (phone: string) => {
        window.open(`tel:${phone}`, '_self');
    };

    const handleEmail = (email: string) => {
        window.open(`mailto:${email}`, '_self');
    };

    const handleWebsite = (website: string) => {
        window.open(`https://${website}`, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-50 p-4">
                <div className="max-w-4xl mx-auto">
                    <Card className="bg-white shadow-lg">
                        <CardContent className="p-8">
                            <div className="flex items-center justify-center space-x-2">
                                <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                                <span className="text-lg text-gray-600">Загрузка контактов...</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (error || !contacts) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-50 p-4">
                <div className="max-w-4xl mx-auto">
                    <Card className="bg-white shadow-lg">
                        <CardContent className="p-8">
                            <div className="text-center">
                                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                                    Ошибка загрузки контактов
                                </h2>
                                <p className="text-gray-600 mb-4">
                                    {error || 'Контактные данные не найдены'}
                                </p>
                                <Button onClick={fetchContacts} variant="outline">
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
                            <Phone className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800">
                            Контакты
                        </h1>
                    </div>
                    <p className="text-gray-600">
                        Контактная информация и реквизиты
                    </p>
                </div>

                {/* Основная информация */}
                <Card className="bg-white shadow-lg mb-6">
                    <CardHeader>
                        <CardTitle className="text-xl text-orange-700 flex items-center">
                            <Building2 className="h-5 w-5 mr-2" />
                            {contacts.company_name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Правовой статус */}
                            <div className="flex items-center space-x-3">
                                <div className="bg-green-100 rounded-full p-2">
                                    <User className="h-4 w-4 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Правовой статус</p>
                                    <p className="font-medium text-gray-800">{contacts.legal_status}</p>
                                </div>
                            </div>

                            {/* ИНН */}
                            <div className="flex items-center space-x-3">
                                <div className="bg-blue-100 rounded-full p-2">
                                    <Building2 className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">ИНН</p>
                                    <p className="font-medium text-gray-800">{contacts.inn}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Контактная информация */}
                <Card className="bg-white shadow-lg mb-6">
                    <CardHeader>
                        <CardTitle className="text-xl text-orange-700 flex items-center">
                            <Phone className="h-5 w-5 mr-2" />
                            Контактная информация
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Телефон */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-green-100 rounded-full p-2">
                                        <Phone className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Телефон</p>
                                        <p className="font-medium text-gray-800">{contacts.phone}</p>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => handleCall(contacts.phone)}
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    Позвонить
                                </Button>
                            </div>

                            {/* Email */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-blue-100 rounded-full p-2">
                                        <Mail className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="font-medium text-gray-800">{contacts.email}</p>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => handleEmail(contacts.email)}
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    Написать
                                </Button>
                            </div>
                        </div>

                        {/* Адрес */}
                        {contacts.address && (
                            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                                <div className="bg-purple-100 rounded-full p-2">
                                    <MapPin className="h-4 w-4 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Адрес</p>
                                    <p className="font-medium text-gray-800">{contacts.address}</p>
                                </div>
                            </div>
                        )}

                        {/* Веб-сайт */}
                        {contacts.website && (
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-orange-100 rounded-full p-2">
                                        <Globe className="h-4 w-4 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Веб-сайт</p>
                                        <p className="font-medium text-gray-800">{contacts.website}</p>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => handleWebsite(contacts.website!)}
                                    size="sm"
                                    className="bg-orange-600 hover:bg-orange-700"
                                >
                                    Открыть
                                </Button>
                            </div>
                        )}
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

