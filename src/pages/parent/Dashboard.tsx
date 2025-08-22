/**
 * @file: src/pages/parent/Dashboard.tsx
 * @description: Родительский дашборд с управлением детьми и мастер-классами
 * @dependencies: useAuth, useToast, useMasterClasses, useSchools, useServices, useWorkshopRegistrations
 * @created: 2024-12-19
 */

import { useState, useEffect, useMemo } from "react";
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
import { useMasterClasses } from "@/hooks/use-master-classes";
import { useSchools } from "@/hooks/use-schools";
import { useServices } from "@/hooks/use-services";
import { useWorkshopRegistrations } from "@/hooks/use-workshop-registrations";
import { useWorkshopParticipation, useParticipantInvoices } from "@/hooks/use-invoices";
import { useUsers } from "@/hooks/use-users";
import { useWorkshopRequestsWebSocket } from "@/hooks/use-workshop-requests-websocket";
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
    console.log('🔄 ParentDashboard: Компонент рендерится');

    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { masterClasses, fetchMasterClasses } = useMasterClasses();
    const { schools } = useSchools();
    const { services } = useServices();
    const { getUserRegistrations } = useWorkshopRegistrations();
    const { data: participantInvoices } = useParticipantInvoices(user?.id || '');
    // Получаем счета для всех мастер-классов
    const [workshopInvoices, setWorkshopInvoices] = useState<{ [workshopId: string]: Invoice[] }>({});
    const { getChildrenByParentId, createUser, updateUser } = useUsers();

    const [activeTab, setActiveTab] = useState("children");
    const [children, setChildren] = useState<ChildData[]>([]);
    const [userRegistrations, setUserRegistrations] = useState<WorkshopRegistration[]>([]);
    const [isAddChildDialogOpen, setIsAddChildDialogOpen] = useState(false);
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
    const [refreshTrigger, setRefreshTrigger] = useState(0); // Триггер для принудительного обновления
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => {
        // Проверяем, был ли уже показан онбординг
        const hasSeenOnboarding = localStorage.getItem('parent-onboarding-completed');
        return !hasSeenOnboarding;
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
            console.log('🔌 ParentDashboard: Получено WebSocket сообщение:', message);

            if (message.type === 'workshop_request_status_change' || message.type === 'workshop_request_update') {
                console.log('📋 ParentDashboard: Обновление заявки через WebSocket, перезагружаем данные...');
                loadWorkshopRequests();
            } else if (message.type === 'workshop_request_created') {
                console.log('📋 ParentDashboard: Новая заявка через WebSocket, перезагружаем данные...');
                loadWorkshopRequests();
            } else {
                console.log('🔌 ParentDashboard: Неизвестный тип сообщения:', message.type);
            }
        }
    );

    // Функция для правильного склонения слова "записался"
    const getParticipantsText = (count: number): string => {
        if (count === 0) return 'записались';
        if (count === 1) return 'записался';
        if (count >= 2 && count <= 4) return 'записались';
        return 'записалось';
    };

    // Загружаем мастер-классы
    useEffect(() => {
        console.log('🔄 useEffect: Загружаем мастер-классы, refreshTrigger:', refreshTrigger);
        if (user?.id && !masterClasses.length) {
            // Загружаем все мастер-классы, а не только для конкретного пользователя
            console.log('🔄 useEffect: Запрашиваем мастер-классы для пользователя:', user.id);
            fetchMasterClasses();
        }
    }, [user?.id, fetchMasterClasses, refreshTrigger, masterClasses.length]);

    // Загружаем регистрации пользователя
    useEffect(() => {
        console.log('🔄 useEffect: Загружаем регистрации пользователя, refreshTrigger:', refreshTrigger);
        if (user?.id && userRegistrations.length === 0) {
            getUserRegistrations(user.id)
                .then(registrations => {
                    console.log('✅ useEffect: Получены регистрации:', registrations);
                    console.log('🔍 useEffect: Детали регистраций:', {
                        count: registrations.length,
                        registrations: registrations.map(reg => ({
                            id: reg.id,
                            workshopId: reg.workshopId,
                            userId: reg.userId,
                            status: reg.status,
                            totalPrice: reg.totalPrice
                        }))
                    });
                    setUserRegistrations(registrations);
                })
                .catch(error => {
                    console.error('❌ useEffect: Ошибка загрузки регистраций:', error);
                });
        }
    }, [user?.id, getUserRegistrations, refreshTrigger, userRegistrations.length]);

    // Получаем детей родителя из API
    useEffect(() => {
        console.log('🔄 useEffect: Загружаем детей родителя, refreshTrigger:', refreshTrigger);
        if (user?.id && children.length === 0) {
            const fetchChildren = async () => {
                try {
                    console.log('🔄 useEffect: Запрашиваем детей для родителя:', user.id);
                    const childrenData = await getChildrenByParentId(user.id);

                    // Преобразуем данные в нужный формат с использованием реального возраста
                    const formattedChildren: ChildData[] = childrenData.map(child => {
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

                    console.log('✅ useEffect: Дети успешно загружены:', formattedChildren);
                    setChildren(formattedChildren);
                } catch (error) {
                    console.error('❌ useEffect: Ошибка при загрузке детей:', error);
                    setChildren([]);
                }
            };

            fetchChildren();
        }
    }, [user?.id, getChildrenByParentId, children.length]); // Добавляем children.length в зависимости

    // Загружаем заявки на проведение мастер-классов при монтировании
    useEffect(() => {
        console.log('🔄 useEffect: Загружаем заявки, user?.id:', user?.id);
        if (user?.id) {
            loadWorkshopRequests();
        } else {
            console.log('⚠️ useEffect: user?.id отсутствует, заявки не загружаются');
        }
    }, [user?.id]);

    // Функция загрузки заявок на проведение мастер-классов
    const loadWorkshopRequests = async () => {
        console.log('🔄 loadWorkshopRequests: Начинаем загрузку заявок, user?.id:', user?.id);
        if (!user?.id) {
            console.log('⚠️ loadWorkshopRequests: user?.id отсутствует, выход из функции');
            return;
        }

        try {
            console.log('🔄 ParentDashboard: Загружаем заявки на проведение мастер-классов...');

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
                    console.log('✅ ParentDashboard: Заявки загружены:', data.data);
                } else if (Array.isArray(data)) {
                    setWorkshopRequests(data);
                    console.log('✅ ParentDashboard: Заявки загружены (массив):', data);
                }
            } else if (response.status === 403) {
                console.warn('⚠️ ParentDashboard: Нет доступа к заявкам (403), возможно нужны права администратора');
                // Устанавливаем пустой массив заявок
                setWorkshopRequests([]);
            } else {
                console.error('❌ ParentDashboard: Ошибка загрузки заявок:', response.status, response.statusText);
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
                    console.log('✅ ParentDashboard: Статистика заявок загружена:', statsData.data);
                }
            } else if (statsResponse.status === 403) {
                console.warn('⚠️ ParentDashboard: Нет доступа к статистике заявок (403), устанавливаем нулевые значения');
                // Устанавливаем нулевую статистику
                setWorkshopRequestsStats({
                    total: 0,
                    pending: 0,
                    approved: 0,
                    rejected: 0
                });
            } else {
                console.error('❌ ParentDashboard: Ошибка загрузки статистики заявок:', statsResponse.status, statsResponse.statusText);
            }
        } catch (error) {
            console.error('❌ ParentDashboard: Ошибка при загрузке заявок:', error);
        }

        console.log('✅ loadWorkshopRequests: Загрузка завершена, workshopRequests:', workshopRequests.length, 'workshopRequestsStats:', workshopRequestsStats);
    };

    // Обработчик изменения школы для формы добавления ребенка
    const handleSchoolChange = (schoolId: string) => {
        setSelectedSchoolId(schoolId);
        setNewChild(prev => ({ ...prev, schoolId, class: '' }));
        const school = schools.find(s => s.id === schoolId);
        setAvailableClasses(school?.classes || []);
    };

    // Обработчик добавления нового ребенка
    const handleAddChild = async () => {
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
            const formattedChildren: ChildData[] = updatedChildren.map(child => {
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
    };

    // Функция для открытия модального окна редактирования ребенка
    const handleEditChild = (child: ChildData) => {
        setEditingChild(child);
        setIsEditChildDialogOpen(true);
    };

    // Функция для сохранения изменений ребенка
    const handleSaveChildChanges = async () => {
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
            const formattedChildren: ChildData[] = updatedChildren.map(child => {
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
    };

    // Мемоизируем тяжелые вычисления для предотвращения пересчетов
    const groupedWorkshops = useMemo(() => {
        console.log('🔄 groupedWorkshops: Пересчитываем мастер-классы, refreshTrigger:', refreshTrigger);

        if (!masterClasses.length || !children.length) {
            console.log('✅ groupedWorkshops: Нет данных для расчета');
            return { total: 0, workshops: [] };
        }

        const today = new Date().toISOString().slice(0, 10);

        // Фильтруем мастер-классы по дате
        const availableEvents = masterClasses.filter(ev => ev.date >= today);

        console.log('🔍 Фильтрация мастер-классов:', {
            total: masterClasses.length,
            availableToday: availableEvents.length,
            today: today,
            events: availableEvents.map(ev => ({
                id: ev.id,
                date: ev.date,
                schoolId: ev.schoolId,
                classGroup: ev.classGroup
            }))
        });

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
                const childrenWithStatus = eligibleChildren.map(child => {
                    // Сначала проверяем в регистрациях
                    const registration = userRegistrations.find(reg =>
                        reg.workshopId === event.id && reg.userId === child.id
                    );

                    // Затем проверяем в счетах - ищем по master_class_id
                    // Для групповых регистраций создается один счет на родителя (participant_id = parentId)
                    // Для индивидуальных регистраций может быть счет на ребенка (participant_id = child.id)
                    // Ищем счета где master_class_id = event.id и participant_id = user.id (родитель) или child.id
                    const availableInvoices = participantInvoices?.invoices?.filter(inv =>
                        inv.master_class_id === event.id &&
                        (inv.participant_id === user?.id || inv.participant_id === child.id)
                    ) || [];

                    console.log(`🔍 Доступные счета для ребенка ${child.name} в мастер-классе ${event.id}:`, {
                        childId: child.id,
                        parentId: user?.id,
                        availableInvoices: availableInvoices.map(inv => ({
                            id: inv.id,
                            master_class_id: inv.master_class_id,
                            participant_id: inv.participant_id,
                            status: inv.status,
                            selected_styles: inv.selected_styles,
                            selected_options: inv.selected_options
                        })),
                        allInvoices: participantInvoices?.invoices?.map(inv => ({
                            id: inv.id,
                            master_class_id: inv.master_class_id,
                            participant_id: inv.participant_id,
                            status: inv.status
                        })) || []
                    });

                    // Берем счет для родителя (групповой) или для ребенка (индивидуальный)
                    // Для групповых регистраций все дети используют один счет
                    let invoice = availableInvoices.find(inv => inv.participant_id === user?.id);
                    if (!invoice) {
                        // Если нет группового счета, ищем индивидуальный для ребенка
                        invoice = availableInvoices.find(inv => inv.participant_id === child.id);
                    }

                    // Если есть групповой счет, привязываем его ко всем детям
                    if (invoice && invoice.participant_id === user?.id) {
                        console.log(`🔍 Групповой счет для ребенка ${child.name}:`, {
                            invoiceId: invoice.id,
                            participant_id: invoice.participant_id,
                            status: invoice.status
                        });
                    }

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

                    console.log(`🔍 Статус для ребенка ${child.name} в мастер-классе ${event.id}:`, {
                        childId: child.id,
                        registration: registration ? {
                            id: registration.id,
                            status: registration.status
                        } : null,
                        invoice: invoice ? {
                            id: invoice.id,
                            status: invoice.status,
                            participant_id: invoice.participant_id
                        } : null,
                        finalStatus: status,
                        masterClassParticipants: masterClasses.find(mc => mc.id === event.id)?.participants?.length || 0
                    });

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
                    // Ищем групповой счет (для родителя) или любой детский счет
                    const groupInvoice = participantInvoices?.invoices?.find(inv =>
                        inv.master_class_id === event.id && inv.participant_id === user?.id
                    );

                    if (groupInvoice) {
                        // Если есть групповой счет, используем его статус
                        invoiceStatus = groupInvoice.status;
                        console.log(`🔍 Групповой счет для мастер-класса ${event.id}:`, {
                            invoiceId: groupInvoice.id,
                            status: groupInvoice.status,
                            participant_id: groupInvoice.participant_id
                        });
                    } else {
                        // Иначе определяем по детским счетам
                        const hasPaidInvoice = childInvoices.some(c => c.invoice?.status === 'paid');
                        const hasPendingInvoice = childInvoices.some(c => c.invoice?.status === 'pending');
                        const hasCancelledInvoice = childInvoices.some(c => c.invoice?.status === 'cancelled');

                        if (hasPaidInvoice) invoiceStatus = 'paid';
                        else if (hasPendingInvoice) invoiceStatus = 'pending';
                        else if (hasCancelledInvoice) invoiceStatus = 'cancelled';
                    }

                    console.log(`🔍 Статус счета для мастер-класса ${event.id}:`, {
                        childInvoices: childInvoices.length,
                        groupInvoice: groupInvoice ? { id: groupInvoice.id, status: groupInvoice.status } : null,
                        invoiceStatus
                    });
                }

                console.log(`✅ Мастер-класс ${event.id} подходит для класса ${event.classGroup}:`, {
                    eligibleChildren: eligibleChildren.map(c => c.name),
                    childrenWithStatus,
                    invoiceStatus,
                    userRegistrations: userRegistrations.filter(reg => reg.workshopId === event.id),
                    participantInvoices: participantInvoices?.invoices?.filter(inv => inv.master_class_id === event.id)
                });

                // Отладочная информация для OrderDetailsModal
                console.log(`🔍 OrderDetailsModal Debug - Мастер-класс ${event.id}:`, {
                    childrenWithStatus: childrenWithStatus.map(child => ({
                        childId: child.childId,
                        childName: child.childName,
                        status: child.status,
                        invoice: child.invoice ? {
                            id: child.invoice.id,
                            status: child.invoice.status,
                            selected_styles: child.invoice.selected_styles,
                            selected_options: child.invoice.selected_options
                        } : null
                    }))
                });

                // Создаем или обновляем карточку для этого класса
                if (classGroupMap.has(classKey)) {
                    // Обновляем существующую карточку, добавляя новых детей
                    const existing = classGroupMap.get(classKey)!;
                    const oldInvoiceStatus = existing.invoiceStatus;

                    existing.children = [...new Set([...existing.children, ...eligibleChildren.map(c => c.id)])];

                    // Обновляем статус счета (не понижая его)
                    existing.invoiceStatus = mergeInvoice(existing.invoiceStatus, invoiceStatus);

                    // Обновляем информацию о детях и их статусах (берем лучший статус для каждого ребенка)
                    existing.eligibleChildren = mergeEligibleChildren(existing.eligibleChildren, eligibleChildren);
                    existing.childrenWithStatus = mergeChildStatusLists(existing.childrenWithStatus, childrenWithStatus);

                    console.log(`🔄 Обновлена существующая карточка для класса ${event.classGroup}:`, {
                        oldInvoiceStatus,
                        newInvoiceStatus: existing.invoiceStatus,
                        childrenCount: existing.children.length
                    });
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
                        children: eligibleChildren.map(c => c.id),
                        invoiceId: undefined, // Может быть несколько счетов для разных детей
                        schoolId: event.schoolId,
                        serviceId: event.serviceId,
                        eligibleChildren: eligibleChildren,
                        childrenWithStatus: childrenWithStatus,
                        participantsCount: event.participants ? event.participants.length : 0,
                        invoiceStatus
                    };

                    classGroupMap.set(classKey, newCard);

                    console.log(`🆕 Создана новая карточка для класса ${event.classGroup}:`, {
                        invoiceStatus,
                        childrenCount: newCard.children.length
                    });
                }
            } else {
                console.log(`❌ Мастер-класс ${event.id} не подходит ни для одного ребенка`);
            }
        });

        // Преобразуем в массив для отображения
        const allWorkshops = Array.from(classGroupMap.values());

        console.log('📋 Итоговый список мастер-классов по классам:', {
            total: allWorkshops.length,
            workshops: allWorkshops.map(w => ({
                id: w.id,
                childrenCount: w.children.length,
                date: w.date,
                schoolName: w.schoolName,
                classGroup: w.classGroup,
                invoiceStatus: w.invoiceStatus,
                childrenWithStatus: w.childrenWithStatus.map(c => ({
                    name: c.childName,
                    status: c.status,
                    hasInvoice: !!c.invoice,
                    hasRegistration: !!c.registration
                }))
            }))
        });

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

        console.log('✅ groupedWorkshops: Мастер-классы рассчитаны:', {
            total: sortedWorkshops.length,
            refreshTrigger
        });

        return { total: sortedWorkshops.length, workshops: sortedWorkshops };
    }, [masterClasses, schools, services, children, userRegistrations, participantInvoices, refreshTrigger]);

    // Мемоизируем прошедшие мастер-классы для вкладки "История"
    const pastWorkshops = useMemo(() => {
        console.log('🔄 pastWorkshops: Пересчитываем прошедшие мастер-классы, refreshTrigger:', refreshTrigger);

        if (!masterClasses.length || !children.length) {
            console.log('✅ pastWorkshops: Нет данных для расчета');
            return { total: 0, workshops: [] };
        }

        const today = new Date().toISOString().slice(0, 10);

        // Фильтруем прошедшие мастер-классы
        const pastEvents = masterClasses.filter(ev => ev.date < today);

        console.log('🔍 Фильтрация прошедших мастер-классов:', {
            total: masterClasses.length,
            pastEvents: pastEvents.length,
            today: today,
            events: pastEvents.map(ev => ({
                id: ev.id,
                date: ev.date,
                schoolId: ev.schoolId,
                classGroup: ev.classGroup
            }))
        });

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
                const childrenWithStatus = eligibleChildren.map(child => {
                    const registration = userRegistrations.find(reg =>
                        reg.workshopId === event.id && reg.userId === child.id
                    );

                    const availableInvoices = participantInvoices?.invoices?.filter(inv => inv.master_class_id === event.id) || [];
                    const invoice = availableInvoices.find(inv => {
                        const masterClass = masterClasses.find(mc => mc.id === event.id);
                        if (masterClass && masterClass.participants) {
                            const hasChild = masterClass.participants.some(participant =>
                                participant.childId === child.id
                            );
                            return hasChild;
                        }
                        return true;
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

        console.log('✅ pastWorkshops: Прошедшие мастер-классы рассчитаны:', {
            total: sortedPastWorkshops.length,
            refreshTrigger
        });

        return { total: sortedPastWorkshops.length, workshops: sortedPastWorkshops };
    }, [masterClasses, schools, services, children, userRegistrations, participantInvoices, refreshTrigger]);

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
        console.log('🔄 Dashboard: Открываем модальное окно регистрации для мастер-класса:', workshop.title);
        setSelectedWorkshop(workshop);
        setIsWorkshopRegistrationOpen(true);
    };

    // Обработчик успешной регистрации на мастер-класс
    const handleWorkshopRegistrationSuccess = async () => {
        console.log('🎯 Dashboard: handleWorkshopRegistrationSuccess ВЫЗВАН!');
        console.log('🔄 ОБНОВЛЕНИЕ DASHBOARD: Начинаем обновление данных после успешной регистрации...');
        console.log('🔄 ОБНОВЛЕНИЕ DASHBOARD: Текущие данные:', {
            userRegistrations: userRegistrations.length,
            children: children.length,
            masterClasses: masterClasses.length,
            refreshTrigger
        });

        try {
            // Принудительно обновляем все данные
            if (user?.id) {
                console.log('🔄 ОБНОВЛЕНИЕ DASHBOARD: Перезагружаем регистрации пользователя...');

                // Перезагружаем регистрации пользователя
                const updatedRegistrations = await getUserRegistrations(user.id);
                console.log('🔄 ОБНОВЛЕНИЕ DASHBOARD: Получены регистрации:', updatedRegistrations);

                setUserRegistrations(updatedRegistrations);
                console.log('✅ ОБНОВЛЕНИЕ DASHBOARD: Регистрации обновлены:', updatedRegistrations.length);

                console.log('🔄 ОБНОВЛЕНИЕ DASHBOARD: Перезагружаем детей...');

                // Перезагружаем детей (для обновления статистики)
                const updatedChildren = await getChildrenByParentId(user.id);
                const formattedChildren: ChildData[] = updatedChildren.map(child => {
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
                        pendingOrders: 0, // TODO: Получить из API
                        completedOrders: 0, // TODO: Получить из API
                    };
                });
                setChildren(formattedChildren);
                console.log('✅ Дети обновлены:', formattedChildren.length);
            }

            console.log('🔄 ОБНОВЛЕНИЕ DASHBOARD: Перезагружаем мастер-классы...');

            // Перезагружаем мастер-классы
            await fetchMasterClasses();
            console.log('✅ ОБНОВЛЕНИЕ DASHBOARD: Мастер-классы обновлены');

            // Принудительно обновляем счеты участников через React Query
            if (user?.id) {
                // Инвалидируем кэш для всех счетов участника
                // Это заставит useParticipantInvoices перезагрузить данные
                console.log('🔄 Инвалидируем кэш счетов участника');

                // Инвалидируем кэш счетов
                queryClient.invalidateQueries({ queryKey: ['invoices', 'participant', user.id] });

                // Инвалидируем кэш мастер-классов
                queryClient.invalidateQueries({ queryKey: ['masterClasses'] });

                // Принудительно обновляем данные через refreshTrigger
                // Это заставит все useMemo пересчитаться
            }

            toast({
                title: "Успешно! 🎉",
                description: "Дети записаны на мастер-класс. Ожидаем оплату счета.",
            });

            // Принудительно обновляем UI через триггер
            setRefreshTrigger(prev => {
                const newValue = prev + 1;
                console.log('🔄 ОБНОВЛЕНИЕ DASHBOARD: Триггер обновления UI изменен с', prev, 'на', newValue);
                return newValue;
            });

            // Небольшая задержка для корректного обновления UI
            setTimeout(() => {
                console.log('🔄 ОБНОВЛЕНИЕ DASHBOARD: Принудительное обновление UI завершено');
                console.log('🔄 ОБНОВЛЕНИЕ DASHBOARD: Финальные данные:', {
                    userRegistrations: userRegistrations.length,
                    children: children.length,
                    masterClasses: masterClasses.length,
                    refreshTrigger
                });
            }, 100);

        } catch (error) {
            console.error('❌ ОБНОВЛЕНИЕ DASHBOARD: Ошибка при обновлении данных:', error);
            toast({
                title: "Внимание",
                description: "Запись прошла успешно, но не удалось обновить данные. Обновите страницу.",
                variant: "destructive",
            });
        }
    };

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
        const childrenNames = workshop.childrenWithStatus.map(c => c.childName).join(', ');
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
        return childrenIds.map(id => children.find(c => c.id === id)?.name).filter(Boolean).join(', ');
    };

    // Мемоизируем статистику детей
    const childrenStats = useMemo(() => {
        console.log('🔄 getChildrenStats: Пересчитываем статистику:', {
            children: children.length,
            userRegistrations: userRegistrations.length,
            participantInvoices: participantInvoices?.invoices?.length || 0,
            refreshTrigger
        });

        if (!children.length) {
            console.log('✅ getChildrenStats: Нет детей для расчета статистики');
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
        console.log('✅ getChildrenStats: Статистика рассчитана:', stats);
        return stats;
    }, [children, userRegistrations, participantInvoices?.invoices, refreshTrigger]);

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

        console.log('✅ getChildOrderStats: Статистика по детям рассчитана:',
            Array.from(childStats.entries()).map(([childId, stats]) => ({
                childId,
                childName: children.find(c => c.id === childId)?.name,
                ...stats
            }))
        );

        return childStats;
    }, [children, userRegistrations, participantInvoices?.invoices]);

    // Отладочная информация (только при изменении основных данных)
    useEffect(() => {
        console.log('📊 ОТЛАДКА: Загружены данные, refreshTrigger:', refreshTrigger, {
            masterClasses: masterClasses.length,
            schools: schools.length,
            services: services.length,
            children: children.length,
            userRegistrations: userRegistrations.length,
            participantInvoices: participantInvoices?.invoices?.length || 0
        });

        // Отладочная информация для мастер-классов
        if (masterClasses.length > 0) {
            console.log('🎨 ОТЛАДКА: Доступные мастер-классы:', masterClasses.map(mc => ({
                id: mc.id,
                date: mc.date,
                schoolId: mc.schoolId,
                classGroup: mc.classGroup,
                schoolName: mc.schoolName,
                city: mc.city
            })));
        }

        // Отладочная информация для детей
        if (children.length > 0) {
            console.log('👶 ОТЛАДКА: Дети родителя:', children.map(child => ({
                id: child.id,
                name: child.name,
                schoolId: child.schoolId,
                classGroup: child.classGroup,
                schoolName: child.schoolName
            })));
        }

        // Отладочная информация для школ
        if (schools.length > 0) {
            console.log('🏫 ОТЛАДКА: Доступные школы:', schools.map(school => ({
                id: school.id,
                name: school.name,
                address: school.address,
                classes: school.classes
            })));
        }

        // Отладочная информация для регистраций
        if (userRegistrations.length > 0) {
            console.log('📝 ОТЛАДКА: Регистрации пользователя:', userRegistrations.map(reg => ({
                id: reg.id,
                workshopId: reg.workshopId,
                userId: reg.userId,
                status: reg.status,
                totalPrice: reg.totalPrice
            })));
        }

        // Отладочная информация для статистики заказов по детям
        if (children.length > 0) {
            console.log('📊 ОТЛАДКА: Статистика заказов по детям:',
                Array.from(getChildOrderStats.entries()).map(([childId, stats]) => ({
                    childId,
                    childName: children.find(c => c.id === childId)?.name,
                    ...stats
                }))
            );
        }

        // Отладочная информация для счетов
        if (participantInvoices?.invoices && participantInvoices.invoices.length > 0) {
            console.log('💰 ОТЛАДКА: Счета участника:', participantInvoices.invoices.map(inv => ({
                id: inv.id,
                master_class_id: inv.master_class_id,
                participant_id: inv.participant_id,
                status: inv.status,
                amount: inv.amount
            })));
        }

        // Отладочная информация для сопоставления данных
        if (children.length > 0 && participantInvoices?.invoices) {
            console.log('🔗 ОТЛАДКА: Сопоставление детей и счетов:', children.map(child => {
                const childInvoices = participantInvoices.invoices.filter(inv => inv.participant_id === child.id);
                return {
                    childId: child.id,
                    childName: child.name,
                    invoices: childInvoices.map(inv => ({
                        id: inv.id,
                        master_class_id: inv.master_class_id,
                        status: inv.status
                    }))
                };
            }));
        }
    }, [masterClasses.length, schools.length, services.length, children.length, masterClasses, children, refreshTrigger]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-blue-100 relative overflow-hidden">
            {/* Анимированные звездочки */}
            <AnimatedStars count={15} className="opacity-40" />



            {/* Шапка с логотипом и названием студии */}
            <ParentHeader />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 mt-20">
                {/* Заголовок */}
                <div className="text-center mb-6 sm:mb-8">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-3 sm:mb-4">
                        Добро пожаловать, {user?.name}! 👋
                    </h1>
                    <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-2">
                        Управляйте записями детей на мастер-классы
                    </p>
                </div>

                {/* Статистика */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 sm:mb-8">
                    <Card className="bg-orange-50/80 backdrop-blur-sm border-orange-200 hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-3 text-center">
                            <div className="flex items-center justify-center mb-1">
                                <Baby className="w-5 h-5 text-orange-600 mr-2" />
                                <div className="text-xl font-bold text-orange-600">{children.length}</div>
                            </div>
                            <div className="text-xs text-gray-600">Детей</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-purple-50/80 backdrop-blur-sm border-purple-200 hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-3 text-center">
                            <div className="flex items-center justify-center mb-1">
                                <AlertCircle className="w-5 h-5 text-purple-600 mr-2" />
                                <div className="text-xl font-bold text-purple-600">
                                    {childrenStats.pending}
                                </div>
                            </div>
                            <div className="text-xs text-gray-600">Ожидают подтверждения</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-blue-50/80 backdrop-blur-sm border-blue-200 hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-3 text-center">
                            <div className="flex items-center justify-center mb-1">
                                <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                                <div className="text-xl font-bold text-blue-600">
                                    {childrenStats.completed}
                                </div>
                            </div>
                            <div className="text-xs text-gray-600">Завершенных заказов</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-green-50/80 backdrop-blur-sm border-green-200 hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-3 text-center">
                            <div className="flex items-center justify-center mb-1">
                                <Star className="w-5 h-5 text-green-600 mr-2" />
                                <div className="text-xl font-bold text-green-600">
                                    {groupedWorkshops.total}
                                </div>
                            </div>
                            <div className="text-xs text-gray-600">Доступных мастер-классов</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Основной контент */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm">
                        <TabsTrigger value="children" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                            <Baby className="w-4 h-4 mr-2" />
                            Мои дети
                        </TabsTrigger>
                        <TabsTrigger value="workshops" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                            <Palette className="w-4 h-4 mr-2" />
                            Мастер-классы
                        </TabsTrigger>
                        <TabsTrigger value="history" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            История
                        </TabsTrigger>
                    </TabsList>

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
                                    {children.map((child) => (
                                        <Card key={child.id} className="hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-50 to-purple-50 border-orange-300">
                                            <CardHeader className="p-4 sm:p-6">
                                                <CardTitle className="text-xl sm:text-2xl text-orange-600 flex items-center justify-between">
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
                                                            {schools.map((school) => (
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
                                                                {availableClasses.map((className) => (
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
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-bold text-gray-800">
                                        Доступные мастер-классы
                                    </h2>
                                    <Badge variant="secondary" className="text-sm">
                                        {groupedWorkshops.total} найдено
                                    </Badge>
                                </div>

                                {groupedWorkshops.workshops.map((workshop) => {
                                    const workshopChildren = children.filter(c => workshop.children.includes(c.id));
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

                        {/* Секция с заявками на проведение мастер-классов */}
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
                                        {workshopRequests.map((request) => (
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
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-gray-500" />
                                                        <span className="text-gray-700">
                                                            Желаемая дата: {new Date(request.desired_date).toLocaleDateString('ru-RU')}
                                                        </span>
                                                    </div>
                                                </div>
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

                                    {pastWorkshops.workshops.map((workshop) => {
                                        const workshopChildren = children.filter(c => workshop.children.includes(c.id));
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
                                                                {workshop.childrenWithStatus.map((child) => (
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
                                                                                eventTime={workshop.time}
                                                                                onPaymentSuccess={() => {
                                                                                    toast({
                                                                                        title: "Оплата успешна! 🎉",
                                                                                        description: "Статус счета обновлен. Спасибо за оплату!",
                                                                                    });
                                                                                    // Обновляем данные
                                                                                    queryClient.invalidateQueries({ queryKey: ['workshopParticipation'] });
                                                                                    queryClient.invalidateQueries({ queryKey: ['participantInvoices'] });
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
                console.log('🔄 Dashboard: Рендерим MultiChildWorkshopModal с onRegistrationSuccess:', !!handleWorkshopRegistrationSuccess);
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
                                        {schools.map((school) => (
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
                                            return school?.classes.map((className) => (
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

    console.log('🔄 ParentDashboard: Рендер завершен, refreshTrigger:', refreshTrigger);
};

export default ParentDashboard; 