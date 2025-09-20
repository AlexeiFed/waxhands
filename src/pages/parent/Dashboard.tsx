/**
 * @file: src/pages/parent/Dashboard.tsx
 * @description: Родительский дашборд с управлением детьми и мастер-классами
 * @dependencies: useAuth, useToast, useMasterClasses, useSchools, useServices, useWorkshopRegistrations
 * @created: 2024-12-19
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import BonusBlock from "@/components/BonusBlock";
import { useMasterClasses } from "@/hooks/use-master-classes";
import { useSchools } from "@/hooks/use-schools";
import { useServices } from "@/hooks/use-services";
import { useWorkshopRegistrations } from "@/hooks/use-workshop-registrations";
import { useWorkshopParticipation, useParticipantInvoices, useParentInvoices } from "@/hooks/use-invoices";
import { useUsers } from "@/hooks/use-users";
import { useWorkshopRequestsWebSocket } from "@/hooks/use-workshop-requests-websocket";
import { useMasterClassesWebSocket } from "@/hooks/use-master-classes-websocket";
import { useAboutContent, useAboutMedia } from "@/hooks/use-about-api";
import { MasterClass, School, Service, WorkshopRegistration, Invoice, User, WorkshopRequestWithParent } from "@/types";

import { AnimatedStars } from "@/components/ui/animated-stars";
import MultiChildWorkshopModal from "@/components/ui/multi-child-workshop-modal";
import OrderDetailsModal from "@/components/ui/order-details-modal";
import { ParentHeader } from "@/components/ui/parent-header";
import ParentChildOnboardingModal from "@/components/ui/parent-child-onboarding-modal";
import WorkshopRequestModal from "@/components/ui/workshop-request-modal";
import YandexPaymentButton from "@/components/ui/yandex-payment-button";
import {
    Palette,
    Calendar,
    Clock,
    MapPin,
    Users,
    Star,
    Sparkles,
    CheckCircle,
    AlertCircle,
    Plus,
    Baby,
    GraduationCap,
    X,
    Edit,
    Info,
    FileImage,
    FileVideo,
    Play,
} from "lucide-react";

interface ChildData {
    id: string;
    name: string;
    age: number;
    schoolId: string; // Делаем обязательным
    schoolName?: string;
    classGroup: string; // Делаем обязательным
}

interface WorkshopCardData {
    id: string;
    title: string;
    date: string;
    time: string;
    classGroup: string;
    schoolName: string;
    city: string;
    children: string[]; // ID детей, для которых доступен этот мастер-класс
    invoiceId?: string;
    schoolId: string; // Добавляем для MultiChildWorkshopModal
    serviceId: string; // Добавляем для MultiChildWorkshopModal
    eligibleChildren: ChildData[]; // Добавляем для MultiChildWorkshopModal
    childrenWithStatus: Array<{
        childId: string;
        childName: string;
        status: 'none' | 'pending' | 'paid' | 'cancelled';
        invoiceId?: string;
        registrationId?: string;
        registration?: WorkshopRegistration;
        invoice?: Invoice;
    }>;
    participantsCount?: number; // Количество участников в мастер-классе
    invoiceStatus?: 'pending' | 'paid' | 'cancelled'; // Статус счета
}

interface NewChildData {
    name: string;
    surname: string;
    age?: number; // Добавляем поле возраста
    schoolId: string;
    class: string;
    shift: string;
}

const ParentDashboard = () => {

    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { masterClasses, fetchMasterClasses } = useMasterClasses();
    const { schools } = useSchools();
    const { services } = useServices();
    const { getUserRegistrations } = useWorkshopRegistrations();
    // Получаем счета для всех мастер-классов
    const [workshopInvoices, setWorkshopInvoices] = useState<{ [workshopId: string]: Invoice[] }>({});
    const { getChildrenByParentId, createUser, updateUser } = useUsers();
    const { content: aboutContent, loading: aboutContentLoading } = useAboutContent();
    const { media: aboutMedia, loading: aboutMediaLoading } = useAboutMedia();

    const [activeTab, setActiveTab] = useState("about");
    const [children, setChildren] = useState<ChildData[]>([]);

    // Получаем ID всех детей
    const childrenIds = (children || []).map(child => child.id);
    const { data: participantInvoices } = useParentInvoices(user?.id || '', childrenIds);
    const [userRegistrations, setUserRegistrations] = useState<WorkshopRegistration[]>([]);
    const [isAddChildDialogOpen, setIsAddChildDialogOpen] = useState(false);

    // Функция для получения URL медиа файлов
    const getMediaUrl = useCallback((filePath: string) => {
        // Преобразуем путь из БД в URL для отображения
        if (filePath.startsWith('/src/assets/')) {
            return filePath;
        }

        // Обработка путей из папки uploads
        if (filePath.startsWith('@uploads/')) {
            const result = filePath.replace('@uploads/', '/uploads/');
            return result;
        }

        // Обработка путей из папки uploads (без @)
        if (filePath.startsWith('uploads/')) {
            const result = filePath.replace('uploads/', '/uploads/');
            return result;
        }

        // Если путь уже содержит полный URL
        if (filePath.startsWith('http')) {
            return filePath;
        }

        // По умолчанию добавляем правильный базовый URL для production
        const baseUrl = process.env.NODE_ENV === 'production' ? 'https://waxhands.ru' : 'http://localhost:3001';
        const result = `${baseUrl}${filePath}`;
        return result;
    }, []);
    const [newChild, setNewChild] = useState<NewChildData>({
        name: '',
        surname: '',
        age: undefined, // Добавляем поле возраста
        schoolId: '',
        class: '',
        shift: ''
    });
    const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
    const [availableClasses, setAvailableClasses] = useState<string[]>([]);
    const [isWorkshopRegistrationOpen, setIsWorkshopRegistrationOpen] = useState(false);
    const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
    const [selectedWorkshop, setSelectedWorkshop] = useState<WorkshopCardData | null>(null);
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => {
        // Проверяем, был ли уже показан онбординг
        const hasSeenOnboarding = localStorage.getItem('parent-onboarding-completed');
        // НЕ показываем онбординг авторизованным пользователям
        return false; // Отключаем онбординг для всех авторизованных пользователей
    });
    const [isEditChildDialogOpen, setIsEditChildDialogOpen] = useState(false);
    const [editingChild, setEditingChild] = useState<ChildData | null>(null);
    const [isWorkshopRequestOpen, setIsWorkshopRequestOpen] = useState(false); // Модальное окно заявки

    // Состояние для заявок на проведение мастер-классов
    const [workshopRequests, setWorkshopRequests] = useState<WorkshopRequestWithParent[]>([]);
    const [workshopRequestsStats, setWorkshopRequestsStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0
    });

    // WebSocket для автоматических обновлений заявок
    const { isConnected: wsConnected, sendMessage: wsSendMessage } = useWorkshopRequestsWebSocket(
        user?.id,
        false,
        (message) => {

            if (message.type === 'workshop_request_status_change' || message.type === 'workshop_request_update') {
                loadWorkshopRequests();
            } else if (message.type === 'workshop_request_created') {
                loadWorkshopRequests();
            } else {
                // Нет обработки для других типов сообщений
            }
        }
    );

    // WebSocket для автоматических обновлений мастер-классов
    const { isConnected: masterClassesWsConnected } = useMasterClassesWebSocket({
        userId: user?.id,
        enabled: true,
        onMasterClassUpdate: useCallback(() => {
            console.log('🔄 WebSocket: обновляем мастер-классы...');
            // Принудительно обновляем мастер-классы
            fetchMasterClasses({ forceRefresh: true });

            // Также обновляем счета и регистрации
            if (user?.id) {
                // Инвалидируем кэш счетов
                queryClient.invalidateQueries({ queryKey: ['invoices', 'parent', user.id] });
                queryClient.invalidateQueries({ queryKey: ['invoices', 'parent'] });

                // Перезагружаем регистрации
                getUserRegistrations(user.id)
                    .then(registrations => {
                        setUserRegistrations(registrations);
                    })
                    .catch(error => {
                        console.error('❌ Ошибка загрузки регистраций:', error);
                    });
            }
        }, [user?.id, fetchMasterClasses, queryClient, getUserRegistrations])
    });

    // Функция для правильного склонения слова "записался" (мемоизирована)
    const getParticipantsText = useCallback((count: number): string => {
        if (count === 0) return 'записались';
        if (count === 1) return 'записался';
        if (count >= 2 && count <= 4) return 'записались';
        return 'записалось';
    }, []);

    // Загружаем мастер-классы (оптимизировано)
    useEffect(() => {
        if (user?.id) {
            // Загружаем все мастер-классы, а не только для конкретного пользователя
            fetchMasterClasses();
        }
    }, [user?.id, fetchMasterClasses]);

    // Загружаем регистрации пользователя
    useEffect(() => {
        if (user?.id) {
            getUserRegistrations(user.id)
                .then(registrations => {
                    setUserRegistrations(registrations);
                })
                .catch(error => {
                    console.error('❌ Ошибка загрузки регистраций:', error);
                });
        }
    }, [user?.id, getUserRegistrations]);

    // Получаем детей родителя из API
    useEffect(() => {
        if (user?.id) {
            const fetchChildren = async () => {
                try {
                    const childrenData = await getChildrenByParentId(user.id);

                    // Преобразуем данные в нужный формат с использованием реального возраста
                    const formattedChildren: ChildData[] = (childrenData || []).map(child => {
                        // Используем реальный возраст из базы данных, если он есть
                        let age = child.age || 7; // По умолчанию 7 лет
                        if (!child.age && child.class) {
                            // Если возраст не указан, рассчитываем примерный возраст на основе класса
                            const classNumber = parseInt(child.class.match(/\d+/)?.[0] || '0');
                            age = classNumber + 6; // Примерно 6 лет в 1 классе
                        }

                        return {
                            id: child.id,
                            name: `${child.name} ${child.surname || ''}`.trim(),
                            age: age,
                            schoolId: child.schoolId,
                            schoolName: child.schoolName,
                            classGroup: child.class,
                        };
                    });

                    setChildren(formattedChildren);
                } catch (error) {
                    console.error('❌ Ошибка при загрузке детей:', error);
                    setChildren([]);
                }
            };

            fetchChildren();
        }
    }, [user?.id, getChildrenByParentId]);

    // Функция загрузки заявок на проведение мастер-классов
    const loadWorkshopRequests = useCallback(async () => {
        if (!user?.id) {
            return;
        }

        try {

            // Загружаем заявки родителя через специальный эндпоинт
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/workshop-requests/parent/${user.id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    setWorkshopRequests(data.data);
                } else if (Array.isArray(data)) {
                    setWorkshopRequests(data);
                }
            } else if (response.status === 403) {
                // Устанавливаем пустой массив заявок
                setWorkshopRequests([]);
            } else {
                // Обработка других статусов ответа
            }

            // Загружаем статистику заявок родителя через специальный эндпоинт
            const statsResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/workshop-requests/stats/parent/${user.id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                if (statsData.success && statsData.data) {
                    setWorkshopRequestsStats(statsData.data);
                }
            } else if (statsResponse.status === 403) {
                // Устанавливаем нулевую статистику
                setWorkshopRequestsStats({
                    total: 0,
                    pending: 0,
                    approved: 0,
                    rejected: 0
                });
            } else {
                // Обработка других статусов ответа
            }
        } catch (error) {
            console.error('❌ Ошибка при загрузке заявок:', error);
        }

    }, [user?.id]);

    // Загружаем заявки на проведение мастер-классов при монтировании
    useEffect(() => {
        if (user?.id) {
            loadWorkshopRequests();
        }
    }, [user?.id, loadWorkshopRequests]);

    // Обработчик изменения школы для формы добавления ребенка
    const handleSchoolChange = (schoolId: string) => {
        setSelectedSchoolId(schoolId);
        setNewChild(prev => ({ ...prev, schoolId, class: '' }));
        const school = schools.find(s => s.id === schoolId);
        setAvailableClasses(school?.classes || []);
    };

    // Обработчик добавления нового ребенка
    const handleAddChild = useCallback(async () => {
        if (!user?.id) return;

        try {
            // Валидация
            if (!newChild.name || !newChild.surname || !newChild.age || !newChild.schoolId || !newChild.class || !newChild.shift) {
                toast({
                    title: "Ошибка",
                    description: "Заполните все поля",
                    variant: "destructive",
                });
                return;
            }

            // Создаем ребенка через API
            const childData = {
                name: newChild.name,
                surname: newChild.surname,
                age: newChild.age, // Добавляем возраст
                role: 'child' as const,
                schoolId: newChild.schoolId,
                class: newChild.class,
                shift: newChild.shift,
                parentId: user.id
            };

            await createUser(childData);

            // Перезагружаем список детей после создания
            const updatedChildren = await getChildrenByParentId(user.id);
            const formattedChildren: ChildData[] = (updatedChildren || []).map(child => {
                // Используем реальный возраст из базы данных, если он есть
                let age = child.age || 7; // По умолчанию 7 лет
                if (!child.age && child.class) {
                    // Если возраст не указан, рассчитываем примерный возраст на основе класса
                    const classNumber = parseInt(child.class.match(/\d+/)?.[0] || '0');
                    age = classNumber + 6;
                }

                return {
                    id: child.id,
                    name: `${child.name} ${child.surname || ''}`.trim(),
                    age: age,
                    schoolId: child.schoolId,
                    schoolName: child.schoolName,
                    classGroup: child.class,
                };
            });

            setChildren(formattedChildren);

            // Сбрасываем форму
            setNewChild({
                name: '',
                surname: '',
                age: undefined, // Добавляем поле возраста
                schoolId: '',
                class: '',
                shift: ''
            });
            setSelectedSchoolId("");
            setAvailableClasses([]);
            setIsAddChildDialogOpen(false);

            toast({
                title: "Ребенок добавлен! 🎉",
                description: `${newChild.name} успешно добавлен в систему`,
            });

        } catch (error) {
            console.error('Ошибка при добавлении ребенка:', error);
            toast({
                title: "Ошибка",
                description: "Не удалось добавить ребенка. Попробуйте позже.",
                variant: "destructive",
            });
        }
    }, [user?.id, newChild, createUser, getChildrenByParentId, toast]);

    // Функция для открытия модального окна редактирования ребенка (мемоизирована)
    const handleEditChild = useCallback((child: ChildData) => {
        setEditingChild(child);
        setIsEditChildDialogOpen(true);
    }, []);

    // Функция для сохранения изменений ребенка (мемоизирована)
    const handleSaveChildChanges = useCallback(async () => {
        if (!editingChild || !user?.id) return;

        try {
            // Валидация
            if (!editingChild.name || !editingChild.age || !editingChild.schoolId || !editingChild.classGroup) {
                toast({
                    title: "Ошибка",
                    description: "Заполните все обязательные поля",
                    variant: "destructive",
                });
                return;
            }

            // Разделяем имя и фамилию
            const nameParts = editingChild.name.split(' ');
            const firstName = nameParts[0] || '';
            const surname = nameParts.slice(1).join(' ') || '';

            // Обновляем ребенка через API
            const updateData = {
                name: firstName,
                surname: surname,
                age: editingChild.age,
                schoolId: editingChild.schoolId,
                class: editingChild.classGroup,
            };

            // Используем существующий API для обновления пользователя
            await updateUser(editingChild.id, updateData);

            // Перезагружаем список детей после обновления
            const updatedChildren = await getChildrenByParentId(user.id);
            const formattedChildren: ChildData[] = (updatedChildren || []).map(child => {
                let age = child.age || 7;
                if (!child.age && child.class) {
                    const classNumber = parseInt(child.class.match(/\d+/)?.[0] || '0');
                    age = classNumber + 6;
                }

                return {
                    id: child.id,
                    name: `${child.name} ${child.surname || ''}`.trim(),
                    age: age,
                    schoolId: child.schoolId,
                    schoolName: child.schoolName,
                    classGroup: child.class,
                };
            });

            setChildren(formattedChildren);
            setIsEditChildDialogOpen(false);
            setEditingChild(null);

            toast({
                title: "Данные обновлены! ✅",
                description: `Информация о ребенке успешно обновлена`,
            });

        } catch (error) {
            console.error('Ошибка при обновлении ребенка:', error);
            toast({
                title: "Ошибка",
                description: "Не удалось обновить данные ребенка. Попробуйте позже.",
                variant: "destructive",
            });
        }
    }, [editingChild, user?.id, updateUser, getChildrenByParentId, toast]);

    // Мемоизируем тяжелые вычисления для предотвращения пересчетов
    const groupedWorkshops = useMemo(() => {
        if (!masterClasses.length || !children.length) {
            return { total: 0, workshops: [] };
        }

        const today = new Date().toISOString().slice(0, 10);

        // Фильтруем мастер-классы по дате
        const availableEvents = masterClasses.filter(ev => ev.date >= today);


        // Создаем карту для группировки по классу (школа + класс)
        const classGroupMap = new Map<string, WorkshopCardData>();


        const getInvoiceRank = (s?: 'pending' | 'paid' | 'cancelled'): number => {
            if (!s) return -1;
            switch (s) {
                case 'paid': return 2;
                case 'pending': return 1;
                default: return 0; // cancelled
            }
        };
        const mergeInvoice = (
            a?: 'pending' | 'paid' | 'cancelled',
            b?: 'pending' | 'paid' | 'cancelled'
        ): 'pending' | 'paid' | 'cancelled' | undefined => {
            return getInvoiceRank(b) > getInvoiceRank(a) ? b : a;
        };
        type ChildStatus = {
            childId: string;
            childName: string;
            status: 'none' | 'pending' | 'paid' | 'cancelled';
            invoiceId?: string;
            registrationId?: string;
            registration?: WorkshopRegistration;
            invoice?: Invoice;
        };
        const mergeChildStatusLists = (prev: ChildStatus[], next: ChildStatus[]): ChildStatus[] => {
            const map = new Map<string, ChildStatus>();
            prev.forEach(cs => map.set(cs.childId, cs));
            next.forEach(cs => {
                const existing = map.get(cs.childId);
                if (!existing) {
                    map.set(cs.childId, cs);
                } else {
                    // Простая логика: если новый статус лучше (paid > pending > cancelled > none), берем его
                    const statusPriority = { 'paid': 3, 'pending': 2, 'cancelled': 1, 'none': 0 };
                    const better = statusPriority[cs.status] > statusPriority[existing.status] ? cs : existing;
                    map.set(cs.childId, better);
                }
            });
            return Array.from(map.values());
        };
        const mergeEligibleChildren = (prev: ChildData[], next: ChildData[]): ChildData[] => {
            const map = new Map<string, ChildData>();
            [...prev, ...next].forEach(c => map.set(c.id, c));
            return Array.from(map.values());
        };

        // Для каждого доступного мастер-класса находим подходящих детей
        availableEvents.forEach(event => {
            const school = schools.find(s => s.id === event.schoolId);
            const service = services.find(s => s.id === event.serviceId);

            // Нормализуем названия классов для сравнения
            const normalizeClass = (className: string) => {
                return className
                    .replace(/[А-Я]/g, (match) => match.charCodeAt(0) === 1040 ? 'A' : match) // А -> A
                    .replace(/[а-я]/g, (match) => match.charCodeAt(0) === 1072 ? 'a' : match) // а -> a
                    .toUpperCase()
                    .trim();
            };

            const normalizedEventClass = normalizeClass(event.classGroup);

            // Ищем детей, которые могут участвовать в этом мастер-классе
            const eligibleChildren = children.filter(child => {
                const normalizedChildClass = normalizeClass(child.classGroup);

                // Проверяем соответствие школы по ID или названию
                const schoolMatches = child.schoolId === event.schoolId ||
                    (child.schoolName && school?.name &&
                        child.schoolName.toLowerCase() === school.name.toLowerCase());

                // Проверяем соответствие класса
                const classMatches = normalizedEventClass === normalizedChildClass;

                return schoolMatches && classMatches;
            });

            if (eligibleChildren.length > 0) {
                // Создаем ключ для группировки: школа + класс
                const classKey = `${event.schoolId}-${event.classGroup}`;

                // Проверяем статус участия для всех детей
                const childrenWithStatus = (eligibleChildren || []).map(child => {
                    // Сначала проверяем в регистрациях
                    const registration = userRegistrations.find(reg =>
                        reg.workshopId === event.id && reg.userId === child.id
                    );

                    // Проверяем в счетах - НЕ фильтруем по master_class_id, так как счет может быть для другого мастер-класса
                    // Связь между счетом и ребенком определяется через участников мастер-класса
                    const allInvoices = participantInvoices?.invoices || [];

                    const invoice = allInvoices.find(inv => {
                        const masterClass = masterClasses.find(mc => mc.id === event.id);
                        if (masterClass && masterClass.participants) {
                            // Проверяем, есть ли ребенок в участниках мастер-класса для этого счета
                            const hasChild = masterClass.participants.some(participant =>
                                participant.childId === child.id
                            );
                            return hasChild;
                        }
                        return false;
                    });


                    let status: 'none' | 'pending' | 'paid' | 'cancelled' = 'none';
                    if (registration) {
                        // confirmed = paid, pending = pending, cancelled = cancelled
                        status = registration.status === 'confirmed' ? 'paid' :
                            registration.status === 'pending' ? 'pending' : 'cancelled';
                    } else if (invoice) {
                        // invoice.status уже в правильном формате
                        // Если это групповой счет (participant_id = user.id), то статус применяется ко всем детям
                        if (invoice.participant_id === user?.id) {
                            status = invoice.status;
                        } else {
                            // Если это индивидуальный счет для ребенка
                            status = invoice.status;
                        }
                    }


                    return {
                        childId: child.id,
                        childName: child.name,
                        status: status,
                        invoiceId: invoice?.id,
                        registrationId: registration?.id,
                        registration: registration,
                        invoice: invoice
                    };
                });

                // Определяем статус счета на основе счетов детей
                let invoiceStatus: 'pending' | 'paid' | 'cancelled' | undefined;
                const childInvoices = childrenWithStatus.filter(c => c.invoice);
                if (childInvoices.length > 0) {
                    // Используем статус из найденных счетов детей
                    const hasPaidInvoice = childInvoices.some(c => c.invoice?.status === 'paid');
                    const hasPendingInvoice = childInvoices.some(c => c.invoice?.status === 'pending');
                    const hasCancelledInvoice = childInvoices.some(c => c.invoice?.status === 'cancelled');

                    if (hasPaidInvoice) invoiceStatus = 'paid';
                    else if (hasPendingInvoice) invoiceStatus = 'pending';
                    else if (hasCancelledInvoice) invoiceStatus = 'cancelled';
                }



                // Создаем или обновляем карточку для этого класса
                if (classGroupMap.has(classKey)) {
                    // Обновляем существующую карточку, добавляя новых детей
                    const existing = classGroupMap.get(classKey)!;
                    const oldInvoiceStatus = existing.invoiceStatus;

                    existing.children = [...new Set([...existing.children, ...(eligibleChildren || []).map(c => c.id)])];

                    // Обновляем статус счета (не понижая его)
                    existing.invoiceStatus = mergeInvoice(existing.invoiceStatus, invoiceStatus);

                    // Обновляем информацию о детях и их статусах (берем лучший статус для каждого ребенка)
                    existing.eligibleChildren = mergeEligibleChildren(existing.eligibleChildren, eligibleChildren);
                    existing.childrenWithStatus = mergeChildStatusLists(existing.childrenWithStatus, childrenWithStatus);

                } else {
                    // Создаем новую карточку для класса
                    const newCard = {
                        id: event.id,
                        title: service?.name || 'Мастер-класс',
                        date: event.date,
                        time: event.time,
                        classGroup: event.classGroup,
                        schoolName: event.schoolName || school?.name || 'Не указано',
                        city: event.city || school?.address?.split(',')[0]?.trim() || 'Не указан',
                        children: (eligibleChildren || []).map(c => c.id),
                        invoiceId: undefined, // Может быть несколько счетов для разных детей
                        schoolId: event.schoolId,
                        serviceId: event.serviceId,
                        eligibleChildren: eligibleChildren,
                        childrenWithStatus: childrenWithStatus,
                        participantsCount: event.participants ? event.participants.length : 0,
                        invoiceStatus
                    };

                    classGroupMap.set(classKey, newCard);

                }
            } else {
                // Нет подходящих детей для этого мастер-класса
            }
        });

        // Преобразуем в массив для отображения
        const allWorkshops = Array.from(classGroupMap.values());


        // Сортируем по дате, времени и названию школы
        const sortedWorkshops = allWorkshops.sort((a, b) => {
            // Сначала по дате
            if (a.date !== b.date) {
                return a.date.localeCompare(b.date);
            }
            // Затем по времени
            if (a.time !== b.time) {
                return a.time.localeCompare(b.time);
            }
            // Затем по названию школы
            return a.schoolName.localeCompare(b.schoolName);
        });


        return { total: sortedWorkshops.length, workshops: sortedWorkshops };
    }, [masterClasses, schools, services, children, userRegistrations, participantInvoices, user?.id]);

    // Мемоизируем прошедшие мастер-классы для вкладки "История"
    const pastWorkshops = useMemo(() => {
        if (!masterClasses.length || !children.length) {
            return { total: 0, workshops: [] };
        }

        const today = new Date().toISOString().slice(0, 10);

        // Фильтруем прошедшие мастер-классы
        const pastEvents = masterClasses.filter(ev => ev.date < today);


        // Создаем карту для группировки по классу (школа + класс)
        const classGroupMap = new Map<string, WorkshopCardData>();

        // Для каждого прошедшего мастер-класса находим подходящих детей
        pastEvents.forEach(event => {
            const school = schools.find(s => s.id === event.schoolId);
            const service = services.find(s => s.id === event.serviceId);

            // Нормализуем названия классов для сравнения
            const normalizeClass = (className: string) => {
                return className
                    .replace(/[А-Я]/g, (match) => match.charCodeAt(0) === 1040 ? 'A' : match)
                    .replace(/[а-я]/g, (match) => match.charCodeAt(0) === 1072 ? 'a' : match)
                    .toUpperCase()
                    .trim();
            };

            const normalizedEventClass = normalizeClass(event.classGroup);

            // Ищем детей, которые могли участвовать в этом мастер-классе
            const eligibleChildren = children.filter(child => {
                const normalizedChildClass = normalizeClass(child.classGroup);

                const schoolMatches = child.schoolId === event.schoolId ||
                    (child.schoolName && school?.name &&
                        child.schoolName.toLowerCase() === school.name.toLowerCase());

                const classMatches = normalizedEventClass === normalizedChildClass;

                return schoolMatches && classMatches;
            });

            if (eligibleChildren.length > 0) {
                const classKey = `${event.schoolId}-${event.classGroup}`;

                // Проверяем статус участия для всех детей
                const childrenWithStatus = (eligibleChildren || []).map(child => {
                    const registration = userRegistrations.find(reg =>
                        reg.workshopId === event.id && reg.userId === child.id
                    );

                    const allInvoices = participantInvoices?.invoices || [];
                    const invoice = allInvoices.find(inv => {
                        const masterClass = masterClasses.find(mc => mc.id === event.id);
                        if (masterClass && masterClass.participants) {
                            const hasChild = masterClass.participants.some(participant =>
                                participant.childId === child.id
                            );
                            return hasChild;
                        }
                        return false;
                    });

                    let status: 'none' | 'pending' | 'paid' | 'cancelled' = 'none';
                    if (registration) {
                        status = registration.status === 'confirmed' ? 'paid' :
                            registration.status === 'pending' ? 'pending' : 'cancelled';
                    } else if (invoice) {
                        status = invoice.status;
                    }

                    return {
                        childId: child.id,
                        childName: child.name,
                        status: status,
                        invoiceId: invoice?.id,
                        registrationId: registration?.id,
                        registration: registration,
                        invoice: invoice
                    };
                });

                // Определяем статус счета на основе счетов детей
                let invoiceStatus: 'pending' | 'paid' | 'cancelled' | undefined;
                const childInvoices = childrenWithStatus.filter(c => c.invoice);
                if (childInvoices.length > 0) {
                    const hasPaidInvoice = childInvoices.some(c => c.invoice?.status === 'paid');
                    const hasPendingInvoice = childInvoices.some(c => c.invoice?.status === 'pending');
                    const hasCancelledInvoice = childInvoices.some(c => c.invoice?.status === 'cancelled');

                    if (hasPaidInvoice) invoiceStatus = 'paid';
                    else if (hasPendingInvoice) invoiceStatus = 'pending';
                    else if (hasCancelledInvoice) invoiceStatus = 'cancelled';
                }

                // Создаем карточку для прошедшего мастер-класса
                const pastCard = {
                    id: event.id,
                    title: service?.name || 'Мастер-класс',
                    date: event.date,
                    time: event.time,
                    classGroup: event.classGroup,
                    schoolName: event.schoolName || school?.name || 'Не указано',
                    city: event.city || school?.address?.split(',')[0]?.trim() || 'Не указан',
                    children: eligibleChildren.map(c => c.id),
                    invoiceId: undefined,
                    schoolId: event.schoolId,
                    serviceId: event.serviceId,
                    eligibleChildren: eligibleChildren,
                    childrenWithStatus: childrenWithStatus,
                    participantsCount: event.participants ? event.participants.length : 0,
                    invoiceStatus
                };

                classGroupMap.set(classKey, pastCard);
            }
        });

        // Преобразуем в массив и сортируем по дате (новые сначала)
        const allPastWorkshops = Array.from(classGroupMap.values());
        const sortedPastWorkshops = allPastWorkshops.sort((a, b) => b.date.localeCompare(a.date));


        return { total: sortedPastWorkshops.length, workshops: sortedPastWorkshops };
    }, [masterClasses, schools, services, children, userRegistrations, participantInvoices]);

    const handleApproveOrder = (orderId: string) => {
        toast({
            title: "Заказ подтвержден!",
            description: "Ребенок записан на мастер-класс",
        });
    };

    const handleRejectOrder = (orderId: string) => {
        toast({
            title: "Заказ отклонен",
            description: "Ребенок не будет записан на мастер-класс",
        });
    };

    const handleWorkshopRegistration = (workshop: WorkshopCardData) => {
        setSelectedWorkshop(workshop);
        setIsWorkshopRegistrationOpen(true);
    };

    // Обработчик успешной регистрации на мастер-класс
    const handleWorkshopRegistrationSuccess = useCallback(async () => {
        try {
            console.log('🔄 Начинаем обновление данных после записи...');

            if (user?.id) {
                // 1. Принудительно обновляем мастер-классы
                console.log('📋 Обновляем мастер-классы...');
                await fetchMasterClasses({ forceRefresh: true });

                // 2. Перезагружаем регистрации пользователя
                console.log('📝 Обновляем регистрации...');
                const updatedRegistrations = await getUserRegistrations(user.id);
                setUserRegistrations(updatedRegistrations);

                // 3. Перезагружаем детей (для обновления статистики)
                console.log('👶 Обновляем данные детей...');
                const updatedChildren = await getChildrenByParentId(user.id);
                const formattedChildren: ChildData[] = (updatedChildren || []).map(child => {
                    let age = child.age || 7;
                    if (!child.age && child.class) {
                        const classNumber = parseInt(child.class.match(/\d+/)?.[0] || '0');
                        age = classNumber + 6;
                    }

                    return {
                        id: child.id,
                        name: `${child.name} ${child.surname || ''}`.trim(),
                        age: age,
                        schoolId: child.schoolId,
                        schoolName: child.schoolName,
                        classGroup: child.class,
                    };
                });
                setChildren(formattedChildren);

                // 4. Принудительно инвалидируем кэш счетов
                console.log('💰 Обновляем счета...');
                queryClient.invalidateQueries({ queryKey: ['invoices', 'parent', user.id] });
                queryClient.invalidateQueries({ queryKey: ['invoices', 'parent'] });
                queryClient.invalidateQueries({ queryKey: ['masterClasses'] });

                // 5. Небольшая задержка для корректного обновления UI
                setTimeout(() => {
                    console.log('✅ Обновление данных завершено');
                }, 500);
            }

            toast({
                title: "Успешно! 🎉",
                description: "Дети записаны на мастер-класс. Данные обновлены.",
            });

        } catch (error) {
            console.error('❌ Ошибка при обновлении данных:', error);
            toast({
                title: "Внимание",
                description: "Запись прошла успешно, но не удалось обновить данные. Обновите страницу.",
                variant: "destructive",
            });
        }
    }, [user?.id, fetchMasterClasses, getUserRegistrations, getChildrenByParentId, queryClient, toast]);

    // Обработчик просмотра счетов
    const handleViewInvoices = (workshop: WorkshopCardData) => {
        toast({
            title: "Счета",
            description: `Просмотр счетов для мастер-класса "${workshop.title}"`,
        });
        // TODO: Открыть модальное окно со счетами
    };

    // Обработчик просмотра деталей заказа
    const handleViewOrderDetails = (workshop: WorkshopCardData) => {
        const childrenNames = (workshop.childrenWithStatus || []).map(c => c.childName).join(', ');
        const statusText = workshop.invoiceStatus === 'paid' ? 'оплачен' :
            workshop.invoiceStatus === 'pending' ? 'ожидает оплаты' : 'отменен';

        // Показываем модальное окно с деталями заказа
        setSelectedWorkshop(workshop);
        setIsOrderDetailsOpen(true);

        console.log('Детали заказа:', {
            workshop: workshop.title,
            children: workshop.childrenWithStatus,
            status: workshop.invoiceStatus,
            invoiceStatus: workshop.invoiceStatus
        });
    };

    // Обработчик оплаты заказа
    const handlePaymentForWorkshop = (workshop: WorkshopCardData) => {
        // Показываем модальное окно с деталями заказа для оплаты
        setSelectedWorkshop(workshop);
        setIsOrderDetailsOpen(true);

        toast({
            title: "Оплата заказа",
            description: `Открываем детали заказа для оплаты мастер-класса "${workshop.title}"`,
        });
    };

    const getChildrenNames = (childrenIds: string[]) => {
        return (childrenIds || []).map(id => (children || []).find(c => c.id === id)?.name).filter(Boolean).join(', ');
    };

    // Мемоизируем статистику детей
    const childrenStats = useMemo(() => {
        if (!children.length) {
            return { pending: 0, completed: 0 };
        }

        // Считаем статистику из регистраций
        let pending = userRegistrations.filter(reg => reg.status === 'pending').length;
        let completed = userRegistrations.filter(reg => reg.status === 'confirmed').length;

        // ДОПОЛНИТЕЛЬНО: Считаем статистику из счетов участника
        if (participantInvoices?.invoices) {
            participantInvoices.invoices.forEach(invoice => {
                if (invoice.status === 'pending') {
                    pending++;
                } else if (invoice.status === 'paid') {
                    completed++;
                }
            });
        }

        const stats = { pending, completed };
        return stats;
    }, [children, userRegistrations, participantInvoices?.invoices]);

    // Функция для расчета статистики заказов по каждому ребенку
    const getChildOrderStats = useMemo(() => {
        if (!children.length) {
            return new Map<string, { pending: number; completed: number }>();
        }

        const childStats = new Map<string, { pending: number; completed: number }>();

        // Инициализируем статистику для каждого ребенка
        children.forEach(child => {
            childStats.set(child.id, { pending: 0, completed: 0 });
        });

        // Считаем статистику из регистраций
        userRegistrations.forEach(registration => {
            const childId = registration.userId;
            const stats = childStats.get(childId);

            if (stats) {
                if (registration.status === 'pending') {
                    stats.pending++;
                } else if (registration.status === 'confirmed') {
                    stats.completed++;
                }
            }
        });

        // ДОПОЛНИТЕЛЬНО: Считаем статистику из счетов участника
        if (participantInvoices?.invoices) {
            participantInvoices.invoices.forEach(invoice => {
                // Ищем ребенка по participant_id в счете
                const child = children.find(c => c.id === invoice.participant_id);
                if (child) {
                    const stats = childStats.get(child.id);
                    if (stats) {
                        if (invoice.status === 'pending') {
                            stats.pending++;
                        } else if (invoice.status === 'paid') {
                            stats.completed++;
                        }
                    }
                }
            });
        }


        return childStats;
    }, [children, userRegistrations, participantInvoices?.invoices]);


    return (
        <div className="min-h-screen bg-gradient-wax-hands relative overflow-hidden">
            {/* Анимированные звездочки */}
            <AnimatedStars count={15} className="opacity-40" />



            {/* Шапка с логотипом и названием студии */}
            <ParentHeader />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 mt-20">
                {/* Заголовок */}
                <div className="text-center mb-6 sm:mb-8">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4 drop-shadow-lg">
                        Добро пожаловать, {user?.name}! 👋
                    </h1>
                    <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto px-2 drop-shadow-md">
                        Управляйте записями детей на мастер-классы
                    </p>
                </div>

                {/* Статистика - компактная в одну строку */}
                <div className="flex flex-wrap gap-2 mb-4 sm:mb-6 justify-center">
                    <Card
                        className="bg-white/90 backdrop-blur-sm border-2 border-orange-300 hover:shadow-xl hover:scale-105 transition-all duration-300 shadow-lg cursor-pointer flex-1 min-w-[120px]"
                        onClick={() => setActiveTab('children')}
                    >
                        <CardContent className="p-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                                <Baby className="w-4 h-4 text-orange-700" />
                                <div className="text-lg font-bold text-orange-700">{children.length}</div>
                                <div className="text-xs font-medium text-gray-700">Детей</div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card
                        className="bg-white/90 backdrop-blur-sm border-2 border-purple-300 hover:shadow-xl hover:scale-105 transition-all duration-300 shadow-lg cursor-pointer flex-1 min-w-[120px]"
                        onClick={() => setActiveTab(childrenStats.pending > 0 ? 'workshops' : 'children')}
                    >
                        <CardContent className="p-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                                <AlertCircle className="w-4 h-4 text-purple-700" />
                                <div className="text-lg font-bold text-purple-700">{childrenStats.pending}</div>
                                <div className="text-xs font-medium text-gray-700">Ожидают</div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card
                        className="bg-white/90 backdrop-blur-sm border-2 border-blue-300 hover:shadow-xl hover:scale-105 transition-all duration-300 shadow-lg cursor-pointer flex-1 min-w-[120px]"
                        onClick={() => setActiveTab('history')}
                    >
                        <CardContent className="p-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                                <CheckCircle className="w-4 h-4 text-blue-700" />
                                <div className="text-lg font-bold text-blue-700">{childrenStats.completed}</div>
                                <div className="text-xs font-medium text-gray-700">Завершено</div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card
                        className="bg-white/90 backdrop-blur-sm border-2 border-green-300 hover:shadow-xl hover:scale-105 transition-all duration-300 shadow-lg cursor-pointer flex-1 min-w-[120px]"
                        onClick={() => setActiveTab('workshops')}
                    >
                        <CardContent className="p-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                                <Star className="w-4 h-4 text-green-700" />
                                <div className="text-lg font-bold text-green-700">{groupedWorkshops.total}</div>
                                <div className="text-xs font-medium text-gray-700">Мастер-классов</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Блок бонусов */}
                <BonusBlock />

                {/* Мотивационный текст */}
                <div className="text-center mb-6 sm:mb-8">
                    <div className="bg-white/90 backdrop-blur-sm border-2 border-yellow-300 rounded-lg p-4 shadow-lg max-w-2xl mx-auto">
                        <div className="text-2xl mb-2">🎨✨</div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
                            Готовы создать шедевр? 🚀
                        </h3>
                        <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                            Запишите своего ребенка на увлекательный мастер-класс по созданию восковых ручек!
                            <br />
                            <span className="font-semibold text-green-700">Тогда переходите на вкладку "Мастер-классы"</span> ⏰
                        </p>
                    </div>
                </div>

                {/* Основной контент */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4 bg-white/90 backdrop-blur-sm border-2 border-gray-200 shadow-lg p-2 gap-1 h-auto">
                        <TabsTrigger value="about" className="data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 py-1.5 px-1 text-xs font-medium rounded-md flex items-center justify-center h-10">
                            О нас
                        </TabsTrigger>
                        <TabsTrigger value="children" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 py-1.5 px-1 text-xs font-medium rounded-md flex items-center justify-center h-10">
                            Мои дети
                        </TabsTrigger>
                        <TabsTrigger value="workshops" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 py-1.5 px-1 text-xs font-medium rounded-md flex items-center justify-center h-10">
                            Мастер-классы
                        </TabsTrigger>
                        <TabsTrigger value="history" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 py-1.5 px-1 text-xs font-medium rounded-md flex items-center justify-center h-10">
                            История
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="about" className="space-y-4">
                        <div className="space-y-4">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center space-x-2">
                                <Info className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                                <span>О нашей студии</span>
                            </h2>

                            {/* Краткая информация о студии */}
                            <Card className="bg-white/90 backdrop-blur-sm border-2 border-green-300 shadow-lg">
                                <CardContent className="p-4 sm:p-6">
                                    <div className="text-center space-y-4">
                                        <div className="text-4xl mb-4">✨</div>
                                        <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                                            {aboutContent?.title || 'Восковые Ручки'}
                                        </h3>
                                        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                                            {aboutContent?.description || 'Создай свою уникальную 3D копию руки в восковом исполнении!'}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Более подробно с информацией о студии и стоимостью услуг можно ознакомиться на страничке "О нас"
                                        </p>
                                        <Button
                                            onClick={() => window.location.href = '/about'}
                                            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
                                        >
                                            <Info className="w-4 h-4 mr-2" />
                                            Подробнее о нас
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Медиа контент */}
                            {aboutMedia && aboutMedia.length > 0 && (
                                <Card className="bg-white/90 backdrop-blur-sm border-2 border-green-300 shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-gray-800">
                                            <Sparkles className="w-5 h-5 text-green-600" />
                                            Наши работы
                                        </CardTitle>
                                        <CardDescription className="text-gray-600">
                                            Примеры наших мастер-классов и работ
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                                            {(aboutMedia || []).slice(0, 8).map((media, index) => (
                                                <div
                                                    key={index}
                                                    className="relative bg-gray-100 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200"
                                                >
                                                    {media.type === 'image' ? (
                                                        <div className="aspect-square">
                                                            <img
                                                                src={getMediaUrl(media.file_path)}
                                                                alt={media.title || `Работа ${index + 1}`}
                                                                className="w-full h-full object-cover"
                                                                loading="lazy"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="aspect-square relative">
                                                            <video
                                                                src={getMediaUrl(media.file_path)}
                                                                className="w-full h-full object-cover cursor-pointer"
                                                                preload="metadata"
                                                                muted
                                                                onClick={() => window.open(getMediaUrl(media.file_path), '_blank')}
                                                                onLoadedData={(e) => {
                                                                    const video = e.target as HTMLVideoElement;
                                                                    video.currentTime = 1; // Устанавливаем на 1 секунду для показа кадра
                                                                }}
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLVideoElement;
                                                                    target.style.display = 'none';
                                                                    target.parentElement!.innerHTML = `
                                                                        <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                                                            <div class="text-center">
                                                                                <svg class="w-8 h-8 text-gray-400 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                                                                                    <path d="M8 5v10l8-5-8-5z"/>
                                                                                </svg>
                                                                                <span class="text-xs text-gray-500 font-medium">Видео</span>
                                                                            </div>
                                                                        </div>
                                                                    `;
                                                                }}
                                                            />
                                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                                <div className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center">
                                                                    <Play className="w-4 h-4 text-white ml-0.5" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {(media.title || media.description) && (
                                                        <div className="p-2 bg-white">
                                                            {media.title && (
                                                                <h4 className="text-xs font-medium text-gray-800 mb-1 line-clamp-1">
                                                                    {media.title}
                                                                </h4>
                                                            )}
                                                            {media.description && (
                                                                <p className="text-xs text-gray-600 line-clamp-2">
                                                                    {media.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        {aboutMedia.length > 8 && (
                                            <div className="text-center mt-4">
                                                <p className="text-sm text-gray-500">
                                                    И еще {aboutMedia.length - 8} работ в полной галерее
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="children" className="space-y-4">
                        {children.length === 0 ? (
                            <Card className="text-center py-12 bg-gradient-to-br from-orange-50 to-purple-50 border-orange-300">
                                <CardContent className="space-y-4">
                                    <div className="text-6xl mb-4">👶</div>
                                    <div className="text-xl font-semibold text-gray-800 mb-2">
                                        У вас пока нет привязанных детей
                                    </div>
                                    <p className="text-gray-500 mb-4">
                                        Дети автоматически привязываются к вашему аккаунту при регистрации
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        Если у вас возникли проблемы, обратитесь к администратору
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {(children || []).map((child) => (
                                        <Card key={child.id} className="hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm border-2 border-orange-300 shadow-lg">
                                            <CardHeader className="p-4 sm:p-6">
                                                <CardTitle className="text-xl sm:text-2xl text-orange-700 flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        <Baby className="w-5 h-5" />
                                                        <span>{child.name}</span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditChild(child)}
                                                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-100"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                </CardTitle>
                                                <CardDescription className="text-sm sm:text-base flex items-center space-x-2">
                                                    <GraduationCap className="w-4 h-4" />
                                                    <span>{child.age} лет • {child.schoolName} • {child.classGroup}</span>
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                {/* Статистика убрана по требованию */}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                {/* Кнопка добавления ребенка */}
                                <div className="text-center mt-6">
                                    <Dialog open={isAddChildDialogOpen} onOpenChange={setIsAddChildDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button className="bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600 text-white">
                                                <Plus className="w-4 h-4 mr-2" />
                                                Добавить ребенка
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[425px]">
                                            <DialogHeader>
                                                <DialogTitle>Добавить нового ребенка</DialogTitle>
                                                <DialogDescription>
                                                    Заполните информацию о ребенке для записи на мастер-классы
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="childName">Имя</Label>
                                                        <Input
                                                            id="childName"
                                                            value={newChild.name}
                                                            onChange={(e) => setNewChild(prev => ({ ...prev, name: e.target.value }))}
                                                            placeholder="Введите имя"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="childSurname">Фамилия</Label>
                                                        <Input
                                                            id="childSurname"
                                                            value={newChild.surname}
                                                            onChange={(e) => setNewChild(prev => ({ ...prev, surname: e.target.value }))}
                                                            placeholder="Введите фамилию"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="childAge">Возраст</Label>
                                                    <Input
                                                        id="childAge"
                                                        type="number"
                                                        min="1"
                                                        max="18"
                                                        value={newChild.age || ""}
                                                        onChange={(e) => setNewChild(prev => ({ ...prev, age: parseInt(e.target.value) || undefined }))}
                                                        placeholder="Введите возраст"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="childSchool">Школа/сад</Label>
                                                    <Select onValueChange={handleSchoolChange} value={selectedSchoolId}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Выберите школу или сад" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {(schools || []).map((school) => (
                                                                <SelectItem key={school.id} value={school.id}>
                                                                    <div>
                                                                        <div className="font-medium">{school.name}</div>
                                                                        <div className="text-sm text-gray-500">{school.address}</div>
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="childClass">Класс/группа</Label>
                                                        <Select
                                                            onValueChange={(value) => setNewChild(prev => ({ ...prev, class: value }))}
                                                            value={newChild.class}
                                                            disabled={!selectedSchoolId}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Выберите класс или группу" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {(availableClasses || []).map((className) => (
                                                                    <SelectItem key={className} value={className}>
                                                                        {className}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        {!selectedSchoolId && (
                                                            <p className="text-sm text-gray-500">Сначала выберите школу</p>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="childShift">Смена</Label>
                                                        <Select
                                                            onValueChange={(value) => setNewChild(prev => ({ ...prev, shift: value }))}
                                                            value={newChild.shift}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Выберите смену" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="1">Первая смена</SelectItem>
                                                                <SelectItem value="2">Вторая смена</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-end space-x-2">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setIsAddChildDialogOpen(false)}
                                                >
                                                    Отмена
                                                </Button>
                                                <Button onClick={handleAddChild}>
                                                    Добавить ребенка
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </>
                        )}
                    </TabsContent>

                    <TabsContent value="workshops" className="space-y-4">
                        {/* Секция с мастер-классами */}
                        {groupedWorkshops.total === 0 ? (
                            <Card className="bg-white/80 backdrop-blur-sm">
                                <CardContent className="p-8 text-center">
                                    <div className="text-4xl mb-4">🎨</div>
                                    <div className="text-lg font-semibold text-gray-600 mb-2">
                                        Нет мастер-классов в вашем классе
                                    </div>
                                    <p className="text-gray-500 mb-4">
                                        К сожалению, в данный момент нет доступных мастер-классов для классов ваших детей.
                                        Но вы можете подать заявку на проведение мастер-класса!
                                    </p>
                                    <Button
                                        onClick={() => setIsWorkshopRequestOpen(true)}
                                        className="bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
                                    >
                                        📝 Подать заявку на проведение
                                    </Button>
                                    <p className="text-xs text-gray-400 mt-2">
                                        Мы рассмотрим вашу заявку и свяжемся с вами
                                    </p>
                                </CardContent>
                            </Card>



                        ) : (
                            <div className="space-y-4">
                                <div className="mb-4">
                                    <h2 className="text-2xl font-bold text-gray-800">
                                        Доступные мастер-классы
                                    </h2>
                                </div>

                                {(groupedWorkshops?.workshops || []).map((workshop) => {
                                    const workshopChildren = (children || []).filter(c => workshop.children.includes(c.id));
                                    const childrenNames = workshopChildren.map(c => c.name).join(', ');

                                    return (
                                        <Card
                                            key={workshop.id}
                                            className="hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-50 to-purple-50 border-orange-300"
                                        >
                                            <CardHeader className="relative p-4 sm:p-6">
                                                <div className="absolute top-2 right-2 flex flex-col gap-1">
                                                    <Badge className="bg-orange-500 text-white text-xs">
                                                        👥 {workshopChildren.length} {workshopChildren.length === 1 ? 'ребенок' : workshopChildren.length < 5 ? 'ребенка' : 'детей'}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                                        🎯 {workshop.participantsCount || 0} {getParticipantsText(workshop.participantsCount || 0)}
                                                    </Badge>
                                                    {workshop.invoiceStatus && (
                                                        <Badge
                                                            variant={workshop.invoiceStatus === 'paid' ? 'default' :
                                                                workshop.invoiceStatus === 'pending' ? 'secondary' : 'destructive'}
                                                            className="text-xs"
                                                        >
                                                            {workshop.invoiceStatus === 'paid' ? '💰 Счет оплачен' :
                                                                workshop.invoiceStatus === 'pending' ? '📋 Счет ожидает оплаты' :
                                                                    '❌ Счет отменен'}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <CardTitle className="text-lg sm:text-xl text-orange-600 flex items-center space-x-2">
                                                    <Palette className="w-5 h-5" />
                                                    <span>{workshop.title}</span>
                                                </CardTitle>
                                                <CardDescription className="text-sm">
                                                    Студия: МК Восковые ручки • Класс: {workshop.classGroup}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex items-center space-x-2">
                                                        <MapPin className="w-4 h-4 text-gray-500" />
                                                        <span>{workshop.schoolName}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Users className="w-4 h-4 text-gray-500" />
                                                        <span>Класс: {workshop.classGroup}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Calendar className="w-4 h-4 text-gray-500" />
                                                        <span>{new Date(workshop.date).toLocaleDateString('ru-RU')}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Clock className="w-4 h-4 text-gray-500" />
                                                        <span>{workshop.time}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Baby className="w-4 h-4 text-gray-500" />
                                                        <span>
                                                            {workshop.invoiceStatus && workshop.invoiceStatus !== 'cancelled' ?
                                                                `На мастер-класс записан(а): ${childrenNames}` :
                                                                `Дети: ${childrenNames}`
                                                            }
                                                        </span>
                                                    </div>
                                                </div>



                                                {/* Кнопки в зависимости от статуса счета */}
                                                {!workshop.invoiceStatus || workshop.invoiceStatus === 'cancelled' ? (
                                                    <div className="space-y-2">
                                                        <Button
                                                            onClick={() => handleWorkshopRegistration(workshop)}
                                                            className="w-full bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                                                        >
                                                            🎨 Записать детей
                                                        </Button>
                                                        <p className="text-xs text-gray-600 text-center">
                                                            Доступно для: {childrenNames} ({workshop.classGroup})
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <Button
                                                            onClick={() => handleViewOrderDetails(workshop)}
                                                            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                                                        >
                                                            🔍 Детали заказа
                                                        </Button>

                                                        {/* Кнопка оплаты для неоплаченных заказов */}
                                                        {workshop.invoiceStatus === 'pending' && (
                                                            <Button
                                                                onClick={() => handlePaymentForWorkshop(workshop)}
                                                                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                                                            >
                                                                💳 Оплатить заказ
                                                            </Button>
                                                        )}

                                                        <p className="text-xs text-gray-600 text-center">
                                                            {workshop.invoiceStatus === 'paid' ?
                                                                `${childrenNames} записаны на мастер-класс!` :
                                                                workshop.invoiceStatus === 'pending' ?
                                                                    `Ожидаем оплату для: ${childrenNames}` :
                                                                    `Счета для ${childrenNames} были отменены`
                                                            }
                                                        </p>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}

                    </TabsContent>

                    <TabsContent value="history" className="space-y-4">
                        <div className="space-y-4">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center space-x-2">
                                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                                <span>История мастер-классов</span>
                            </h2>

                            {/* Прошедшие мастер-классы */}
                            {pastWorkshops.total === 0 ? (
                                <Card className="bg-white/80 backdrop-blur-sm">
                                    <CardContent className="p-8 text-center">
                                        <div className="text-4xl mb-4">📚</div>
                                        <div className="text-lg font-semibold text-gray-600 mb-2">
                                            История мастер-классов пуста
                                        </div>
                                        <p className="text-gray-500">
                                            У вас пока нет прошедших мастер-классов
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-700">
                                            Прошедшие мастер-классы
                                        </h3>
                                        <Badge variant="secondary" className="text-sm">
                                            {pastWorkshops.total} найдено
                                        </Badge>
                                    </div>

                                    {(pastWorkshops?.workshops || []).map((workshop) => {
                                        const workshopChildren = (children || []).filter(c => workshop.children.includes(c.id));
                                        const childrenNames = workshopChildren.map(c => c.name).join(', ');

                                        return (
                                            <Card
                                                key={workshop.id}
                                                className="hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-gray-50 to-blue-50 border-gray-300"
                                            >
                                                <CardHeader className="relative p-4 sm:p-6">
                                                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                                                        <Badge className="bg-gray-500 text-white text-xs">
                                                            📅 Прошедший
                                                        </Badge>
                                                        <Badge className="bg-blue-500 text-white text-xs">
                                                            👥 {workshopChildren.length} {workshopChildren.length === 1 ? 'ребенок' : workshopChildren.length < 5 ? 'ребенка' : 'детей'}
                                                        </Badge>
                                                        {workshop.invoiceStatus && (
                                                            <Badge
                                                                variant={workshop.invoiceStatus === 'paid' ? 'default' :
                                                                    workshop.invoiceStatus === 'pending' ? 'secondary' : 'destructive'}
                                                                className="text-xs"
                                                            >
                                                                {workshop.invoiceStatus === 'paid' ? '✅ Оплачен' :
                                                                    workshop.invoiceStatus === 'pending' ? '⏳ Ожидает оплаты' :
                                                                        '❌ Отменен'}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <CardTitle className="text-lg sm:text-xl text-gray-700 flex items-center space-x-2">
                                                        <Palette className="w-5 h-5" />
                                                        <span>{workshop.title}</span>
                                                    </CardTitle>
                                                    <CardDescription className="text-sm">
                                                        Студия: МК Восковые ручки • Класс: {workshop.classGroup}
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex items-center space-x-2">
                                                            <MapPin className="w-4 h-4 text-gray-500" />
                                                            <span>{workshop.schoolName}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <Users className="w-4 h-4 text-gray-500" />
                                                            <span>Класс: {workshop.classGroup}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <Calendar className="w-4 h-4 text-gray-500" />
                                                            <span>Дата: {new Date(workshop.date).toLocaleDateString('ru-RU')}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <Clock className="w-4 h-4 text-gray-500" />
                                                            <span>Время: {workshop.time}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <Baby className="w-4 h-4 text-gray-500" />
                                                            <span>
                                                                {workshop.invoiceStatus && workshop.invoiceStatus !== 'cancelled' ?
                                                                    `Участвовали: ${childrenNames}` :
                                                                    `Были доступны для: ${childrenNames}`
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Статус участия детей */}
                                                    {workshop.childrenWithStatus.length > 0 && (
                                                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                                            <div className="text-sm font-medium text-gray-700 mb-2">Статус участия детей:</div>
                                                            <div className="space-y-1">
                                                                {(workshop.childrenWithStatus || []).map((child) => (
                                                                    <div key={child.childId} className="flex items-center justify-between text-sm">
                                                                        <span className="text-gray-600">{child.childName}</span>
                                                                        <Badge
                                                                            variant={child.status === 'paid' ? 'default' :
                                                                                child.status === 'pending' ? 'secondary' :
                                                                                    child.status === 'cancelled' ? 'destructive' : 'outline'}
                                                                            className="text-xs"
                                                                        >
                                                                            {child.status === 'paid' ? '✅ Участвовал' :
                                                                                child.status === 'pending' ? '⏳ Ожидал' :
                                                                                    child.status === 'cancelled' ? '❌ Отменен' :
                                                                                        '➖ Не участвовал'}
                                                                        </Badge>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Кнопка оплаты для неоплаченных заявок */}
                                                    {workshop.invoiceStatus === 'pending' && workshop.childrenWithStatus.some(child => child.status === 'pending' && child.invoiceId) && (
                                                        <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                                                            <div className="flex items-center space-x-2 mb-3">
                                                                <AlertCircle className="w-5 h-5 text-orange-600" />
                                                                <span className="font-medium text-orange-800">
                                                                    Требуется оплата
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-orange-700 mb-4">
                                                                У вас есть неоплаченные заявки на участие в этом мастер-классе
                                                            </p>

                                                            {workshop.childrenWithStatus
                                                                .filter(child => child.status === 'pending' && child.invoiceId)
                                                                .map((child) => {
                                                                    const invoice = child.invoice;
                                                                    if (!invoice) return null;

                                                                    return (
                                                                        <div key={child.childId} className="bg-white rounded-lg p-3 border border-orange-200 mb-3">
                                                                            <div className="flex justify-between items-center mb-2">
                                                                                <div>
                                                                                    <p className="font-medium text-gray-900">
                                                                                        {child.childName}
                                                                                    </p>
                                                                                    <p className="text-xs text-gray-600">
                                                                                        Счет №{invoice.id.slice(-8)}
                                                                                    </p>
                                                                                </div>
                                                                                <div className="text-right">
                                                                                    <p className="text-lg font-bold text-green-600">
                                                                                        {invoice.amount} ₽
                                                                                    </p>
                                                                                </div>
                                                                            </div>

                                                                            <YandexPaymentButton
                                                                                invoiceId={invoice.id}
                                                                                amount={invoice.amount}
                                                                                description={`Участие в мастер-классе "${workshop.title}" для ${child.childName}`}
                                                                                children={[{
                                                                                    id: child.childId,
                                                                                    name: child.childName,
                                                                                    selectedServices: ['Мастер-класс'],
                                                                                    totalAmount: invoice.amount
                                                                                }]}
                                                                                masterClassName={workshop.title}
                                                                                eventDate={workshop.date}
                                                                                isPaymentDisabled={true}
                                                                                eventTime={workshop.time}
                                                                                onPaymentSuccess={() => {
                                                                                    toast({
                                                                                        title: "Оплата успешна! 🎉",
                                                                                        description: "Статус счета обновлен. Спасибо за оплату!",
                                                                                    });
                                                                                    // Обновляем данные
                                                                                    queryClient.invalidateQueries({ queryKey: ['workshopParticipation'] });
                                                                                    queryClient.invalidateQueries({ queryKey: ['invoices', 'parent'] });
                                                                                }}
                                                                                onPaymentError={(error) => {
                                                                                    console.error('Ошибка оплаты:', error);
                                                                                }}
                                                                                className="w-full"
                                                                                variant="default"
                                                                                size="default"
                                                                            />
                                                                        </div>
                                                                    );
                                                                })}
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Старые регистрации (если есть) */}
                            {userRegistrations.length > 0 && (
                                <div className="space-y-4 mt-8">
                                    <h3 className="text-lg font-semibold text-gray-700 flex items-center space-x-2">
                                        <CheckCircle className="w-4 h-4 text-gray-600" />
                                        <span>История регистраций</span>
                                    </h3>

                                    <div className="space-y-4">
                                        {userRegistrations
                                            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                                            .map((registration) => {
                                                const child = children.find(c => c.id === registration.userId);
                                                const workshop = masterClasses.find(mc => mc.id === registration.workshopId);

                                                return (
                                                    <Card key={registration.id} className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                                                        <CardHeader className="pb-3">
                                                            <div className="flex items-center justify-between">
                                                                <CardTitle className="text-lg text-gray-800">
                                                                    {workshop?.serviceName || 'Мастер-класс'}
                                                                </CardTitle>
                                                                <Badge
                                                                    variant={registration.status === 'confirmed' ? 'default' :
                                                                        registration.status === 'pending' ? 'secondary' : 'destructive'}
                                                                    className="text-sm"
                                                                >
                                                                    {registration.status === 'confirmed' ? '✅ Подтверждено' :
                                                                        registration.status === 'pending' ? '⏳ Ожидает подтверждения' :
                                                                            '❌ Отменено'}
                                                                </Badge>
                                                            </div>
                                                            <CardDescription className="text-gray-600">
                                                                {child?.name} • {workshop?.schoolName} • {workshop?.classGroup}
                                                            </CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="space-y-3">
                                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                                <div>
                                                                    <span className="font-medium text-gray-700">Дата:</span>
                                                                    <div className="text-gray-600">
                                                                        {workshop?.date ? new Date(workshop.date).toLocaleDateString('ru-RU') : 'Не указана'}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium text-gray-700">Время:</span>
                                                                    <div className="text-gray-600">
                                                                        {workshop?.time || 'Не указано'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-sm">
                                                                <span className="font-medium text-gray-700">Стоимость:</span>
                                                                <div className="text-green-600 font-semibold">
                                                                    {registration.totalPrice || 0} ₽
                                                                </div>
                                                            </div>
                                                            {registration.createdAt && (
                                                                <div className="text-xs text-gray-500 border-t pt-2">
                                                                    Дата записи: {new Date(registration.createdAt).toLocaleString('ru-RU')}
                                                                </div>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>


                </Tabs>

                {/* Секция с заявками на проведение мастер-классов - всегда видна */}
                <div className="mt-6">
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    <h3 className="text-lg font-semibold text-blue-800">
                                        Заявки на проведение мастер-классов
                                    </h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    <span className="text-sm text-blue-600">
                                        {wsConnected ? 'Автообновление' : 'Ручное обновление'}
                                    </span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {workshopRequests.length > 0 ? (
                                <>
                                    {(workshopRequests || []).map((request) => (
                                        <div key={request.id} className="bg-white/60 rounded-lg p-4 border border-blue-200">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-blue-600" />
                                                    <span className="font-medium text-blue-800">{request.school_name}</span>
                                                </div>
                                                <Badge
                                                    className={`${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                                        request.status === 'approved' ? 'bg-green-100 text-green-800 border-green-200' :
                                                            'bg-red-100 text-red-800 border-red-200'
                                                        } border`}
                                                >
                                                    {request.status === 'pending' ? '⏳ Ожидает рассмотрения' :
                                                        request.status === 'approved' ? '✅ Одобрено' :
                                                            '❌ Отклонено'}
                                                </Badge>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <GraduationCap className="w-4 h-4 text-gray-500" />
                                                    <span className="text-gray-700">Класс: {request.class_group}</span>
                                                </div>
                                                {request.city && (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4 text-gray-500" />
                                                        <span className="text-gray-700">Город: {request.city}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {request.is_other_school && (
                                                <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                                                    <div className="text-sm font-medium text-orange-700 mb-1">Дополнительная школа:</div>
                                                    <div className="text-sm text-orange-600">
                                                        <div><strong>Название:</strong> {request.other_school_name}</div>
                                                        <div><strong>Адрес:</strong> {request.other_school_address}</div>
                                                    </div>
                                                </div>
                                            )}
                                            {request.notes && (
                                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                                    <div className="text-sm font-medium text-gray-700 mb-1">Ваши примечания:</div>
                                                    <div className="text-sm text-gray-600">{request.notes}</div>
                                                </div>
                                            )}
                                            {request.admin_notes && (
                                                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                                    <div className="text-sm font-medium text-blue-700 mb-1">Ответ администратора:</div>
                                                    <div className="text-sm text-blue-600">{request.admin_notes}</div>
                                                </div>
                                            )}
                                            <div className="mt-3 text-xs text-gray-500 border-t pt-2">
                                                Создано: {new Date(request.created_at).toLocaleString('ru-RU')}
                                                {request.updated_at !== request.created_at &&
                                                    ` • Обновлено: ${new Date(request.updated_at).toLocaleString('ru-RU')}`
                                                }
                                            </div>
                                        </div>
                                    ))}

                                    {/* Статистика заявок */}
                                    <div className="mt-4 pt-4 border-t border-blue-200">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <div className="text-center">
                                                <div className="text-lg font-bold text-blue-600">{workshopRequestsStats.total}</div>
                                                <div className="text-xs text-blue-600">Всего заявок</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-lg font-bold text-yellow-600">{workshopRequestsStats.pending}</div>
                                                <div className="text-xs text-yellow-600">Ожидают</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-lg font-bold text-green-600">{workshopRequestsStats.approved}</div>
                                                <div className="text-xs text-green-600">Одобрено</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-lg font-bold text-red-600">{workshopRequestsStats.rejected}</div>
                                                <div className="text-xs text-red-600">Отклонено</div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-4">📝</div>
                                    <div className="text-lg font-semibold text-gray-600 mb-2">
                                        У вас пока нет заявок
                                    </div>
                                    <p className="text-gray-500 mb-4">
                                        Хотите провести мастер-класс в классе вашего ребенка? Подайте заявку!
                                    </p>
                                    <Button
                                        onClick={() => setIsWorkshopRequestOpen(true)}
                                        className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
                                    >
                                        📝 Подать заявку на проведение
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Модальное окно записи на мастер-класс или просмотра деталей заказа */}
            {selectedWorkshop && (
                <MultiChildWorkshopModal
                    workshop={selectedWorkshop}
                    children={children.filter(c => selectedWorkshop.children.includes(c.id))}
                    isOpen={isWorkshopRegistrationOpen}
                    onOpenChange={setIsWorkshopRegistrationOpen}
                    onRegistrationSuccess={handleWorkshopRegistrationSuccess}
                    masterClasses={masterClasses}
                />
            )}

            {/* Модальное окно с деталями заказа */}
            {selectedWorkshop && (
                <OrderDetailsModal
                    workshop={selectedWorkshop}
                    isOpen={isOrderDetailsOpen}
                    onOpenChange={setIsOrderDetailsOpen}
                />
            )}
            {/* Отладочная информация */}
            {(() => {
                return null;
            })()}

            {/* Обобщенный онбординг для родителя и ребенка */}
            <ParentChildOnboardingModal
                isOpen={isOnboardingOpen}
                onOpenChange={(open) => {
                    setIsOnboardingOpen(open);
                    if (!open) {
                        // Отмечаем онбординг как завершенный
                        localStorage.setItem('parent-onboarding-completed', 'true');
                    }
                }}
            />



            {/* Модальное окно подачи заявки на проведение мастер-класса */}
            <WorkshopRequestModal
                isOpen={isWorkshopRequestOpen}
                onOpenChange={setIsWorkshopRequestOpen}
                onRequestCreated={loadWorkshopRequests}
            />




            {/* Модальное окно редактирования ребенка */}
            <Dialog open={isEditChildDialogOpen} onOpenChange={setIsEditChildDialogOpen}>
                <DialogContent className="edit-child-modal sm:max-w-[380px] max-h-[85vh] overflow-y-auto border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
                    <DialogHeader className="pb-4 border-b border-gray-100">
                        <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Edit className="w-5 h-5 text-orange-500" />
                            Редактировать ребенка
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-600 mt-1">
                            Обновите информацию о ребенке
                        </DialogDescription>
                    </DialogHeader>
                    {editingChild && (
                        <div className="space-y-5 py-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="editChildName" className="text-sm font-semibold text-gray-700">Имя</Label>
                                    <Input
                                        id="editChildName"
                                        value={editingChild.name.split(' ')[0] || ''}
                                        onChange={(e) => {
                                            const surname = editingChild.name.split(' ').slice(1).join(' ') || '';
                                            setEditingChild(prev => prev ? {
                                                ...prev,
                                                name: `${e.target.value} ${surname}`.trim()
                                            } : null);
                                        }}
                                        placeholder="Введите имя"
                                        className="edit-child-input h-10 text-sm border-gray-200 focus:border-orange-400 focus:ring-orange-400/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="editChildSurname" className="text-sm font-semibold text-gray-700">Фамилия</Label>
                                    <Input
                                        id="editChildSurname"
                                        value={editingChild.name.split(' ').slice(1).join(' ') || ''}
                                        onChange={(e) => {
                                            const firstName = editingChild.name.split(' ')[0] || '';
                                            setEditingChild(prev => prev ? {
                                                ...prev,
                                                name: `${firstName} ${e.target.value}`.trim()
                                            } : null);
                                        }}
                                        placeholder="Введите фамилию"
                                        className="edit-child-input h-10 text-sm border-gray-200 focus:border-orange-400 focus:ring-orange-400/20"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="editChildAge" className="text-sm font-semibold text-gray-700">Возраст</Label>
                                <Input
                                    id="editChildAge"
                                    type="number"
                                    min="1"
                                    max="18"
                                    value={editingChild.age || ""}
                                    onChange={(e) => setEditingChild(prev => prev ? {
                                        ...prev,
                                        age: parseInt(e.target.value) || undefined
                                    } : null)}
                                    placeholder="Введите возраст"
                                    className="edit-child-input h-10 text-sm border-gray-200 focus:border-orange-400 focus:ring-orange-400/20"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="editChildSchool" className="text-sm font-semibold text-gray-700">Школа/сад</Label>
                                <Select
                                    onValueChange={(value) => {
                                        setEditingChild(prev => prev ? {
                                            ...prev,
                                            schoolId: value,
                                            classGroup: ''
                                        } : null);
                                    }}
                                    value={editingChild.schoolId}
                                >
                                    <SelectTrigger className="edit-child-input h-10 text-sm border-gray-200 focus:border-orange-400 focus:ring-orange-400/20">
                                        <SelectValue placeholder="Выберите школу или сад" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(schools || []).map((school) => (
                                            <SelectItem key={school.id} value={school.id}>
                                                <div>
                                                    <div className="font-medium">{school.name}</div>
                                                    <div className="text-sm text-gray-500">{school.address}</div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="editChildClass" className="text-sm font-semibold text-gray-700">Класс/группа</Label>
                                <Select
                                    onValueChange={(value) => setEditingChild(prev => prev ? {
                                        ...prev,
                                        classGroup: value
                                    } : null)}
                                    value={editingChild.classGroup}
                                    disabled={!editingChild.schoolId}
                                >
                                    <SelectTrigger className="edit-child-input h-10 text-sm border-gray-200 focus:border-orange-400 focus:ring-orange-400/20 disabled:opacity-50">
                                        <SelectValue placeholder="Выберите класс или группу" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(() => {
                                            const school = schools.find(s => s.id === editingChild.schoolId);
                                            return (school?.classes || []).map((className) => (
                                                <SelectItem key={className} value={className}>
                                                    {className}
                                                </SelectItem>
                                            )) || [];
                                        })()}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditChildDialogOpen(false);
                                        setEditingChild(null);
                                    }}
                                    className="edit-child-button h-10 px-6 text-sm border-gray-300 text-gray-700 hover:bg-gray-50"
                                >
                                    Отмена
                                </Button>
                                <Button
                                    onClick={handleSaveChildChanges}
                                    className="edit-child-button h-10 px-6 text-sm bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600 text-white font-medium"
                                >
                                    Сохранить изменения
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );

};

export default ParentDashboard; 