import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import logoImage from '../../assets/logo.png';
import { Card, CardContent, CardContentCompact, CardDescription, CardHeader, CardHeaderCompact, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AdminFiltersProvider, useAdminFilters } from '@/contexts/AdminFiltersContext';
import { useUsers } from '@/hooks/use-users';
import { useSchools } from '@/hooks/use-schools';
import { useServices } from '@/hooks/use-services';
import { useMasterClasses } from '@/hooks/use-master-classes';
import { useInvoices } from '@/hooks/use-invoices';
import { useAdminChat } from '@/hooks/use-chat';
import { useWebSocketChat } from '@/hooks/use-websocket-chat';
import { useWorkshopRequestsWebSocket } from '@/hooks/use-workshop-requests-websocket';
import { useMasterClassesWebSocket } from '@/hooks/use-master-classes-websocket';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { useLandingSettingsAdmin } from '@/hooks/use-landing-settings';
import { cn } from '@/lib/utils';
import { useResponsiveLayout } from '@/contexts/ResponsiveLayoutContext';
import { ResponsiveList } from '@/components/admin/lists/ResponsiveList';
import { SelectionManagerProvider, useSelectionManager } from '@/contexts/SelectionManagerContext';
import { BulkActionBar } from '@/components/admin/selection/BulkActionBar';
import { AdminNavigationProvider } from '@/components/admin/navigation/AdminNavigationContext';
import { MobileAppBar } from '@/components/admin/navigation/MobileAppBar';
import { MobileAdminDrawer } from '@/components/admin/navigation/MobileAdminDrawer';
import { FloatingActionButton } from '@/components/admin/navigation/FloatingActionButton';
import { StatCardSection } from '@/components/admin/dashboard/StatCardSection';
import { FilterDrawer } from '@/components/admin/filters/FilterDrawer';
import { FilterChips, type FilterChip } from '@/components/admin/filters/FilterChips';
import { UserCard } from '@/components/admin/cards/UserCard';
import { SchoolCard } from '@/components/admin/cards/SchoolCard';
import { api } from '@/lib/api';
import { chatApi } from '@/lib/chat-api';
import { Chat } from '@/types/chat';
import { useQueryClient } from '@tanstack/react-query';
import { SchoolModal } from '@/components/ui/school-modal';
import { SchoolFilters } from '@/components/ui/school-filters';
import { AddServiceModal } from '@/components/ui/add-service-modal';
import { AddUserModal } from '@/components/ui/add-user-modal';
import { ServiceCard } from '@/components/ui/service-card';
import { StyleOptionModal } from '@/components/ui/style-option-modal';
import MasterClassesTab from '@/components/admin/MasterClassesTab';
import { MasterClassDetails } from '@/components/admin/MasterClassDetails';
import WorkshopRequestsTab from '@/components/admin/WorkshopRequestsTab';
import OffersTab from '@/components/admin/OffersTab';
import ContactsTab from '@/components/admin/ContactsTab';
import BonusesTab from '@/components/admin/BonusesTab';
import PrivacyConsentTab from '@/components/admin/PrivacyConsentTab';
import { Service, ServiceStyle, ServiceOption, User } from '@/types';
import { MasterClassEvent, MasterClassParticipant } from '@/types/services';
import { StatCardDefinition } from '@/types/dashboard';
import {
    Users,
    Building2,
    Wrench,
    GraduationCap,
    Receipt,
    Search,
    Plus,
    UserPlus,
    Trash2,
    Edit,
    Filter,
    MessageCircle,
    Shield,
    User as UserIcon,
    Clock,
    Send,
    RefreshCw,
    FileText,
    ChevronDown,
    ChevronUp,
    ChevronRight,
    LogOut
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import InvoicesTab from "@/components/admin/InvoicesTab";
import { RefundsTab } from "@/components/admin/RefundsTab";
import ServicePage from "./ServicePage";
import AboutTab from "@/components/admin/AboutTab";

interface School {
    id: string;
    name: string;
    address: string;
    classes: string[];
    teacher?: string;
    teacherPhone?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

type QuickLinkTone = 'blue' | 'teal' | 'purple' | 'orange';

const QUICK_LINK_TONE_STYLES: Record<QuickLinkTone, { container: string; icon: string; badge: string }> = {
    blue: {
        container: 'border border-blue-200 bg-blue-50/80',
        icon: 'bg-blue-100 text-blue-600',
        badge: 'bg-blue-600 text-white',
    },
    teal: {
        container: 'border border-teal-200 bg-teal-50/80',
        icon: 'bg-teal-100 text-teal-600',
        badge: 'bg-teal-600 text-white',
    },
    purple: {
        container: 'border border-purple-200 bg-purple-50/80',
        icon: 'bg-purple-100 text-purple-600',
        badge: 'bg-purple-600 text-white',
    },
    orange: {
        container: 'border border-orange-200 bg-orange-50/80',
        icon: 'bg-orange-100 text-orange-600',
        badge: 'bg-orange-500 text-white',
    },
};

interface QuickNavigationItem {
    id: string;
    label: string;
    description: string;
    icon: LucideIcon;
    tone: QuickLinkTone;
    onPress: () => void;
    badge?: number | string | null;
}

interface QuickActionItem {
    id: string;
    label: string;
    icon: LucideIcon;
    onPress: () => void;
    variant?: 'default' | 'outline';
}

const DashboardContent: React.FC = () => {
    const { user, logout } = useAuth();
    const { toast } = useToast();
    const { filters, updateFilters } = useAdminFilters();
    const queryClient = useQueryClient();
    const { isSmallScreen } = useResponsiveLayout();

    // ===== ВСЕ ХУКИ ДАННЫХ В НАЧАЛЕ (ДО ИСПОЛЬЗОВАНИЯ) =====
    const { users, loading: usersLoading, error: usersError, total: usersTotal, deleteUser, createUser, fetchUsers, lastFetch: usersLastFetch } = useUsers();
    const { schools, loading: schoolsLoading, error: schoolsError, total: schoolsTotal, deleteSchool, createSchool, updateSchool, fetchSchools } = useSchools();
    const { data: invoicesData, isLoading: invoicesLoading, error: invoicesError } = useInvoices({});
    const {
        services,
        loading: servicesLoading,
        error: servicesError,
        total: servicesTotal,
        deleteService,
        createService,
        addStyleToService,
        addOptionToService,
        updateServiceStyle,
        updateServiceOption,
        reorderServiceStyles,
        reorderServiceOptions,
        fetchServices
    } = useServices();
    const {
        masterClasses,
        loading: masterClassesLoading,
        error: masterClassesError,
        total: masterClassesTotal,
        fetchMasterClasses,
        createMasterClass,
        updateMasterClass,
        deleteMasterClass,
        getMasterClassById
    } = useMasterClasses();
    
    // Хук для настроек лендинга
    const { registrationEnabled, isLoading: landingSettingsLoading, toggleRegistration, isUpdating: landingSettingsUpdating } = useLandingSettingsAdmin();

    // Отладка импорта логотипа (убрано для оптимизации)
    // console.log('Dashboard: logoImage импортирован:', logoImage);
    const [searchTerm, setSearchTerm] = useState('');
    const [usersSearchTerm, setUsersSearchTerm] = useState('');
    const [schoolsSearchTerm, setSchoolsSearchTerm] = useState('');
    const [expandedChildRows, setExpandedChildRows] = useState<Set<string>>(new Set());
    // Используем поиск услуг из контекста
    const servicesSearchTerm = filters.services.search;

    const [selectedTab, setSelectedTab] = useState(() => {
        // Восстанавливаем выбранную вкладку из localStorage
        const savedTab = localStorage.getItem('adminSelectedTab');
        return savedTab || 'overview';
    });

    // Функция для обновления выбранной вкладки с сохранением в localStorage
    const handleTabChange = useCallback((newTab: string) => {
        setSelectedTab(newTab);
        localStorage.setItem('adminSelectedTab', newTab);

        // Отключаем мигание сразу при переходе на вкладку чата
        if (newTab === 'chat') {
            console.log('💬 Переход на таб чата - отключаем мигание');
            setChatTabBlink(false);
        }
        if (newTab === 'workshop-requests') {
            console.log('📋 Переход на таб заявок - отключаем мигание');
            setRequestsTabBlink(false);
        }
    }, []);

    // Состояние для мигания вкладки чата
    const [chatTabBlink, setChatTabBlink] = useState(false);
    const [requestsTabBlink, setRequestsTabBlink] = useState(false);
    const [statsExpanded, setStatsExpanded] = useState(!isSmallScreen);

    useEffect(() => {
        setStatsExpanded(!isSmallScreen);
    }, [isSmallScreen]);

    const [schoolModalOpen, setSchoolModalOpen] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
    const [addUserModalOpen, setAddUserModalOpen] = useState(false);
    const [isUserFiltersDrawerOpen, setUserFiltersDrawerOpen] = useState(false);

    // Состояние для статистики заявок
    const [workshopRequestsStats, setWorkshopRequestsStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0
    });

    // ===== ФУНКЦИЯ ЗАГРУЗКИ СТАТИСТИКИ (ПЕРЕД WebSocket) =====
    const loadWorkshopRequestsStats = useCallback(async () => {
        try {
            const authToken = localStorage.getItem('authToken');
            if (!authToken) {
                console.error('❌ Dashboard: Токен авторизации отсутствует, перенаправляем на логин');
                window.location.href = '/admin/login';
                return;
            }

            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const apiUrl = `${API_BASE_URL}/workshop-requests/stats/overview`;

            try {
                const healthUrl = `${API_BASE_URL}/health`;
                const healthCheck = await fetch(healthUrl, {
                    method: 'HEAD'
                });
            } catch (healthError) {
                console.warn('⚠️ Dashboard: Backend сервер недоступен, используем fallback:', healthError);
                setWorkshopRequestsStats({
                    total: 0,
                    pending: 0,
                    approved: 0,
                    rejected: 0
                });
                return;
            }

            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });

            if (response.ok) {
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    console.error('❌ Dashboard: Ответ не является JSON. Content-Type:', contentType);
                    setWorkshopRequestsStats({
                        total: 0,
                        pending: 0,
                        approved: 0,
                        rejected: 0
                    });
                    return;
                }

                const responseText = await response.text();
                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (parseError) {
                    console.error('❌ Dashboard: Ошибка парсинга JSON:', parseError);
                    return;
                }

                if (data.success && data.data) {
                    setWorkshopRequestsStats({
                        total: data.data.total || 0,
                        pending: data.data.pending || 0,
                        approved: data.data.approved || 0,
                        rejected: data.data.rejected || 0
                    });
                } else {
                    console.error('❌ Dashboard: Некорректный формат данных');
                }
            } else {
                console.error('❌ Dashboard: Ошибка загрузки статистики заявок:', response.status);
            }
        } catch (error) {
            console.error('❌ Dashboard: Ошибка при загрузке статистики заявок:', error);
        }
    }, []);

    // WebSocket для автоматических обновлений заявок
    const { isConnected: wsRequestsConnected, sendMessage: wsRequestsSendMessage } = useWorkshopRequestsWebSocket(
        'admin',
        true,
        (message) => {
            // Обрабатываем WebSocket сообщения для автоматического обновления статистики
            if (message.type === 'workshop_request_status_change' || message.type === 'workshop_request_update') {

                loadWorkshopRequestsStats();
            }
        }
    );

    // WebSocket для автоматических обновлений мастер-классов
    const { isConnected: masterClassesWsConnected, sendMasterClassMessage } = useMasterClassesWebSocket({
        userId: user?.id,
        enabled: true,
        onMasterClassUpdate: () => {

            fetchMasterClasses({ forceRefresh: true });
        }
    });

    // Отладка WebSocket состояния и принудительная загрузка статистики
    useEffect(() => {
        // console.log('🔌 Dashboard: WebSocket состояние заявок:', {
        //     isConnected: wsRequestsConnected,
        //     timestamp: new Date().toISOString()
        // });

        // При подключении WebSocket загружаем статистику только один раз
        if (wsRequestsConnected) {
            // console.log('🔌 Dashboard: WebSocket подключен, загружаем статистику заявок...');
            // loadWorkshopRequestsStats(); // Убираю повторную загрузку
        }
    }, [wsRequestsConnected]);

    // Проверяем токен авторизации при изменении WebSocket состояния
    useEffect(() => {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            console.error('❌ Dashboard: Токен авторизации отсутствует в WebSocket эффекте');
            window.location.href = '/admin/login';
            return;
        }
    }, [wsRequestsConnected]);
    // Состояния для чата - используем из контекста
    const chatStatusFilter = filters.chat.status;
    const [selectedAdminChat, setSelectedAdminChat] = useState<Chat | null>(null);
    const [adminMessage, setAdminMessage] = useState('');
    const [isSendingAdminMessage, setIsSendingAdminMessage] = useState(false);
    const [isUpdatingAdminChatStatus, setIsUpdatingAdminChatStatus] = useState(false);

    // Хук для админского чата с callback для мигания вкладки
    const {
        chats: adminChats,
        messages: adminMessages,
        isLoadingChats: isLoadingAdminChats,
        isLoadingMessages: isLoadingAdminMessages,
        sendMessage: adminSendMessage,
        updateChatStatus: adminUpdateChatStatus,
        deleteChat,
        isDeletingChat
    } = useAdminChat(
        selectedAdminChat,
        chatStatusFilter,
        (data) => {
            // При получении нового сообщения активируем мигание вкладки, если она не активна
            if (selectedTab !== 'chat') {
                console.log('💬 Новое сообщение - активируем мигание вкладки чата');
                setChatTabBlink(true);
            }
        }
    );

    // WebSocket для real-time обновлений чатов
    const { isConnected: wsConnected, isConnecting: wsConnecting } = useWebSocketChat(
        selectedAdminChat?.id,
        user?.id,
        true, // isAdmin = true
        {
            onMessage: (data) => {
                // При получении нового сообщения активируем мигание вкладки, если она не активна
                if (data.type === 'chat_message' && selectedTab !== 'chat') {
                    console.log('💬 Новое сообщение - активируем мигание вкладки чата');
                    setChatTabBlink(true);
                }
            }
        }
    );

    // Глобальная WebSocket подписка для мигания таба чата при ЛЮБЫХ новых сообщениях
    const wsContext = useWebSocketContext();

    useEffect(() => {
        if (!user?.id || !wsContext?.isConnected) return;

        console.log('📡 Админ подписывается на глобальный канал admin:all для мигания таба');

        // Подписываемся на все админские события
        const unsubscribe = wsContext.subscribe('admin:all', (data) => {
            console.log('📢 Админ получил глобальное событие для мигания:', data);

            // При любом новом сообщении ВСЕГДА активируем мигание таба
            // Это привлекает внимание админа к новым сообщениям
            if (data.type === 'chat_message') {
                console.log('💬 Новое сообщение - активируем мигание (selectedTab:', selectedTab, ')');
                // Мигаем ВСЕГДА, независимо от вкладки - для привлечения внимания
                if (selectedTab !== 'chat') {
                    setChatTabBlink(true);
                    console.log('💬 Таб чата будет мигать');
                } else {
                    // Даже если на вкладке чат - запускаем кратковременное мигание
                    setChatTabBlink(true);
                    setTimeout(() => setChatTabBlink(false), 2000); // 2 секунды мигания
                    console.log('💬 Кратковременное мигание на 2 сек (уже на вкладке чат)');
                }
            }
        });

        return () => {
            console.log('📡 Админ отписывается от глобального канала admin:all');
            unsubscribe();
        };
    }, [user?.id, wsContext?.isConnected, selectedTab, wsContext]);

    // Мигание вкладки заявок при наличии pending заявок
    useEffect(() => {
        if (workshopRequestsStats && selectedTab !== 'workshop-requests') {
            if (workshopRequestsStats.pending > 0) {
                console.log(`📋 Обнаружено ${workshopRequestsStats.pending} заявок со статусом pending - включаем мигание таба`);
                setRequestsTabBlink(true);
            } else {
                console.log('📋 Нет pending заявок - отключаем мигание таба');
                setRequestsTabBlink(false);
            }
        }
        // Отключаем мигание при переходе на вкладку заявок
        if (selectedTab === 'workshop-requests') {
            setRequestsTabBlink(false);
        }
    }, [workshopRequestsStats, selectedTab]);

    // WebSocket для автоматического обновления заявок
    useEffect(() => {
        if (!user?.id || !wsContext?.isConnected) return;

        console.log('📡 Админ подписывается на события заявок');

        // Подписываемся на события заявок
        const unsubscribe = wsContext.subscribe('admin:all', (data) => {
            console.log('📢 Админ получил событие заявки:', data);

            // При создании новой заявки или изменении статуса - обновляем статистику
            if (data.type === 'workshop_request_created' ||
                data.type === 'workshop_request_status_change' ||
                data.type === 'workshop_request_update') {
                console.log('📋 Событие заявки - обновляем статистику');
                loadWorkshopRequestsStats();
            }
        });

        return () => {
            console.log('📡 Админ отписывается от событий заявок');
            unsubscribe();
        };
    }, [user?.id, wsContext?.isConnected, wsContext]);

    // WebSocket для автоматических обновлений школ (изменение оплаты)
    useEffect(() => {
        if (!user?.id || !wsContext?.isConnected) return;

        console.log('📡 Админ подписывается на события изменения оплаты школ');

        // Подписываемся на события изменения оплаты школ
        const unsubscribe = wsContext.subscribe('admin:all', (data) => {
            if (data.type === 'master_class_update' && data.data?.action === 'school_payment_changed') {
                console.log('🏫 Событие изменения оплаты школы - обновляем список школ');
                fetchSchools();
            }
        });

        return () => {
            console.log('📡 Админ отписывается от событий изменения оплаты школ');
            unsubscribe();
        };
    }, [user?.id, wsContext?.isConnected, wsContext, fetchSchools]);

    // Автоматическая пометка сообщений как прочитанных при выборе чата (только если вкладка чата активна)
    useEffect(() => {
        const markChatAsRead = async () => {
            // Помечаем как прочитанное только если вкладка чата активна И выбран конкретный чат
            if (selectedAdminChat?.id && user?.id && selectedTab === 'chat') {
                try {
                    await chatApi.markAsRead({
                        chatId: selectedAdminChat.id,
                        userId: user.id
                    });
                    // Обновляем список чатов после пометки
                    // Используем небольшую задержку для обновления на backend
                    setTimeout(() => {
                        // Принудительно обновляем чаты
                        queryClient.invalidateQueries({ queryKey: ['adminChats'] });
                    }, 500);
                } catch (error) {
                    console.error('❌ Ошибка пометки сообщений как прочитанных:', error);
                }
            }
        };

        markChatAsRead();
    }, [selectedAdminChat?.id, user?.id, selectedTab, queryClient]);

    // Проверка наличия непрочитанных сообщений для мигания таба
    useEffect(() => {
        if (!adminChats || selectedTab === 'chat') return;

        // Подсчитываем чаты с непрочитанными сообщениями
        const chatsWithUnread = adminChats.filter(chat => (chat.unreadCount || 0) > 0);

        if (chatsWithUnread.length > 0) {
            console.log(`💬 Обнаружено ${chatsWithUnread.length} чатов с непрочитанными - включаем мигание таба`);
            setChatTabBlink(true);
        } else {
            console.log('💬 Нет непрочитанных сообщений - отключаем мигание таба');
            setChatTabBlink(false);
        }
    }, [adminChats, selectedTab]);

    // Фильтры для пользователей - используем из контекста
    const userFilters = filters.users;
    const userFilterChips = useMemo<FilterChip[]>(() => {
        const chips: FilterChip[] = [];
        if (userFilters.role && userFilters.role !== 'all') {
            chips.push({
                id: 'role',
                label: 'Роль',
                value: userFilters.role,
                onRemove: () => updateFilters('users', { role: 'all' }),
            });
        }
        if (userFilters.school && userFilters.school !== 'all') {
            chips.push({
                id: 'school',
                label: 'Школа',
                value: userFilters.school,
                onRemove: () => updateFilters('users', { school: 'all', class: 'all' }),
            });
        }
        if (userFilters.class && userFilters.class !== 'all') {
            chips.push({
                id: 'class',
                label: 'Класс',
                value: userFilters.class,
                onRemove: () => updateFilters('users', { class: 'all' }),
            });
        }
        return chips;
    }, [userFilters.role, userFilters.school, userFilters.class, updateFilters]);

    const unreadChatsCount = useMemo(
        () => (adminChats || []).reduce((acc, chat) => acc + (chat.unreadCount || 0), 0),
        [adminChats]
    );
    const pendingRequestsCount = workshopRequestsStats.pending || 0;

    const navigationTabs = useMemo(
        () => [
            { id: 'overview', label: 'Обзор', emoji: '📊', activeClass: 'data-[state=active]:from-blue-500 data-[state=active]:to-blue-600' },
            { id: 'users', label: 'Пользователи', emoji: '👥', activeClass: 'data-[state=active]:from-green-500 data-[state=active]:to-green-600' },
            { id: 'schools', label: 'Школы', emoji: '🏫', activeClass: 'data-[state=active]:from-purple-500 data-[state=active]:to-purple-600' },
            { id: 'services', label: 'Услуги', emoji: '🎨', activeClass: 'data-[state=active]:from-orange-500 data-[state=active]:to-orange-600' },
            { id: 'master-classes', label: 'Мастер-классы', emoji: '🎭', activeClass: 'data-[state=active]:from-red-500 data-[state=active]:to-red-600' },
            { id: 'invoices', label: 'Счета', emoji: '💰', activeClass: 'data-[state=active]:from-teal-500 data-[state=active]:to-teal-600' },
            {
                id: 'chat',
                label: 'Чат',
                emoji: '💬',
                activeClass: 'data-[state=active]:from-cyan-500 data-[state=active]:to-cyan-600',
                animate: chatTabBlink && selectedTab !== 'chat',
                badge: unreadChatsCount,
            },
            { id: 'refunds', label: 'Возвраты', emoji: '🔄', activeClass: 'data-[state=active]:from-red-500 data-[state=active]:to-red-600' },
            {
                id: 'workshop-requests',
                label: 'Заявки',
                emoji: '📋',
                activeClass: 'data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-600',
                animate: requestsTabBlink && selectedTab !== 'workshop-requests',
                badge: pendingRequestsCount,
            },
            { id: 'about', label: 'О нас', emoji: 'ℹ️', activeClass: 'data-[state=active]:from-pink-500 data-[state=active]:to-pink-600' },
            { id: 'offers', label: 'Оферты', emoji: '📄', activeClass: 'data-[state=active]:from-amber-500 data-[state=active]:to-amber-600' },
            { id: 'contacts', label: 'Контакты', emoji: '📞', activeClass: 'data-[state=active]:from-yellow-500 data-[state=active]:to-yellow-600' },
            { id: 'bonuses', label: 'Бонусы', emoji: '🎁', activeClass: 'data-[state=active]:from-yellow-500 data-[state=active]:to-yellow-600' },
            { id: 'privacy-consent', label: 'Согласия', emoji: '🛡️', activeClass: 'data-[state=active]:from-green-500 data-[state=active]:to-green-600' },
        ],
        [chatTabBlink, requestsTabBlink, selectedTab, unreadChatsCount, pendingRequestsCount]
    );

    const mobileNavigationItems = useMemo(
        () => navigationTabs.map(tab => ({
            id: tab.id,
            label: tab.label,
            icon: <span className="text-lg">{tab.emoji}</span>,
            badge: tab.badge,
            onSelect: () => handleTabChange(tab.id),
        })),
        [navigationTabs, handleTabChange]
    );

    const mobileNotifications = unreadChatsCount + pendingRequestsCount;

    // ===== HANDLERS ДЛЯ useMemo (ПЕРЕД ИСПОЛЬЗОВАНИЕМ) =====
    const handleAddSchool = useCallback(() => {
        setSelectedSchool(null);
        setSchoolModalOpen(true);
    }, []);

    const handleAddService = useCallback(() => {
        setAddServiceModalOpen(true);
    }, []);

    // ===== ФИЛЬТРОВАННЫЕ ДАННЫЕ (ДО ИСПОЛЬЗОВАНИЯ В useMemo) =====
    const filteredUsers = (() => {
        if (!users || users.length === 0) return [];

        return users.filter(user => {
            try {
                if (!user) return false;

                const searchMatch =
                    (user.name?.toLowerCase() || '').includes(usersSearchTerm.toLowerCase()) ||
                    (user.surname?.toLowerCase() || '').includes(usersSearchTerm.toLowerCase()) ||
                    (user.email?.toLowerCase() || '').includes(usersSearchTerm.toLowerCase());

                const roleMatch = userFilters.role === 'all' || user.role === userFilters.role;

                let schoolMatch = true;
                if (userFilters.school !== 'all') {
                    try {
                        const userSchoolName = getUserSchoolName(user);
                        schoolMatch = userSchoolName === userFilters.school;
                    } catch (error) {
                        console.error('Error getting school name for user:', error, user);
                        schoolMatch = false;
                    }
                }

                let classMatch = true;
                if (userFilters.class !== 'all') {
                    classMatch = user.class === userFilters.class;
                }

                return searchMatch && roleMatch && schoolMatch && classMatch;
            } catch (error) {
                console.error('Error filtering user:', error, user);
                return false;
            }
        });
    })();

    const filteredSchools = schools.filter(school => {
        const searchMatch =
            (school.name?.toLowerCase() || '').includes(schoolsSearchTerm.toLowerCase()) ||
            (school.address?.toLowerCase() || '').includes(schoolsSearchTerm.toLowerCase()) ||
            (school.teacher?.toLowerCase() || '').includes(schoolsSearchTerm.toLowerCase());

        const cityMatch = !filters.schools.city || (school.address && school.address.split(',')[0]?.trim() === filters.schools.city);
        const schoolMatch = !filters.schools.school || school.name === filters.schools.school;
        const classMatch = !filters.schools.class || (school.classes && school.classes.includes(filters.schools.class));

        return searchMatch && cityMatch && schoolMatch && classMatch;
    });

    const filteredServices = services.filter(service =>
        (service.name?.toLowerCase() || '').includes(servicesSearchTerm.toLowerCase()) ||
        (service.shortDescription?.toLowerCase() || '').includes(servicesSearchTerm.toLowerCase())
    );

    // Вспомогательная функция для получения школы пользователя
    function getUserSchoolName(user: User) {
        try {
            if (!user) {
                return null;
            }

            // Если это родитель, то ищем школу первого ребенка
            if (user.role === 'parent' && user.children && user.children.length > 0) {
                const child = user.children[0];
                return child?.schoolName || null;
            }

            // Если это ребенок или другой пользователь со школой
            if (user.schoolName) {
                return user.schoolName;
            }

            if (user.schoolId && schools && Array.isArray(schools) && schools.length > 0) {
                const school = schools.find(s => s && s.id === user.schoolId);
                return school ? school.name : null;
            }

            return null;
        } catch (error) {
            console.error('Error in getUserSchoolName:', error);
            return null;
        }
    }

    const statCardClass = useMemo(
        () => cn(
            "w-full min-w-0 cursor-pointer transition-all duration-200 rounded-xl",
            isSmallScreen
                ? "border border-orange-100 bg-white shadow-sm active:scale-[0.99]"
                : "hover:scale-105 hover:shadow-lg"
        ),
        [isSmallScreen]
    );
    const uniqueMasterClassesCount = useMemo(() => getUniqueSchoolsCount(), [masterClasses]);
    const invoicesTotal = invoicesData?.total ?? 0;

    const quickNavigationItems = useMemo<QuickNavigationItem[]>(() => [
        {
            id: 'nav-users',
            label: 'Пользователи',
            description: 'Управление аккаунтами',
            icon: Users,
            tone: 'blue',
            onPress: () => handleTabChange('users'),
            badge: usersTotal ?? users.length,
        },
        {
            id: 'nav-invoices',
            label: 'Счета',
            description: 'Платежи и статусы',
            icon: Receipt,
            tone: 'teal',
            onPress: () => handleTabChange('invoices'),
            badge: invoicesTotal,
        },
        {
            id: 'nav-requests',
            label: 'Заявки',
            description: 'Статусы запросов школ',
            icon: FileText,
            tone: 'purple',
            onPress: () => handleTabChange('workshop-requests'),
            badge: pendingRequestsCount,
        },
        {
            id: 'nav-chat',
            label: 'Чат',
            description: unreadChatsCount > 0 ? 'Есть непрочитанные сообщения' : 'Все сообщения обработаны',
            icon: MessageCircle,
            tone: 'orange',
            onPress: () => handleTabChange('chat'),
            badge: unreadChatsCount > 0 ? unreadChatsCount : null,
        },
    ], [handleTabChange, invoicesTotal, pendingRequestsCount, unreadChatsCount, users.length, usersTotal]);

    const quickActionButtons = useMemo<QuickActionItem[]>(() => [
        {
            id: 'action-add-user',
            label: 'Добавить пользователя',
            icon: UserPlus,
            onPress: () => {
                if (selectedTab !== 'users') {
                    handleTabChange('users');
                }
                setAddUserModalOpen(true);
            },
        },
        {
            id: 'action-add-school',
            label: 'Добавить школу',
            icon: Building2,
            variant: 'outline',
            onPress: () => {
                if (selectedTab !== 'schools') {
                    handleTabChange('schools');
                }
                handleAddSchool();
            },
        },
        {
            id: 'action-add-service',
            label: 'Добавить услугу',
            icon: Wrench,
            variant: 'outline',
            onPress: () => {
                if (selectedTab !== 'services') {
                    handleTabChange('services');
                }
                handleAddService();
            },
        },
    ], [handleAddSchool, handleAddService, handleTabChange, selectedTab]);

    const statCards = useMemo<StatCardDefinition[]>(() => [
        {
            id: 'users',
            element: (
                <Card
                    className={statCardClass}
                    onClick={() => handleTabChange('users')}
                >
                    <CardHeaderCompact className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Пользователи
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeaderCompact>
                    <CardContentCompact>
                        <div className="text-2xl font-bold">{filteredUsers.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Всего пользователей
                        </p>
                    </CardContentCompact>
                </Card>
            ),
        },
        {
            id: 'schools',
            element: (
                <Card
                    className={statCardClass}
                    onClick={() => handleTabChange('schools')}
                >
                    <CardHeaderCompact className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Школы
                        </CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeaderCompact>
                    <CardContentCompact>
                        <div className="text-2xl font-bold">{schoolsTotal}</div>
                        <p className="text-xs text-muted-foreground">
                            Всего школ
                        </p>
                    </CardContentCompact>
                </Card>
            ),
        },
        {
            id: 'services',
            element: (
                <Card
                    className={statCardClass}
                    onClick={() => handleTabChange('services')}
                >
                    <CardHeaderCompact className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Услуги
                        </CardTitle>
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                    </CardHeaderCompact>
                    <CardContentCompact>
                        <div className="text-2xl font-bold">{servicesTotal}</div>
                        <p className="text-xs text-muted-foreground">
                            Всего услуг
                        </p>
                    </CardContentCompact>
                </Card>
            ),
        },
        {
            id: 'master-classes',
            element: (
                <Card
                    className={statCardClass}
                    onClick={() => handleTabChange('master-classes')}
                >
                    <CardHeaderCompact className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Мастер-классы
                        </CardTitle>
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    </CardHeaderCompact>
                    <CardContentCompact>
                        <div className="text-2xl font-bold">{uniqueMasterClassesCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Запланированных мастер-классов
                        </p>
                    </CardContentCompact>
                </Card>
            ),
        },
        {
            id: 'invoices',
            element: (
                <Card
                    className={statCardClass}
                    onClick={() => handleTabChange('invoices')}
                >
                    <CardHeaderCompact className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Счета
                        </CardTitle>
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                    </CardHeaderCompact>
                    <CardContentCompact>
                        {invoicesLoading ? (
                            <div className="text-2xl font-bold text-muted-foreground">...</div>
                        ) : invoicesError ? (
                            <div className="text-2xl font-bold text-red-500">!</div>
                        ) : (
                            <div className="text-2xl font-bold">{invoicesTotal}</div>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Всего счетов
                        </p>
                    </CardContentCompact>
                </Card>
            ),
        },
        {
            id: 'chat',
            element: (
                <Card
                    className={statCardClass}
                    onClick={() => handleTabChange('chat')}
                >
                    <CardHeaderCompact className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Чат
                        </CardTitle>
                        <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeaderCompact>
                    <CardContentCompact>
                        {adminChats && adminChats.length > 0 ? (
                            <div className="flex items-center space-x-2">
                                <div className="text-2xl font-bold text-blue-600">
                                    {adminChats.filter(chat => chat.unreadCount > 0).length > 0 ? '🔔' : '✅'}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {adminChats.filter(chat => chat.unreadCount > 0).length > 0
                                        ? 'Есть непрочитанные'
                                        : 'Все прочитано'
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <div className="text-2xl font-bold text-gray-400">-</div>
                                <p className="text-xs text-muted-foreground">
                                    Нет чатов
                                </p>
                            </div>
                        )}
                    </CardContentCompact>
                </Card>
            ),
        },
        {
            id: 'workshop-requests',
            element: (
                <Card
                    className={statCardClass}
                    onClick={() => handleTabChange('workshop-requests')}
                >
                    <CardHeaderCompact className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Заявки
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div className={`w-2 h-2 rounded-full ${wsRequestsConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        </div>
                    </CardHeaderCompact>
                    <CardContentCompact>
                        <div className="text-2xl font-bold text-blue-600">{workshopRequestsStats.total}</div>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                <span className="text-xs text-yellow-600">{workshopRequestsStats.pending}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-xs text-green-600">{workshopRequestsStats.approved}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <span className="text-xs text-red-600">{workshopRequestsStats.rejected}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-muted-foreground">
                                {wsRequestsConnected ? 'Автообновление' : 'Ручное обновление'}
                            </p>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    loadWorkshopRequestsStats();
                                }}
                                className="h-6 w-6 p-0 hover:bg-blue-100"
                            >
                                <RefreshCw className="h-3 w-3" />
                            </Button>
                        </div>
                    </CardContentCompact>
                </Card>
            ),
        },
    ], [
        adminChats,
        filteredUsers.length,
        handleTabChange,
        invoicesTotal,
        invoicesError,
        invoicesLoading,
        loadWorkshopRequestsStats,
        servicesTotal,
        statCardClass,
        uniqueMasterClassesCount,
        workshopRequestsStats.approved,
        workshopRequestsStats.pending,
        workshopRequestsStats.rejected,
        workshopRequestsStats.total,
        wsRequestsConnected,
        schoolsTotal,
    ]);
    const mobileFabConfig = useMemo(() => {
        if (!isSmallScreen) {
            return null;
        }
        switch (selectedTab) {
            case 'overview':
                return {
                    label: 'Добавить пользователя',
                    icon: <UserPlus className="h-4 w-4" />,
                    onClick: () => {
                        handleTabChange('users');
                        setAddUserModalOpen(true);
                    },
                };
            case 'users':
                return {
                    label: 'Добавить',
                    icon: <UserPlus className="h-4 w-4" />,
                    onClick: () => setAddUserModalOpen(true),
                };
            case 'schools':
                return {
                    label: 'Новая школа',
                    icon: <Building2 className="h-4 w-4" />,
                    onClick: handleAddSchool,
                };
            case 'services':
                return {
                    label: 'Новая услуга',
                    icon: <Wrench className="h-4 w-4" />,
                    onClick: handleAddService,
                };
            default:
                return null;
        }
    }, [isSmallScreen, selectedTab, handleAddSchool, handleAddService, handleTabChange]);

    // Состояния для модальных окон услуг
    const [addServiceModalOpen, setAddServiceModalOpen] = useState(false);
    const [styleOptionModalOpen, setStyleOptionModalOpen] = useState(false);
    const [currentServiceId, setCurrentServiceId] = useState<string | null>(null);
    const [styleOptionType, setStyleOptionType] = useState<'style' | 'option'>('style');
    const [selectedStyleOption, setSelectedStyleOption] = useState<ServiceStyle | ServiceOption | null>(null);
    const tabsListRef = useRef<HTMLDivElement | null>(null);
    const baseTabTriggerClasses =
        "flex items-center justify-center text-center px-2 py-1.5 text-[11px] sm:px-3 sm:py-2 sm:text-xs md:px-3 md:py-2.5 md:text-sm rounded-lg font-medium transition-all duration-200 hover:scale-[1.02] hover:shadow-md data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-[1.04] data-[state=inactive]:bg-white/80 data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:bg-gray-100 min-w-0 flex-1 basis-[5.5rem] sm:basis-[6.5rem] md:basis-[7.5rem] lg:basis-[8.5rem] max-w-[11rem] leading-tight";

    // Состояния для мастер-классов
    const [selectedMasterClassEvent, setSelectedMasterClassEvent] = useState<MasterClassEvent | null>(null);
    const [masterClassDetailsOpen, setMasterClassDetailsOpen] = useState(false);

    // Автоматическое обновление данных при переключении вкладок
    useEffect(() => {
        if (selectedTab === 'users' && users.length === 0) {

            fetchUsers();
        }
    }, [selectedTab, users.length, fetchUsers]);

    useEffect(() => {
        if (selectedTab === 'schools' && schools.length === 0) {
            // Загрузка школ происходит автоматически через useSchools хук
        }
    }, [selectedTab, schools.length]);

    useEffect(() => {
        if (selectedTab === 'services' && services.length === 0) {
            // Загрузка услуг происходит автоматически через useServices хук
        }
    }, [selectedTab, services.length]);

    useEffect(() => {
        if (selectedTab === 'master-classes' && masterClasses.length === 0) {

            fetchMasterClasses();
        }
    }, [selectedTab, masterClasses.length, fetchMasterClasses]);

    // Загружаем статистику заявок при монтировании
    useEffect(() => {
        // console.log('🚀 Dashboard: Компонент смонтирован, проверяем авторизацию...');

        // Проверяем наличие токена авторизации
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            console.error('❌ Dashboard: Токен авторизации отсутствует при монтировании');
            window.location.href = '/admin/login';
            return;
        }

        // console.log('✅ Dashboard: Токен авторизации найден, загружаем статистику заявок...');
        loadWorkshopRequestsStats();

        // Загружаем сервисы для доступа к стилям и опциям
        if (services.length === 0) {
            // console.log('🔄 Dashboard: Загружаем сервисы для мастер-классов...');
            fetchServices();
        }
    }, [fetchServices, services.length]); // Добавляем недостающие зависимости

    // Автоматическое обновление статистики заявок через WebSocket
    useEffect(() => {
        if (wsRequestsConnected) {
            // Подписываемся на обновления заявок только один раз
            wsRequestsSendMessage({
                type: 'subscribe',
                channels: ['admin:workshop_requests', 'workshop_requests:all']
            });

            // console.log('🔌 Dashboard: WebSocket подключен для заявок, подписка активна');
        }
    }, [wsRequestsConnected, wsRequestsSendMessage]);

    // Отладочная информация для мастер-классов (убрано для оптимизации)
    // useEffect(() => {
    //     console.log('Dashboard: Данные мастер-классов:', {
    //         count: masterClasses.length,
    //         data: masterClasses,
    //         loading: masterClassesLoading,
    //         error: masterClassesError
    //     });

    //     // Детальная отладка участников
    //     if (masterClasses.length > 0) {
    //         masterClasses.forEach((mc, index) => {
    //             console.log(`Dashboard: Мастер-класс ${index + 1}:`, {
    //                 id: mc.id,
    //                 date: mc.date,
    //                 schoolName: mc.schoolName,
    //                 classGroup: mc.classGroup,
    //                 participantsCount: mc.participants?.length || 0,
    //                 participants: mc.participants
    //             });

    //             if (mc.participants && mc.participants.length > 0) {
    //                 mc.participants.forEach((participant, pIndex) => {
    //                     console.log(`Dashboard: Участник ${pIndex + 1} в мастер-классе ${index + 1}:`, {
    //                         id: participant.id,
    //                         childName: participant.childName,
    //                         selectedStyles: participant.selectedStyles,
    //                         selectedOptions: participant.selectedOptions,
    //                         totalAmount: participant.totalAmount
    //                     });
    //                 });
    //             }
    //         });
    //     }
    // }, [masterClasses, masterClassesLoading, masterClassesError]);

    // Отладочная информация для школ (убрано для оптимизации)
    // useEffect(() => {
    //     console.log('Dashboard: Данные школ:', {
    //         count: schools.length,
    //         data: schools,
    //         loading: schoolsLoading,
    //         error: schoolsError
    //     });
    //     // Дополнительная отладка для поля teacherPhone
    //     if (schools.length > 0) {
    //         console.log('Dashboard: Пример школы с teacherPhone:', schools[0]);
    //         console.log('Dashboard: Все школы teacherPhone:', schools.map(s => ({ id: s.id, name: s.name, teacherPhone: s.teacherPhone })));
    //     }
    // }, [schools, schoolsLoading, schoolsError]);

    // Отладочная информация для пользователей (убрано для оптимизации)
    // useEffect(() => {
    //     console.log('Dashboard: Данные пользователей:', {
    //         count: users.length,
    //         data: users,
    //         loading: usersLoading,
    //         error: usersError
    //     });
    // }, [users, usersLoading, usersError]);

    // Функции для работы с модальным окном школы
    const handleEditSchool = (school: School) => {
        setSelectedSchool(school);
        setSchoolModalOpen(true);
    };

    const handleCreateService = async (serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            await createService(serviceData);
            toast({
                title: "Успех",
                description: "Услуга успешно создана",
            });
        } catch (error) {
            toast({
                title: "Ошибка",
                description: "Не удалось создать услугу",
                variant: "destructive",
            });
        }
    };

    const handleDeleteService = async (serviceId: string) => {
        try {
            await deleteService(serviceId);
            toast({
                title: "Успех",
                description: "Услуга успешно удалена",
            });
        } catch (error) {
            toast({
                title: "Ошибка",
                description: "Не удалось удалить услугу",
                variant: "destructive",
            });
        }
    };

    const handleAddStyle = (serviceId: string) => {
        setCurrentServiceId(serviceId);
        setStyleOptionType('style');
        setSelectedStyleOption(null);
        setStyleOptionModalOpen(true);
    };

    const handleAddOption = (serviceId: string) => {
        setCurrentServiceId(serviceId);
        setStyleOptionType('option');
        setSelectedStyleOption(null);
        setStyleOptionModalOpen(true);
    };

    const handleViewStyle = (style: ServiceStyle, serviceId: string) => {

        setCurrentServiceId(serviceId);
        setSelectedStyleOption(style);
        setStyleOptionType('style');
        setStyleOptionModalOpen(true);
    };

    const handleViewOption = (option: ServiceOption, serviceId: string) => {

        setCurrentServiceId(serviceId);
        setSelectedStyleOption(option);
        setStyleOptionType('option');
        setStyleOptionModalOpen(true);
    };

    const handleDeleteStyle = async (styleId: string, serviceId: string) => {
        try {

            const response = await fetch(`${import.meta.env.VITE_API_URL}/services/${serviceId}/styles/${styleId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Не удалось удалить стиль');
            }

            toast({
                title: "Стиль удален",
                description: "Стиль успешно удален из услуги",
            });

            // Обновляем данные через fetchServices
            await fetchServices();
        } catch (error) {
            console.error('Ошибка при удалении стиля:', error);
            toast({
                title: "Ошибка",
                description: error instanceof Error ? error.message : "Не удалось удалить стиль",
                variant: "destructive"
            });
        }
    };

    const handleDeleteOption = async (optionId: string, serviceId: string) => {
        try {

            const response = await fetch(`${import.meta.env.VITE_API_URL}/services/${serviceId}/options/${optionId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Не удалось удалить опцию');
            }

            toast({
                title: "Опция удалена",
                description: "Опция успешно удалена из услуги",
            });

            // Обновляем данные через fetchServices
            await fetchServices();
        } catch (error) {
            console.error('Ошибка при удалении опции:', error);
            toast({
                title: "Ошибка",
                description: error instanceof Error ? error.message : "Не удалось удалить опцию",
                variant: "destructive"
            });
        }
    };

    const handleCreateStyleOption = async (data: Omit<ServiceStyle | ServiceOption, 'id'>) => {
        if (!currentServiceId) return;

        try {
            if (styleOptionType === 'style') {
                if (selectedStyleOption) {

                    await updateServiceStyle(currentServiceId, selectedStyleOption.id, data);
                } else {

                    await addStyleToService(currentServiceId, data);
                }
            } else {
                if (selectedStyleOption) {

                    await updateServiceOption(currentServiceId, selectedStyleOption.id, data);
                } else {

                    await addOptionToService(currentServiceId, data);
                }
            }

            // Закрываем модальное окно и очищаем состояния
            setStyleOptionModalOpen(false);
            setCurrentServiceId(null);
            setSelectedStyleOption(null);

            toast({
                title: "Успех",
                description: `${styleOptionType === 'style' ? 'Стиль' : 'Опция'} успешно ${selectedStyleOption ? 'обновлен' : 'добавлен'}`,
            });
        } catch (error) {
            console.error('Dashboard: error in handleCreateStyleOption:', error);
            toast({
                title: "Ошибка",
                description: `Не удалось ${selectedStyleOption ? 'обновить' : 'добавить'} ${styleOptionType === 'style' ? 'стиль' : 'опцию'}`,
                variant: "destructive",
            });
        }
    };

    const handleSchoolSubmit = async (schoolData: Omit<School, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            if (selectedSchool) {
                await updateSchool(selectedSchool.id, schoolData);
                toast({
                    title: "Школа обновлена",
                    description: "Школа успешно обновлена в системе.",
                });
            } else {
                await createSchool(schoolData);
                toast({
                    title: "Школа добавлена",
                    description: "Новая школа успешно добавлена в систему.",
                });
            }
            setSchoolModalOpen(false);
            setSelectedSchool(null);
        } catch (error) {
            toast({
                title: "Ошибка",
                description: "Не удалось сохранить школу. Попробуйте еще раз.",
                variant: "destructive",
            });
        }
    };

    const handleSchoolFiltersChange = (filters: { city: string; school: string; class: string }) => {
        updateFilters('schools', filters);
    };

    // Функции удаления
    const handleDeleteUser = async (userId: string) => {
        try {
            await deleteUser(userId);
            toast({
                title: "Пользователь удален",
                description: "Пользователь успешно удален из системы",
            });
        } catch (error) {
            toast({
                title: "Ошибка",
                description: "Не удалось удалить пользователя",
                variant: "destructive",
            });
        }
    };

    const handleDeleteSchool = async (schoolId: string) => {
        try {
            await deleteSchool(schoolId);

            // Принудительно обновляем ВСЕ данные после удаления школы

            // Обновляем список школ
            await fetchSchools();

            // Обновляем список мастер-классов
            await fetchMasterClasses({ forceRefresh: true });

            // Дополнительное обновление через небольшую задержку
            setTimeout(async () => {

                await fetchMasterClasses({ forceRefresh: true });
            }, 500);

            // Отправляем WebSocket уведомление об удалении школы
            if (masterClassesWsConnected) {

                sendMasterClassMessage('master_class_deleted', {
                    schoolId: schoolId,
                    message: 'Школа удалена, обновляем список мастер-классов'
                });
            }

            toast({
                title: "Школа удалена",
                description: "Школа и все связанные мастер-классы успешно удалены из системы",
            });
        } catch (error) {
            console.error('❌ Ошибка при удалении школы:', error);
            toast({
                title: "Ошибка",
                description: "Не удалось удалить школу",
                variant: "destructive",
            });
        }
    };

    const handleDeleteMasterClass = async (masterClassId: string) => {
        try {
            await deleteMasterClass(masterClassId);
            toast({
                title: "Мастер-класс удален",
                description: "Мастер-класс успешно удален из системы",
            });

            // Принудительно обновляем список мастер-классов
            await fetchMasterClasses();
        } catch (error) {
            toast({
                title: "Ошибка",
                description: "Не удалось удалить мастер-класс",
                variant: "destructive",
            });
        }
    };

    const handleDeleteSchoolMasterClasses = async (schoolId: string, date: string) => {
        try {

            // Получаем все мастер-классы школы за указанную дату
            const schoolMasterClasses = masterClasses.filter(mc =>
                mc.schoolId === schoolId && mc.date === date
            );

            if (schoolMasterClasses.length === 0) {
                toast({
                    title: "Предупреждение",
                    description: "Нет мастер-классов для удаления",
                    variant: "destructive",
                });
                return;
            }

            // Удаляем все мастер-классы школы за дату

            await api.masterClassEvents.deleteSchoolMasterClasses(schoolId, date);

            toast({
                title: "Мастер-классы удалены",
                description: `Удалено ${schoolMasterClasses.length} мастер-классов школы за ${new Date(date).toLocaleDateString('ru-RU')}`,
            });

            // Принудительно обновляем список мастер-классов

            await fetchMasterClasses();

        } catch (error) {
            console.error('❌ Ошибка при удалении мастер-классов школы:', error);
            toast({
                title: "Ошибка",
                description: `Не удалось удалить мастер-классы школы: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
                variant: "destructive",
            });
        }
    };

    // Функции для чата
    const getChatUnreadCount = (chat: Chat) => {
        return chat.unreadCount || 0;
    };

    const formatChatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleString('ru-RU', {
            timeZone: 'Asia/Vladivostok',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleAdminChatStatusUpdate = async (chatId: string, status: 'active' | 'closed' | 'pending') => {
        setIsUpdatingAdminChatStatus(true);
        try {
            await adminUpdateChatStatus(chatId, status);
            toast({
                title: "Статус обновлен",
                description: "Статус чата успешно обновлен.",
            });
        } catch (error) {
            console.error('Ошибка обновления статуса чата:', error);
            toast({
                title: "Ошибка",
                description: "Не удалось обновить статус чата.",
                variant: "destructive",
            });
        } finally {
            setIsUpdatingAdminChatStatus(false);
        }
    };

    const handleAdminSendMessage = async (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!adminMessage.trim() || !selectedAdminChat?.id) return;

        setIsSendingAdminMessage(true);
        try {
            await adminSendMessage(adminMessage.trim());
            setAdminMessage('');
            toast({
                title: "Сообщение отправлено",
                description: "Сообщение успешно отправлено.",
            });
        } catch (error) {
            console.error('Ошибка отправки сообщения:', error);
            toast({
                title: "Ошибка",
                description: "Не удалось отправить сообщение.",
                variant: "destructive",
            });
        } finally {
            setIsSendingAdminMessage(false);
        }
    };

    // Обработчики для мастер-классов (событий)
    const handleAddMasterClassEvent = async (masterClassEvent: Omit<MasterClassEvent, 'id' | 'createdAt' | 'updatedAt' | 'participants' | 'statistics'>) => {
        try {
            await createMasterClass({ ...masterClassEvent });
            toast({ title: 'Мастер-класс создан', description: 'Событие сохранено' });

            // Принудительно обновляем список мастер-классов
            await fetchMasterClasses({ forceRefresh: true });

            // Дополнительное обновление через небольшую задержку
            setTimeout(async () => {
                await fetchMasterClasses({ forceRefresh: true });
            }, 500);
        } catch {
            toast({ title: 'Ошибка', description: 'Не удалось создать событие', variant: 'destructive' });
        }
    };

    const handleEditMasterClassEvent = async (id: string, updates: Partial<MasterClassEvent>) => {
        try {
            await updateMasterClass(id, { ...updates });

            // Обновляем локальное состояние выбранного мастер-класса
            if (selectedMasterClassEvent && selectedMasterClassEvent.id === id) {
                setSelectedMasterClassEvent(prev => prev ? { ...prev, ...updates } : null);
            }

            // Обновляем список мастер-классов с сервера
            await fetchMasterClasses();

            toast({ title: 'Мастер-класс обновлен', description: 'Изменения сохранены' });
        } catch {
            toast({ title: 'Ошибка', description: 'Не удалось сохранить изменения', variant: 'destructive' });
        }
    };

    const handleViewMasterClassEvent = async (masterClassEvent: MasterClassEvent) => {
        try {
            // Загружаем свежие данные мастер-класса с сервера
            const freshMasterClassData = await getMasterClassById(masterClassEvent.id);
            setSelectedMasterClassEvent(freshMasterClassData);
            setMasterClassDetailsOpen(true);
        } catch (error) {
            console.error('Error loading master class details:', error);
            // Fallback на данные из списка, если не удалось загрузить свежие данные
            setSelectedMasterClassEvent(masterClassEvent);
            setMasterClassDetailsOpen(true);
        }
    };

    const handleRefreshMasterClasses = async () => {
        try {

            await fetchMasterClasses({ forceRefresh: true });
            // Также обновляем список школ для синхронизации данных об оплате
            await fetchSchools();
            toast({
                title: "Данные обновлены",
                description: "Список мастер-классов успешно обновлен",
            });
        } catch (error) {
            console.error('❌ Ошибка при обновлении мастер-классов:', error);
            toast({
                title: "Ошибка",
                description: "Не удалось обновить список мастер-классов",
                variant: "destructive",
            });
        }
    };

    const handleUpdateParticipant = (participantId: string, updates: Partial<MasterClassParticipant>) => {
        if (!selectedMasterClassEvent) return;

        const updatedEvent = {
            ...selectedMasterClassEvent,
            participants: (selectedMasterClassEvent.participants || []).map(p =>
                p.id === participantId ? { ...p, ...updates } : p
            )
        };

        // Пересчитываем статистику
        const totalParticipants = updatedEvent.participants.length;
        const totalAmount = updatedEvent.participants.reduce((sum, p) => sum + p.totalAmount, 0);
        const paidAmount = updatedEvent.participants.filter(p => p.isPaid).reduce((sum, p) => sum + p.totalAmount, 0);
        const unpaidAmount = totalAmount - paidAmount;

        updatedEvent.statistics = {
            ...updatedEvent.statistics,
            totalParticipants,
            totalAmount,
            paidAmount,
            unpaidAmount
        };

        setSelectedMasterClassEvent(updatedEvent);
        handleEditMasterClassEvent(updatedEvent.id, { participants: updatedEvent.participants, statistics: updatedEvent.statistics });
    };


    // Переключение раскрытия строки ребенка
    const toggleChildRow = (userId: string) => {
        setExpandedChildRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(userId)) {
                newSet.delete(userId);
            } else {
                newSet.add(userId);
            }
            return newSet;
        });
    };

    // Получение школы ребенка для родителя
    const getChildSchoolName = (user: User) => {
        if (user.role !== 'parent' || !user.children || user.children.length === 0) {
            return null;
        }
        return getUserSchoolName(user.children[0]);
    };

    // Получение родителя для ребенка
    const getParentForChild = (childUser: User) => {
        if (childUser.role !== 'child') {
            return null;
        }
        return childUser.parent || null;
    };

    // Подсчет уникальных школ в мастер-классах
    function getUniqueSchoolsCount() {
        try {
            if (!masterClasses || masterClasses.length === 0) return 0;

            // Группируем мастер-классы по школам и датам (как в MasterClassesTab)
            const grouped = masterClasses.reduce((acc, masterClass) => {
                const dateStr = new Date(masterClass.date).toISOString().split('T')[0];
                const groupKey = `${masterClass.schoolId}_${dateStr}`;

                if (!acc[groupKey]) {
                    acc[groupKey] = {
                        schoolId: masterClass.schoolId,
                        date: dateStr,
                        masterClasses: []
                    };
                }
                acc[groupKey].masterClasses.push(masterClass);
                return acc;
            }, {} as Record<string, { schoolId: string; date: string; masterClasses: MasterClassEvent[] }>);

            return Object.keys(grouped).length;
        } catch (error) {
            console.error('Error counting unique schools:', error);
            return 0;
        }
    }


    // Получение роли пользователя для отображения иконки
    function getRoleIcon(role: string) {
        switch (role) {
            case 'admin':
                return <Users className="w-4 h-4" />;
            case 'parent':
                return <Users className="w-4 h-4" />;
            case 'child':
                return <GraduationCap className="w-4 h-4" />;
            case 'executor':
                return <Wrench className="w-4 h-4" />;
            default:
                return <Users className="w-4 h-4" />;
        }
    }

    // Получение цвета роли для Badge
    function getRoleColor(role: string) {
        switch (role) {
            case 'admin':
                return 'bg-red-100 text-red-800';
            case 'parent':
                return 'bg-blue-100 text-blue-800';
            case 'child':
                return 'bg-green-100 text-green-800';
            case 'executor':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    useEffect(() => {
        const storedTab = localStorage.getItem('adminLastTab');
        if (storedTab && tabs.includes(storedTab as AdminTab)) {
            setSelectedTab(storedTab as AdminTab);
        }
    }, []);

    useEffect(() => {
        if (!selectedMasterClassEvent) {
            return;
        }

        const latest = masterClasses.find(mc => mc.id === selectedMasterClassEvent.id);
        if (!latest) {
            return;
        }

        if (latest.updatedAt !== selectedMasterClassEvent.updatedAt) {
            setSelectedMasterClassEvent({
                ...latest,
                executors: latest.executors
            });
        }
    }, [masterClasses, selectedMasterClassEvent]);

    useEffect(() => {
        const tabsElement = tabsListRef.current;
        if (!tabsElement) {
            return undefined;
        }

        let isDragging = false;
        let startX = 0;
        let scrollLeft = 0;

        const handleMouseDown = (event: MouseEvent) => {
            isDragging = true;
            tabsElement.classList.add('cursor-grabbing');
            startX = event.pageX - tabsElement.offsetLeft;
            scrollLeft = tabsElement.scrollLeft;
        };

        const handleMouseLeave = () => {
            isDragging = false;
            tabsElement.classList.remove('cursor-grabbing');
        };

        const handleMouseUp = () => {
            isDragging = false;
            tabsElement.classList.remove('cursor-grabbing');
        };

        const handleMouseMove = (event: MouseEvent) => {
            if (!isDragging) {
                return;
            }
            event.preventDefault();
            const x = event.pageX - tabsElement.offsetLeft;
            const walk = (x - startX) * 1.2;
            tabsElement.scrollLeft = scrollLeft - walk;
        };

        tabsElement.addEventListener('mousedown', handleMouseDown);
        tabsElement.addEventListener('mouseleave', handleMouseLeave);
        tabsElement.addEventListener('mouseup', handleMouseUp);
        tabsElement.addEventListener('mousemove', handleMouseMove);

        return () => {
            tabsElement.removeEventListener('mousedown', handleMouseDown);
            tabsElement.removeEventListener('mouseleave', handleMouseLeave);
            tabsElement.removeEventListener('mouseup', handleMouseUp);
            tabsElement.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    if (!user || user.role !== 'admin') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="w-96">
                    <CardHeader>
                        <CardTitle>Доступ запрещен</CardTitle>
                        <CardDescription>
                            У вас нет прав для доступа к админ-панели
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={logout} className="w-full">
                            Выйти
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="w-full max-w-none px-8 py-6 relative bg-gradient-wax-hands min-h-screen">
            {/* Логотип на заднем плане всего экрана 
            <div
                className="fixed inset-0 opacity-10 pointer-events-none z-0"
                style={{
                    backgroundImage: `url(${logoImage})`,
                    backgroundSize: selectedTab === 'overview' ? '35%' : '15%',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: selectedTab === 'overview' ? 'center 75%' : 'left top',
                    left: selectedTab === 'overview' ? '30%' : '2rem',
                    top: selectedTab === 'overview' ? '30%' : '2rem',
                    transform: selectedTab === 'overview' ? 'translate(-50%, -50%)' : 'none'
                }}
            />*/}

            <MobileAppBar
                title="Админ-панель"
                subtitle="Wax Hands"
                notificationsBadge={mobileNotifications > 0 ? mobileNotifications : undefined}
                actions={[
                    {
                        key: 'logout',
                        icon: <LogOut className="h-5 w-5 text-orange-500" />,
                        onClick: logout,
                        label: 'Выйти',
                    },
                ]}
            />

            <MobileAdminDrawer
                items={mobileNavigationItems}
                description="Быстрая навигация по разделам"
                footer={(
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 text-red-600 hover:text-red-700"
                        onClick={logout}
                    >
                        <LogOut className="h-4 w-4" />
                        Выйти
                    </Button>
                )}
            />

            <div className="relative z-10">
                {/* Фиксированный заголовок и навигация */}
                {!isSmallScreen && (
                <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-lg -mx-6 px-6 py-4">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 bg-clip-text text-transparent">
                                Админ-панель
                            </h1>
                            <p className="text-muted-foreground text-lg">
                                Управление системой Wax Hands
                            </p>
                        </div>
                        <Button onClick={logout} variant="outline" className="px-6 py-2 text-base">
                            Выйти
                        </Button>
                    </div>

                    {/* Стильные объемные вкладки */}
                    <Tabs value={selectedTab} onValueChange={handleTabChange} className="space-y-0">
                        <TabsList
                            ref={tabsListRef}
                            className="flex w-full overflow-x-auto md:overflow-visible gap-1 sm:gap-1.5 md:gap-2 p-1.5 sm:p-2 bg-transparent rounded-xl scrollbar-hide flex-nowrap md:flex-nowrap cursor-grab select-none md:justify-center"
                        >
                            {navigationTabs.map((tab) => (
                                <TabsTrigger
                                    key={tab.id}
                                    value={tab.id}
                                    className={cn(
                                        baseTabTriggerClasses,
                                        'data-[state=active]:bg-gradient-to-r',
                                        tab.activeClass,
                                        tab.animate && 'animate-pulse-glow'
                                    )}
                                >
                                    <span className="flex items-center justify-center w-full">
                                        <span className="mr-1">{tab.emoji}</span>
                                        <span>{tab.label}</span>
                                    </span>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>
                )}

                {/* Основной контент с увеличенным отступом сверху */}
                <div className={cn(isSmallScreen ? 'pt-4' : 'pt-12')}>
                    <Tabs value={selectedTab} onValueChange={handleTabChange} className="space-y-4">
                        <TabsContent value="overview" className="space-y-4 relative">
                            <StatCardSection
                                title="Ключевые показатели"
                                subtitle="Быстрый обзор состояния платформы"
                                isSmallScreen={isSmallScreen}
                                cards={statCards}
                                statsExpanded={statsExpanded}
                                onToggle={() => setStatsExpanded(prev => !prev)}
                            />

                            {isSmallScreen && quickNavigationItems.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="px-1 text-sm font-semibold text-gray-600">Быстрые ссылки</h3>
                                    <div className="-mx-2 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
                                        {quickNavigationItems.map((item) => {
                                            const tone = QUICK_LINK_TONE_STYLES[item.tone];
                                            const showBadge = item.badge !== null && item.badge !== undefined && item.badge !== 0;
                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={item.onPress}
                                                    className={cn(
                                                        "min-w-[220px] snap-start rounded-2xl p-4 text-left shadow-sm transition-transform duration-150 active:scale-[0.98]",
                                                        tone.container
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className={cn("flex h-10 w-10 items-center justify-center rounded-full", tone.icon)}>
                                                            <item.icon className="h-5 w-5" />
                                                        </span>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                                                            <p className="text-xs text-gray-600">{item.description}</p>
                                                        </div>
                                                        <ChevronRight className="h-4 w-4 text-gray-400" />
                                                    </div>
                                                    {showBadge && (
                                                        <span className={cn("mt-3 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", tone.badge)}>
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {isSmallScreen && quickActionButtons.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="px-1 text-sm font-semibold text-gray-600">Быстрые действия</h3>
                                    <div className="flex flex-col gap-2">
                                        {quickActionButtons.map((action) => (
                                            <Button
                                                key={action.id}
                                                type="button"
                                                variant={action.variant ?? 'default'}
                                                onClick={action.onPress}
                                                className={cn(
                                                    "w-full justify-between rounded-xl py-5 px-4 text-sm font-semibold",
                                                    action.variant === 'outline'
                                                        ? "bg-white text-gray-900 border-orange-100"
                                                        : "shadow-md"
                                                )}
                                            >
                                                <span className="flex items-center gap-3">
                                                    <action.icon className="h-5 w-5 text-orange-500" />
                                                    {action.label}
                                                </span>
                                                <ChevronRight className="h-4 w-4 text-gray-400" />
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Настройки лендинга */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Настройки лендинга</CardTitle>
                                    <CardDescription>
                                        Управление доступом к регистрации и входу с главной страницы
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="landing-registration" className="text-base">
                                                Регистрация и вход на лендинге
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                {registrationEnabled 
                                                    ? 'Пользователи могут регистрироваться и входить в приложение с лендинга'
                                                    : 'Кнопки регистрации и входа скрыты на лендинге'}
                                            </p>
                                        </div>
                                        <Switch
                                            id="landing-registration"
                                            checked={registrationEnabled}
                                            disabled={landingSettingsLoading || landingSettingsUpdating}
                                            onCheckedChange={async (checked) => {
                                                try {
                                                    await toggleRegistration(checked);
                                                    toast({
                                                        title: checked ? 'Регистрация включена' : 'Регистрация отключена',
                                                        description: checked 
                                                            ? 'Пользователи теперь могут регистрироваться и входить с лендинга'
                                                            : 'Кнопки регистрации и входа скрыты на лендинге',
                                                    });
                                                } catch (error) {
                                                    toast({
                                                        title: 'Ошибка',
                                                        description: 'Не удалось обновить настройки',
                                                        variant: 'destructive',
                                                    });
                                                }
                                            }}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="users" className="space-y-4">
                            <div className={cn(
                                "flex justify-between items-center gap-3",
                                isSmallScreen && "flex-col items-stretch"
                            )}>
                                <div className={cn("relative", isSmallScreen && "w-full")}>
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Поиск пользователей..."
                                        value={usersSearchTerm}
                                        onChange={(e) => setUsersSearchTerm(e.target.value)}
                                        className={cn("pl-8", isSmallScreen && "w-full")}
                                    />
                                </div>
                                <div className={cn("flex gap-2", isSmallScreen && "w-full flex-col")}>
                                    <Button
                                        variant="outline"
                                        onClick={() => {

                                            fetchUsers();
                                        }}
                                        disabled={usersLoading}
                                        className={cn(isSmallScreen && "w-full justify-center")}
                                    >
                                        {usersLoading ? 'Обновление...' : '🔄 Обновить'}
                                    </Button>
                                    {user?.name === 'Admin' && (
                                        <Button
                                            className={cn("bg-blue-600 hover:bg-blue-700", isSmallScreen && "w-full justify-center")}
                                            onClick={() => setAddUserModalOpen(true)}
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            👤 Добавить пользователя
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Карточка фильтров пользователей */}
                            <Card className={cn(isSmallScreen && 'hidden')}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Filter className="h-5 w-5" />
                                        Фильтры пользователей
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <UsersFilterFields
                                        users={users}
                                        schools={schools}
                                        userFilters={userFilters}
                                        updateFilters={updateFilters}
                                        getUserSchoolName={getUserSchoolName}
                                        showResetButton
                                    />
                                </CardContent>
                            </Card>

                            {isSmallScreen && (
                                <>
                                    <div className="flex items-center justify-between">
                                        <Button
                                            variant="outline"
                                            className="flex items-center gap-2"
                                            onClick={() => setUserFiltersDrawerOpen(true)}
                                        >
                                            <Filter className="h-4 w-4" />
                                            Фильтры
                                        </Button>
                                        <FilterChips
                                            chips={userFilterChips}
                                            onClearAll={userFilterChips.length > 0 ? () => updateFilters('users', { role: 'all', school: 'all', class: 'all' }) : undefined}
                                        />
                                    </div>
                                    <FilterDrawer
                                        open={isUserFiltersDrawerOpen}
                                        onOpenChange={setUserFiltersDrawerOpen}
                                        title="Фильтры пользователей"
                                        onApply={() => setUserFiltersDrawerOpen(false)}
                                        onReset={() => updateFilters('users', { role: 'all', school: 'all', class: 'all' })}
                                    >
                                        <UsersFilterFields
                                            users={users}
                                            schools={schools}
                                            userFilters={userFilters}
                                            updateFilters={updateFilters}
                                            getUserSchoolName={getUserSchoolName}
                                            showResetButton={false}
                                        />
                                    </FilterDrawer>
                                </>
                            )}

                            {!isSmallScreen && userFilterChips.length > 0 && (
                                <FilterChips
                                    chips={userFilterChips}
                                    onClearAll={() => updateFilters('users', { role: 'all', school: 'all', class: 'all' })}
                                    className="mt-2"
                                />
                            )}

                            <Card>
                                <CardHeader>
                                    <CardTitle>Пользователи ({filteredUsers.length})</CardTitle>
                                    <CardDescription>
                                        Управление пользователями системы
                                        {usersLastFetch && (
                                            <span className="block text-xs text-muted-foreground mt-1">
                                                Последнее обновление: {usersLastFetch.toLocaleTimeString()}
                                            </span>
                                        )}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {usersLoading ? (
                                        <div className="py-4 text-center">Загрузка...</div>
                                    ) : usersError ? (
                                        <div className="py-4 text-center text-red-500">{usersError}</div>
                                    ) : filteredUsers.length === 0 ? (
                                        <div className="py-4 text-center text-gray-500">
                                            Нет пользователей для отображения. Попробуйте изменить фильтры или поисковый запрос.
                                        </div>
                                    ) : isSmallScreen ? (
                                        <SelectionManagerProvider>
                                            <UsersMobileList
                                                filteredUsers={filteredUsers}
                                                isLoading={usersLoading}
                                                error={usersError}
                                                getParentForChild={getParentForChild}
                                                getChildSchoolName={getChildSchoolName}
                                                onDeleteUser={handleDeleteUser}
                                            />
                                        </SelectionManagerProvider>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Пользователь</TableHead>
                                                    <TableHead>Роль</TableHead>
                                                    <TableHead>Контакт</TableHead>
                                                    <TableHead>Школа/Садик</TableHead>
                                                    <TableHead>Класс/Группа</TableHead>
                                                    <TableHead>Действия</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredUsers.map((user) => {
                                                    const isExpanded = expandedChildRows.has(user.id);
                                                    const parent = getParentForChild(user);
                                                    const childSchool = getChildSchoolName(user);

                                                    return (
                                                        <React.Fragment key={user.id}>
                                                            <TableRow>
                                                                <TableCell>
                                                                    <div className="flex items-center space-x-2">
                                                                        {user.role === 'child' && parent && (
                                                                            <Button
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                onClick={() => toggleChildRow(user.id)}
                                                                                className="h-6 w-6 p-0"
                                                                            >
                                                                                {isExpanded ? (
                                                                                    <ChevronUp className="h-4 w-4" />
                                                                                ) : (
                                                                                    <ChevronDown className="h-4 w-4" />
                                                                                )}
                                                                            </Button>
                                                                        )}
                                                                        {getRoleIcon(user.role)}
                                                                        <div>
                                                                            <div className="font-medium">
                                                                                {user.name} {user.surname}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge className={getRoleColor(user.role)}>
                                                                        {user.role}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell>
                                                                    {user.phone || user.email || '-'}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {user.role === 'parent' && childSchool ? (
                                                                        <div>
                                                                            <span className="text-xs text-muted-foreground">Школа ребенка: </span>
                                                                            {childSchool}
                                                                        </div>
                                                                    ) : (
                                                                        getUserSchoolName(user) || '-'
                                                                    )}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {user.class || '-'}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex space-x-2">
                                                                        <AlertDialog>
                                                                            <AlertDialogTrigger asChild>
                                                                                <Button size="sm" variant="outline" className="text-red-600">
                                                                                    <Trash2 className="w-4 h-4" />
                                                                                </Button>
                                                                            </AlertDialogTrigger>
                                                                            <AlertDialogContent>
                                                                                <AlertDialogHeader>
                                                                                    <AlertDialogTitle>Удалить пользователя?</AlertDialogTitle>
                                                                                    <AlertDialogDescription>
                                                                                        Это действие нельзя отменить. Пользователь будет удален навсегда.
                                                                                    </AlertDialogDescription>
                                                                                </AlertDialogHeader>
                                                                                <AlertDialogFooter>
                                                                                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                                                                                    <AlertDialogAction
                                                                                        onClick={() => handleDeleteUser(user.id)}
                                                                                        className="bg-red-600 hover:bg-red-700"
                                                                                    >
                                                                                        Удалить
                                                                                    </AlertDialogAction>
                                                                                </AlertDialogFooter>
                                                                            </AlertDialogContent>
                                                                        </AlertDialog>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>

                                                            {user.role === 'child' && parent && isExpanded && (
                                                                <TableRow className="bg-muted/50">
                                                                    <TableCell colSpan={6} className="py-2">
                                                                        <div className="ml-8 flex items-center space-x-4 text-sm">
                                                                            <div className="flex items-center space-x-2">
                                                                                {getRoleIcon(parent.role)}
                                                                                <span className="font-medium text-muted-foreground">Родитель:</span>
                                                                                <span>{parent.name} {parent.surname}</span>
                                                                            </div>
                                                                            <div className="flex items-center space-x-2">
                                                                                <span className="text-muted-foreground">Контакт:</span>
                                                                                <span>{parent.phone || parent.email || '-'}</span>
                                                                            </div>
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="schools" className="space-y-4">

                            <div className="flex justify-between items-center">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Поиск школ..."
                                        value={schoolsSearchTerm}
                                        onChange={(e) => setSchoolsSearchTerm(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                                <Button onClick={handleAddSchool} className="bg-green-600 hover:bg-green-700">
                                    <Plus className="w-4 h-4 mr-2" />
                                    🏫 Добавить школу
                                </Button>
                            </div>

                            {/* Фильтры школ */}
                            {schools.length > 0 && (
                                <SchoolFilters
                                    schools={schools}
                                    onFiltersChange={handleSchoolFiltersChange}
                                />
                            )}

                            <Card>
                                <CardHeader>
                                    <CardTitle>Школы ({filteredSchools.length} из {schools.length})</CardTitle>
                                    <CardDescription>
                                        Управление школами в системе
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {schoolsLoading ? (
                                        <div className="py-4 text-center">Загрузка...</div>
                                    ) : schoolsError ? (
                                        <div className="py-4 text-center text-red-500">{schoolsError}</div>
                                    ) : filteredSchools.length === 0 ? (
                                        <div className="py-4 text-center text-gray-500">
                                            Нет школ для отображения. Попробуйте изменить фильтры или поисковый запрос.
                                        </div>
                                    ) : isSmallScreen ? (
                                        <ResponsiveList
                                            items={filteredSchools}
                                            keyExtractor={(item) => item.id}
                                            renderItem={(school) => (
                                                <SchoolCard
                                                    school={school}
                                                    onEdit={handleEditSchool}
                                                    onDelete={(target) => handleDeleteSchool(target.id)}
                                                />
                                            )}
                                        />
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Название</TableHead>
                                                    <TableHead>Адрес</TableHead>
                                                    <TableHead>Контактное лицо</TableHead>
                                                    <TableHead>Телефон</TableHead>
                                                    <TableHead>Классы/группы</TableHead>
                                                    <TableHead>Примечания</TableHead>
                                                    <TableHead>Действия</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredSchools.map((school) => (
                                                    <TableRow key={school.id}>
                                                        <TableCell className="font-medium">
                                                            {school.name}
                                                        </TableCell>
                                                        <TableCell>{school.address}</TableCell>
                                                        <TableCell>{school.teacher || '-'}</TableCell>
                                                        <TableCell>{school.teacherPhone || '-'}</TableCell>
                                                        <TableCell>
                                                            {school.classes.length > 0 ? school.classes.join(', ') : '-'}
                                                        </TableCell>
                                                        <TableCell>{school.notes || '-'}</TableCell>
                                                        <TableCell>
                                                            <div className="flex space-x-2">
                                                                <Button size="sm" variant="outline" onClick={() => handleEditSchool(school)}>
                                                                    <Edit className="w-4 h-4" />
                                                                </Button>
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button size="sm" variant="outline" className="text-red-600">
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>Удалить школу?</AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                Это действие нельзя отменить. Школа будет удалена навсегда.
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                                                                            <AlertDialogAction
                                                                                onClick={() => handleDeleteSchool(school.id)}
                                                                                className="bg-red-600 hover:bg-red-700"
                                                                            >
                                                                                Удалить
                                                                            </AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="services" className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Поиск услуг..."
                                        value={servicesSearchTerm}
                                        onChange={(e) => updateFilters('services', { search: e.target.value })}
                                        className="pl-8"
                                    />
                                </div>
                                <Button onClick={handleAddService}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Добавить услугу
                                </Button>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Услуги</CardTitle>
                                    <CardDescription>
                                        Управление услугами в системе
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {servicesLoading ? (
                                        <div className="text-center py-4">Загрузка...</div>
                                    ) : servicesError ? (
                                        <div className="text-center py-4 text-red-500">{servicesError}</div>
                                    ) : filteredServices.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Wrench className="mx-auto h-12 w-12 mb-4 opacity-50" />
                                            <p>Услуги не найдены</p>
                                            <Button onClick={handleAddService} className="mt-4">
                                                <Plus className="w-4 h-4 mr-2" />
                                                Добавить первую услугу
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-4">
                                            {(filteredServices || []).map((service) => (
                                                <div key={service.id} className="w-full">
                                                    <ServiceCard
                                                        service={service}
                                                        onAddStyle={handleAddStyle}
                                                        onAddOption={handleAddOption}
                                                        onViewStyle={handleViewStyle}
                                                        onViewOption={handleViewOption}
                                                        onDeleteStyle={handleDeleteStyle}
                                                        onDeleteOption={handleDeleteOption}
                                                        onReorderStyles={(serviceId, order) => reorderServiceStyles(serviceId, order)}
                                                        onReorderOptions={(serviceId, order) => reorderServiceOptions(serviceId, order)}
                                                        onDelete={handleDeleteService}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="master-classes" className="space-y-4">
                            <MasterClassesTab
                                services={services}
                                schools={schools}
                                masterClasses={masterClasses}
                                onAddMasterClass={handleAddMasterClassEvent}
                                onEditMasterClass={handleEditMasterClassEvent}
                                onViewMasterClass={handleViewMasterClassEvent}
                                onDeleteMasterClass={handleDeleteMasterClass}
                                onDeleteSchoolMasterClasses={handleDeleteSchoolMasterClasses}
                                onRefreshMasterClasses={handleRefreshMasterClasses}
                                filters={filters.masterClasses}
                                onFiltersChange={(newFilters) => updateFilters('masterClasses', newFilters)}
                            />
                        </TabsContent>

                        <TabsContent value="invoices" className="space-y-4">
                            <InvoicesTab
                                filters={filters.invoices}
                                onFiltersChange={(newFilters) => updateFilters('invoices', newFilters)}
                            />
                        </TabsContent>

                        <TabsContent value="refunds" className="space-y-4">
                            <RefundsTab />
                        </TabsContent>

                        <TabsContent value="workshop-requests" className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold">Заявки на проведение мастер-классов</h2>
                            </div>
                            <WorkshopRequestsTab
                                filters={filters.workshopRequests}
                                onFiltersChange={(newFilters) => updateFilters('workshopRequests', newFilters)}
                            />
                        </TabsContent>

                        <TabsContent value="about" className="space-y-4">
                            <AboutTab />
                        </TabsContent>

                        <TabsContent value="offers" className="space-y-4">
                            <OffersTab />
                        </TabsContent>


                        <TabsContent value="contacts" className="space-y-4">
                            <ContactsTab />
                        </TabsContent>

                        <TabsContent value="bonuses" className="space-y-4">
                            <BonusesTab />
                        </TabsContent>

                        <TabsContent value="privacy-consent" className="space-y-4">
                            <PrivacyConsentTab />
                        </TabsContent>

                        <TabsContent value="chat" className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold">Управление чатами</h2>
                                    <p className="text-muted-foreground">
                                        Поддержка пользователей
                                    </p>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow border border-gray-200 w-full h-[calc(100vh-300px)] flex flex-col">
                                {/* Заголовок с фильтрами */}
                                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                                    <div className="flex items-center space-x-3">
                                        <MessageCircle className="w-6 h-6 text-blue-600" />
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">Управление чатами</h3>
                                            <p className="text-sm text-gray-600">Поддержка пользователей</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm text-gray-600">Фильтр:</span>
                                        <Select value={chatStatusFilter} onValueChange={(value) => updateFilters('chat', { status: value })}>
                                            <SelectTrigger className="w-32">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Все</SelectItem>
                                                <SelectItem value="pending">Ожидают</SelectItem>
                                                <SelectItem value="active">Активные</SelectItem>
                                                <SelectItem value="closed">Закрытые</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex-1 flex overflow-hidden">
                                    {/* Список чатов */}
                                    <div className="w-96 border-r border-gray-200 flex flex-col">
                                        <div className="p-4 border-b border-gray-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-semibold text-gray-900">Чаты</h4>
                                                <Badge variant="secondary">
                                                    {(adminChats || []).length} всего
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {(adminChats || []).filter(c => (c.unreadCount || 0) > 0).length} ожидают ответа
                                            </div>
                                            {/* Статус WebSocket */}
                                            <div className="text-xs mt-2 p-2 rounded flex items-center space-x-2">
                                                <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : wsConnecting ? 'bg-yellow-500' : 'bg-gray-400'}`} />
                                                <span className="text-gray-600">
                                                    WebSocket: {wsConnected ? 'Подключен' : wsConnecting ? 'Подключение...' : 'Отключен'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto">
                                            {isLoadingAdminChats ? (
                                                <div className="p-4 text-center text-gray-500">
                                                    Загрузка чатов...
                                                </div>
                                            ) : (adminChats || []).length === 0 ? (
                                                <div className="p-4 text-center text-gray-500">
                                                    Нет чатов
                                                </div>
                                            ) : (
                                                (adminChats || []).map((chat) => {
                                                    const hasUnread = getChatUnreadCount(chat) > 0;
                                                    return (
                                                        <div
                                                            key={chat.id}
                                                            onClick={() => setSelectedAdminChat(chat)}
                                                            className={cn(
                                                                "p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50",
                                                                selectedAdminChat?.id === chat.id && "bg-blue-50 border-blue-200"
                                                            )}
                                                        >
                                                            <div className="flex items-center justify-between mb-1">
                                                                {/* Зеленый кружок только для непрочитанных */}
                                                                {hasUnread && (
                                                                    <div className="flex items-center space-x-2">
                                                                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                                                                        <Badge variant="destructive" className="text-xs">
                                                                            {getChatUnreadCount(chat)}
                                                                        </Badge>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Имя и фамилия */}
                                                            <p className={cn(
                                                                "text-base mb-1",
                                                                hasUnread ? "font-bold text-gray-900" : "font-medium text-gray-700"
                                                            )}>
                                                                {chat.user?.name && chat.user?.surname
                                                                    ? `${chat.user.name} ${chat.user.surname}`.trim()
                                                                    : chat.user?.name || 'Пользователь'
                                                                }
                                                            </p>

                                                            {/* Телефон */}
                                                            {chat.user?.phone && (
                                                                <p className={cn(
                                                                    "text-xs mb-1 flex items-center gap-1",
                                                                    hasUnread ? "font-semibold text-gray-800" : "text-gray-600"
                                                                )}>
                                                                    <span>📞</span>
                                                                    <span>{chat.user.phone}</span>
                                                                </p>
                                                            )}

                                                            {/* Школа */}
                                                            {chat.user?.schoolName && chat.user.schoolName !== 'Не указана' && (
                                                                <p className={cn(
                                                                    "text-xs mb-1 flex items-center gap-1",
                                                                    hasUnread ? "font-semibold text-gray-800" : "text-gray-600"
                                                                )}>
                                                                    <span>🏫</span>
                                                                    <span className="line-clamp-1">{chat.user.schoolName}</span>
                                                                </p>
                                                            )}

                                                            {/* Последнее сообщение */}
                                                            {chat.lastMessage && (
                                                                <p className={cn(
                                                                    "text-xs mt-2 line-clamp-2",
                                                                    hasUnread ? "font-medium text-gray-700" : "text-gray-500"
                                                                )}>
                                                                    {chat.lastMessage}
                                                                </p>
                                                            )}

                                                            {/* Время */}
                                                            <div className="flex items-center justify-end mt-2">
                                                                <span className="text-xs text-gray-400">
                                                                    {formatChatDateTime(chat.lastMessageAt)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>

                                    {/* Область сообщений */}
                                    <div className="flex-1 flex flex-col">
                                        {selectedAdminChat ? (
                                            <>
                                                {/* Заголовок чата */}
                                                <div className="p-4 border-b border-gray-200 bg-gray-50">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900">
                                                                {selectedAdminChat.user?.name && selectedAdminChat.user?.surname
                                                                    ? `${selectedAdminChat.user.name} ${selectedAdminChat.user.surname}`.trim()
                                                                    : selectedAdminChat.user?.name || 'Пользователь'
                                                                }
                                                            </h4>
                                                        </div>
                                                        <div className="flex items-center space-x-2">{/* Убрали select для изменения статуса */}
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                        disabled={isDeletingChat}
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Удалить чат?</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            Это действие нельзя отменить. Чат и все сообщения будут удалены навсегда.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            onClick={() => deleteChat(selectedAdminChat.id)}
                                                                            className="bg-red-600 hover:bg-red-700"
                                                                        >
                                                                            Удалить
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setSelectedAdminChat(null)}
                                                            >
                                                                Закрыть
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Сообщения */}
                                                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                                                    {isLoadingAdminMessages ? (
                                                        <div className="text-center text-gray-500">
                                                            Загрузка сообщений...
                                                        </div>
                                                    ) : (adminMessages || []).length === 0 ? (
                                                        <div className="text-center text-gray-500">
                                                            Нет сообщений
                                                        </div>
                                                    ) : (
                                                        (adminMessages || []).map((msg) => (
                                                            <div
                                                                key={msg.id}
                                                                className={cn(
                                                                    "flex",
                                                                    msg.senderType === 'admin' ? "justify-end" : "justify-start"
                                                                )}
                                                            >
                                                                <div
                                                                    className={cn(
                                                                        "max-w-[70%] sm:max-w-xs lg:max-w-md px-4 py-2 rounded-lg break-words",
                                                                        msg.senderType === 'admin'
                                                                            ? "bg-blue-600 text-white"
                                                                            : "bg-gray-100 text-gray-900"
                                                                    )}
                                                                >
                                                                    <div className="flex items-center space-x-2 mb-1">
                                                                        {msg.senderType === 'admin' ? (
                                                                            <Shield className="w-3 h-3" />
                                                                        ) : (
                                                                            <UserIcon className="w-3 h-3" />
                                                                        )}
                                                                        <span className="text-xs opacity-75">
                                                                            {msg.senderType === 'admin' ? 'Администратор' :
                                                                                `${msg.sender?.name || ''} ${msg.sender?.surname || ''}`.trim() || 'Пользователь'
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-sm break-words whitespace-pre-wrap">{msg.message}</p>
                                                                    <div className="flex items-center justify-end mt-1">
                                                                        <Clock className="w-3 h-3 opacity-50 mr-1" />
                                                                        <span className="text-xs opacity-75">
                                                                            {formatChatDateTime(msg.createdAt)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>

                                                {/* Поле ввода */}
                                                <div className="p-4 border-t border-gray-200">
                                                    <form onSubmit={handleAdminSendMessage} className="flex space-x-2">
                                                        <Input
                                                            value={adminMessage}
                                                            onChange={(e) => setAdminMessage(e.target.value)}
                                                            placeholder="Введите сообщение..."
                                                            className="flex-1"
                                                            disabled={isSendingAdminMessage}
                                                        />
                                                        <Button
                                                            type="submit"
                                                            disabled={!adminMessage.trim() || isSendingAdminMessage}
                                                            className="bg-blue-600 hover:bg-blue-700"
                                                        >
                                                            <Send className="w-4 h-4" />
                                                        </Button>
                                                    </form>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex-1 flex items-center justify-center">
                                                <div className="text-center text-gray-500">
                                                    <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                                    <p>Выберите чат для просмотра</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <SchoolModal
                    isOpen={schoolModalOpen}
                    onOpenChange={setSchoolModalOpen}
                    school={selectedSchool}
                    onSubmit={handleSchoolSubmit}
                    trigger={<></>}
                />

                {/* Модальные окна для услуг */}
                <AddServiceModal
                    open={addServiceModalOpen}
                    onClose={() => setAddServiceModalOpen(false)}
                    onSubmit={handleCreateService}
                    loading={servicesLoading}
                />

                <StyleOptionModal
                    open={styleOptionModalOpen}
                    onClose={() => {
                        setStyleOptionModalOpen(false);
                        setCurrentServiceId(null);
                        setSelectedStyleOption(null);
                    }}
                    type={styleOptionType}
                    data={selectedStyleOption}
                    onSubmit={handleCreateStyleOption}
                    loading={servicesLoading}
                />

                {/* Детальный просмотр мастер-класса */}
                <Sheet open={masterClassDetailsOpen} onOpenChange={setMasterClassDetailsOpen}>
                    <SheetContent className="w-screen h-screen max-w-none max-h-none p-0 border-0" side="bottom">
                        {selectedMasterClassEvent && (
                            <MasterClassDetails
                                masterClass={{
                                    ...selectedMasterClassEvent,
                                    executors: selectedMasterClassEvent.executors // executors уже string[]
                                }}
                                service={services.find(s => s.id === selectedMasterClassEvent.serviceId) || {
                                    id: '',
                                    name: 'Неизвестная услуга',
                                    shortDescription: '',
                                    fullDescription: '',
                                    styles: [],
                                    options: [],
                                    createdAt: '',
                                    updatedAt: ''
                                }}
                                onUpdateMasterClass={handleEditMasterClassEvent}
                                allMasterClasses={masterClasses}
                                onRefreshMasterClasses={fetchMasterClasses}
                            />
                        )}
                    </SheetContent>
                </Sheet>

                {/* Модальное окно добавления пользователя */}
                <AddUserModal
                    isOpen={addUserModalOpen}
                    onOpenChange={setAddUserModalOpen}
                    onSubmit={async (userData) => {
                        try {
                            await createUser({
                                name: userData.name,
                                surname: userData.surname,
                                role: userData.role,
                                password: userData.password
                            });
                        } catch (error) {
                            console.error('Error creating user:', error);
                            throw error;
                        }
                    }}
                    trigger={null}
                />

                {mobileFabConfig && (
                    <FloatingActionButton
                        label={mobileFabConfig.label}
                        icon={mobileFabConfig.icon}
                        onClick={mobileFabConfig.onClick}
                    />
                )}

            </div>
        </div>
    );
};


// Основной компонент Dashboard с провайдером контекста
const Dashboard: React.FC = () => {
    return (
        <AdminFiltersProvider>
            <AdminNavigationProvider>
                <DashboardContent />
            </AdminNavigationProvider>
        </AdminFiltersProvider>
    );
};

export default Dashboard; 

interface UsersMobileListProps {
    filteredUsers: User[];
    isLoading: boolean;
    error?: string | null;
    getParentForChild: (user: User) => User | null;
    getChildSchoolName: (user: User) => string | null;
    onDeleteUser: (userId: string) => Promise<void>;
}

const UsersMobileList: React.FC<UsersMobileListProps> = ({
    filteredUsers,
    isLoading,
    error,
    getParentForChild,
    getChildSchoolName,
    onDeleteUser,
}) => {
    const { selectedIds, selectionCount, setSelection, isSelected, clearSelection } = useSelectionManager();
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    const handleBulkDelete = useCallback(async () => {
        if (selectionCount === 0 || isBulkDeleting) {
            return;
        }

        setIsBulkDeleting(true);
        try {
            for (const id of Array.from(selectedIds)) {
                await onDeleteUser(id);
            }
            clearSelection();
        } catch (error) {
            console.error('Bulk delete users error:', error);
        } finally {
            setIsBulkDeleting(false);
        }
    }, [selectionCount, isBulkDeleting, selectedIds, onDeleteUser, clearSelection]);

    const bulkActions = useMemo(
        () => [
            {
                id: 'delete',
                label: isBulkDeleting ? 'Удаление...' : 'Удалить',
                onClick: handleBulkDelete,
                icon: Trash2,
                variant: 'destructive' as const,
            },
        ],
        [handleBulkDelete, isBulkDeleting],
    );

    if (isLoading) {
        return <div className="py-4 text-center">Загрузка...</div>;
    }

    if (error) {
        return <div className="py-4 text-center text-red-500">{error}</div>;
    }

    if (filteredUsers.length === 0) {
        return (
            <div className="py-4 text-center text-gray-500">
                Нет пользователей для отображения. Попробуйте изменить фильтры или поисковый запрос.
            </div>
        );
    }

    return (
        <>
            <ResponsiveList
                items={filteredUsers}
                keyExtractor={(item) => item.id}
                renderItem={(user) => {
                    const parent = getParentForChild(user);
                    const childSchool = getChildSchoolName(user);
                    return (
                        <UserCard
                            user={user}
                            parentUser={parent}
                            childSchoolName={childSchool}
                            selectable
                            selected={isSelected(user.id)}
                            onSelectChange={(value) => setSelection(user.id, value)}
                            onDelete={(target) => onDeleteUser(target.id)}
                        />
                    );
                }}
            />

            <BulkActionBar
                count={selectionCount}
                onClear={clearSelection}
                actions={bulkActions}
            />
        </>
    );
};

interface UsersFilterFieldsProps {
    users: User[];
    schools: School[];
    userFilters: {
        role: string;
        school: string;
        class: string;
    };
    updateFilters: (section: 'users', values: Record<string, string>) => void;
    getUserSchoolName: (user: User) => string | null;
    showResetButton?: boolean;
}

const UsersFilterFields: React.FC<UsersFilterFieldsProps> = ({
    users,
    schools,
    userFilters,
    updateFilters,
    getUserSchoolName,
    showResetButton = true,
}) => {
    const schoolOptions = useMemo(() => {
        if (!users || users.length === 0) return [];
        const names = users
            .map((user) => {
                try {
                    return getUserSchoolName(user);
                } catch (error) {
                    console.error('Error getting school name for user:', error, user);
                    return null;
                }
            })
            .filter(Boolean) as string[];
        return Array.from(new Set(names)).sort();
    }, [users, getUserSchoolName]);

    const classOptions = useMemo(() => {
        if (!users || users.length === 0 || userFilters.school === 'all') return [];
        const classes = users
            .filter((user) => {
                try {
                    const schoolName = getUserSchoolName(user);
                    return schoolName === userFilters.school && user.class;
                } catch (error) {
                    console.error('Error filtering user for classes:', error, user);
                    return false;
                }
            })
            .map((user) => user.class)
            .filter(Boolean) as string[];
        return Array.from(new Set(classes)).sort();
    }, [users, userFilters.school, getUserSchoolName]);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="role-filter">Роль</Label>
                    <Select
                        value={userFilters.role}
                        onValueChange={(value) => updateFilters('users', { role: value })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Выберите роль" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Все роли</SelectItem>
                            <SelectItem value="admin">Администратор</SelectItem>
                            <SelectItem value="executor">Исполнитель</SelectItem>
                            <SelectItem value="parent">Родитель</SelectItem>
                            <SelectItem value="child">Ребенок</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="school-filter">Школа</Label>
                    <Select
                        value={userFilters.school}
                        onValueChange={(value) => updateFilters('users', { school: value, class: 'all' })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Выберите школу" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Все школы</SelectItem>
                            {(schoolOptions.length > 0 ? schoolOptions : schools.map((school) => school.name)).map((schoolName) => (
                                <SelectItem key={schoolName} value={schoolName}>
                                    {schoolName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="class-filter">Класс</Label>
                    <Select
                        value={userFilters.class}
                        onValueChange={(value) => updateFilters('users', { class: value })}
                        disabled={userFilters.school === 'all'}
                    >
                        <SelectTrigger disabled={userFilters.school === 'all'}>
                            <SelectValue placeholder="Выберите класс" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Все классы</SelectItem>
                            {classOptions.map((className) => (
                                <SelectItem key={className} value={className}>
                                    {className}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {showResetButton && (
                <Button
                    variant="outline"
                    onClick={() => updateFilters('users', { role: 'all', school: 'all', class: 'all' })}
                    className="w-full"
                >
                    Сбросить фильтры
                </Button>
            )}
        </div>
    );
};
