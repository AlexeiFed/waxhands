/**
 * @file: OffersTab.tsx
 * @description: Вкладка управления офертами для администратора
 * @dependencies: Card, Button, Dialog, Textarea, Input, Badge, useToast, api
 * @created: 2024-12-19
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Offer, CreateOfferRequest, UpdateOfferRequest } from '@/types';
import {
    FileText,
    Plus,
    Edit,
    Trash2,
    CheckCircle,
    Clock,
    AlertCircle,
    Loader2,
    Eye,
    Save,
    Download
} from 'lucide-react';

export default function OffersTab() {
    const { toast } = useToast();
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
    const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);

    // Форма создания/редактирования
    const [formData, setFormData] = useState<CreateOfferRequest>({
        title: '',
        content: '',
        version: ''
    });

    useEffect(() => {
        fetchOffers();
    }, []);

    const fetchOffers = async () => {
        try {
            setLoading(true);
            setError(null);
            const offersData = await api.offers.getOffers();
            setOffers(offersData);
        } catch (err) {
            console.error('Ошибка при загрузке оферт:', err);
            setError(err instanceof Error ? err.message : 'Не удалось загрузить оферты');
            toast({
                title: "Ошибка",
                description: "Не удалось загрузить оферты",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOffer = async () => {
        if (!formData.title || !formData.content || !formData.version) {
            toast({
                title: "Ошибка",
                description: "Заполните все обязательные поля",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsSaving(true);
            await api.offers.createOffer(formData);
            toast({
                title: "Успех",
                description: "Оферта успешно создана",
            });
            setIsCreateDialogOpen(false);
            setFormData({ title: '', content: '', version: '' });
            fetchOffers();
        } catch (err) {
            console.error('Ошибка при создании оферты:', err);
            toast({
                title: "Ошибка",
                description: err instanceof Error ? err.message : 'Не удалось создать оферту',
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateOffer = async () => {
        if (!selectedOffer || !formData.title || !formData.content || !formData.version) {
            toast({
                title: "Ошибка",
                description: "Заполните все обязательные поля",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsSaving(true);
            await api.offers.updateOffer(selectedOffer.id, formData);
            toast({
                title: "Успех",
                description: "Оферта успешно обновлена",
            });
            setIsEditDialogOpen(false);
            setSelectedOffer(null);
            setFormData({ title: '', content: '', version: '' });
            fetchOffers();
        } catch (err) {
            console.error('Ошибка при обновлении оферты:', err);
            toast({
                title: "Ошибка",
                description: err instanceof Error ? err.message : 'Не удалось обновить оферту',
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleActivateOffer = async (offer: Offer) => {
        try {
            await api.offers.activateOffer(offer.id);
            toast({
                title: "Успех",
                description: `Оферта "${offer.title}" активирована`,
            });
            fetchOffers();
        } catch (err) {
            console.error('Ошибка при активации оферты:', err);
            toast({
                title: "Ошибка",
                description: err instanceof Error ? err.message : 'Не удалось активировать оферту',
                variant: "destructive",
            });
        }
    };

    const handleDeleteOffer = async (offer: Offer) => {
        if (!confirm(`Вы уверены, что хотите удалить оферту "${offer.title}"?`)) {
            return;
        }

        try {
            await api.offers.deleteOffer(offer.id);
            toast({
                title: "Успех",
                description: "Оферта успешно удалена",
            });
            fetchOffers();
        } catch (err) {
            console.error('Ошибка при удалении оферты:', err);
            toast({
                title: "Ошибка",
                description: err instanceof Error ? err.message : 'Не удалось удалить оферту',
                variant: "destructive",
            });
        }
    };

    const handleDownloadPdf = async (offer: Offer) => {
        try {
            setDownloadingPdf(offer.id);
            const blob = await api.offers.downloadPdf(offer.id);

            // Создаем ссылку для скачивания
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `offer-${offer.version}-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast({
                title: 'PDF скачан',
                description: 'Оферта успешно скачана в формате PDF',
            });
        } catch (err) {
            console.error('Ошибка скачивания PDF:', err);
            toast({
                title: 'Ошибка',
                description: 'Не удалось скачать PDF оферты',
                variant: 'destructive',
            });
        } finally {
            setDownloadingPdf(null);
        }
    };

    const openEditDialog = (offer: Offer) => {
        setSelectedOffer(offer);
        setFormData({
            title: offer.title,
            content: offer.content,
            version: offer.version
        });
        setIsEditDialogOpen(true);
    };

    const openPreviewDialog = (offer: Offer) => {
        setSelectedOffer(offer);
        setIsPreviewDialogOpen(true);
    };

    const resetForm = () => {
        setFormData({ title: '', content: '', version: '' });
        setSelectedOffer(null);
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-center p-8">
                    <div className="flex items-center space-x-2">
                        <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                        <span className="text-lg text-gray-600">Загрузка оферт...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <Card className="bg-white shadow-lg">
                    <CardContent className="p-8">
                        <div className="text-center">
                            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">
                                Ошибка загрузки оферт
                            </h2>
                            <p className="text-gray-600 mb-4">{error}</p>
                            <Button onClick={fetchOffers} variant="outline">
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
            {/* Заголовок и кнопка создания */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Управление офертами</h2>
                    <p className="text-gray-600">Создание и редактирование оферт для мастер-классов</p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm} className="bg-orange-600 hover:bg-orange-700">
                            <Plus className="h-4 w-4 mr-2" />
                            Создать оферту
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Создание новой оферты</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="title">Название оферты</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Введите название оферты"
                                />
                            </div>
                            <div>
                                <Label htmlFor="version">Версия</Label>
                                <Input
                                    id="version"
                                    value={formData.version}
                                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                                    placeholder="Например: 1.0, 1.1, 2.0"
                                />
                            </div>
                            <div>
                                <Label htmlFor="content">Содержимое оферты (HTML)</Label>
                                <Textarea
                                    id="content"
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="Введите содержимое оферты в HTML формате"
                                    rows={20}
                                    className="font-mono text-sm"
                                />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsCreateDialogOpen(false)}
                                >
                                    Отмена
                                </Button>
                                <Button
                                    onClick={handleCreateOffer}
                                    disabled={isSaving}
                                    className="bg-orange-600 hover:bg-orange-700"
                                >
                                    {isSaving ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4 mr-2" />
                                    )}
                                    Создать
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Список оферт */}
            <div className="grid gap-4">
                {offers.length === 0 ? (
                    <Card className="bg-white shadow-lg">
                        <CardContent className="p-8">
                            <div className="text-center">
                                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                    Оферты не найдены
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    Создайте первую оферту для мастер-классов
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    offers.map((offer) => (
                        <Card key={offer.id} className="bg-white shadow-lg">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <FileText className="h-5 w-5 text-orange-600" />
                                        <div>
                                            <CardTitle className="text-lg">{offer.title}</CardTitle>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <Badge variant={offer.is_active ? "default" : "secondary"}>
                                                    {offer.is_active ? "Активна" : "Неактивна"}
                                                </Badge>
                                                <span className="text-sm text-gray-500">
                                                    Версия {offer.version}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    {new Date(offer.created_at).toLocaleDateString('ru-RU')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openPreviewDialog(offer)}
                                        >
                                            <Eye className="h-4 w-4 mr-1" />
                                            Просмотр
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDownloadPdf(offer)}
                                            disabled={downloadingPdf === offer.id}
                                            className="text-blue-600 hover:text-blue-700"
                                        >
                                            {downloadingPdf === offer.id ? (
                                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                            ) : (
                                                <Download className="h-4 w-4 mr-1" />
                                            )}
                                            {downloadingPdf === offer.id ? 'Скачивание...' : 'PDF'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openEditDialog(offer)}
                                        >
                                            <Edit className="h-4 w-4 mr-1" />
                                            Редактировать
                                        </Button>
                                        {!offer.is_active && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleActivateOffer(offer)}
                                                className="text-green-600 hover:text-green-700"
                                            >
                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                Активировать
                                            </Button>
                                        )}
                                        {!offer.is_active && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDeleteOffer(offer)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4 mr-1" />
                                                Удалить
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    ))
                )}
            </div>

            {/* Диалог редактирования */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Редактирование оферты</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="edit-title">Название оферты</Label>
                            <Input
                                id="edit-title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Введите название оферты"
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-version">Версия</Label>
                            <Input
                                id="edit-version"
                                value={formData.version}
                                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                                placeholder="Например: 1.0, 1.1, 2.0"
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-content">Содержимое оферты (HTML)</Label>
                            <Textarea
                                id="edit-content"
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                placeholder="Введите содержимое оферты в HTML формате"
                                rows={20}
                                className="font-mono text-sm"
                            />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsEditDialogOpen(false)}
                            >
                                Отмена
                            </Button>
                            <Button
                                onClick={handleUpdateOffer}
                                disabled={isSaving}
                                className="bg-orange-600 hover:bg-orange-700"
                            >
                                {isSaving ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                )}
                                Сохранить
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Диалог предварительного просмотра */}
            <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Предварительный просмотр оферты</DialogTitle>
                    </DialogHeader>
                    {selectedOffer && (
                        <div className="space-y-4">
                            <div className="border-b pb-4">
                                <h3 className="text-xl font-semibold text-orange-700">
                                    {selectedOffer.title}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Версия {selectedOffer.version} • {new Date(selectedOffer.created_at).toLocaleDateString('ru-RU')}
                                </p>
                            </div>
                            <div
                                className="prose prose-lg max-w-none prose-headings:text-orange-700 prose-headings:font-semibold prose-p:text-gray-700 prose-ul:text-gray-700 prose-li:text-gray-700"
                                dangerouslySetInnerHTML={{ __html: selectedOffer.content }}
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
