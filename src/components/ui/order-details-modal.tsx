/**
 * @file: order-details-modal.tsx
 * @description: Модальное окно для отображения деталей заказа с выбранными стилями и опциями
 * @dependencies: Dialog, Card, Button, useAuth, useServices, YandexPaymentButton
 * @created: 2024-12-19
 */

import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useServices } from '@/hooks/use-services';
import { useToast } from '@/hooks/use-toast';
import { useMasterClassesWebSocket } from '@/hooks/use-master-classes-websocket';
import { api } from '@/lib/api';
import { RobokassaPayment } from '@/components/payment/RobokassaPayment';
import { RefundReasonModal } from './refund-reason-modal';
import { Service, ServiceStyle, ServiceOption, Invoice } from '@/types';
import { usePaymentSettings } from '@/hooks/use-payment-settings';
import {
    Calendar,
    Clock,
    MapPin,
    Users,
    Palette,
    Sparkles,
    CheckCircle,
    AlertCircle,
    CreditCard,
    Baby,
    X,
    Edit3,
    Save,
    Plus,
    Minus,
    MessageCircle,
    RotateCcw,
    Loader2
} from 'lucide-react';

interface WorkshopCardData {
    id: string;
    title: string;
    date: string;
    time: string;
    classGroup: string;
    schoolName: string;
    city: string;
    children: string[];
    invoiceId?: string;
    schoolId: string;
    serviceId: string;
    childrenWithStatus: Array<{
        childId: string;
        childName: string;
        invoice?: Invoice;
    }>;
    participants?: Array<{
        id: string;
        childId: string;
        childName: string;
        parentId: string;
        parentName: string;
        selectedStyles: Array<{ id: string; name: string }>;
        selectedOptions: Array<{ id: string; name: string }>;
        totalAmount: number;
        isPaid: boolean;
        hasReceived: boolean;
        paymentMethod?: string;
        paymentDate?: string;
        notes?: string;
    }>;
}

interface OrderDetailsModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    workshop: WorkshopCardData | null;
    onWorkshopUpdate?: (updatedWorkshop: WorkshopCardData) => void;
}

