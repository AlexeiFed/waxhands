/**
 * @file: PrivacyPolicyTab.tsx
 * @description: Вкладка администратора для управления политикой конфиденциальности
 * @dependencies: Card, Button, Input, Textarea, useAuth, api
 * @created: 2024-12-25
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { PrivacyPolicy, CreatePrivacyPolicyRequest, UpdatePrivacyPolicyRequest } from '@/types';
import {
    Shield,
    Save,
    Download,
    AlertCircle,
    Loader2,
    FileText,
    Plus,
    Edit3,
    Trash2,
    Eye
} from 'lucide-react';

export default function PrivacyPolicyTab() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [privacyPolicies, setPrivacyPolicies] = useState<PrivacyPolicy[]>([]);
    const [currentPolicy, setCurrentPolicy] = useState<PrivacyPolicy | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Форма для создания/редактирования
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        version: ''
    });

    const fetchPrivacyPolicies = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const policies = await api.privacyPolicy.getAllPolicies();
            setPrivacyPolicies(policies);

            // Находим активную политику
            const activePolicy = policies.find(p => p.is_active);
            setCurrentPolicy(activePolicy || null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Не удалось загрузить политики конфиденциальности');
            toast({
                title: "Ошибка",
                description: "Не удалось загрузить политики конфиденциальности",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchPrivacyPolicies();
    }, [fetchPrivacyPolicies]);

    const handleCreateNew = () => {
        setIsCreating(true);
        setIsEditing(false);
        setFormData({
            title: 'Политика конфиденциальности',
            content: '',
            version: '1.0'
        });
    };

    const handleEdit = (policy: PrivacyPolicy) => {
        setIsEditing(true);
        setIsCreating(false);
        setFormData({
            title: policy.title,
            content: policy.content,
            version: policy.version
        });
    };

    const handleCancel = () => {
        setIsCreating(false);
        setIsEditing(false);
        setFormData({
            title: '',
            content: '',
            version: ''
        });
    };

    const handleSave = async () => {
        if (!formData.title.trim() || !formData.content.trim() || !formData.version.trim()) {
            toast({
                title: "Ошибка",
                description: "Все поля обязательны для заполнения",
                variant: "destructive",
            });
            return;
        }

        try {
            setSaving(true);

            if (isCreating) {
                const newPolicy = await api.privacyPolicy.createPolicy(formData as CreatePrivacyPolicyRequest);
                toast({
                    title: "Успех",
                    description: "Политика конфиденциальности создана",
                });
            } else if (isEditing && currentPolicy) {
                const updatedPolicy = await api.privacyPolicy.updatePolicy(
                    currentPolicy.id,
                    formData as UpdatePrivacyPolicyRequest
                );
                toast({
                    title: "Успех",
                    description: "Политика конфиденциальности обновлена",
                });
            }

            await fetchPrivacyPolicies();
            handleCancel();
        } catch (err) {
            toast({
                title: "Ошибка",
                description: "Не удалось сохранить политику конфиденциальности",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleActivate = async (policyId: string) => {
        try {
            await api.privacyPolicy.activatePolicy(policyId);
            toast({
                title: "Успех",
                description: "Политика конфиденциальности активирована",
            });
            await fetchPrivacyPolicies();
        } catch (err) {
            toast({
                title: "Ошибка",
                description: "Не удалось активировать политику конфиденциальности",
                variant: "destructive",
            });
        }
    };

    const handleDelete = async (policyId: string) => {
        if (!confirm('Вы уверены, что хотите удалить эту политику конфиденциальности?')) {
            return;
        }

        try {
            await api.privacyPolicy.deletePolicy(policyId);
            toast({
                title: "Успех",
                description: "Политика конфиденциальности удалена",
            });
            await fetchPrivacyPolicies();
        } catch (err) {
            toast({
                title: "Ошибка",
                description: "Не удалось удалить политику конфиденциальности",
                variant: "destructive",
            });
        }
    };

    const handleDownloadPDF = async (policy: PrivacyPolicy) => {
        try {
            setIsDownloading(true);
            const blob = await api.privacyPolicy.downloadPolicyPdf(policy.id);

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `privacy-policy-${policy.version}-${new Date().toISOString().split('T')[0]}.pdf`;
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
            <div className="space-y-6">
                <Card>
                    <CardContent className="p-8">
                        <div className="flex items-center justify-center space-x-2">
                            <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                            <span className="text-lg text-gray-600">Загрузка политик конфиденциальности...</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardContent className="p-8">
                        <div className="text-center">
                            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">
                                Ошибка загрузки
                            </h2>
                            <p className="text-gray-600 mb-4">{error}</p>
                            <Button onClick={fetchPrivacyPolicies} variant="outline">
                                Попробовать снова
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Заголовок и кнопки */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-orange-500 to-purple-500 rounded-full p-2">
                        <Shield className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Политика конфиденциальности</h2>
                        <p className="text-gray-600">Управление политикой конфиденциальности и обработкой персональных данных</p>
                    </div>
                </div>
                <Button
                    onClick={handleCreateNew}
                    className="bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600 text-white"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Создать новую
                </Button>
            </div>

            {/* Форма создания/редактирования */}
            {(isCreating || isEditing) && (
                <Card className="border-2 border-orange-200">
                    <CardHeader>
                        <CardTitle className="text-orange-700">
                            {isCreating ? 'Создание новой политики конфиденциальности' : 'Редактирование политики конфиденциальности'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="title">Название</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Название политики конфиденциальности"
                                />
                            </div>
                            <div>
                                <Label htmlFor="version">Версия</Label>
                                <Input
                                    id="version"
                                    value={formData.version}
                                    onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                                    placeholder="1.0"
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="content">Содержимое (HTML)</Label>
                            <Textarea
                                id="content"
                                value={formData.content}
                                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                                placeholder="Введите содержимое политики конфиденциальности в формате HTML..."
                                rows={15}
                                className="font-mono text-sm"
                            />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <Button
                                onClick={handleCancel}
                                variant="outline"
                                disabled={saving}
                            >
                                Отмена
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                {saving ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                )}
                                {saving ? 'Сохранение...' : 'Сохранить'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Список политик конфиденциальности */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-gray-800">Все политики конфиденциальности</CardTitle>
                </CardHeader>
                <CardContent>
                    {privacyPolicies.length === 0 ? (
                        <div className="text-center py-8">
                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">Политики конфиденциальности не найдены</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {privacyPolicies.map((policy) => (
                                <div
                                    key={policy.id}
                                    className={`border rounded-lg p-4 ${policy.is_active
                                            ? 'border-green-200 bg-green-50'
                                            : 'border-gray-200 bg-white'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <h3 className="text-lg font-semibold text-gray-800">
                                                    {policy.title}
                                                </h3>
                                                {policy.is_active && (
                                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                                        Активная
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">
                                                Версия: {policy.version}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Создана: {new Date(policy.created_at).toLocaleDateString('ru-RU')}
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                onClick={() => handleDownloadPDF(policy)}
                                                variant="outline"
                                                size="sm"
                                                disabled={isDownloading}
                                                className="text-blue-600 hover:text-blue-700"
                                            >
                                                {isDownloading ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Download className="h-4 w-4" />
                                                )}
                                            </Button>
                                            <Button
                                                onClick={() => handleEdit(policy)}
                                                variant="outline"
                                                size="sm"
                                                className="text-orange-600 hover:text-orange-700"
                                            >
                                                <Edit3 className="h-4 w-4" />
                                            </Button>
                                            {!policy.is_active && (
                                                <Button
                                                    onClick={() => handleActivate(policy.id)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-green-600 hover:text-green-700"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button
                                                onClick={() => handleDelete(policy.id)}
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
