/**
 * @file: MasterClassDetails.tsx
 * @description: Модальное окно с детальной информацией о мастер-классе для администратора
 * @dependencies: ui components, types, api
 * @created: 2024-12-19
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { useMasterClassesWebSocket } from '@/hooks/use-master-classes-websocket';
import { useInvoicesWebSocket } from '@/hooks/use-invoices-websocket';
import { MasterClassParticipant, MasterClassStatistics, Service } from '@/types/services';
import { UserCheck, UserX, MessageCircle, Users, DollarSign, Calendar, Clock, MapPin, Building, Filter, RefreshCw, FileText, Phone, User, CheckCircle, AlertCircle, CreditCard, TrendingUp, Download, FileSpreadsheet, FileText as FileTextIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { exportToExcel } from '@/lib/export-utils';
import { MasterClassEvent } from '@/types/services';
import { AdminParentRegistrationModal } from './AdminParentRegistrationModal';
import MultiChildWorkshopModal from '@/components/ui/multi-child-workshop-modal';
import { useResponsiveLayout } from '@/contexts/ResponsiveLayoutContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RegisteredParentData {
    parent: {
        id: string;
        name: string;
        surname: string;
        phone: string;
    };
    children: Array<{
        id: string;
        name: string;
        surname: string;
        age?: number;
        school_id: string;
        school_name: string;
        class: string;
    }>;
}

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
        statistics: MasterClassStatistics;
        createdAt: string;
        updatedAt: string;
        school_data?: { teacher?: string; teacherPhone?: string };
        executors_full?: { id: string; fullName: string }[];
        executor_names?: string[];
    };
    service: Service;
    onUpdateMasterClass?: (id: string, updates: Partial<MasterClassEvent>) => Promise<void>;
    allMasterClasses?: MasterClassEvent[];
    onRefreshMasterClasses?: (params?: { forceRefresh?: boolean }) => Promise<void>;
}

export const MasterClassDetails: React.FC<MasterClassDetailsProps> = ({ masterClass, service, onUpdateMasterClass, allMasterClasses = [], onRefreshMasterClasses }) => {
    const { isSmallScreen } = useResponsiveLayout();
    // Функция для конвертации даты в формат YYYY-MM-DD для input type="date"
    const formatDateForInput = (dateString: string): string => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return dateString;
            }
            // Конвертируем в московское время (UTC+3) для правильного отображения
            const moscowDate = new Date(date.getTime() + (3 * 60 * 60 * 1000));
            return moscowDate.toISOString().split('T')[0];
        } catch (error) {
            console.error('Error formatting date for input:', error);
            return dateString;
        }
    };

    const [stats, setStats] = useState<MasterClassStatistics | null>(null);
    const [loading, setLoading] = useState(false);
    const [schoolData, setSchoolData] = useState<{ teacher?: string; teacherPhone?: string } | null>(null);
    const [participants, setParticipants] = useState<MasterClassParticipant[]>(
        (masterClass.participants || []).map(p => ({
            ...p,
            hasReceived: p.hasReceived || false
        }))
    );
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Состояние для фильтра по статусу оплаты
    const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');

    // WebSocket для автоматических обновлений
    const isUpdatingRef = useRef(false);

    const refreshMasterClassDetails = useCallback(async () => {
        if (isUpdatingRef.current) {
            return;
        }

        isUpdatingRef.current = true;
        setIsRefreshing(true);
        try {
            const response = await api.masterClassEvents.getEventById(masterClass.id);
            const updatedMasterClass = response as unknown as MasterClassEvent;

            const updatedParticipants = (updatedMasterClass.participants || []).map(p => ({
                ...p,
                hasReceived: p.hasReceived || false
            }));

            setParticipants(updatedParticipants);
            setStats({
                ...updatedMasterClass.statistics,
                cashAmount: updatedMasterClass.statistics?.cashAmount || 0,
                stylesStats: updatedMasterClass.statistics?.stylesStats || {},
                optionsStats: updatedMasterClass.statistics?.optionsStats || {}
            });

            await onRefreshMasterClasses?.({ forceRefresh: true });
        } catch (error) {
            console.error('Error refreshing master class details:', error);
        } finally {
            isUpdatingRef.current = false;
            setIsRefreshing(false);
        }
    }, [masterClass.id, onRefreshMasterClasses]);

    useMasterClassesWebSocket({
        enabled: true,
        onMasterClassUpdate: () => {
            void refreshMasterClassDetails();
        }
    });

    // WebSocket для обновлений счетов - для мгновенного обновления таблицы участников
    useInvoicesWebSocket({
        userId: 'admin',
        enabled: true,
        listenAll: true,
        onInvoiceUpdate: useCallback((invoiceId: string, status: string, updatedMasterClassId?: string) => {
            console.log('📡 [MasterClassDetails] Получено обновление счета:', {
                invoiceId,
                status,
                updatedMasterClassId,
                currentMasterClassId: masterClass.id
            });
            // Обновляем только если это счет для текущего мастер-класса
            if (updatedMasterClassId === masterClass.id) {
                console.log('🔄 [MasterClassDetails] Обновляем данные мастер-класса');
                void refreshMasterClassDetails();
            }
        }, [masterClass.id, refreshMasterClassDetails])
    });

    // Состояние для режима редактирования
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        date: formatDateForInput(masterClass.date),
        time: masterClass.time,
        executors: masterClass.executors, // executors уже string[]
        notes: masterClass.notes || ''
    });
    const [availableExecutors, setAvailableExecutors] = useState<Array<{
        id: string;
        name: string;
        surname: string;
        fullName: string;
    }>>([]);
    const [loadingExecutors, setLoadingExecutors] = useState(false);

    // Состояние для модального окна предварительного просмотра сообщения
    const [isMessagePreviewOpen, setIsMessagePreviewOpen] = useState(false);
    const [previewMessage, setPreviewMessage] = useState('');
    const [messageType, setMessageType] = useState<'teacher' | 'admin'>('teacher');

    // Состояние для раскрытия/скрытия данных родителя
    const [expandedParticipants, setExpandedParticipants] = useState<Set<string>>(new Set());

    // Состояние для модальных окон регистрации
    const [isRegisteringParent, setIsRegisteringParent] = useState(false);
    const [isRegisteringChildren, setIsRegisteringChildren] = useState(false);
    const [registeredParentData, setRegisteredParentData] = useState<RegisteredParentData | null>(null);

    const { toast } = useToast();
    const updatePaymentStatusMutation = useUpdateParticipantPaymentStatus();

    // Загружаем актуальные данные участников при изменении masterClass
    useEffect(() => {
        console.log('🔄 Обновление participants из masterClass:', {
            participantsCount: masterClass.participants?.length || 0,
            masterClassId: masterClass.id
        });

        if (masterClass.participants && masterClass.participants.length > 0) {
            setParticipants((masterClass.participants || []).map(p => ({
                ...p,
                hasReceived: p.hasReceived || false
            })));
        } else {
            setParticipants([]);
        }
    }, [masterClass.participants, masterClass.id]);

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

    const participantPaymentStats = useMemo(() => {
        if (!participants || participants.length === 0) {
            return {
                totalParticipants: 0,
                totalAmount: 0,
                paidAmount: 0,
                unpaidAmount: 0,
                cashAmount: 0
            };
        }

        const totalAmount = participants.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
        const paidParticipants = participants.filter(p => p.isPaid);
        const paidAmount = paidParticipants.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
        const cashAmount = paidParticipants
            .filter(p => p.paymentMethod === 'cash')
            .reduce((sum, p) => sum + (p.totalAmount || 0), 0);
        const unpaidAmount = totalAmount - paidAmount;

        return {
            totalParticipants: participants.length,
            totalAmount,
            paidAmount,
            unpaidAmount,
            cashAmount
        };
    }, [participants]);

    const statsToDisplay = useMemo<MasterClassStatistics>(() => {
        const base: MasterClassStatistics = {
            totalParticipants: stats?.totalParticipants ?? masterClass.statistics?.totalParticipants ?? 0,
            totalAmount: stats?.totalAmount ?? masterClass.statistics?.totalAmount ?? 0,
            paidAmount: stats?.paidAmount ?? masterClass.statistics?.paidAmount ?? 0,
            unpaidAmount: stats?.unpaidAmount ?? masterClass.statistics?.unpaidAmount ?? 0,
            cashAmount: stats?.cashAmount ?? masterClass.statistics?.cashAmount ?? 0,
            stylesStats: stats?.stylesStats ?? masterClass.statistics?.stylesStats ?? {},
            optionsStats: stats?.optionsStats ?? masterClass.statistics?.optionsStats ?? {}
        };

        if (!participants || participants.length === 0) {
            return base;
        }

        const effectiveCashAmount = participantPaymentStats.cashAmount > 0
            ? participantPaymentStats.cashAmount
            : base.cashAmount;

        return {
            ...base,
            totalParticipants: participantPaymentStats.totalParticipants,
            totalAmount: participantPaymentStats.totalAmount || base.totalAmount,
            paidAmount: participantPaymentStats.paidAmount,
            unpaidAmount: participantPaymentStats.unpaidAmount,
            cashAmount: effectiveCashAmount
        };
    }, [participants, stats, masterClass.statistics, participantPaymentStats]);

    // Функция для форматирования сообщения для учителя
    const formatTeacherMessage = () => {
        const participants = masterClass.participants || [];
        const allParticipants = participants.filter(p => !p.isPaid || p.isPaid); // Все участники
        const participantNames = allParticipants.map(p => `• ${p.childName}`).join('\n');

        return `Учащиеся вашего класса №${masterClass.classGroup} в количестве ${allParticipants.length} человек участвуют в мастер-классе "${service.name}" ${editData.date} в ${editData.time}.

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

        let message = `Мастер-класс "${service.name}" ${editData.date} в ${editData.time}

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

    // Функция для переключения раскрытия/скрытия данных родителя
    const toggleParticipantExpansion = (participantId: string) => {
        setExpandedParticipants(prev => {
            const newSet = new Set(prev);
            if (newSet.has(participantId)) {
                newSet.delete(participantId);
            } else {
                newSet.add(participantId);
            }
            return newSet;
        });
    };

    const loadStats = useCallback(async () => {
        setLoading(true);
        try {
            // Используем локальную статистику вместо API вызова
            const localStats: MasterClassStatistics = {
                ...masterClass.statistics,
                cashAmount: masterClass.statistics.cashAmount || 0,
                stylesStats: {},
                optionsStats: {}
            };
            setStats(localStats);
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    }, [masterClass.statistics]);

    const loadSchoolData = useCallback(async () => {
        try {
            // Используем данные школы из masterClass, если они есть
            if (masterClass.school_data) {
                setSchoolData(masterClass.school_data);
            } else {
                // Fallback на мок-данные только если нет данных из БД
                setSchoolData({
                    teacher: 'Учитель не указан',
                    teacherPhone: 'Телефон не указан'
                });
            }
        } catch (error) {
            console.error('Error loading school data:', error);
        }
    }, [masterClass.school_data]);

    // Загрузка доступных исполнителей
    const loadExecutors = useCallback(async () => {
        setLoadingExecutors(true);
        try {
            // Используем реальных исполнителей из БД, если они есть и имеют правильную структуру
            if (masterClass.executors_full &&
                masterClass.executors_full.length > 0 &&
                masterClass.executors_full.every(executor =>
                    executor &&
                    typeof executor === 'object' &&
                    'id' in executor &&
                    'name' in executor &&
                    'surname' in executor &&
                    'fullName' in executor
                )) {
                // Создаем новый массив с правильной структурой
                const validExecutors = (masterClass.executors_full || []).map(executor => ({
                    id: executor.id,
                    name: (executor as { name?: string }).name || 'Исполнитель',
                    surname: (executor as { surname?: string }).surname || '',
                    fullName: executor.fullName
                }));
                setAvailableExecutors(validExecutors);
            } else {
                // Fallback на мок-данные только если нет данных из БД
                setAvailableExecutors([
                    { id: '1', name: 'Исполнитель', surname: '1', fullName: 'Исполнитель 1' },
                    { id: '2', name: 'Исполнитель', surname: '2', fullName: 'Исполнитель 2' }
                ]);
            }
        } catch (error) {
            console.error('Error loading executors:', error);
        } finally {
            setLoadingExecutors(false);
        }
    }, [masterClass.executors_full]);

    useEffect(() => {
        loadStats();
        loadSchoolData();
        loadExecutors(); // Загрузка исполнителей при монтировании
    }, [masterClass.id, loadExecutors, loadSchoolData, loadStats]);

    // Обновляем статистику при изменении masterClass.statistics
    useEffect(() => {
        console.log('🔄 Обновление статистики из masterClass:', masterClass.statistics);
        setStats({
            ...masterClass.statistics,
            cashAmount: masterClass.statistics.cashAmount || 0,
            stylesStats: masterClass.statistics.stylesStats || {},
            optionsStats: masterClass.statistics.optionsStats || {}
        });
    }, [masterClass.statistics, masterClass.id]);

    // Принудительно обновляем статистику при изменении masterClass
    useEffect(() => {
        console.log('🔄 Принудительное обновление статистики при изменении masterClass');
        setStats({
            ...masterClass.statistics,
            cashAmount: masterClass.statistics.cashAmount || 0,
            stylesStats: masterClass.statistics.stylesStats || {},
            optionsStats: masterClass.statistics.optionsStats || {}
        });
    }, [masterClass]);

    // Синхронизация editData с masterClass при изменении данных
    useEffect(() => {
        setEditData({
            date: formatDateForInput(masterClass.date),
            time: masterClass.time,
            executors: masterClass.executors,
            notes: masterClass.notes || ''
        });
    }, [masterClass.date, masterClass.time, masterClass.executors, masterClass.notes]);

    // Сохранение изменений
    const handleSaveChanges = async () => {
        try {

            // Если изменилась дата, обновляем все мастер-классы этой школы в этот день
            // Правильно извлекаем дату с учетом московского времени
            const originalDate = new Date(masterClass.date);
            // Конвертируем в московское время (UTC+3)
            const moscowDate = new Date(originalDate.getTime() + (3 * 60 * 60 * 1000));
            const originalDateOnly = moscowDate.toISOString().split('T')[0];

            if (editData.date !== originalDateOnly && onUpdateMasterClass) {
                const newDate = editData.date;

                // Сначала обновляем данные мастер-классов для получения актуальной информации
                if (onRefreshMasterClasses) {
                    await onRefreshMasterClasses();
                }

                const sameSchoolSameDayClasses = allMasterClasses.filter(mc => {
                    // Правильно извлекаем дату с учетом московского времени
                    const mcDate = new Date(mc.date);
                    // Конвертируем в московское время (UTC+3)
                    const mcMoscowDate = new Date(mcDate.getTime() + (3 * 60 * 60 * 1000));
                    const mcDateOnly = mcMoscowDate.toISOString().split('T')[0];
                    const isSameSchool = mc.schoolId === masterClass.schoolId;
                    const isSameDate = mcDateOnly === originalDateOnly;
                    const isNotCurrent = mc.id !== masterClass.id;

                    return isSameSchool && isSameDate && isNotCurrent;
                });

                // Обновляем основной мастер-класс
                await onUpdateMasterClass(masterClass.id, {
                    date: editData.date,
                    time: editData.time,
                    executors: editData.executors,
                    notes: editData.notes
                });

                // Обновляем все остальные мастер-классы той же школы в этот день
                for (const mc of sameSchoolSameDayClasses) {
                    try {
                        await onUpdateMasterClass(mc.id, {
                            date: newDate
                        });
                    } catch (error) {
                        console.error(`❌ Ошибка обновления мастер-класса ${mc.id}:`, error);
                    }
                }

                // Принудительно обновляем данные мастер-классов
                if (onRefreshMasterClasses) {
                    await onRefreshMasterClasses();
                }

                // Обновляем локальное состояние editData для отображения
                setEditData({
                    ...editData,
                    date: editData.date,
                    time: editData.time,
                    executors: editData.executors,
                    notes: editData.notes
                });

                toast({
                    title: "Успешно",
                    description: `Изменения сохранены. Обновлено ${sameSchoolSameDayClasses.length + 1} мастер-классов`,
                });
            } else {
                // Если дата не изменилась, обновляем только текущий мастер-класс
                if (onUpdateMasterClass) {
                    await onUpdateMasterClass(masterClass.id, {
                        date: editData.date,
                        time: editData.time,
                        executors: editData.executors,
                        notes: editData.notes
                    });
                }

                // Обновляем локальное состояние editData для отображения
                setEditData({
                    ...editData,
                    date: editData.date,
                    time: editData.time,
                    executors: editData.executors,
                    notes: editData.notes
                });

                toast({
                    title: "Успешно",
                    description: "Изменения сохранены",
                });
            }

            setIsEditing(false);
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
            date: formatDateForInput(masterClass.date),
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

            await refreshMasterClassDetails();
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
            // Отправляем запрос на backend
            await api.patch(
                `/master-classes/${masterClass.id}/participants/${participantId}/service-received`,
                { hasReceived }
            );

            // Обновляем локальное состояние после успешного сохранения
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

    // Обработчик наличной оплаты
    const handleCashPayment = async (participantId: string) => {
        const participant = participants.find(p => p.id === participantId);
        if (!participant) return;

        // Подтверждение наличной оплаты
        const confirmed = window.confirm(
            `Подтвердить наличную оплату для "${participant.childName}"?\n\n` +
            `Сумма: ${participant.totalAmount} ₽\n\n` +
            `После подтверждения:\n` +
            `• Статус оплаты изменится на "Оплачено"\n` +
            `• Счет будет помечен как оплаченный наличными\n` +
            `• Сумма будет добавлена в статистику наличных платежей`
        );

        if (!confirmed) return;

        try {
            const response = await api.patch<{ success: boolean; data: unknown }>(
                `/master-classes/${masterClass.id}/participants/${participantId}/cash-payment`
            );

            if (response.data.success) {
                toast({
                    title: 'Наличная оплата подтверждена ✅',
                    description: `Участник ${participant.childName} помечен как оплативший наличными`,
                });

                // Обновляем локальное состояние
                setParticipants(prev => prev.map(p =>
                    p.id === participantId ? { ...p, isPaid: true, paymentMethod: 'cash' } : p
                ));

                await refreshMasterClassDetails();
            }
        } catch (error) {
            console.error('Error confirming cash payment:', error);
            const err = error as { response?: { data?: { error?: string } } };
            toast({
                title: 'Ошибка',
                description: err.response?.data?.error || 'Не удалось подтвердить наличную оплату',
                variant: 'destructive',
            });
        }
    };

    // Обработчик успешной регистрации родителя
    const handleParentRegistrationSuccess = (data: RegisteredParentData) => {
        console.log('✅ handleParentRegistrationSuccess вызван:', data);
        console.log('👶 Дети зарегистрированы:', data.children);

        setRegisteredParentData(data);
        setIsRegisteringParent(false);

        // Используем setTimeout для гарантированного открытия модального окна после закрытия предыдущего
        // Увеличиваем задержку до 500ms для гарантии
        setTimeout(() => {
            console.log('⏰ Открываем модальное окно записи детей');
            setIsRegisteringChildren(true);
        }, 500);

        toast({
            title: 'Родитель зарегистрирован ✅',
            description: `Теперь выберите детей и услуги для записи на мастер-класс`,
        });
    };

    // Обработчик успешной записи детей на мастер-класс
    const handleChildrenRegistrationSuccess = async () => {
        // НЕ закрываем модальное окно - пользователь должен увидеть секцию оплаты и кнопку WhatsApp
        // setIsRegisteringChildren(false);
        // setRegisteredParentData(null);

        toast({
            title: 'Дети записаны на мастер-класс ✅',
            description: 'Счет сформирован и готов к отправке. Отправьте счет родителю через WhatsApp!',
        });

        // Обновляем данные мастер-класса
        if (onRefreshMasterClasses) {
            await onRefreshMasterClasses();
        }
    };

    // Функция удаления участника с мастер-класса
    const handleRemoveParticipant = async (participantId: string) => {
        const participant = participants.find(p => p.id === participantId);
        if (!participant) return;

        // Подтверждение удаления
        const confirmed = window.confirm(
            `Вы уверены, что хотите удалить участника "${participant.childName}" с мастер-класса?\n\n` +
            `Это действие:\n` +
            `• Удалит участника из мастер-класса\n` +
            `• Удалит связанный счет\n` +
            `• Обновит статистику по стилям и опциям\n` +
            `• В будущем будет реализован возврат денежных средств (если была произведена оплата)`
        );

        if (!confirmed) return;

        try {
            // Реальный API вызов для удаления участника
            const response = await api.workshopRegistrations.removeParticipant(masterClass.id, participantId);

            // Обновляем локальное состояние
            setParticipants(prev => prev.filter(p => p.id !== participantId));

            // Обновляем статистику мастер-класса из ответа сервера
            if ('updatedStatistics' in response && response.updatedStatistics) {
                const updatedStats = response.updatedStatistics as MasterClassStatistics;
                masterClass.statistics = updatedStats;
                setStats(updatedStats);
            } else {
                // Fallback: обновляем статистику локально
                const updatedStats = {
                    ...masterClass.statistics,
                    totalParticipants: Math.max(masterClass.statistics.totalParticipants - 1, 0),
                    totalAmount: Math.max(masterClass.statistics.totalAmount - participant.totalAmount, 0),
                    paidAmount: participant.isPaid
                        ? Math.max(masterClass.statistics.paidAmount - participant.totalAmount, 0)
                        : masterClass.statistics.paidAmount,
                    unpaidAmount: !participant.isPaid
                        ? Math.max(masterClass.statistics.unpaidAmount - participant.totalAmount, 0)
                        : masterClass.statistics.unpaidAmount,
                    cashAmount: (participant.isPaid && participant.paymentMethod === 'cash')
                        ? Math.max((masterClass.statistics.cashAmount || 0) - participant.totalAmount, 0)
                        : (masterClass.statistics.cashAmount || 0)
                };

                masterClass.statistics = updatedStats;
                setStats(updatedStats);
            }

            toast({
                title: "Участник удален",
                description: `Участник "${participant.childName}" удален с мастер-класса. Счет и статистика обновлены.`,
                variant: "default",
            });

        } catch (error) {
            console.error('Error removing participant:', error);
            toast({
                title: "Ошибка",
                description: `Не удалось удалить участника с мастер-класса: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
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

    if (isSmallScreen) {
        const filteredParticipants = getFilteredParticipants();
        const currentStats = stats ?? masterClass.statistics;
        const executorNames = masterClass.executors_full?.map((e) => e.fullName) || masterClass.executors || [];

        return (
            <div className="flex h-full flex-col overflow-hidden bg-white">
                <div className="px-4 pt-4 pb-2">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h2 className="text-2xl font-bold text-primary">{service.name}</h2>
                            <p className="text-sm text-gray-500">
                                {new Date(masterClass.date).toLocaleDateString('ru-RU')} • {masterClass.time}
                            </p>
                        </div>
                        <Badge variant="secondary" className="px-3 py-1 text-sm">
                            {masterClass.classGroup}
                        </Badge>
                    </div>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Button
                            onClick={() => setIsRegisteringParent(true)}
                            className="bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600 text-white"
                        >
                            <UserCheck className="w-4 h-4 mr-2" />
                            Записать участника
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditing(!isEditing)}
                        >
                            {isEditing ? 'Отменить редактирование' : 'Редактировать'}
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="overview" className="flex-1 flex flex-col px-4 pb-4">
                    <TabsList className="mb-4 grid grid-cols-3 gap-2 rounded-xl bg-gray-100 p-1">
                        <TabsTrigger value="overview" className="text-xs">Обзор</TabsTrigger>
                        <TabsTrigger value="participants" className="text-xs">Участники</TabsTrigger>
                        <TabsTrigger value="stats" className="text-xs">Оплаты</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="flex-1 overflow-y-auto space-y-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Основная информация</CardTitle>
                                <CardDescription>Детали мастер-класса</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 gap-3">
                                <div className="flex items-center gap-3 text-sm">
                                    <Calendar className="h-4 w-4 text-blue-600" />
                                    <span>{new Date(masterClass.date).toLocaleDateString('ru-RU')} • {masterClass.time}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <MapPin className="h-4 w-4 text-orange-600" />
                                    <span>{masterClass.city}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Building className="h-4 w-4 text-purple-600" />
                                    <span>{masterClass.schoolName}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Users className="h-4 w-4 text-teal-600" />
                                    <span>{executorNames.length > 0 ? executorNames.join(', ') : 'Исполнители не назначены'}</span>
                                </div>
                                {masterClass.school_data?.teacher && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <User className="h-4 w-4 text-indigo-600" />
                                        <span>
                                            Учитель: {masterClass.school_data.teacher}
                                            {masterClass.school_data.teacherPhone ? ` • ${masterClass.school_data.teacherPhone}` : ''}
                                        </span>
                                    </div>
                                )}
                                {masterClass.notes && (
                                    <div className="rounded-lg bg-orange-50 p-3 text-sm text-gray-700">
                                        <span className="font-medium text-orange-600 block mb-1">Заметки:</span>
                                        {masterClass.notes}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="participants" className="flex-1 overflow-y-auto space-y-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Участники</CardTitle>
                                <CardDescription>Управление списком и оплатами</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-1">
                                    <Label htmlFor="payment-filter-mobile">Статус оплаты</Label>
                                    <Select
                                        value={paymentStatusFilter}
                                        onValueChange={(value: 'all' | 'paid' | 'unpaid') => setPaymentStatusFilter(value)}
                                    >
                                        <SelectTrigger id="payment-filter-mobile">
                                            <SelectValue placeholder="Статус оплаты" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Все</SelectItem>
                                            <SelectItem value="paid">Оплачено</SelectItem>
                                            <SelectItem value="unpaid">Не оплачено</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {filteredParticipants.length === 0 ? (
                                    <div className="rounded-lg border border-dashed border-orange-200 bg-white/70 p-6 text-center text-sm text-gray-500">
                                        Участников с выбранным фильтром нет.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {filteredParticipants.map((participant) => (
                                            <Card key={participant.id} className="border-orange-100 bg-white/90 shadow-sm">
                                                <CardContent className="space-y-3 p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-base font-semibold text-gray-900">
                                                                {participant.childName}
                                                            </p>
                                                            <p className="text-xs text-gray-500 flex flex-wrap items-center gap-1">
                                                                <span>Родитель: {participant.parentName} {participant.parentSurname}</span>
                                                                {participant.parentPhone && (
                                                                    <>
                                                                        <span className="text-gray-400">•</span>
                                                                        <a
                                                                            href={`tel:${participant.parentPhone.replace(/\s+/g, '')}`}
                                                                            className="text-blue-600 hover:underline"
                                                                        >
                                                                            {participant.parentPhone}
                                                                        </a>
                                                                    </>
                                                                )}
                                                            </p>
                                                        </div>
                                                        <Badge variant={participant.isPaid ? 'default' : 'outline'} className={participant.isPaid ? 'bg-green-500 text-white' : ''}>
                                                            {participant.isPaid ? 'Оплачено' : 'Ожидает'}
                                                        </Badge>
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-2 text-xs text-gray-600">
                                                        <div className="flex items-center gap-2">
                                                            <Phone className="h-3 w-3 text-green-600" />
                                                            <span>{participant.parentPhone || 'Телефон не указан'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <DollarSign className="h-3 w-3 text-orange-600" />
                                                            <span>Сумма: {participant.totalAmount} ₽</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <FileTextIcon className="h-3 w-3 text-purple-600" />
                                                            <span>{getStyleOptionNames(participant.selectedStyles || [], participant.selectedOptions || []).styles}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className={participant.isPaid ? 'border-green-200 text-green-600' : 'border-orange-200 text-orange-600'}
                                                            onClick={() => handlePaymentStatusChange(participant.id, !participant.isPaid)}
                                                        >
                                                            {participant.isPaid ? 'Отметить как неоплаченного' : 'Отметить как оплачено'}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => handleRemoveParticipant(participant.id)}
                                                        >
                                                            Удалить
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="stats" className="flex-1 overflow-y-auto space-y-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Финансы</CardTitle>
                                <CardDescription>Сводка по оплатам</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 gap-3">
                                <div className="rounded-lg border border-green-100 bg-green-50 p-3">
                                    <p className="text-xs text-green-700">Итого собрано</p>
                                    <p className="text-xl font-semibold text-green-900">{currentStats.totalAmount} ₽</p>
                                </div>
                                <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                                    <p className="text-xs text-blue-700">Оплачено</p>
                                    <p className="text-xl font-semibold text-blue-900">{currentStats.paidAmount} ₽</p>
                                </div>
                                <div className="rounded-lg border border-orange-100 bg-orange-50 p-3">
                                    <p className="text-xs text-orange-700">Ожидает оплаты</p>
                                    <p className="text-xl font-semibold text-orange-900">{currentStats.unpaidAmount} ₽</p>
                                </div>
                                <div className="rounded-lg border border-purple-100 bg-purple-50 p-3">
                                    <p className="text-xs text-purple-700">Оплачено наличными</p>
                                    <p className="text-xl font-semibold text-purple-900">{currentStats.cashAmount || 0} ₽</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <AdminParentRegistrationModal
                    isOpen={isRegisteringParent}
                    onOpenChange={setIsRegisteringParent}
                    masterClassId={masterClass.id}
                    schoolId={masterClass.schoolId}
                    classGroup={masterClass.classGroup}
                    onSuccess={handleParentRegistrationSuccess}
                />

                {registeredParentData && isRegisteringChildren && (
                    <MultiChildWorkshopModal
                        isOpen={isRegisteringChildren}
                        onOpenChange={(open) => {
                            setIsRegisteringChildren(open);
                            if (!open) {
                                setRegisteredParentData(null);
                            }
                        }}
                        workshop={{
                            id: masterClass.id,
                            title: service.name,
                            date: masterClass.date,
                            time: masterClass.time,
                            classGroup: masterClass.classGroup,
                            schoolName: masterClass.schoolName,
                            schoolId: masterClass.schoolId,
                            serviceId: masterClass.serviceId,
                            eligibleChildren: registeredParentData.children.map(child => ({
                                id: child.id,
                                name: `${child.name} ${child.surname}`,
                                age: child.age || 7,
                                schoolId: child.school_id,
                                schoolName: child.school_name,
                                classGroup: child.class,
                            })),
                            childrenWithStatus: registeredParentData.children.map(child => ({
                                childId: child.id,
                                childName: `${child.name} ${child.surname}`,
                                status: 'none' as const,
                            })),
                        }}
                        children={registeredParentData.children.map(child => ({
                            id: child.id,
                            name: child.name,
                            surname: child.surname,
                            fullName: `${child.name} ${child.surname}`,
                            age: child.age || 7,
                            schoolId: child.school_id,
                            schoolName: child.school_name,
                            classGroup: child.class,
                            parentId: registeredParentData.parent.id,
                            parentName: registeredParentData.parent.name,
                            parentSurname: registeredParentData.parent.surname,
                            parentPhone: registeredParentData.parent.phone,
                        }))}
                        onRegistrationSuccess={handleChildrenRegistrationSuccess}
                        masterClasses={allMasterClasses}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6 max-h-screen overflow-y-auto">
            {/* Заголовок */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-primary">{service.name}</h2>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => setIsRegisteringParent(true)}
                        className="bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600 text-white"
                    >
                        <UserCheck className="w-4 h-4 mr-2" />
                        Записать на мастер-класс
                    </Button>
                    <Badge variant="outline" className="text-xl px-6 py-3">
                        {masterClass.classGroup}
                    </Badge>
                </div>
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
                                    <p className="text-sm text-blue-600">{formatDate(editData.date)}</p>
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
                                    <p className="text-sm text-green-600">{editData.time}</p>
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
                                    {(() => {
                                        // Сначала пытаемся использовать executor_names
                                        if (masterClass.executor_names && masterClass.executor_names.length > 0) {
                                            return masterClass.executor_names.map((executor, index) => (
                                                <div key={index} className="flex items-center space-x-2">
                                                    <User className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-sm">{executor}</span>
                                                </div>
                                            ));
                                        }
                                        // Затем пытаемся использовать executors_full
                                        if (masterClass.executors_full && masterClass.executors_full.length > 0) {
                                            return masterClass.executors_full.map((executor, index) => (
                                                <div key={index} className="flex items-center space-x-2">
                                                    <User className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-sm">{executor.fullName}</span>
                                                </div>
                                            ));
                                        }
                                        // Fallback на ID, если нет других данных
                                        return masterClass.executors.map((executor, index) => (
                                            <div key={index} className="flex items-center space-x-2">
                                                <User className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-sm">{executor}</span>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <Label className="text-lg font-semibold">Контактное лицо:</Label>
                            <div className="space-y-2">
                                {schoolData?.teacher && schoolData.teacher !== 'Учитель не указан' ? (
                                    <div className="flex items-center space-x-2 p-3 bg-muted rounded-md">
                                        <User className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm">{schoolData.teacher}</span>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-sm">Учитель не указан</p>
                                )}
                                {schoolData?.teacherPhone && schoolData.teacherPhone !== 'Телефон не указан' ? (
                                    <div className="flex items-center space-x-2 p-3 bg-muted rounded-md">
                                        <Phone className="w-4 h-4 text-green-600" />
                                        <span className="text-sm">{schoolData.teacherPhone}</span>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-sm">Телефон не указан</p>
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
                            <div className="text-3xl font-bold text-blue-600">{statsToDisplay.totalParticipants || 0}</div>
                            <div className="text-base text-blue-600">Участников</div>
                        </div>
                        <div className="text-center p-6 bg-green-50 rounded-lg">
                            <div className="text-3xl font-bold text-green-600">{formatCurrency(statsToDisplay.totalAmount || 0)}</div>
                            <div className="text-base text-green-600">Общая сумма</div>
                        </div>
                        <div className="text-center p-6 bg-purple-50 rounded-lg">
                            <div className="text-3xl font-bold text-purple-600">{formatCurrency(statsToDisplay.paidAmount || 0)}</div>
                            <div className="text-base text-purple-600 space-y-1">
                                <div>Оплатили</div>
                                {(statsToDisplay.cashAmount || 0) > 0 ? (
                                    <div className="text-xs text-purple-500">
                                        (в т.ч. наличными: {formatCurrency(statsToDisplay.cashAmount)})
                                    </div>
                                ) : (
                                    <div className="text-xs text-gray-400">
                                        (наличные: 0₽)
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="text-center p-6 bg-orange-50 rounded-lg">
                            <div className="text-3xl font-bold text-orange-600">{formatCurrency(statsToDisplay.unpaidAmount || 0)}</div>
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
                                {statsToDisplay && Object.keys(statsToDisplay.stylesStats || {}).length > 0 ? (
                                    Object.entries(statsToDisplay.stylesStats || {}).map(([styleId, count]) => {
                                        // Получаем название стиля из сервиса
                                        const styleName = service?.styles?.find(s => s.id === styleId)?.name || styleId;
                                        return (
                                            <div key={styleId} className="flex justify-between items-center p-2 bg-muted rounded">
                                                <span className="text-sm">{styleName}</span>
                                                <Badge variant="secondary">{count}</Badge>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-sm text-muted-foreground">Нет данных</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-lg font-semibold">Статистика по дополнительным услугам:</h4>
                            <div className="space-y-2">
                                {statsToDisplay && Object.keys(statsToDisplay.optionsStats || {}).length > 0 ? (
                                    Object.entries(statsToDisplay.optionsStats || {}).map(([optionId, count]) => {
                                        // Получаем название опции из сервиса
                                        const optionName = service?.options?.find(o => o.id === optionId)?.name || optionId;
                                        return (
                                            <div key={optionId} className="flex justify-between items-center p-2 bg-muted rounded">
                                                <span className="text-sm">{optionName}</span>
                                                <Badge variant="secondary">{count}</Badge>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-sm text-muted-foreground">Нет данных</p>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Таблица участников */}
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <CardTitle className="flex items-center gap-3 text-2xl font-semibold tracking-tight">
                            <Users className="h-6 w-6" />
                            Участники
                            {paymentStatusFilter !== 'all' && (
                                <Badge variant="secondary" className="text-sm">
                                    {paymentStatusFilter === 'paid' ? 'Оплаченные' : 'Ожидающие оплаты'}
                                </Badge>
                            )}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-sm">
                                {getFilteredParticipants().length} из {participants.length}
                            </Badge>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                                onClick={() => void refreshMasterClassDetails()}
                                disabled={isRefreshing}
                            >
                                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                Обновить
                            </Button>
                        </div>
                    </div>
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
                                    {/* Динамические заголовки стилей с ценами */}
                                    {service?.styles.map(style => (
                                        <TableHead key={style.id} className="font-semibold text-center min-w-[120px]">
                                            <div className="space-y-1">
                                                <div className="text-sm">{style.name}</div>
                                                <div className="text-xs font-normal text-green-600">
                                                    {style.price ? `${style.price.toLocaleString('ru-RU')} ₽` : 'Бесплатно'}
                                                </div>
                                            </div>
                                        </TableHead>
                                    ))}
                                    {/* Динамические заголовки опций с ценами */}
                                    {service?.options.map(option => (
                                        <TableHead key={option.id} className="font-semibold text-center min-w-[120px]">
                                            <div className="space-y-1">
                                                <div className="text-sm">{option.name}</div>
                                                <div className="text-xs font-normal text-blue-600">
                                                    {option.price ? `${option.price.toLocaleString('ru-RU')} ₽` : 'Бесплатно'}
                                                </div>
                                            </div>
                                        </TableHead>
                                    ))}
                                    <TableHead className="font-semibold">Сумма</TableHead>
                                    <TableHead className="font-semibold">Статус оплаты</TableHead>
                                    <TableHead className="font-semibold">Получил услугу</TableHead>
                                    <TableHead className="font-semibold">Примечания</TableHead>
                                    <TableHead className="font-semibold">Действия</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {getFilteredParticipants().length > 0 ? (
                                    getFilteredParticipants().map((participant) => {
                                        const isPendingPayment = !participant.isPaid;
                                        const hasReceivedService = participant.hasReceived || false;
                                        const isRobokassaPayment = participant.paymentMethod === 'robokassa';
                                        const showCashButton = isPendingPayment && !isRobokassaPayment;

                                        // Данные участника

                                        // Создаем функцию для подсчета количества выбранных стилей
                                        const getStyleCount = (styleId: string) => {
                                            if (!participant.selectedStyles || participant.selectedStyles.length === 0) {
                                                return 0;
                                            }

                                            return participant.selectedStyles.filter((selected: unknown) => {
                                                if (typeof selected === 'string') {
                                                    return selected === styleId;
                                                } else if (selected && typeof selected === 'object' && 'id' in selected) {
                                                    return (selected as { id: string }).id === styleId;
                                                }
                                                return false;
                                            }).length;
                                        };

                                        // Создаем функцию для подсчета количества выбранных опций
                                        const getOptionCount = (optionId: string) => {
                                            if (!participant.selectedOptions || participant.selectedOptions.length === 0) {
                                                return 0;
                                            }

                                            return participant.selectedOptions.filter((selected: unknown) => {
                                                if (typeof selected === 'string') {
                                                    return selected === optionId;
                                                } else if (selected && typeof selected === 'object' && 'id' in selected) {
                                                    return (selected as { id: string }).id === optionId;
                                                }
                                                return false;
                                            }).length;
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
                                                    <div className="space-y-1">
                                                        <div
                                                            className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                                                            onClick={() => toggleParticipantExpansion(participant.id)}
                                                        >
                                                            {expandedParticipants.has(participant.id) ? (
                                                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                            ) : (
                                                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                                            )}
                                                            <p className="font-semibold">{participant.childName}</p>
                                                        </div>
                                                        {expandedParticipants.has(participant.id) && (
                                                            <div className="ml-6 space-y-1">
                                                                {(participant.parentName || participant.parentSurname) && (
                                                                    <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-2">
                                                                        <span>Родитель: {participant.parentName} {participant.parentSurname}</span>
                                                                        {participant.parentPhone && (
                                                                            <a
                                                                                href={`tel:${participant.parentPhone.replace(/\s+/g, '')}`}
                                                                                className="text-blue-600 hover:underline"
                                                                            >
                                                                                {participant.parentPhone}
                                                                            </a>
                                                                        )}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                {/* Динамические столбцы стилей с количеством и ценой */}
                                                {service?.styles.map(style => {
                                                    const count = getStyleCount(style.id);
                                                    const totalPrice = count > 0 && style.price ? count * style.price : 0;
                                                    return (
                                                        <TableCell key={style.id} className="text-center">
                                                            {count > 0 ? (
                                                                <div className="space-y-1">
                                                                    <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 text-green-800 rounded-full font-semibold text-sm">
                                                                        {count}
                                                                    </div>
                                                                    {style.price && style.price > 0 && (
                                                                        <div className="text-xs text-green-600 font-medium">
                                                                            {totalPrice.toLocaleString('ru-RU')} ₽
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-400 rounded-full font-semibold text-sm">
                                                                    -
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                    );
                                                })}
                                                {/* Динамические столбцы опций с количеством и ценой */}
                                                {service?.options.map(option => {
                                                    const count = getOptionCount(option.id);
                                                    const totalPrice = count > 0 && option.price ? count * option.price : 0;
                                                    return (
                                                        <TableCell key={option.id} className="text-center">
                                                            {count > 0 ? (
                                                                <div className="space-y-1">
                                                                    <div className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full font-semibold text-sm">
                                                                        {count}
                                                                    </div>
                                                                    {option.price && option.price > 0 && (
                                                                        <div className="text-xs text-blue-600 font-medium">
                                                                            {totalPrice.toLocaleString('ru-RU')} ₽
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-400 rounded-full font-semibold text-sm">
                                                                    -
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                    );
                                                })}
                                                <TableCell className="font-semibold text-green-600">
                                                    {formatCurrency(participant.totalAmount)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col space-y-2">
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
                                                        {showCashButton && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleCashPayment(participant.id)}
                                                                className="text-green-600 border-green-200 hover:bg-green-50 text-xs"
                                                            >
                                                                <DollarSign className="w-3 h-3 mr-1" />
                                                                Наличными
                                                            </Button>
                                                        )}
                                                        {participant.isPaid && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {participant.paymentMethod === 'cash' ? '💵 Наличные' :
                                                                    participant.paymentMethod === 'robokassa' ? '💳 Робокасса' :
                                                                        participant.paymentMethod === 'card' ? '💳 Карта' :
                                                                            participant.paymentMethod === 'transfer' ? '💳 Перевод' :
                                                                                participant.paymentMethod ? `💳 ${participant.paymentMethod}` : '💳 Оплачено'}
                                                            </Badge>
                                                        )}
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
                                                <TableCell className="max-w-[200px]">
                                                    {participant.notes ? (
                                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                                                            <div className="flex items-start space-x-2">
                                                                <FileText className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                                                <p className="text-sm text-yellow-800 break-words">
                                                                    {participant.notes}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">Нет примечаний</span>
                                                    )}
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
                                                            onClick={() => handleRemoveParticipant(participant.id)}
                                                            className="text-red-600 border-red-200 hover:bg-red-50"
                                                        >
                                                            <UserX className="w-4 h-4 mr-1" />
                                                            Удалить
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    // Заглушка для пустой таблицы
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8">
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
                        onClick={async () => {
                            setLoading(true);
                            try {
                                await api.post(`/master-classes/${masterClass.id}/recalculate-statistics`);
                                toast({
                                    title: 'Статистика обновлена',
                                    description: 'Статистика пересчитана на основе текущих участников',
                                });
                                // Перезагружаем данные мастер-класса
                                if (onRefreshMasterClasses) {
                                    await onRefreshMasterClasses();
                                }
                            } catch (error) {
                                toast({
                                    title: 'Ошибка',
                                    description: 'Не удалось пересчитать статистику',
                                    variant: 'destructive',
                                });
                            } finally {
                                setLoading(false);
                            }
                        }}
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        {loading ? 'Обновляем...' : 'Пересчитать статистику'}
                    </Button>

                    {/* Кнопки экспорта */}
                    <div className="space-y-2">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                                try {
                                    // Создаем правильный объект MasterClassEvent для экспорта
                                    const exportData: MasterClassEvent = {
                                        id: masterClass.id,
                                        date: masterClass.date,
                                        time: masterClass.time,
                                        schoolId: masterClass.schoolId,
                                        schoolName: masterClass.schoolName,
                                        city: masterClass.city,
                                        classGroup: masterClass.classGroup,
                                        serviceId: masterClass.serviceId,
                                        serviceName: masterClass.serviceName,
                                        executors: masterClass.executors,
                                        notes: masterClass.notes,
                                        participants: masterClass.participants,
                                        statistics: masterClass.statistics,
                                        createdAt: masterClass.createdAt,
                                        updatedAt: masterClass.updatedAt
                                    };
                                    exportToExcel(exportData, service, participants);
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
                                        // Создаем правильный объект MasterClassEvent для экспорта
                                        const exportData: MasterClassEvent = {
                                            id: masterClass.id,
                                            date: masterClass.date,
                                            time: masterClass.time,
                                            schoolId: masterClass.schoolId,
                                            schoolName: masterClass.schoolName,
                                            city: masterClass.city,
                                            classGroup: masterClass.classGroup,
                                            serviceId: masterClass.serviceId,
                                            serviceName: masterClass.serviceName,
                                            executors: masterClass.executors,
                                            notes: masterClass.notes,
                                            participants: masterClass.participants,
                                            statistics: masterClass.statistics,
                                            createdAt: masterClass.createdAt,
                                            updatedAt: masterClass.updatedAt
                                        };
                                        exportToExcel(exportData, service, filteredParticipants);
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

            {/* Модальное окно регистрации родителя */}
            <AdminParentRegistrationModal
                isOpen={isRegisteringParent}
                onOpenChange={setIsRegisteringParent}
                masterClassId={masterClass.id}
                schoolId={masterClass.schoolId}
                classGroup={masterClass.classGroup}
                onSuccess={handleParentRegistrationSuccess}
            />

            {/* Модальное окно записи детей на мастер-класс */}
            {registeredParentData && isRegisteringChildren && (
                <MultiChildWorkshopModal
                    isOpen={isRegisteringChildren}
                    onOpenChange={(open) => {
                        console.log('🔧 MultiChildWorkshopModal onOpenChange:', open);
                        setIsRegisteringChildren(open);
                        if (!open) {
                            setRegisteredParentData(null);
                        }
                    }}
                    workshop={{
                        id: masterClass.id,
                        title: service.name,
                        date: masterClass.date,
                        time: masterClass.time,
                        classGroup: masterClass.classGroup,
                        schoolName: masterClass.schoolName,
                        schoolId: masterClass.schoolId,
                        serviceId: masterClass.serviceId,
                        eligibleChildren: registeredParentData.children.map(child => ({
                            id: child.id,
                            name: `${child.name} ${child.surname}`,
                            age: child.age || 7,
                            schoolId: child.school_id,
                            schoolName: child.school_name,
                            classGroup: child.class,
                        })),
                        childrenWithStatus: registeredParentData.children.map(child => ({
                            childId: child.id,
                            childName: `${child.name} ${child.surname}`,
                            status: 'none' as const,
                        })),
                    }}
                    children={registeredParentData.children.map(child => ({
                        id: child.id,
                        name: child.name,
                        surname: child.surname,
                        fullName: `${child.name} ${child.surname}`,
                        age: child.age || 7,
                        schoolId: child.school_id,
                        schoolName: child.school_name,
                        classGroup: child.class,
                        parentId: registeredParentData.parent.id,
                        parentName: registeredParentData.parent.name,
                        parentSurname: registeredParentData.parent.surname,
                        parentPhone: registeredParentData.parent.phone,
                    }))}
                    onRegistrationSuccess={handleChildrenRegistrationSuccess}
                    masterClasses={allMasterClasses}
                />
            )}
        </div>
    );
}; 