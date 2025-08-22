/**
 * @file: MasterClassDetails.tsx
 * @description: Модальное окно с детальной информацией о мастер-классе для администратора
 * @dependencies: ui components, types, api
 * @created: 2024-12-19
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useUpdateParticipantPaymentStatus } from '@/hooks/use-master-classes';
import { MasterClassParticipant, MasterClassStatistics, Service } from '@/types/services';
import { UserCheck, UserX, MessageCircle, Users, DollarSign, Calendar, Clock, MapPin, Building, Filter, RefreshCw, FileText, Phone, User, CheckCircle, AlertCircle, CreditCard, TrendingUp, Download, FileSpreadsheet, FileText as FileTextIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { exportToExcel } from '@/lib/export-utils';

interface MasterClassDetailsProps {
    masterClass: {
        id: string;
        date: string;
        time: string;
        schoolId: string;
        schoolName: string;
        classGroup: string;
        city: string;
        serviceId: string;
        serviceName: string;
        executors: string[];
        notes?: string;
        participants: MasterClassParticipant[];
        statistics: {
            totalParticipants: number;
            totalAmount: number;
            paidAmount: number;
            unpaidAmount: number;
            stylesStats: { [key: string]: number };
            optionsStats: { [key: string]: number };
        };
        createdAt: string;
        updatedAt: string;
    };
    service: Service;
}

export const MasterClassDetails: React.FC<MasterClassDetailsProps> = ({ masterClass, service }) => {
    const [stats, setStats] = useState<MasterClassStatistics | null>(null);
    const [loading, setLoading] = useState(false);
    const [schoolData, setSchoolData] = useState<{ teacher?: string; teacherPhone?: string } | null>(null);
    const [participants, setParticipants] = useState<MasterClassParticipant[]>(
        masterClass.participants.map(p => ({
            ...p,
            hasReceived: p.hasReceived || false
        }))
    );

    // Состояние для фильтра по статусу оплаты
    const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');

    // Состояние для режима редактирования
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        date: masterClass.date,
        time: masterClass.time,
        executors: masterClass.executors, // executors уже string[]
        notes: masterClass.notes || ''
    });
    const [availableExecutors, setAvailableExecutors] = useState<Array<{ id: string; name: string }>>([]);
    const [loadingExecutors, setLoadingExecutors] = useState(false);

    // Состояние для модального окна предварительного просмотра сообщения
    const [isMessagePreviewOpen, setIsMessagePreviewOpen] = useState(false);
    const [previewMessage, setPreviewMessage] = useState('');
    const [messageType, setMessageType] = useState<'teacher' | 'admin'>('teacher');

    const { toast } = useToast();
    const updatePaymentStatusMutation = useUpdateParticipantPaymentStatus();

    // Загружаем актуальные данные участников при изменении masterClass
    useEffect(() => {
        if (masterClass.participants && masterClass.participants.length > 0) {
            console.log('🔍 MasterClassDetails: Загружаем участников:', masterClass.participants);
            setParticipants(masterClass.participants.map(p => ({
                ...p,
                hasReceived: p.hasReceived || false
            })));
        } else {
            console.log('⚠️ MasterClassDetails: Нет участников в masterClass');
            setParticipants([]);
        }
    }, [masterClass.participants]);

    // Получение отфильтрованных участников
    const getFilteredParticipants = (): MasterClassParticipant[] => {
        switch (paymentStatusFilter) {
            case 'paid':
                return participants.filter(p => p.isPaid);
            case 'unpaid':
                return participants.filter(p => !p.isPaid);
            default:
                return participants;
        }
    };

    // Получение статистики по отфильтрованным участникам
    const getFilteredStatistics = () => {
        const filteredParticipants = getFilteredParticipants();
        const totalAmount = filteredParticipants.reduce((sum, p) => sum + p.totalAmount, 0);
        const paidAmount = filteredParticipants.filter(p => p.isPaid).reduce((sum, p) => sum + p.totalAmount, 0);
        const unpaidAmount = totalAmount - paidAmount;

        return {
            totalParticipants: filteredParticipants.length,
            totalAmount,
            paidAmount,
            unpaidAmount
        };
    };

    // Функция для форматирования сообщения для учителя
    const formatTeacherMessage = () => {
        const participants = masterClass.participants || [];
        const allParticipants = participants.filter(p => !p.isPaid || p.isPaid); // Все участники
        const participantNames = allParticipants.map(p => `• ${p.childName}`).join('\n');

        return `Учащиеся вашего класса №${masterClass.classGroup} в количестве ${allParticipants.length} человек участвуют в мастер-классе "${service.name}" ${masterClass.date} в ${masterClass.time}.

Участники:
${participantNames}

С уважением,
Администрация`;
    };

    // Функция для форматирования сообщения для администратора
    const formatAdminMessage = () => {
        const participants = masterClass.participants || [];
        const paidParticipants = participants.filter(p => p.isPaid);
        const unpaidParticipants = participants.filter(p => !p.isPaid);

        const paidNames = paidParticipants.map(p => `• ${p.childName}`).join('\n');
        const unpaidNames = unpaidParticipants.map(p => `• ${p.childName}`).join('\n');

        let message = `Мастер-класс "${service.name}" ${masterClass.date} в ${masterClass.time}

Класс: №${masterClass.classGroup}
Общее количество участников: ${participants.length}

`;

        if (paidParticipants.length > 0) {
            message += `✅ ОПЛАЧЕННЫЕ (${paidParticipants.length}):
${paidNames}

`;
        }

        if (unpaidParticipants.length > 0) {
            message += `❌ НЕ ОПЛАЧЕННЫЕ (${unpaidParticipants.length}):
${unpaidNames}

`;
        }

        message += `С уважением,
Администрация`;

        return message;
    };

    // Функция для отправки сообщения учителю
    const sendTeacherMessage = () => {
        const message = formatTeacherMessage();
        setPreviewMessage(message);
        setMessageType('teacher');
        setIsMessagePreviewOpen(true);
    };

    // Функция для отправки сообщения администратору
    const sendAdminMessage = () => {
        const message = formatAdminMessage();
        setPreviewMessage(message);
        setMessageType('admin');
        setIsMessagePreviewOpen(true);
    };

    // Функция для отправки отредактированного сообщения через WhatsApp
    const sendWhatsAppMessage = (message: string) => {
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');

        setIsMessagePreviewOpen(false);
        toast({
            title: "Сообщение отправлено",
            description: `Откройте WhatsApp и отправьте сообщение ${messageType === 'teacher' ? 'учителю' : 'администратору'}`,
        });
    };

    // Функция для сброса к исходному тексту сообщения
    const resetToOriginalMessage = () => {
        if (messageType === 'teacher') {
            setPreviewMessage(formatTeacherMessage());
        } else {
            setPreviewMessage(formatAdminMessage());
        }
    };

    // Функция для закрытия модального окна предварительного просмотра
    const closeMessagePreview = () => {
        setIsMessagePreviewOpen(false);
        setPreviewMessage('');
    };

    useEffect(() => {
        loadStats();
        loadSchoolData();
        loadExecutors(); // Загрузка исполнителей при монтировании
        console.log('MasterClass data:', masterClass);
        console.log('Participants:', participants);
    }, [masterClass.id]);

    const loadStats = async () => {
        setLoading(true);
        try {
            // Используем локальную статистику вместо API вызова
            const localStats: MasterClassStatistics = {
                ...masterClass.statistics,
                stylesStats: {},
                optionsStats: {}
            };
            setStats(localStats);
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSchoolData = async () => {
        try {
            // Упрощаем загрузку данных школы
            setSchoolData({
                teacher: 'Учитель не указан',
                teacherPhone: 'Телефон не указан'
            });
        } catch (error) {
            console.error('Error loading school data:', error);
        }
    };

    // Загрузка доступных исполнителей
    const loadExecutors = async () => {
        setLoadingExecutors(true);
        try {
            // Упрощаем загрузку исполнителей
            setAvailableExecutors([
                { id: '1', name: 'Исполнитель 1' },
                { id: '2', name: 'Исполнитель 2' }
            ]);
        } catch (error) {
            console.error('Error loading executors:', error);
        } finally {
            setLoadingExecutors(false);
        }
    };

    // Сохранение изменений
    const handleSaveChanges = async () => {
        try {
            // Упрощаем сохранение изменений
            console.log('Saving changes:', editData);

            // Обновляем локальное состояние
            Object.assign(masterClass, {
                date: editData.date,
                time: editData.time,
                executors: editData.executors.map(id => ({ id, name: availableExecutors.find(e => e.id === id)?.name || id })),
                notes: editData.notes
            });

            setIsEditing(false);
            toast({
                title: "Успешно",
                description: "Изменения сохранены",
            });
        } catch (error) {
            console.error('Error saving changes:', error);
            toast({
                title: "Ошибка",
                description: "Не удалось сохранить изменения",
                variant: "destructive"
            });
        }
    };

    // Отмена редактирования
    const handleCancelEdit = () => {
        setEditData({
            date: masterClass.date,
            time: masterClass.time,
            executors: masterClass.executors, // executors уже string[]
            notes: masterClass.notes || ''
        });
        setIsEditing(false);
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return dateString;
            }
            return date.toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch (error) {
            return dateString;
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
        }).format(amount);
    };

    const formatDateTime = (dateString: string, timeString: string) => {
        try {
            const date = new Date(dateString + 'T' + timeString);
            if (isNaN(date.getTime())) {
                return `${dateString} ${timeString}`;
            }
            return date.toLocaleString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return `${dateString} ${timeString}`;
        }
    };

    const handlePaymentStatusChange = async (participantId: string, isPaid: boolean) => {
        try {
            await updatePaymentStatusMutation.mutateAsync({
                masterClassId: masterClass.id,
                participantId,
                isPaid
            });

            // Обновляем локальное состояние
            setParticipants(prev => prev.map(p =>
                p.id === participantId ? { ...p, isPaid } : p
            ));

            toast({
                title: "Статус оплаты обновлен",
                description: `Статус оплаты участника изменен на ${isPaid ? 'оплачено' : 'не оплачено'}`,
            });
        } catch (error) {
            console.error('Error updating payment status:', error);
            toast({
                title: "Ошибка",
                description: "Не удалось обновить статус оплаты",
                variant: "destructive",
            });
        }
    };

    const handleServiceReceivedChange = async (participantId: string, hasReceived: boolean) => {
        try {
            // TODO: API call to update service received status
            setParticipants(prev => prev.map(p =>
                p.id === participantId ? { ...p, hasReceived } : p
            ));

            toast({
                title: "Статус получения обновлен",
                description: `Статус получения услуги изменен на ${hasReceived ? 'получено' : 'не получено'}`,
            });
        } catch (error) {
            console.error('Error updating service received status:', error);
            toast({
                title: "Ошибка",
                description: "Не удалось обновить статус получения услуги",
                variant: "destructive",
            });
        }
    };

    const getStyleOptionNames = (styleIds: string[], optionIds: string[]) => {
        if (!service) {
            return {
                styles: styleIds.join(', '),
                options: optionIds.join(', ')
            };
        }

        const styleNames = styleIds.map(id => {
            const style = service.styles.find(s => s.id === id);
            return style ? style.name : id;
        });

        const optionNames = optionIds.map(id => {
            const option = service.options.find(o => o.id === id);
            return option ? option.name : id;
        });

        return {
            styles: styleNames.join(', '),
            options: optionNames.join(', ')
        };
    };

    return (
        <div className="space-y-6 p-6 max-h-screen overflow-y-auto">
            {/* Заголовок */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-primary">{service.name}</h2>
                </div>
                <Badge variant="outline" className="text-xl px-6 py-3">
                    {masterClass.classGroup}
                </Badge>
            </div>

            {/* Информация о мастер-классе */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-2xl">
                        <FileText className="h-6 w-6" />
                        Информация о мастер-классе
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditing(!isEditing)}
                            className="ml-auto"
                        >
                            {isEditing ? 'Отменить' : 'Редактировать'}
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                            <Calendar className="w-6 h-6 text-blue-600" />
                            <div className="flex-1">
                                <p className="font-medium">Дата</p>
                                {isEditing ? (
                                    <input
                                        type="date"
                                        value={editData.date}
                                        onChange={(e) => setEditData(prev => ({ ...prev, date: e.target.value }))}
                                        className="text-sm text-blue-600 bg-white border border-blue-200 rounded px-2 py-1 w-full"
                                    />
                                ) : (
                                    <p className="text-sm text-blue-600">{formatDate(masterClass.date)}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                            <Clock className="w-6 h-6 text-green-600" />
                            <div className="flex-1">
                                <p className="font-medium">Время</p>
                                {isEditing ? (
                                    <input
                                        type="time"
                                        value={editData.time}
                                        onChange={(e) => setEditData(prev => ({ ...prev, time: e.target.value }))}
                                        className="text-sm text-green-600 bg-white border border-green-200 rounded px-2 py-1 w-full"
                                    />
                                ) : (
                                    <p className="text-sm text-green-600">{masterClass.time}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
                            <MapPin className="w-6 h-6 text-purple-600" />
                            <div>
                                <p className="font-medium">Место проведения</p>
                                <p className="text-sm text-purple-600">{masterClass.schoolName}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg">
                            <Users className="w-6 h-6 text-orange-600" />
                            <div>
                                <p className="font-medium">Класс</p>
                                <p className="text-sm text-orange-600">{masterClass.classGroup}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div className="space-y-3">
                            <Label className="text-lg font-semibold">Исполнители:</Label>
                            {isEditing ? (
                                <div className="space-y-3">
                                    {loadingExecutors ? (
                                        <p className="text-sm text-muted-foreground">Загрузка исполнителей...</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {availableExecutors.map((executor) => (
                                                <label key={executor.id} className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={editData.executors.includes(executor.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setEditData(prev => ({
                                                                    ...prev,
                                                                    executors: [...prev.executors, executor.id]
                                                                }));
                                                            } else {
                                                                setEditData(prev => ({
                                                                    ...prev,
                                                                    executors: prev.executors.filter(id => id !== executor.id)
                                                                }));
                                                            }
                                                        }}
                                                        className="rounded"
                                                    />
                                                    <span className="text-sm">{executor.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {masterClass.executors.map((executor) => (
                                        <div key={executor} className="flex items-center space-x-2">
                                            <User className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-sm">{executor}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <Label className="text-lg font-semibold">Контактное лицо:</Label>
                            <div className="space-y-2">
                                {schoolData?.teacher ? (
                                    <div className="flex items-center space-x-2 p-3 bg-muted rounded-md">
                                        <User className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm">{schoolData.teacher}</span>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-sm">Не указано</p>
                                )}
                                {schoolData?.teacherPhone && (
                                    <div className="flex items-center space-x-2 p-3 bg-muted rounded-md">
                                        <Phone className="w-4 h-4 text-green-600" />
                                        <span className="text-sm">{schoolData.teacherPhone}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {isEditing && (
                        <div className="flex space-x-3 mt-6">
                            <Button onClick={handleSaveChanges} className="bg-green-600 hover:bg-green-700">
                                Сохранить изменения
                            </Button>
                            <Button onClick={handleCancelEdit} variant="outline">
                                Отмена
                            </Button>
                        </div>
                    )}

                    {/* Примечания - всегда отображаем для возможности редактирования */}
                    <div className="mt-6">
                        <div className="space-y-3">
                            <Label className="text-lg font-semibold">Примечания:</Label>
                            {isEditing ? (
                                <textarea
                                    value={editData.notes}
                                    onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Введите примечания к мастер-классу..."
                                    className="text-sm text-blue-600 bg-white border border-blue-200 rounded px-2 py-1 w-full h-24"
                                />
                            ) : (
                                <div className="min-h-[6rem]">
                                    {masterClass.notes ? (
                                        <p className="text-muted-foreground bg-muted p-4 rounded-md text-base">
                                            {masterClass.notes}
                                        </p>
                                    ) : (
                                        <p className="text-muted-foreground bg-muted/30 p-4 rounded-md text-base italic">
                                            Примечания не добавлены
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Статистика */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-2xl">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                        Статистика
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                        <div className="text-center p-6 bg-blue-50 rounded-lg">
                            <div className="text-3xl font-bold text-blue-600">{masterClass.statistics.totalParticipants}</div>
                            <div className="text-base text-blue-600">Участников</div>
                        </div>
                        <div className="text-center p-6 bg-green-50 rounded-lg">
                            <div className="text-3xl font-bold text-green-600">{formatCurrency(masterClass.statistics.totalAmount)}</div>
                            <div className="text-base text-green-600">Общая сумма</div>
                        </div>
                        <div className="text-center p-6 bg-purple-50 rounded-lg">
                            <div className="text-3xl font-bold text-purple-600">{formatCurrency(masterClass.statistics.paidAmount)}</div>
                            <div className="text-base text-purple-600">Оплатили</div>
                        </div>
                        <div className="text-center p-6 bg-orange-50 rounded-lg">
                            <div className="text-3xl font-bold text-orange-600">{formatCurrency(masterClass.statistics.unpaidAmount)}</div>
                            <div className="text-base text-orange-600">Не оплатили</div>
                        </div>
                    </div>

                    {/* Кнопки WhatsApp */}
                    <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                            <MessageCircle className="h-5 w-5" />
                            Отправить информацию через WhatsApp
                        </h4>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                onClick={sendTeacherMessage}
                                className="bg-green-600 hover:bg-green-700 text-white"
                                size="lg"
                            >
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Учителю класса
                            </Button>
                            <Button
                                onClick={sendAdminMessage}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                size="lg"
                            >
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Администратору
                            </Button>
                        </div>
                        <div className="mt-3 text-sm text-green-700">
                            <p>• <strong>Учителю:</strong> список всех участников класса</p>
                            <p>• <strong>Администратору:</strong> разделение по статусу оплаты</p>
                        </div>
                    </div>

                    <Separator className="my-6" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="text-lg font-semibold">Статистика по вариантам ручек:</h4>
                            <div className="space-y-2">
                                {Object.entries(masterClass.statistics.stylesStats).map(([styleId, count]) => (
                                    <div key={styleId} className="flex justify-between items-center p-2 bg-muted rounded">
                                        <span className="text-sm">{styleId}</span>
                                        <Badge variant="secondary">{count}</Badge>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-lg font-semibold">Статистика по дополнительным услугам:</h4>
                            <div className="space-y-2">
                                {Object.entries(masterClass.statistics.optionsStats).map(([optionId, count]) => (
                                    <div key={optionId} className="flex justify-between items-center p-2 bg-muted rounded">
                                        <span className="text-sm">{optionId}</span>
                                        <Badge variant="secondary">{count}</Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Таблица участников */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-2xl">
                        <Users className="h-6 w-6" />
                        Участники
                        {paymentStatusFilter !== 'all' && (
                            <Badge variant="secondary" className="text-sm ml-2">
                                {paymentStatusFilter === 'paid' ? 'Оплаченные' : 'Ожидающие оплаты'}
                            </Badge>
                        )}
                        <Badge variant="outline" className="text-sm ml-auto">
                            {getFilteredParticipants().length} из {participants.length}
                        </Badge>
                    </CardTitle>
                    <CardDescription>
                        {paymentStatusFilter === 'all'
                            ? 'Список всех участников мастер-класса'
                            : paymentStatusFilter === 'paid'
                                ? 'Список участников с подтвержденной оплатой'
                                : 'Список участников, ожидающих оплаты'
                        }
                        {paymentStatusFilter !== 'all' && (
                            <span className="ml-2 text-xs text-muted-foreground">
                                • Показано {getFilteredParticipants().length} из {participants.length} участников
                            </span>
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 p-3 bg-muted rounded">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Количество участников: {getFilteredParticipants().length} из {participants.length}
                            </p>
                            <div className="flex items-center space-x-4 text-sm">
                                <span className="text-green-600">
                                    Оплачено: {getFilteredStatistics().paidAmount.toLocaleString('ru-RU')} ₽
                                </span>
                                <span className="text-red-600">
                                    Ожидает: {getFilteredStatistics().unpaidAmount.toLocaleString('ru-RU')} ₽
                                </span>
                                <span className="text-blue-600">
                                    Всего: {getFilteredStatistics().totalAmount.toLocaleString('ru-RU')} ₽
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Фильтр по статусу оплаты */}
                    <div className="flex items-center justify-between mb-4 p-3 bg-muted/50 rounded-lg border">
                        <div className="flex items-center space-x-3">
                            <Filter className="w-4 h-4 text-muted-foreground" />
                            <Label className="text-sm font-medium">Фильтр по статусу оплаты:</Label>
                            <Select onValueChange={(value) => setPaymentStatusFilter(value as 'all' | 'paid' | 'unpaid')} value={paymentStatusFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Выберите статус" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Все участники</SelectItem>
                                    <SelectItem value="paid">Оплаченные</SelectItem>
                                    <SelectItem value="unpaid">Ожидающие оплаты</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                            {paymentStatusFilter !== 'all' && (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPaymentStatusFilter('all')}
                                        className="text-xs"
                                    >
                                        Сбросить фильтр
                                    </Button>
                                    <Separator orientation="vertical" className="h-4" />
                                </>
                            )}
                            <div className="text-xs text-muted-foreground">
                                {paymentStatusFilter === 'all' && 'Показаны все участники'}
                                {paymentStatusFilter === 'paid' && `Показаны ${getFilteredParticipants().length} оплаченных участников`}
                                {paymentStatusFilter === 'unpaid' && `Показаны ${getFilteredParticipants().length} участников, ожидающих оплаты`}
                            </div>
                        </div>
                    </div>

                    {/* Быстрые действия для отфильтрованных участников */}
                    {paymentStatusFilter !== 'all' && getFilteredParticipants().length > 0 && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-blue-800">
                                        Быстрые действия для {getFilteredParticipants().length} отфильтрованных участников:
                                    </span>
                                </div>
                                <div className="flex space-x-2">
                                    {paymentStatusFilter === 'unpaid' && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-green-600 border-green-200 hover:bg-green-50"
                                            onClick={() => {
                                                // TODO: Массовое подтверждение оплаты
                                                alert(`Подтвердить оплату для ${getFilteredParticipants().length} участников`);
                                            }}
                                        >
                                            <UserCheck className="w-3 h-3 mr-1" />
                                            Подтвердить оплату всем
                                        </Button>
                                    )}
                                    {paymentStatusFilter === 'paid' && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-red-600 border-red-200 hover:bg-red-50"
                                            onClick={() => {
                                                // TODO: Массовое отмена оплаты
                                                alert(`Отменить оплату для ${getFilteredParticipants().length} участников`);
                                            }}
                                        >
                                            <UserX className="w-3 h-3 mr-1" />
                                            Отменить оплату всем
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Таблица участников - всегда видима */}
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="font-semibold">Участник</TableHead>
                                    {/* Динамические заголовки стилей */}
                                    {service?.styles.map(style => (
                                        <TableHead key={style.id} className="font-semibold text-center min-w-[100px]">
                                            {style.name}
                                        </TableHead>
                                    ))}
                                    {/* Динамические заголовки опций */}
                                    {service?.options.map(option => (
                                        <TableHead key={option.id} className="font-semibold text-center min-w-[100px]">
                                            {option.name}
                                        </TableHead>
                                    ))}
                                    <TableHead className="font-semibold">Сумма</TableHead>
                                    <TableHead className="font-semibold">Статус оплаты</TableHead>
                                    <TableHead className="font-semibold">Получил услугу</TableHead>
                                    <TableHead className="font-semibold">Действия</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {getFilteredParticipants().length > 0 ? (
                                    getFilteredParticipants().map((participant) => {
                                        const isPendingPayment = !participant.isPaid;
                                        const hasReceivedService = participant.hasReceived || false;

                                        // Отладочная информация для участника
                                        console.log(`🔍 MasterClassDetails: Данные участника ${participant.childName}:`, {
                                            id: participant.id,
                                            childName: participant.childName,
                                            parentName: participant.parentName,
                                            selectedStyles: participant.selectedStyles,
                                            selectedOptions: participant.selectedOptions,
                                            totalAmount: participant.totalAmount,
                                            isPaid: participant.isPaid,
                                            hasReceived: participant.hasReceived
                                        });

                                        // Создаем функцию для проверки выбран ли стиль/опция
                                        const isStyleSelected = (styleId: string) => {
                                            const result = participant.selectedStyles?.some((selected: unknown) =>
                                                typeof selected === 'string' ? selected === styleId : (selected as { id: string }).id === styleId
                                            ) || false;

                                            // Отладочная информация
                                            if (participant.selectedStyles && participant.selectedStyles.length > 0) {
                                                console.log(`🔍 isStyleSelected для ${participant.childName}, стиль ${styleId}:`, {
                                                    selectedStyles: participant.selectedStyles,
                                                    result,
                                                    styleId
                                                });
                                            }

                                            return result;
                                        };

                                        const isOptionSelected = (optionId: string) => {
                                            const result = participant.selectedOptions?.some((selected: unknown) =>
                                                typeof selected === 'string' ? selected === optionId : (selected as { id: string }).id === optionId
                                            ) || false;

                                            // Отладочная информация
                                            if (participant.selectedOptions && participant.selectedOptions.length > 0) {
                                                console.log(`🔍 isOptionSelected для ${participant.childName}, опция ${optionId}:`, {
                                                    selectedOptions: participant.selectedOptions,
                                                    result,
                                                    optionId
                                                });
                                            }

                                            return result;
                                        };

                                        return (
                                            <TableRow
                                                key={participant.id}
                                                className={`
                                                    ${isPendingPayment ? 'bg-red-100 border-l-4 border-l-red-500' : ''}
                                                    ${hasReceivedService ? 'bg-green-100 border-l-4 border-l-green-500' : ''}
                                                `}
                                            >
                                                <TableCell className="font-medium">
                                                    <div>
                                                        <p className="font-semibold">{participant.childName}</p>
                                                        {participant.childName !== participant.parentName && (
                                                            <p className="text-sm text-muted-foreground">Родитель: {participant.parentName}</p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                {/* Динамические столбцы стилей с галочками */}
                                                {service?.styles.map(style => (
                                                    <TableCell key={style.id} className="text-center">
                                                        {isStyleSelected(style.id) ? (
                                                            <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                                                        ) : (
                                                            <div className="h-5 w-5 mx-auto border-2 border-gray-300 rounded"></div>
                                                        )}
                                                    </TableCell>
                                                ))}
                                                {/* Динамические столбцы опций с галочками */}
                                                {service?.options.map(option => (
                                                    <TableCell key={option.id} className="text-center">
                                                        {isOptionSelected(option.id) ? (
                                                            <CheckCircle className="h-5 w-5 text-blue-600 mx-auto" />
                                                        ) : (
                                                            <div className="h-5 w-5 mx-auto border-2 border-gray-300 rounded"></div>
                                                        )}
                                                    </TableCell>
                                                ))}
                                                <TableCell className="font-semibold text-green-600">
                                                    {formatCurrency(participant.totalAmount)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <Switch
                                                            checked={participant.isPaid}
                                                            onCheckedChange={(checked) =>
                                                                handlePaymentStatusChange(participant.id, checked)
                                                            }
                                                        />
                                                        <Badge variant={participant.isPaid ? "default" : "destructive"}>
                                                            {participant.isPaid ? (
                                                                <>
                                                                    <UserCheck className="w-3 h-3 mr-1" />
                                                                    Оплачено
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <UserX className="w-3 h-3 mr-1" />
                                                                    Ожидает
                                                                </>
                                                            )}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <Switch
                                                            checked={hasReceivedService}
                                                            onCheckedChange={(checked) =>
                                                                handleServiceReceivedChange(participant.id, checked)
                                                            }
                                                        />
                                                        <Badge variant={hasReceivedService ? "default" : "secondary"}>
                                                            {hasReceivedService ? (
                                                                <>
                                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                                    Получил
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <AlertCircle className="w-3 h-3 mr-1" />
                                                                    Не получил
                                                                </>
                                                            )}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex space-x-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handlePaymentStatusChange(participant.id, !participant.isPaid)}
                                                            className={participant.isPaid ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'}
                                                        >
                                                            {participant.isPaid ? 'Отменить оплату' : 'Подтвердить оплату'}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleServiceReceivedChange(participant.id, !hasReceivedService)}
                                                            className={hasReceivedService ? 'text-green-600 border-green-200' : 'text-blue-600 border-blue-200'}
                                                        >
                                                            {hasReceivedService ? 'Отменить получение' : 'Отметить получение'}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    // Заглушка для пустой таблицы
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8">
                                            <div className="flex flex-col items-center space-y-3">
                                                <Users className="w-12 h-12 text-muted-foreground opacity-50" />
                                                <div>
                                                    <p className="text-lg font-medium text-muted-foreground">
                                                        Участники пока не зарегистрированы
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Таблица будет заполнена при появлении участников
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Действия */}
            <Card>
                <CardHeader>
                    <CardTitle>Действия</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Button
                        variant="outline"
                        className="w-full"
                        disabled={loading}
                    >
                        {loading ? 'Обновляем...' : 'Обновить статистику'}
                    </Button>

                    {/* Кнопки экспорта */}
                    <div className="space-y-2">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                                try {
                                    exportToExcel(masterClass, service, participants);
                                    toast({
                                        title: "Успешно!",
                                        description: "Данные экспортированы в Excel файл",
                                        variant: "default"
                                    });
                                } catch (error) {
                                    toast({
                                        title: "Ошибка!",
                                        description: "Не удалось экспортировать данные в Excel",
                                        variant: "destructive"
                                    });
                                }
                            }}
                        >
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            Экспорт в Excel
                        </Button>

                    </div>

                    {paymentStatusFilter !== 'all' && (
                        <div className="space-y-2">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                    try {
                                        const filteredParticipants = getFilteredParticipants();
                                        exportToExcel(masterClass, service, filteredParticipants);
                                        toast({
                                            title: "Успешно!",
                                            description: `Экспорт ${paymentStatusFilter === 'paid' ? 'оплаченных' : 'ожидающих оплаты'} участников в Excel`,
                                            variant: "default"
                                        });
                                    } catch (error) {
                                        toast({
                                            title: "Ошибка!",
                                            description: "Не удалось экспортировать отфильтрованные данные",
                                            variant: "destructive"
                                        });
                                    }
                                }}
                            >
                                <FileSpreadsheet className="w-4 h-4 mr-2" />
                                Excel ({getFilteredParticipants().length} участников)
                            </Button>


                        </div>
                    )}
                    <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                        {paymentStatusFilter === 'all'
                            ? 'Показаны все участники мастер-класса'
                            : `Показаны ${paymentStatusFilter === 'paid' ? 'оплаченные' : 'ожидающие оплаты'} участники (${getFilteredParticipants().length} из ${participants.length})`
                        }
                    </div>
                </CardContent>
            </Card>

            {/* Модальное окно предварительного просмотра сообщения */}
            {isMessagePreviewOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold">
                                Предварительный просмотр сообщения
                            </h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={closeMessagePreview}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </Button>
                        </div>

                        <div className="mb-4">
                            <Label className="text-base font-medium">
                                {messageType === 'teacher' ? 'Сообщение для учителя:' : 'Сообщение для администратора:'}
                            </Label>
                        </div>

                        <div className="mb-4">
                            <textarea
                                value={previewMessage}
                                onChange={(e) => setPreviewMessage(e.target.value)}
                                className="w-full h-80 p-4 border border-gray-300 rounded-md text-sm font-mono resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent leading-relaxed"
                                placeholder="Редактируйте текст сообщения..."
                                style={{ whiteSpace: 'pre-wrap' }}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Символов: {previewMessage.length}
                            </div>
                            <div className="flex space-x-3">
                                <Button
                                    variant="outline"
                                    onClick={resetToOriginalMessage}
                                    className="px-4"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Сбросить
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={closeMessagePreview}
                                    className="px-6"
                                >
                                    Отмена
                                </Button>
                                <Button
                                    onClick={() => sendWhatsAppMessage(previewMessage)}
                                    className="bg-green-600 hover:bg-green-700 px-6"
                                >
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    Отправить в WhatsApp
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}; 