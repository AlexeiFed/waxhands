/**
 * @file: ContactsTab.tsx
 * @description: Вкладка управления контактами в админ панели
 * @dependencies: Card, Button, Input, useAuth, api
 * @created: 2025-01-13
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { ContactData } from '@/types';
import { Phone, Mail, Building2, User, MapPin, Globe, Loader2, AlertCircle, Save, RefreshCw } from 'lucide-react';

export default function ContactsTab() {
    const { toast } = useToast();
    const [contacts, setContacts] = useState<ContactData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Форма для редактирования
    const [formData, setFormData] = useState({
        company_name: '',
        legal_status: '',
        inn: '',
        phone: '',
        email: '',
        address: '',
        website: ''
    });

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        try {
            setLoading(true);
            setError(null);
            const contactData = await api.contacts.getContacts();
            setContacts(contactData);

            // Заполняем форму данными
            setFormData({
                company_name: contactData.company_name || '',
                legal_status: contactData.legal_status || '',
                inn: contactData.inn || '',
                phone: contactData.phone || '',
                email: contactData.email || '',
                address: contactData.address || '',
                website: contactData.website || ''
            });
        } catch (err) {
            console.error('Ошибка при загрузке контактов:', err);
            setError(err instanceof Error ? err.message : 'Не удалось загрузить контактные данные');
            toast({
                title: "Ошибка",
                description: "Не удалось загрузить контактные данные",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            // Валидация обязательных полей
            if (!formData.company_name || !formData.legal_status || !formData.inn || !formData.phone || !formData.email) {
                toast({
                    title: "Ошибка валидации",
                    description: "Пожалуйста, заполните все обязательные поля",
                    variant: "destructive",
                });
                return;
            }

            const updatedContacts = await api.contacts.updateContacts(formData);
            setContacts(updatedContacts);

            toast({
                title: "Успешно",
                description: "Контактные данные обновлены",
            });
        } catch (err) {
            console.error('Ошибка при сохранении контактов:', err);
            toast({
                title: "Ошибка",
                description: "Не удалось сохранить контактные данные",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">Управление контактами</h2>
                        <p className="text-muted-foreground">
                            Редактирование контактной информации
                        </p>
                    </div>
                </div>

                <Card className="bg-white shadow-lg">
                    <CardContent className="p-8">
                        <div className="flex items-center justify-center space-x-2">
                            <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                            <span className="text-lg text-gray-600">Загрузка контактов...</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">Управление контактами</h2>
                        <p className="text-muted-foreground">
                            Редактирование контактной информации
                        </p>
                    </div>
                </div>

                <Card className="bg-white shadow-lg">
                    <CardContent className="p-8">
                        <div className="text-center">
                            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                Ошибка загрузки
                            </h3>
                            <p className="text-gray-600 mb-4">{error}</p>
                            <Button onClick={fetchContacts} variant="outline">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Попробовать снова
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Управление контактами</h2>
                    <p className="text-muted-foreground">
                        Редактирование контактной информации
                    </p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700"
                >
                    {saving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4 mr-2" />
                    )}
                    {saving ? 'Сохранение...' : 'Сохранить'}
                </Button>
            </div>

            {/* Форма редактирования */}
            <Card className="bg-white shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl text-orange-700 flex items-center">
                        <Building2 className="h-5 w-5 mr-2" />
                        Основная информация
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Название компании */}
                        <div className="space-y-2">
                            <Label htmlFor="company_name" className="flex items-center">
                                <Building2 className="h-4 w-4 mr-2 text-orange-600" />
                                Название компании *
                            </Label>
                            <Input
                                id="company_name"
                                value={formData.company_name}
                                onChange={(e) => handleInputChange('company_name', e.target.value)}
                                placeholder="Введите название компании"
                                className="w-full"
                            />
                        </div>

                        {/* Правовой статус */}
                        <div className="space-y-2">
                            <Label htmlFor="legal_status" className="flex items-center">
                                <User className="h-4 w-4 mr-2 text-green-600" />
                                Правовой статус *
                            </Label>
                            <Input
                                id="legal_status"
                                value={formData.legal_status}
                                onChange={(e) => handleInputChange('legal_status', e.target.value)}
                                placeholder="Например: самозанятый, ИП, ООО"
                                className="w-full"
                            />
                        </div>

                        {/* ИНН */}
                        <div className="space-y-2">
                            <Label htmlFor="inn" className="flex items-center">
                                <Building2 className="h-4 w-4 mr-2 text-blue-600" />
                                ИНН *
                            </Label>
                            <Input
                                id="inn"
                                value={formData.inn}
                                onChange={(e) => handleInputChange('inn', e.target.value)}
                                placeholder="Введите ИНН"
                                className="w-full"
                            />
                        </div>

                        {/* Телефон */}
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="flex items-center">
                                <Phone className="h-4 w-4 mr-2 text-green-600" />
                                Телефон *
                            </Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                placeholder="Введите номер телефона"
                                className="w-full"
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="flex items-center">
                                <Mail className="h-4 w-4 mr-2 text-blue-600" />
                                Email *
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                placeholder="Введите email"
                                className="w-full"
                            />
                        </div>

                        {/* Веб-сайт */}
                        <div className="space-y-2">
                            <Label htmlFor="website" className="flex items-center">
                                <Globe className="h-4 w-4 mr-2 text-orange-600" />
                                Веб-сайт
                            </Label>
                            <Input
                                id="website"
                                value={formData.website}
                                onChange={(e) => handleInputChange('website', e.target.value)}
                                placeholder="Введите адрес сайта"
                                className="w-full"
                            />
                        </div>
                    </div>

                    {/* Адрес */}
                    <div className="space-y-2">
                        <Label htmlFor="address" className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-purple-600" />
                            Адрес
                        </Label>
                        <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                            placeholder="Введите адрес"
                            className="w-full"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Предварительный просмотр */}
            {contacts && (
                <Card className="bg-gray-50 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-lg text-gray-700">
                            Предварительный просмотр
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium text-gray-600">Компания:</span>
                                <p className="text-gray-800">{formData.company_name}</p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-600">Статус:</span>
                                <p className="text-gray-800">{formData.legal_status}</p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-600">ИНН:</span>
                                <p className="text-gray-800">{formData.inn}</p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-600">Телефон:</span>
                                <p className="text-gray-800">{formData.phone}</p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-600">Email:</span>
                                <p className="text-gray-800">{formData.email}</p>
                            </div>
                            {formData.website && (
                                <div>
                                    <span className="font-medium text-gray-600">Сайт:</span>
                                    <p className="text-gray-800">{formData.website}</p>
                                </div>
                            )}
                            {formData.address && (
                                <div className="md:col-span-2">
                                    <span className="font-medium text-gray-600">Адрес:</span>
                                    <p className="text-gray-800">{formData.address}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