export default function OrderDetailsModal({ isOpen, onOpenChange, workshop, onWorkshopUpdate }: OrderDetailsModalProps) {
    const { user } = useAuth();
    const { services } = useServices(user?.id);
    const { isEnabled: isGlobalPaymentEnabled, isLoading: paymentSettingsLoading } = usePaymentSettings();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [currentService, setCurrentService] = useState<Service | null>(null);

    // WebSocket для автоматических обновлений мастер-классов
    const { isConnected: masterClassesWsConnected } = useMasterClassesWebSocket({
        userId: user?.id,
        enabled: isOpen, // Включаем только когда модальное окно открыто
        onMasterClassUpdate: useCallback(() => {
            console.log('🔄 WebSocket: Обновление данных мастер-класса в модальном окне');

            // Принудительно обновляем данные мастер-класса
            queryClient.invalidateQueries({ queryKey: ['master-classes'] });
            queryClient.refetchQueries({ queryKey: ['master-classes'] });

            // Обновляем данные счетов
            if (user?.id) {
                queryClient.invalidateQueries({ queryKey: ['invoices', 'parent', user.id] });
                queryClient.refetchQueries({ queryKey: ['invoices', 'parent', user.id] });
            }

            // Принудительно обновляем компонент
            setRefreshKey(prev => prev + 1);
        }, [user?.id, queryClient])
    });

    // Состояние для редактирования заказа
    const [isEditing, setIsEditing] = useState(false);
    const [editingChildId, setEditingChildId] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [paymentRefreshKey, setPaymentRefreshKey] = useState(0); // Отдельный ключ для обновления платежей
    const [editedStyles, setEditedStyles] = useState<Array<{ id: string; name: string; price: number; quantity: number }>>([]);
    const [editedOptions, setEditedOptions] = useState<Array<{ id: string; name: string; price: number; quantity: number }>>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Состояние для редактирования примечаний
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [editedNotes, setEditedNotes] = useState<string>('');
    const [isSavingNotes, setIsSavingNotes] = useState(false);

    // Состояние для возврата
    const [isRefunding, setIsRefunding] = useState(false);
    const [refundError, setRefundError] = useState<string | null>(null);
    const [showRefundModal, setShowRefundModal] = useState(false);

    // Поиск сервиса по названию мастер-класса
    useEffect(() => {
        if (workshop && services) {
            const service = services.find(s => s.id === workshop.serviceId);
            setCurrentService(service || null);
        }
    }, [workshop, services]);

    // Принудительное обновление данных при изменении workshop
    useEffect(() => {
        if (workshop) {
            console.log('🔄 Обновляем данные при изменении workshop');

            // Принудительно обновляем данные мастер-класса
            queryClient.invalidateQueries({ queryKey: ['master-classes'] });
            queryClient.refetchQueries({ queryKey: ['master-classes'] });

            // Обновляем данные счетов
            if (user?.id) {
                queryClient.invalidateQueries({ queryKey: ['invoices', 'parent', user.id] });
                queryClient.refetchQueries({ queryKey: ['invoices', 'parent', user.id] });
            }

            // Принудительно обновляем компонент
            setRefreshKey(prev => prev + 1);
        }
    }, [workshop, user?.id, queryClient]);

    // Принудительное обновление данных при открытии модального окна
    useEffect(() => {
        if (isOpen && workshop) {
            // Обновляем данные мастер-класса
            console.log('🔄 Обновляем данные мастер-класса при открытии модального окна');

            // Принудительно обновляем данные мастер-класса
            queryClient.invalidateQueries({ queryKey: ['master-classes'] });
            queryClient.refetchQueries({ queryKey: ['master-classes'] });

            // Обновляем данные счетов
            if (user?.id) {
                queryClient.invalidateQueries({ queryKey: ['invoices', 'parent', user.id] });
                queryClient.refetchQueries({ queryKey: ['invoices', 'parent', user.id] });
            }

            // Обновляем статус счетов для всех детей
            const updateInvoiceStatuses = async () => {
                try {
                    for (const child of workshop.childrenWithStatus || []) {
                        if (child.invoice?.id) {
                            // Проверяем статус счета через API
                            const response = await api.invoices.getInvoices({
                                participant_id: child.childId
                            });

                            if (response.invoices.length > 0) {
                                const updatedInvoice = response.invoices[0];
                                if (updatedInvoice.status !== child.invoice.status) {
                                    console.log('🔄 Статус счета обновлен:', {
                                        invoiceId: child.invoice.id,
                                        oldStatus: child.invoice.status,
                                        newStatus: updatedInvoice.status
                                    });
                                    // Обновляем статус в локальном состоянии
                                    child.invoice.status = updatedInvoice.status;
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error('❌ Ошибка обновления статуса счетов:', error);
                }
            };

            updateInvoiceStatuses();
        }
    }, [isOpen, workshop, queryClient, user?.id]);

    if (!workshop || !currentService) return null;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (timeString: string) => {
        return timeString.slice(0, 5); // Убираем секунды
    };


    const getUnpaidInvoices = () => {
        return (workshop.childrenWithStatus || [])
            .filter(child => child.invoice && child.invoice.status === 'pending')
            .map(child => child.invoice)
            .filter(Boolean) as Invoice[];
    };

    const getPaidInvoices = () => {
        const paidInvoices = (workshop.childrenWithStatus || [])
            .filter(child => child.invoice && child.invoice.status === 'paid')
            .map(child => child.invoice)
            .filter(Boolean) as Invoice[];

        // Отладочная информация
        console.log('🔍 Отладка кнопки возврата:', {
            workshop: workshop?.title,
            childrenWithStatus: workshop?.childrenWithStatus?.map(child => ({
                childName: child.childName,
                invoiceStatus: child.invoice?.status,
                invoiceId: child.invoice?.id
            })),
            paidInvoices: paidInvoices.length,
            canRefund: canRefund()
        });

        return paidInvoices;
    };

    // Проверка возможности возврата - за 3 часа до мастер-класса
    const canRefund = () => {
        if (!workshop) return false;

        const workshopDateTime = new Date(`${workshop.date}T${workshop.time}`);
        const now = new Date();
        const threeHoursBefore = new Date(workshopDateTime.getTime() - 3 * 60 * 60 * 1000);

        return now < threeHoursBefore;
    };

    // Инициирование возврата
    const initiateRefund = async (reason: string, email: string) => {
        if (!workshop) return;

        setIsRefunding(true);
        setRefundError(null);

        try {
            const paidInvoices = getPaidInvoices();
            if (paidInvoices.length === 0) {
                throw new Error('Нет оплаченных счетов для возврата');
            }

            // Инициируем возврат для первого оплаченного счета
            const invoice = paidInvoices[0];

            // Сначала получаем JWT токен для отладки
            console.log('🔍 Получаем JWT токен для отладки возврата...');
            console.log('🔍 Invoice ID:', invoice.id);
            console.log('🔍 Reason:', reason);

            try {
                const jwtResponse = await fetch(`${import.meta.env.VITE_API_URL || 'https://waxhands.ru/api'}/robokassa/invoices/${invoice.id}/refund/jwt`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    }
                });

                console.log('🔍 JWT Response status:', jwtResponse.status);
                console.log('🔍 JWT Response ok:', jwtResponse.ok);

                if (jwtResponse.ok) {
                    const jwtData = await jwtResponse.json();
                    console.log('🔐 JWT токен для возврата:', jwtData.jwtToken);
                    console.log('📋 Данные для возврата:', jwtData.refundData);

                    // Декодируем JWT payload для отладки
                    try {
                        // JWT использует base64url, а не base64
                        const base64Url = jwtData.jwtToken.split('.')[1];
                        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                        const payload = JSON.parse(atob(base64));
                        console.log('🔍 Декодированный JWT payload:', payload);
                    } catch (decodeError) {
                        console.warn('⚠️ Не удалось декодировать JWT payload:', decodeError);
                    }
                } else {
                    const errorText = await jwtResponse.text();
                    console.warn('⚠️ Не удалось получить JWT токен для отладки:', jwtResponse.status, errorText);
                }
            } catch (jwtError) {
                console.warn('⚠️ Ошибка при получении JWT токена для отладки:', jwtError);
            }

            const response = await api.robokassa.initiateRefund(invoice.id, reason, email);

            if (response.success) {
                toast({
                    title: "Возврат инициирован",
                    description: "Запрос на возврат отправлен. Ожидайте обработки.",
                });

                // Обновляем статус счета в локальном состоянии
                const paidInvoices = getPaidInvoices();
                if (paidInvoices.length > 0) {
                    paidInvoices[0].status = 'cancelled';
                }

                // Закрываем модальное окно и обновляем страницу
                onOpenChange(false);
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                throw new Error(response.error || 'Ошибка при инициировании возврата');
            }
        } catch (error) {
            console.error('Ошибка при инициировании возврата:', error);
            const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
            setRefundError(errorMessage);
            toast({
                title: "Ошибка возврата",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setIsRefunding(false);
        }
    };

    // Вычисляем общую сумму для всех детей
    const getTotalAmount = () => {
        return (workshop.childrenWithStatus || []).reduce((total, child) => {
            const childInvoice = child.invoice;
            if (!childInvoice || childInvoice.status !== 'pending') return total;

            // Получаем данные участника для этого ребенка
            const participant = (workshop.participants || []).find(p => p.childId === child.childId);
            if (!participant) return total;

            // Используем данные напрямую из participant для точного расчета
            const childStyles = participant.selectedStyles?.map(style => {
                const serviceStyle = currentService?.styles?.find(s => s.id === style.id);
                return {
                    id: style.id,
                    name: style.name,
                    price: serviceStyle?.price || 0
                };
            }) || [];

            const childOptions = participant.selectedOptions?.map(option => {
                const serviceOption = currentService?.options?.find(o => o.id === option.id);
                return {
                    id: option.id,
                    name: option.name,
                    price: serviceOption?.price || 0
                };
            }) || [];

            // Считаем сумму для этого ребенка
            const childAmount = (childStyles || []).reduce((sum, style) => {
                const price = typeof style === 'object' ? (style.price || 0) : 0;
                return sum + price;
            }, 0) + (childOptions || []).reduce((sum, option) => {
                const price = typeof option === 'object' ? (option.price || 0) : 0;
                return sum + price;
            }, 0);

            return total + childAmount;
        }, 0);
    };

    const unpaidInvoices = getUnpaidInvoices();
    const isTesterPaymentBypass = user?.surname === 'Тырин' && user?.phone === '+79143131002';
    const isPaymentAvailable = isGlobalPaymentEnabled || isTesterPaymentBypass;

    // Функции для редактирования заказа
    const startEditing = (childId: string) => {
        const child = workshop.childrenWithStatus.find(c => c.childId === childId);
        if (!child?.invoice) return;

        setEditingChildId(childId);
        setIsEditing(true);

        // Получаем данные участника для конкретного ребенка
        const participant = (workshop.participants || []).find(p => p.childId === childId);
        if (!participant) return;

        // Инициализируем данные для редактирования из participant (только для этого ребенка)
        const stylesWithQuantity = (participant.selectedStyles || []).map(style => {
            const serviceStyle = currentService?.styles?.find(s => s.id === style.id);
            return {
                id: style.id,
                name: style.name,
                price: serviceStyle?.price || 0,
                quantity: 1 // Каждый стиль показываем как 1 штуку
            };
        });

        const optionsWithQuantity = (participant.selectedOptions || []).map(option => {
            const serviceOption = currentService?.options?.find(o => o.id === option.id);
            return {
                id: option.id,
                name: option.name,
                price: serviceOption?.price || 0,
                quantity: 1 // Каждую опцию показываем как 1 штуку
            };
        });

        setEditedStyles(stylesWithQuantity);
        setEditedOptions(optionsWithQuantity);
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setEditingChildId(null);
        setEditedStyles([]);
        setEditedOptions([]);
    };

    // Функции для редактирования примечаний
    const startEditingNotes = () => {
        setIsEditingNotes(true);
        const firstParticipant = (workshop.participants || [])[0];
        setEditedNotes(firstParticipant?.notes || '');
    };

    const cancelEditingNotes = () => {
        setIsEditingNotes(false);
        setEditedNotes('');
    };

    const saveNotes = async () => {
        console.log('🔄 saveNotes: Начинаем сохранение примечаний', {
            editedNotes,
            onWorkshopUpdate: !!onWorkshopUpdate,
            workshop: workshop?.id
        });
        setIsSavingNotes(true);
        try {
            const unpaidInvoices = getUnpaidInvoices();
            console.log('🔍 saveNotes: unpaidInvoices', unpaidInvoices);

            if (unpaidInvoices.length > 0) {
                // Получаем текущие данные счета
                const currentInvoice = unpaidInvoices[0];
                console.log('🔍 saveNotes: currentInvoice', currentInvoice);

                await api.invoices.updateInvoice(unpaidInvoices[0].id, {
                    selected_styles: currentInvoice.selected_styles || [],
                    selected_options: currentInvoice.selected_options || [],
                    amount: currentInvoice.amount || 0,
                    notes: editedNotes
                });
                console.log('✅ saveNotes: invoice обновлен');

                // Обновляем участников в мастер-классе через правильный API
                // Используем ID участника из workshop.participants (с суффиксом), а не из счета
                console.log('🔍 saveNotes: workshop.participants', workshop.participants);
                console.log('🔍 saveNotes: currentInvoice.participant_id', currentInvoice.participant_id);
                console.log('🔍 saveNotes: participant IDs в workshop.participants', (workshop.participants || []).map(p => p.id));

                // Находим участника в workshop.participants (используем первый, так как обычно один)
                const participant = (workshop.participants || [])[0];
                if (!participant) {
                    console.log('❌ saveNotes: нет участников в workshop.participants');
                    throw new Error('Нет участников в мастер-классе');
                }

                const participantId = participant.id;
                console.log('✅ saveNotes: используем participantId из workshop.participants:', participantId);

                try {
                    await api.masterClassEvents.updateParticipant(workshop.id, participantId, {
                        notes: editedNotes
                    });
                    console.log('✅ saveNotes: participant обновлен через API');

                    // Обновляем локальное состояние workshop
                    if (onWorkshopUpdate) {
                        const updatedParticipants = (workshop.participants || []).map(p =>
                            p.id === participant.id ? { ...p, notes: editedNotes } : p
                        );
                        console.log('🔄 Обновляем workshop с новыми примечаниями:', {
                            participantId: participant.id,
                            notes: editedNotes,
                            updatedParticipants
                        });
                        onWorkshopUpdate({
                            ...workshop,
                            participants: updatedParticipants
                        });
                    } else {
                        console.log('❌ onWorkshopUpdate не определен');
                    }
                } catch (error) {
                    console.error('❌ saveNotes: ошибка при обновлении участника через API:', error);
                    throw error;
                }
            } else {
                console.log('❌ saveNotes: нет неоплаченных счетов');
            }

            // Обновляем данные после сохранения примечаний (НЕ обновляем платежи, так как сумма не изменилась)
            if (user?.id) {
                queryClient.invalidateQueries({ queryKey: ['master-classes'] });
                queryClient.refetchQueries({ queryKey: ['master-classes'] });
            }
            setRefreshKey(prev => prev + 1); // Обновляем только интерфейс, не платежи

            // Принудительно обновляем интерфейс примечаний
            console.log('🔄 Принудительно обновляем интерфейс примечаний');

            // Альтернативный способ обновления данных, если onWorkshopUpdate не работает
            if (!onWorkshopUpdate) {
                console.log('⚠️ onWorkshopUpdate не определен, используем альтернативный способ');
                // Принудительно обновляем данные мастер-классов
                queryClient.invalidateQueries({ queryKey: ['master-classes'] });
                queryClient.refetchQueries({ queryKey: ['master-classes'] });
            }

            toast({
                title: "Примечания обновлены",
                description: "Примечания к заказу сохранены.",
            });

            cancelEditingNotes();
        } catch (error) {
            console.error('Ошибка при сохранении примечаний:', error);
            toast({
                title: "Ошибка",
                description: "Не удалось сохранить примечания. Попробуйте еще раз.",
                variant: "destructive",
            });
        } finally {
            setIsSavingNotes(false);
        }
    };

    const updateStyleQuantity = (styleId: string, quantity: number) => {
        if (quantity <= 0) {
            setEditedStyles(prev => prev.filter(s => s.id !== styleId));
        } else {
            setEditedStyles(prev => prev.map(s => s.id === styleId ? { ...s, quantity } : s));
        }
    };

    const updateOptionQuantity = (optionId: string, quantity: number) => {
        if (quantity <= 0) {
            setEditedOptions(prev => prev.filter(o => o.id !== optionId));
        } else {
            setEditedOptions(prev => prev.map(o => o.id === optionId ? { ...o, quantity } : o));
        }
    };

    const addStyle = (style: ServiceStyle) => {
        const existing = editedStyles.find(s => s.id === style.id);
        if (existing) {
            updateStyleQuantity(style.id, existing.quantity + 1);
        } else {
            setEditedStyles(prev => [...prev, { ...style, quantity: 1 }]);
        }
    };

    const addOption = (option: ServiceOption) => {
        const existing = editedOptions.find(o => o.id === option.id);
        if (existing) {
            updateOptionQuantity(option.id, existing.quantity + 1);
        } else {
            setEditedOptions(prev => [...prev, { ...option, quantity: 1 }]);
        }
    };

    const removeStyle = (styleId: string) => {
        setEditedStyles(prev => prev.filter(s => s.id !== styleId));
    };

    const removeOption = (optionId: string) => {
        setEditedOptions(prev => prev.filter(o => o.id !== optionId));
    };

    const saveChanges = async () => {
        if (!editingChildId || !workshop) return;

        setIsSaving(true);
        try {
            // Подготавливаем данные для обновления конкретного ребенка
            const updatedStyles = editedStyles.flatMap(style =>
                Array(style.quantity).fill(0).map(() => ({
                    id: style.id,
                    name: style.name,
                    price: style.price
                }))
            );

            const updatedOptions = editedOptions.flatMap(option =>
                Array(option.quantity).fill(0).map(() => ({
                    id: option.id,
                    name: option.name,
                    price: option.price
                }))
            );

            // Вычисляем новую сумму для этого ребенка
            const childAmount = updatedStyles.reduce((sum, style) => sum + style.price, 0) +
                updatedOptions.reduce((sum, option) => sum + option.price, 0);

            // Обновляем участников в мастер-классе
            const updatedParticipants = (workshop.participants || []).map(p => {
                if (p.childId === editingChildId) {
                    // Обновляем данные для редактируемого ребенка
                    return {
                        ...p,
                        selectedStyles: editedStyles.map(s => ({ id: s.id, name: s.name })),
                        selectedOptions: editedOptions.map(o => ({ id: o.id, name: o.name })),
                        totalAmount: childAmount
                    };
                }
                return p;
            });

            // Обновляем каждого участника отдельно через новый API
            for (const participant of updatedParticipants) {
                if (participant.id) {
                    await api.masterClassEvents.updateParticipant(workshop.id, participant.id, {
                        selectedStyles: participant.selectedStyles,
                        selectedOptions: participant.selectedOptions,
                        notes: participant.notes
                    });
                }
            }

            // Обновляем общий счет
            const unpaidInvoices = getUnpaidInvoices();
            if (unpaidInvoices.length > 0) {
                // Собираем все стили и опции всех детей для общего счета
                const allStyles: Array<{ id: string; name: string; price: number }> = [];
                const allOptions: Array<{ id: string; name: string; price: number }> = [];

                for (const p of updatedParticipants) {
                    const childStyles = (p.selectedStyles || []).map(style => {
                        const serviceStyle = currentService?.styles?.find(s => s.id === style.id);
                        return {
                            id: style.id,
                            name: style.name,
                            price: serviceStyle?.price || 0
                        };
                    });
                    const childOptions = (p.selectedOptions || []).map(option => {
                        const serviceOption = currentService?.options?.find(o => o.id === option.id);
                        return {
                            id: option.id,
                            name: option.name,
                            price: serviceOption?.price || 0
                        };
                    });
                    allStyles.push(...childStyles);
                    allOptions.push(...childOptions);
                }

                // Вычисляем общую сумму
                const totalAmount = allStyles.reduce((sum, style) => sum + style.price, 0) +
                    allOptions.reduce((sum, option) => sum + option.price, 0);

                // Счет обновляется автоматически в backend при обновлении участников
            }

            // Обновляем локальные данные workshop
            if (workshop && onWorkshopUpdate) {
                const updatedWorkshop = {
                    ...workshop,
                    participants: updatedParticipants
                };
                onWorkshopUpdate(updatedWorkshop);
            }

            // Инвалидируем кэш счетов для обновления карточки оплаты
            if (user?.id) {
                queryClient.invalidateQueries({ queryKey: ['invoices', 'parent', user.id] });
                queryClient.invalidateQueries({ queryKey: ['invoices', 'parent'] });
                queryClient.invalidateQueries({ queryKey: ['master-classes'] });

                // Принудительно обновляем данные мастер-класса
                queryClient.refetchQueries({ queryKey: ['master-classes'] });
                queryClient.refetchQueries({ queryKey: ['invoices', 'parent', user.id] });
            }

            // Принудительно обновляем компонент оплаты (изменилась сумма)
            setPaymentRefreshKey(prev => prev + 1);

            toast({
                title: "Заказ обновлен",
                description: "Изменения в заказе сохранены.",
            });

            // Закрываем режим редактирования
            cancelEditing();

            // НЕ перезагружаем страницу - остаемся на том же экране для оплаты
        } catch (error) {
            console.error('Ошибка при сохранении:', error);
            toast({
                title: "Ошибка",
                description: "Не удалось сохранить изменения. Попробуйте еще раз.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-[95vw] sm:w-[90vw] sm:max-w-[90vw] md:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-2 sm:p-6">
                <DialogHeader className="pb-2 sm:pb-4">
                    <DialogTitle className="text-lg sm:text-2xl font-bold text-orange-600 flex items-center space-x-2 sm:space-x-3">
                        <Palette className="w-6 h-6 sm:w-8 sm:h-8" />
                        <span>Детали заказа</span>
                    </DialogTitle>
                    <DialogDescription className="text-sm sm:text-lg text-gray-600">
                        Мастер-класс "{workshop.title}"
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 sm:space-y-6">
                    {/* Основная информация о мастер-классе */}
                    <Card className="bg-gradient-to-br from-orange-50 to-purple-50 border-orange-200">
                        <CardHeader className="pb-2 sm:pb-4">
                            <CardTitle className="text-lg sm:text-xl text-orange-700 flex items-center space-x-2">
                                <Palette className="w-5 h-5 sm:w-6 sm:h-6" />
                                <span>{workshop.title}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 sm:space-y-4">
                            <div className="grid grid-cols-1 gap-3 sm:gap-4">
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-3">
                                        <MapPin className="w-5 h-5 text-gray-500" />
                                        <span className="text-gray-700">{workshop.schoolName}</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <Users className="w-5 h-5 text-gray-500" />
                                        <span className="text-gray-700">Класс: {workshop.classGroup}</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-3">
                                        <Calendar className="w-5 h-5 text-gray-500" />
                                        <span className="text-gray-700">{formatDate(workshop.date)}</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <Clock className="w-5 h-5 text-gray-500" />
                                        <span className="text-gray-700">{formatTime(workshop.time)}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Участники и их выборы */}
                    <Card className="bg-white border-blue-200">
                        <CardHeader className="pb-2 sm:pb-4">
                            <CardTitle className="text-lg sm:text-xl text-blue-700 flex items-center space-x-2">
                                <Baby className="w-5 h-5 sm:w-6 sm:h-6" />
                                <span>Участники мастер-класса</span>
                            </CardTitle>
                            <CardDescription className="text-sm">
                                Дети и их выборы варианта ручки и дополнительных услуг
                            </CardDescription>
                        </CardHeader>

                        {/* Предупреждение если данные о счете не загружены */}
                        {workshop.childrenWithStatus.some(child => !child.invoice) && (
                            <div className="mx-6 mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-center space-x-2 text-yellow-800">
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="text-sm font-medium">
                                        ⚠️ Внимание: Данные о выбранных вариантах ручек и дополнительных услуг не загружены для некоторых участников.
                                        Возможно, требуется обновить страницу или проверить подключение к серверу.
                                    </span>
                                </div>
                            </div>
                        )}
                        <CardContent className="space-y-3 sm:space-y-4">
                            {(workshop.childrenWithStatus || []).map((child, index) => {
                                const childInvoice = child.invoice;
                                const isPaid = childInvoice?.status === 'paid';

                                // Получаем данные участника из мастер-класса для конкретного ребенка
                                const participant = (workshop.participants || []).find(p => p.childId === child.childId);

                                // Используем данные напрямую из participant, а не из invoice
                                // Это гарантирует, что показываем только выборы конкретного ребенка
                                const childStyles = participant?.selectedStyles?.map(style => {
                                    const serviceStyle = currentService.styles.find(s => s.id === style.id);
                                    return {
                                        id: style.id,
                                        name: style.name,
                                        price: serviceStyle?.price || 0
                                    };
                                }) || [];

                                const childOptions = participant?.selectedOptions?.map(option => {
                                    const serviceOption = currentService.options.find(o => o.id === option.id);
                                    return {
                                        id: option.id,
                                        name: option.name,
                                        price: serviceOption?.price || 0
                                    };
                                }) || [];

                                return (
                                    <div key={child.childId} className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-gray-50">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                                            <h4 className="text-base sm:text-lg font-semibold text-gray-800">
                                                {child.childName}
                                            </h4>
                                            <Badge
                                                variant={isPaid ? "default" : "secondary"}
                                                className={`${isPaid ? "bg-green-500 text-white" : "bg-yellow-100 text-yellow-800"} text-xs sm:text-sm`}
                                            >
                                                {isPaid ? 'Оплачено' : 'Ожидает оплаты'}
                                            </Badge>
                                        </div>

                                        {/* Выбранные стили */}
                                        <div className="mb-3">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                                                <h5 className="font-medium text-gray-700 flex items-center space-x-2 text-sm sm:text-base">
                                                    <Palette className="w-4 h-4 text-purple-500" />
                                                    <span>Выбранные варианты ручек:</span>
                                                </h5>
                                                {!isPaid && !isEditing && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => startEditing(child.childId)}
                                                        className="text-purple-600 hover:text-purple-700 text-xs sm:text-sm"
                                                    >
                                                        <Edit3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                                        Редактировать
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                {isEditing && editingChildId === child.childId ? (
                                                    // Режим редактирования
                                                    <div className="space-y-3">
                                                        {editedStyles.map((style) => (
                                                            <div key={style.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white rounded border border-purple-200 gap-3">
                                                                <div className="flex items-center space-x-3">
                                                                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                                                                        <Palette className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="font-medium text-gray-800 text-sm sm:text-base truncate">{style.name}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center justify-between sm:justify-end space-x-3">
                                                                    <div className="flex items-center space-x-2">
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => updateStyleQuantity(style.id, style.quantity - 1)}
                                                                            disabled={style.quantity <= 1}
                                                                            className="w-6 h-6 sm:w-8 sm:h-8 p-0"
                                                                        >
                                                                            <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                                                                        </Button>
                                                                        <span className="w-6 sm:w-8 text-center font-medium text-sm sm:text-base">{style.quantity}</span>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => updateStyleQuantity(style.id, style.quantity + 1)}
                                                                            className="w-6 h-6 sm:w-8 sm:h-8 p-0"
                                                                        >
                                                                            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                                                        </Button>
                                                                    </div>
                                                                    <div className="flex items-center space-x-2">
                                                                        <div className="text-right">
                                                                            <div className="font-bold text-purple-600 text-sm sm:text-base">{style.price * style.quantity} руб.</div>
                                                                            {style.quantity > 1 && (
                                                                                <div className="text-xs text-gray-500">{style.price} руб. × {style.quantity}</div>
                                                                            )}
                                                                        </div>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => removeStyle(style.id)}
                                                                            className="w-6 h-6 sm:w-8 sm:h-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                        >
                                                                            <X className="w-3 h-3 sm:w-4 sm:h-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {/* Добавление новых стилей */}
                                                        <div className="mt-4 p-3 bg-gray-50 rounded border">
                                                            <h6 className="font-medium text-gray-700 mb-2 text-sm sm:text-base">Добавить стили:</h6>
                                                            <div className="grid grid-cols-1 gap-2">
                                                                {(currentService.styles || []).map((style) => (
                                                                    <Button
                                                                        key={style.id}
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => addStyle(style)}
                                                                        className="justify-start text-left text-xs sm:text-sm h-8 sm:h-9"
                                                                    >
                                                                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                                                        <span className="truncate">{style.name} ({style.price} руб.)</span>
                                                                    </Button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : childStyles && childStyles.length > 0 ? (
                                                    // Обычный режим просмотра с группировкой
                                                    (() => {
                                                        // Группируем стили по названию и считаем количество ТОЛЬКО для этого ребенка
                                                        const groupedStyles = childStyles.reduce((acc, style) => {
                                                            const styleData = typeof style === 'string'
                                                                ? { id: style, name: currentService.styles.find(s => s.id === style)?.name || style, price: currentService.styles.find(s => s.id === style)?.price || 0 }
                                                                : style;

                                                            const existing = acc.find(s => s.id === styleData.id);
                                                            if (existing) {
                                                                existing.quantity += 1;
                                                                existing.totalPrice += styleData.price;
                                                            } else {
                                                                acc.push({ ...styleData, quantity: 1, totalPrice: styleData.price });
                                                            }
                                                            return acc;
                                                        }, [] as Array<{ id: string; name: string; price: number; quantity: number; totalPrice: number }>);

                                                        return groupedStyles.map((style) => (
                                                            <div key={style.id} className="flex items-center justify-between p-2 bg-white rounded border">
                                                                <div className="flex items-center space-x-2">
                                                                    <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                                                                        <Palette className="w-4 h-4 text-white" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-medium text-gray-800">
                                                                            {style.name} {style.quantity > 1 && `× ${style.quantity}`}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="font-bold text-purple-600">{style.totalPrice} руб.</div>
                                                                    {style.quantity > 1 && (
                                                                        <div className="text-xs text-gray-500">{style.price} руб. × {style.quantity}</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ));
                                                    })()
                                                ) : participant ? (
                                                    <div className="text-gray-500 text-sm italic p-2">Варианты ручек не выбраны</div>
                                                ) : (
                                                    <div className="text-yellow-600 text-sm italic p-2">⚠️ Данные о вариантах ручек не загружены</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Выбранные опции */}
                                        <div className="mb-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <h5 className="font-medium text-gray-700 flex items-center space-x-2">
                                                    <Sparkles className="w-4 h-4 text-blue-500" />
                                                    <span>Дополнительные услуги:</span>
                                                </h5>
                                                {!isPaid && !isEditing && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => startEditing(child.childId)}
                                                        className="text-blue-600 hover:text-blue-700"
                                                    >
                                                        <Edit3 className="w-4 h-4 mr-1" />
                                                        Редактировать
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                {isEditing && editingChildId === child.childId ? (
                                                    // Режим редактирования
                                                    <div className="space-y-3">
                                                        {editedOptions.map((option) => (
                                                            <div key={option.id} className="flex items-center justify-between p-3 bg-white rounded border border-blue-200">
                                                                <div className="flex items-center space-x-3">
                                                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center">
                                                                        <Sparkles className="w-4 h-4 text-white" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-medium text-gray-800">{option.name}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center space-x-3">
                                                                    <div className="flex items-center space-x-2">
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => updateOptionQuantity(option.id, option.quantity - 1)}
                                                                            disabled={option.quantity <= 1}
                                                                            className="w-8 h-8 p-0"
                                                                        >
                                                                            <Minus className="w-4 h-4" />
                                                                        </Button>
                                                                        <span className="w-8 text-center font-medium">{option.quantity}</span>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => updateOptionQuantity(option.id, option.quantity + 1)}
                                                                            className="w-8 h-8 p-0"
                                                                        >
                                                                            <Plus className="w-4 h-4" />
                                                                        </Button>
                                                                    </div>
                                                                    <div className="flex items-center space-x-2">
                                                                        <div className="text-right">
                                                                            <div className="font-bold text-blue-600">{option.price * option.quantity} руб.</div>
                                                                            {option.quantity > 1 && (
                                                                                <div className="text-xs text-gray-500">{option.price} руб. × {option.quantity}</div>
                                                                            )}
                                                                        </div>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => removeOption(option.id)}
                                                                            className="w-8 h-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                        >
                                                                            <X className="w-4 h-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {/* Добавление новых опций */}
                                                        <div className="mt-4 p-3 bg-gray-50 rounded border">
                                                            <h6 className="font-medium text-gray-700 mb-2">Добавить дополнительные услуги:</h6>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                {(currentService.options || []).map((option) => (
                                                                    <Button
                                                                        key={option.id}
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => addOption(option)}
                                                                        className="justify-start text-left"
                                                                    >
                                                                        <Plus className="w-4 h-4 mr-2" />
                                                                        {option.name} ({option.price} руб.)
                                                                    </Button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : childOptions && childOptions.length > 0 ? (
                                                    // Обычный режим просмотра с группировкой
                                                    (() => {
                                                        // Группируем опции по названию и считаем количество ТОЛЬКО для этого ребенка
                                                        const groupedOptions = childOptions.reduce((acc, option) => {
                                                            const optionData = typeof option === 'string'
                                                                ? { id: option, name: currentService.options.find(o => o.id === option)?.name || option, price: currentService.options.find(o => o.id === option)?.price || 0 }
                                                                : option;

                                                            const existing = acc.find(o => o.id === optionData.id);
                                                            if (existing) {
                                                                existing.quantity += 1;
                                                                existing.totalPrice += optionData.price;
                                                            } else {
                                                                acc.push({ ...optionData, quantity: 1, totalPrice: optionData.price });
                                                            }
                                                            return acc;
                                                        }, [] as Array<{ id: string; name: string; price: number; quantity: number; totalPrice: number }>);

                                                        return groupedOptions.map((option) => (
                                                            <div key={option.id} className="flex items-center justify-between p-2 bg-white rounded border">
                                                                <div className="flex items-center space-x-2">
                                                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center">
                                                                        <Sparkles className="w-4 h-4 text-white" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-medium text-gray-800">
                                                                            {option.name} {option.quantity > 1 && `× ${option.quantity}`}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="font-bold text-blue-600">{option.totalPrice} руб.</div>
                                                                    {option.quantity > 1 && (
                                                                        <div className="text-xs text-gray-500">{option.price} руб. × {option.quantity}</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ));
                                                    })()
                                                ) : participant ? (
                                                    <div className="text-gray-500 text-sm italic p-2">Дополнительные услуги не выбраны</div>
                                                ) : (
                                                    <div className="text-yellow-600 text-sm italic p-2">⚠️ Данные об дополнительных услугах не загружены</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Кнопки редактирования */}
                                        {isEditing && editingChildId === child.childId && (
                                            <div className="border-t pt-3 mb-3">
                                                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        onClick={cancelEditing}
                                                        disabled={isSaving}
                                                        className="w-full sm:w-auto text-xs sm:text-sm"
                                                    >
                                                        <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                                        Отмена
                                                    </Button>
                                                    <Button
                                                        onClick={saveChanges}
                                                        disabled={isSaving}
                                                        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                                                    >
                                                        <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                                        {isSaving ? 'Сохранение...' : 'Сохранить'}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}


                                        {/* Итого по ребенку */}
                                        <div className="border-t pt-3">
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-gray-700">Итого за {child.childName}:</span>
                                                <span className="text-xl font-bold text-green-600">
                                                    {isEditing && editingChildId === child.childId ? (
                                                        // В режиме редактирования показываем новую сумму
                                                        (editedStyles.reduce((sum, style) => sum + (style.price * style.quantity), 0) +
                                                            editedOptions.reduce((sum, option) => sum + (option.price * option.quantity), 0)) + ' руб.'
                                                    ) : (
                                                        // Используем отфильтрованные стили и опции с ценами
                                                        ((childStyles || []).reduce((sum, style) => {
                                                            const price = typeof style === 'object' ? (style.price || 0) : 0;
                                                            return sum + price;
                                                        }, 0) +
                                                            (childOptions || []).reduce((sum, option) => {
                                                                const price = typeof option === 'object' ? (option.price || 0) : 0;
                                                                return sum + price;
                                                            }, 0)) + ' руб.'
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>

                    {/* Примечания (общие для всех детей) - показываем после всех детей */}
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                        <CardHeader className="pb-2 sm:pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg sm:text-xl text-blue-700 flex items-center space-x-2">
                                        <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                                        <span>Примечания к заказу</span>
                                    </CardTitle>
                                    <CardDescription className="text-sm">
                                        Общие пожелания и примечания для всех детей
                                    </CardDescription>
                                </div>
                                {!isEditingNotes && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={startEditingNotes}
                                        className="text-blue-600 hover:text-blue-700"
                                    >
                                        <Edit3 className="w-4 h-4 mr-1" />
                                        Редактировать
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isEditingNotes ? (
                                <div className="space-y-3">
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <textarea
                                            value={editedNotes}
                                            onChange={(e) => setEditedNotes(e.target.value)}
                                            placeholder="Введите примечания или пожелания..."
                                            className="w-full p-2 border border-gray-300 rounded-md text-sm resize-none"
                                            rows={3}
                                        />
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                        <Button
                                            variant="outline"
                                            onClick={cancelEditingNotes}
                                            disabled={isSavingNotes}
                                            size="sm"
                                        >
                                            <X className="w-4 h-4 mr-1" />
                                            Отмена
                                        </Button>
                                        <Button
                                            onClick={saveNotes}
                                            disabled={isSavingNotes}
                                            size="sm"
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            <Save className="w-4 h-4 mr-1" />
                                            {isSavingNotes ? 'Сохранение...' : 'Сохранить'}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-gray-700">
                                        {(() => {
                                            const notes = (workshop.participants || [])[0]?.notes;
                                            console.log('📝 Отображение примечаний:', {
                                                workshopId: workshop.id,
                                                participants: workshop.participants,
                                                firstParticipant: (workshop.participants || [])[0],
                                                notes: notes
                                            });
                                            return notes || 'Примечания не добавлены';
                                        })()}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Секция оплаты для неоплаченных счетов */}
                    {unpaidInvoices.length > 0 && paymentSettingsLoading && (
                        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                            <CardHeader className="pb-2 sm:pb-4">
                                <CardTitle className="text-lg sm:text-xl text-blue-700 flex items-center space-x-2">
                                    <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                                    <span>Проверяем доступность оплаты...</span>
                                </CardTitle>
                                <CardDescription className="text-sm">
                                    Подгружаем настройки Robokassa, это займет несколько секунд
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    )}
                    {unpaidInvoices.length > 0 && isPaymentAvailable && !paymentSettingsLoading && (
                        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                            <CardHeader className="pb-2 sm:pb-4">
                                <CardTitle className="text-lg sm:text-xl text-blue-700 flex items-center space-x-2">
                                    <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
                                    <span>Оплата участия</span>
                                </CardTitle>
                                <CardDescription className="text-sm">
                                    Оплатите счет для завершения записи на мастер-класс
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Показываем только первый неоплаченный счет (общий) */}
                                {unpaidInvoices.length > 0 && (
                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                        <div className="flex justify-between items-center mb-3">
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    Счет №{unpaidInvoices[0].id.slice(-8)}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {workshop.childrenWithStatus.map(child => child.childName).join(', ')} - {formatDate(unpaidInvoices[0].workshop_date || '')}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-green-600">
                                                    {getTotalAmount()} руб.
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Ожидает оплаты
                                                </p>
                                            </div>
                                        </div>

                                        <RobokassaPayment
                                            key={`payment-${paymentRefreshKey}-${unpaidInvoices[0]?.id}-${workshop?.id}`}
                                            invoiceId={unpaidInvoices[0]?.id}
                                            onPaymentSuccess={() => {
                                                toast({
                                                    title: "Оплата успешна! 🎉",
                                                    description: "Статус счета обновлен. Спасибо за оплату!",
                                                });

                                                // Обновляем статус счета в локальном состоянии
                                                if (unpaidInvoices[0]) {
                                                    unpaidInvoices[0].status = 'paid';
                                                }

                                                onOpenChange(false);
                                                // Обновляем данные после успешной оплаты
                                                if (user?.id) {
                                                    queryClient.invalidateQueries({ queryKey: ['invoices', 'parent', user.id] });
                                                    queryClient.invalidateQueries({ queryKey: ['invoices', 'parent'] });
                                                    queryClient.invalidateQueries({ queryKey: ['master-classes'] });
                                                    queryClient.refetchQueries({ queryKey: ['master-classes'] });
                                                    queryClient.refetchQueries({ queryKey: ['invoices', 'parent', user.id] });
                                                }
                                                setPaymentRefreshKey(prev => prev + 1);
                                            }}
                                            onPaymentError={(error) => {
                                                toast({
                                                    title: "Ошибка оплаты",
                                                    description: "Не удалось обработать оплату. Попробуйте еще раз.",
                                                    variant: "destructive"
                                                });
                                            }}
                                            onRefundSuccess={() => {
                                                toast({
                                                    title: "Возврат успешен! 💰",
                                                    description: "Средства возвращены на ваш счет.",
                                                });
                                                // Обновляем данные после успешного возврата
                                                if (user?.id) {
                                                    queryClient.invalidateQueries({ queryKey: ['invoices', 'parent', user.id] });
                                                    queryClient.invalidateQueries({ queryKey: ['invoices', 'parent'] });
                                                    queryClient.invalidateQueries({ queryKey: ['master-classes'] });
                                                    queryClient.refetchQueries({ queryKey: ['master-classes'] });
                                                    queryClient.refetchQueries({ queryKey: ['invoices', 'parent', user.id] });
                                                }
                                                setPaymentRefreshKey(prev => prev + 1);
                                                onOpenChange(false);
                                            }}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Сообщение для пользователей, которым недоступна оплата */}
                    {unpaidInvoices.length > 0 && !isPaymentAvailable && !paymentSettingsLoading && (
                        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                            <CardHeader className="pb-2 sm:pb-4">
                                <CardTitle className="text-lg sm:text-xl text-yellow-700 flex items-center space-x-2">
                                    <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                                    <span>Оплата в данный момент недоступна</span>
                                </CardTitle>
                                <CardDescription className="text-sm">
                                    Ведутся технические работы
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-sm text-yellow-800">
                                        Оплата временно недоступна. Пожалуйста, попробуйте позже или обратитесь к администратору.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Кнопки действий */}
                    <div className="flex justify-center space-x-4 pt-4">
                        {/* Кнопка возврата - показываем только для оплаченных заказов и если можно вернуть */}
                        {getPaidInvoices().length > 0 && canRefund() && (
                            <Button
                                onClick={() => setShowRefundModal(true)}
                                disabled={isRefunding}
                                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isRefunding ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Обработка...
                                    </>
                                ) : (
                                    <>
                                        <RotateCcw className="w-5 h-5 mr-2" />
                                        Возврат
                                    </>
                                )}
                            </Button>
                        )}

                        {/* Сообщение если нельзя вернуть */}
                        {getPaidInvoices().length > 0 && !canRefund() && (
                            <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-800">
                                    ⏰ Возврат недоступен - осталось менее 3 часов до мастер-класса
                                </p>
                            </div>
                        )}

                        <Button
                            onClick={() => onOpenChange(false)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        >
                            Закрыть
                        </Button>
                    </div>
                </div>
            </DialogContent>

            {/* Модальное окно для причины возврата */}
            <RefundReasonModal
                open={showRefundModal}
                onClose={() => setShowRefundModal(false)}
                onConfirm={initiateRefund}
                loading={isRefunding}
                defaultEmail={user?.email || ''}
            />
        </Dialog>
    );
}
