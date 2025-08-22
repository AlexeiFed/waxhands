import React, { useState, useEffect } from 'react';
import logoImage from '../../assets/logo.png';
import { Card, CardContent, CardContentCompact, CardDescription, CardHeader, CardHeaderCompact, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/hooks/use-users';
import { useSchools } from '@/hooks/use-schools';
import { useServices } from '@/hooks/use-services';
import { useMasterClasses } from '@/hooks/use-master-classes';
import { useInvoices } from '@/hooks/use-invoices';
import { useAdminChat } from '@/hooks/use-chat';
import { useWebSocketChat } from '@/hooks/use-websocket-chat';
import { useWorkshopRequestsWebSocket } from '@/hooks/use-workshop-requests-websocket';
import { cn } from '@/lib/utils';
import { Chat } from '@/types/chat';
import { SchoolModal } from '@/components/ui/school-modal';
import { SchoolFilters } from '@/components/ui/school-filters';
import { AddServiceModal } from '@/components/ui/add-service-modal';
import { ServiceCard } from '@/components/ui/service-card';
import { StyleOptionModal } from '@/components/ui/style-option-modal';
import MasterClassesTab from '@/components/admin/MasterClassesTab';
import { MasterClassDetails } from '@/components/admin/MasterClassDetails';
import WorkshopRequestsTab from '@/components/admin/WorkshopRequestsTab';
import { Service, ServiceStyle, ServiceOption } from '@/types';
import { MasterClassEvent, MasterClassParticipant } from '@/types/services';
import {
    Users,
    Building2,
    Wrench,
    GraduationCap,
    Receipt,
    Search,
    Plus,
    Trash2,
    Edit,
    Filter,
    MessageCircle,
    Shield,
    User,
    Clock,
    Send,
    FileText,
    RefreshCw
} from 'lucide-react';
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

const Dashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const { toast } = useToast();

    // Отладка импорта логотипа
    console.log('Dashboard: logoImage импортирован:', logoImage);
    const [searchTerm, setSearchTerm] = useState('');
    const [usersSearchTerm, setUsersSearchTerm] = useState('');
    const [schoolsSearchTerm, setSchoolsSearchTerm] = useState('');
    const [servicesSearchTerm, setServicesSearchTerm] = useState('');

    const [selectedTab, setSelectedTab] = useState('overview');
    const [schoolModalOpen, setSchoolModalOpen] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

    // Состояние для статистики заявок
    const [workshopRequestsStats, setWorkshopRequestsStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0
    });

    // WebSocket для автоматических обновлений заявок
    const { isConnected: wsRequestsConnected, sendMessage: wsRequestsSendMessage } = useWorkshopRequestsWebSocket(
        'admin',
        true,
        (message) => {
            // Обрабатываем WebSocket сообщения для автоматического обновления статистики
            if (message.type === 'workshop_request_status_change' || message.type === 'workshop_request_update') {
                console.log('📋 Dashboard: Получено WebSocket уведомление о заявке, обновляем статистику');
                loadWorkshopRequestsStats();
            }
        }
    );

    // Отладка WebSocket состояния и принудительная загрузка статистики
    useEffect(() => {
        console.log('🔌 Dashboard: WebSocket состояние заявок:', {
            isConnected: wsRequestsConnected,
            timestamp: new Date().toISOString()
        });

        // При подключении WebSocket загружаем статистику
        if (wsRequestsConnected) {
            console.log('🔌 Dashboard: WebSocket подключен, загружаем статистику заявок...');
            loadWorkshopRequestsStats();
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
    const [schoolFilters, setSchoolFilters] = useState({
        city: '',
        school: '',
        class: ''
    });

    // Состояния для чата
    const [chatStatusFilter, setChatStatusFilter] = useState('all');
    const [selectedAdminChat, setSelectedAdminChat] = useState<Chat | null>(null);
    const [adminMessage, setAdminMessage] = useState('');
    const [isSendingAdminMessage, setIsSendingAdminMessage] = useState(false);
    const [isUpdatingAdminChatStatus, setIsUpdatingAdminChatStatus] = useState(false);

    // Хук для админского чата
    const {
        chats: adminChats,
        messages: adminMessages,
        isLoadingChats: isLoadingAdminChats,
        isLoadingMessages: isLoadingAdminMessages,
        sendMessage: adminSendMessage,
        updateChatStatus: adminUpdateChatStatus
    } = useAdminChat(selectedAdminChat);

    // WebSocket для real-time обновлений чатов
    const { isConnected: wsConnected, isConnecting: wsConnecting } = useWebSocketChat(
        selectedAdminChat?.id,
        user?.id,
        true // isAdmin = true
    );

    // Фильтры для пользователей
    const [userFilters, setUserFilters] = useState({
        role: 'all',
        school: 'all'
    });

    // Состояния для модальных окон услуг
    const [addServiceModalOpen, setAddServiceModalOpen] = useState(false);
    const [styleOptionModalOpen, setStyleOptionModalOpen] = useState(false);
    const [currentServiceId, setCurrentServiceId] = useState<string | null>(null);
    const [styleOptionType, setStyleOptionType] = useState<'style' | 'option'>('style');
    const [selectedStyleOption, setSelectedStyleOption] = useState<ServiceStyle | ServiceOption | null>(null);

    // Состояния для мастер-классов
    const [selectedMasterClassEvent, setSelectedMasterClassEvent] = useState<MasterClassEvent | null>(null);
    const [masterClassDetailsOpen, setMasterClassDetailsOpen] = useState(false);

    // Хуки для работы с данными
    const { users, loading: usersLoading, error: usersError, total: usersTotal, deleteUser, fetchUsers, lastFetch: usersLastFetch } = useUsers();
    const { schools, loading: schoolsLoading, error: schoolsError, total: schoolsTotal, deleteSchool, createSchool, updateSchool } = useSchools();
    const { data: invoicesData, isLoading: invoicesLoading, error: invoicesError } = useInvoices({});

    // Отладочная информация для счетов
    useEffect(() => {
        console.log('Dashboard: Данные счетов:', {
            invoicesData,
            total: invoicesData?.total,
            invoices: invoicesData?.invoices,
            loading: invoicesLoading,
            error: invoicesError
        });
    }, [invoicesData, invoicesLoading, invoicesError]);

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
        deleteMasterClass
    } = useMasterClasses();

    // Автоматическое обновление данных при переключении вкладок
    useEffect(() => {
        if (selectedTab === 'users' && users.length === 0) {
            console.log('🔄 Switching to users tab, fetching users...');
            fetchUsers();
        }
    }, [selectedTab, users.length, fetchUsers]);

    useEffect(() => {
        if (selectedTab === 'schools' && schools.length === 0) {
            console.log('🔄 Switching to schools tab, fetching schools...');
        }
    }, [selectedTab, schools.length]);

    useEffect(() => {
        if (selectedTab === 'services' && services.length === 0) {
            console.log('🔄 Switching to services tab, fetching services...');
        }
    }, [selectedTab, services.length]);

    useEffect(() => {
        if (selectedTab === 'master-classes' && masterClasses.length === 0) {
            console.log('🔄 Switching to master-classes tab, fetching master classes...');
            fetchMasterClasses();
        }
    }, [selectedTab, masterClasses.length, fetchMasterClasses]);

    // Загружаем статистику заявок при монтировании
    useEffect(() => {
        console.log('🚀 Dashboard: Компонент смонтирован, проверяем авторизацию...');

        // Проверяем наличие токена авторизации
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            console.error('❌ Dashboard: Токен авторизации отсутствует при монтировании');
            window.location.href = '/admin/login';
            return;
        }

        console.log('✅ Dashboard: Токен авторизации найден, загружаем статистику заявок...');
        loadWorkshopRequestsStats();

        // Загружаем сервисы для доступа к стилям и опциям
        if (services.length === 0) {
            console.log('🔄 Dashboard: Загружаем сервисы для мастер-классов...');
            fetchServices();
        }

        // Принудительно загружаем статистику с задержкой для отладки
        setTimeout(() => {
            console.log('⏰ Dashboard: Принудительная загрузка статистики заявок...');
            loadWorkshopRequestsStats();
        }, 2000);
    }, []);

    // Автоматическое обновление статистики заявок через WebSocket
    useEffect(() => {
        if (wsRequestsConnected) {
            // Подписываемся на обновления заявок
            wsRequestsSendMessage({
                type: 'subscribe',
                channels: ['admin:workshop_requests', 'workshop_requests:all']
            });

            console.log('🔌 Dashboard: WebSocket подключен для заявок, подписка активна');
        }
    }, [wsRequestsConnected, wsRequestsSendMessage]);

    // Функция загрузки статистики заявок
    const loadWorkshopRequestsStats = async () => {
        try {
            console.log('🔄 Dashboard: Загружаем статистику заявок...');
            // Проверяем токен авторизации
            const authToken = localStorage.getItem('authToken');
            console.log('🔄 Dashboard: Токен авторизации:', authToken ? 'Есть' : 'Нет');

            if (!authToken) {
                console.error('❌ Dashboard: Токен авторизации отсутствует, перенаправляем на логин');
                // Перенаправляем на страницу логина
                window.location.href = '/admin/login';
                return;
            }

            // Используем правильный URL для backend API
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const apiUrl = `${API_BASE_URL}/workshop-requests/stats/overview`;

            console.log('🔄 Dashboard: API URL для статистики заявок:', apiUrl);

            // Проверяем доступность backend сервера
            try {
                const healthUrl = `${API_BASE_URL}/health`;
                console.log('🏥 Dashboard: Проверяем health endpoint:', healthUrl);

                const healthCheck = await fetch(healthUrl, {
                    method: 'HEAD'
                });
                console.log('✅ Dashboard: Backend сервер доступен, статус:', healthCheck.status);
            } catch (healthError) {
                console.warn('⚠️ Dashboard: Backend сервер недоступен, используем fallback:', healthError);
                // Устанавливаем fallback значения
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

            console.log('📋 Dashboard: Ответ API статистики заявок:', response.status, response.ok);
            console.log('📋 Dashboard: Заголовки ответа:', Object.fromEntries(response.headers.entries()));
            console.log('📋 Dashboard: Content-Type ответа:', response.headers.get('content-type'));

            if (response.ok) {
                const contentType = response.headers.get('content-type');
                console.log('📋 Dashboard: Content-Type ответа:', contentType);

                // Проверяем, что ответ действительно JSON
                if (!contentType || !contentType.includes('application/json')) {
                    console.error('❌ Dashboard: Ответ не является JSON. Content-Type:', contentType);
                    const responseText = await response.text();
                    console.error('❌ Dashboard: Сырой ответ (не JSON):', responseText.substring(0, 200) + '...');

                    // Устанавливаем fallback значения
                    setWorkshopRequestsStats({
                        total: 0,
                        pending: 0,
                        approved: 0,
                        rejected: 0
                    });
                    return;
                }

                const responseText = await response.text();
                console.log('📋 Dashboard: Сырой ответ API:', responseText);

                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (parseError) {
                    console.error('❌ Dashboard: Ошибка парсинга JSON:', parseError);
                    console.error('❌ Dashboard: Сырой ответ:', responseText);
                    return;
                }

                console.log('📋 Dashboard: Данные статистики заявок:', data);

                if (data.success && data.data) {
                    setWorkshopRequestsStats(data.data);
                    console.log('✅ Dashboard: Статистика заявок обновлена:', data.data);
                } else {
                    console.warn('⚠️ Dashboard: Неожиданный формат ответа статистики заявок:', data);
                    // Попробуем fallback - если data есть, но не в ожидаемом формате
                    if (data.data && typeof data.data === 'object') {
                        const fallbackStats = {
                            total: data.data.total || 0,
                            pending: data.data.pending || 0,
                            approved: data.data.approved || 0,
                            rejected: data.data.rejected || 0
                        };
                        console.log('🔄 Dashboard: Используем fallback статистику:', fallbackStats);
                        setWorkshopRequestsStats(fallbackStats);
                    }
                }
            } else {
                console.error('❌ Dashboard: Ошибка API статистики заявок:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('❌ Dashboard: Текст ошибки:', errorText);

                // Обрабатываем ошибку 403 (Unauthorized)
                if (response.status === 403) {
                    console.error('❌ Dashboard: Токен недействителен, перенаправляем на логин');
                    // Очищаем недействительный токен
                    localStorage.removeItem('authToken');
                    // Перенаправляем на страницу логина
                    window.location.href = '/admin/login';
                    return;
                }

                // Для других ошибок устанавливаем fallback значения
                setWorkshopRequestsStats({
                    total: 0,
                    pending: 0,
                    approved: 0,
                    rejected: 0
                });
            }
        } catch (error) {
            console.error('❌ Dashboard: Ошибка при загрузке статистики заявок:', error);
        }
    };

    // Отладочная информация для мастер-классов
    useEffect(() => {
        console.log('Dashboard: Данные мастер-классов:', {
            count: masterClasses.length,
            data: masterClasses,
            loading: masterClassesLoading,
            error: masterClassesError
        });

        // Детальная отладка участников
        if (masterClasses.length > 0) {
            masterClasses.forEach((mc, index) => {
                console.log(`Dashboard: Мастер-класс ${index + 1}:`, {
                    id: mc.id,
                    date: mc.date,
                    schoolName: mc.schoolName,
                    classGroup: mc.classGroup,
                    participantsCount: mc.participants?.length || 0,
                    participants: mc.participants
                });

                if (mc.participants && mc.participants.length > 0) {
                    mc.participants.forEach((participant, pIndex) => {
                        console.log(`Dashboard: Участник ${pIndex + 1} в мастер-классе ${index + 1}:`, {
                            id: participant.id,
                            childName: participant.childName,
                            selectedStyles: participant.selectedStyles,
                            selectedOptions: participant.selectedOptions,
                            totalAmount: participant.totalAmount
                        });
                    });
                }
            });
        }
    }, [masterClasses, masterClassesLoading, masterClassesError]);

    // Отладочная информация для школ
    useEffect(() => {
        console.log('Dashboard: Данные школ:', {
            count: schools.length,
            data: schools,
            loading: schoolsLoading,
            error: schoolsError
        });
        // Дополнительная отладка для поля teacherPhone
        if (schools.length > 0) {
            console.log('Dashboard: Пример школы с teacherPhone:', schools[0]);
            console.log('Dashboard: Все школы teacherPhone:', schools.map(s => ({ id: s.id, name: s.name, teacherPhone: s.teacherPhone })));
        }
    }, [schools, schoolsLoading, schoolsError]);

    // Отладочная информация для пользователей
    useEffect(() => {
        console.log('Dashboard: Данные пользователей:', {
            count: users.length,
            data: users,
            loading: usersLoading,
            error: usersError
        });
    }, [users, usersLoading, usersError]);



    // Функции для работы с модальным окном школы
    const handleAddSchool = () => {
        setSelectedSchool(null);
        setSchoolModalOpen(true);
    };

    const handleEditSchool = (school: School) => {
        setSelectedSchool(school);
        setSchoolModalOpen(true);
    };

    // Функции для работы с услугами
    const handleAddService = () => {
        setAddServiceModalOpen(true);
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
        console.log('Dashboard: handleViewStyle called with:', style, 'serviceId:', serviceId);
        console.log('Dashboard: style price type:', typeof style.price, 'value:', style.price);
        console.log('Dashboard: style media files:', {
            avatar: style.avatar,
            images: style.images,
            videos: style.videos
        });
        setCurrentServiceId(serviceId);
        setSelectedStyleOption(style);
        setStyleOptionType('style');
        setStyleOptionModalOpen(true);
    };

    const handleViewOption = (option: ServiceOption, serviceId: string) => {
        console.log('Dashboard: handleViewOption called with:', option, 'serviceId:', serviceId);
        setCurrentServiceId(serviceId);
        setSelectedStyleOption(option);
        setStyleOptionType('option');
        setStyleOptionModalOpen(true);
    };

    const handleCreateStyleOption = async (data: Omit<ServiceStyle | ServiceOption, 'id'>) => {
        if (!currentServiceId) return;

        console.log('Dashboard: handleCreateStyleOption called with:', data);
        console.log('Dashboard: data price type:', typeof data.price, 'value:', data.price);
        console.log('Dashboard: selectedStyleOption:', selectedStyleOption?.id, 'type:', styleOptionType);

        try {
            if (styleOptionType === 'style') {
                if (selectedStyleOption) {
                    console.log('Dashboard: updating style with data:', data);
                    await updateServiceStyle(currentServiceId, selectedStyleOption.id, data);
                } else {
                    console.log('Dashboard: adding new style with data:', data);
                    await addStyleToService(currentServiceId, data);
                }
            } else {
                if (selectedStyleOption) {
                    console.log('Dashboard: updating option with data:', data);
                    await updateServiceOption(currentServiceId, selectedStyleOption.id, data);
                } else {
                    console.log('Dashboard: adding new option with data:', data);
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
        setSchoolFilters(filters);
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
            toast({
                title: "Школа удалена",
                description: "Школа успешно удалена из системы",
            });
        } catch (error) {
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
        } catch (error) {
            toast({
                title: "Ошибка",
                description: "Не удалось удалить мастер-класс",
                variant: "destructive",
            });
        }
    };

    // Функции для чата
    const getChatStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500';
            case 'pending': return 'bg-yellow-500';
            case 'closed': return 'bg-gray-500';
            default: return 'bg-gray-500';
        }
    };

    const getChatStatusText = (status: string) => {
        switch (status) {
            case 'active': return 'Активен';
            case 'pending': return 'Ожидает';
            case 'closed': return 'Закрыт';
            default: return 'Неизвестно';
        }
    };

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
        } catch {
            toast({ title: 'Ошибка', description: 'Не удалось создать событие', variant: 'destructive' });
        }
    };

    const handleEditMasterClassEvent = async (id: string, updates: Partial<MasterClassEvent>) => {
        try {
            await updateMasterClass(id, { ...updates });
            toast({ title: 'Мастер-класс обновлен', description: 'Изменения сохранены' });
        } catch {
            toast({ title: 'Ошибка', description: 'Не удалось сохранить изменения', variant: 'destructive' });
        }
    };

    const handleViewMasterClassEvent = (masterClassEvent: MasterClassEvent) => {
        setSelectedMasterClassEvent(masterClassEvent);
        setMasterClassDetailsOpen(true);
    };

    const handleUpdateParticipant = (participantId: string, updates: Partial<MasterClassParticipant>) => {
        if (!selectedMasterClassEvent) return;

        const updatedEvent = {
            ...selectedMasterClassEvent,
            participants: selectedMasterClassEvent.participants.map(p =>
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

    // Фильтрация данных
    const filteredUsers = users.filter(user => {
        // Поиск по имени, фамилии и email с проверкой на null/undefined
        const searchMatch =
            (user.name?.toLowerCase() || '').includes(usersSearchTerm.toLowerCase()) ||
            (user.surname?.toLowerCase() || '').includes(usersSearchTerm.toLowerCase()) ||
            (user.email?.toLowerCase() || '').includes(usersSearchTerm.toLowerCase());

        // Фильтр по роли
        const roleMatch = userFilters.role === 'all' || user.role === userFilters.role;

        // Фильтр по школе
        const schoolMatch = userFilters.school === 'all' || getUserSchoolName(user) === userFilters.school;

        return searchMatch && roleMatch && schoolMatch;
    });

    const filteredSchools = schools.filter(school => {
        // Фильтр по поисковому запросу с проверкой на null/undefined
        const searchMatch =
            (school.name?.toLowerCase() || '').includes(schoolsSearchTerm.toLowerCase()) ||
            (school.address?.toLowerCase() || '').includes(schoolsSearchTerm.toLowerCase()) ||
            (school.teacher?.toLowerCase() || '').includes(schoolsSearchTerm.toLowerCase());

        // Фильтр по городу
        const cityMatch = !schoolFilters.city || (school.address && school.address.split(',')[0]?.trim() === schoolFilters.city);

        // Фильтр по школе
        const schoolMatch = !schoolFilters.school || school.name === schoolFilters.school;

        // Фильтр по классу
        const classMatch = !schoolFilters.class || (school.classes && school.classes.includes(schoolFilters.class));

        return searchMatch && cityMatch && schoolMatch && classMatch;
    });

    const filteredServices = services.filter(service =>
        (service.name?.toLowerCase() || '').includes(servicesSearchTerm.toLowerCase()) ||
        (service.shortDescription?.toLowerCase() || '').includes(servicesSearchTerm.toLowerCase())
    );



    // Получение названия школы пользователя
    const getUserSchoolName = (user: { schoolName?: string; schoolId?: string }) => {
        if (user.schoolName) {
            return user.schoolName;
        }
        if (user.schoolId) {
            const school = schools.find(s => s.id === user.schoolId);
            return school ? school.name : null;
        }
        return null;
    };

    // Получение роли пользователя для отображения иконки
    const getRoleIcon = (role: string) => {
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
    };

    const getRoleColor = (role: string) => {
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
    };

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
        <div className="w-full max-w-none px-8 py-6 relative">
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

            <div className="relative z-10">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-3xl font-bold">Админ-панель</h1>
                        <p className="text-muted-foreground">
                            {/*Добро пожаловать, {user.name}!*/}
                        </p>
                    </div>
                    <Button onClick={logout} variant="outline">
                        Выйти
                    </Button>
                </div>

                <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
                    <TabsList className="grid w-full grid-cols-9">
                        <TabsTrigger value="overview">Обзор</TabsTrigger>
                        <TabsTrigger value="users">Пользователи</TabsTrigger>
                        <TabsTrigger value="schools">Школы</TabsTrigger>
                        <TabsTrigger value="services">Услуги</TabsTrigger>
                        <TabsTrigger value="master-classes">Мастер-классы</TabsTrigger>
                        <TabsTrigger value="invoices">Счета</TabsTrigger>
                        <TabsTrigger value="workshop-requests">Заявки</TabsTrigger>
                        <TabsTrigger value="about">О нас</TabsTrigger>
                        <TabsTrigger value="chat">Чат</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4 relative">
                        {/* Секция обзора с кликабельными карточками статистики */}
                        <div className="relative z-10 grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 w-full">
                            <Card
                                className="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg w-full min-w-0"
                                onClick={() => setSelectedTab('users')}
                            >
                                <CardHeaderCompact className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Пользователи
                                    </CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeaderCompact>
                                <CardContentCompact>
                                    <div className="text-2xl font-bold">{usersTotal}</div>
                                    <p className="text-xs text-muted-foreground">
                                        Всего пользователей
                                    </p>
                                </CardContentCompact>
                            </Card>

                            <Card
                                className="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg w-full min-w-0"
                                onClick={() => setSelectedTab('schools')}
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

                            <Card
                                className="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg w-full min-w-0"
                                onClick={() => setSelectedTab('services')}
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

                            <Card
                                className="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg w-full min-w-0"
                                onClick={() => setSelectedTab('master-classes')}
                            >
                                <CardHeaderCompact className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Мастер-классы
                                    </CardTitle>
                                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                </CardHeaderCompact>
                                <CardContentCompact>
                                    <div className="text-2xl font-bold">{masterClasses.length}</div>
                                    <p className="text-xs text-muted-foreground">
                                        Запланированных мастер-классов
                                    </p>
                                </CardContentCompact>
                            </Card>

                            <Card
                                className="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg w-full min-w-0"
                                onClick={() => setSelectedTab('invoices')}
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
                                        <div className="text-2xl font-bold">{invoicesData?.total ?? 0}</div>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Всего счетов
                                    </p>
                                </CardContentCompact>
                            </Card>

                            <Card
                                className="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg w-full min-w-0"
                                onClick={() => setSelectedTab('chat')}
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

                            <Card
                                className="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg w-full min-w-0"
                                onClick={() => setSelectedTab('workshop-requests')}
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
                        </div>
                    </TabsContent>

                    <TabsContent value="users" className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Поиск пользователей..."
                                    value={usersSearchTerm}
                                    onChange={(e) => setUsersSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        console.log('🔄 Manually refreshing users...');
                                        fetchUsers();
                                    }}
                                    disabled={usersLoading}
                                >
                                    {usersLoading ? 'Обновление...' : '🔄 Обновить'}
                                </Button>
                                <Button className="bg-blue-600 hover:bg-blue-700">
                                    <Plus className="w-4 h-4 mr-2" />
                                    👤 Добавить пользователя
                                </Button>
                            </div>
                        </div>

                        {/* Карточка фильтров пользователей */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Filter className="h-5 w-5" />
                                    Фильтры пользователей
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="role-filter">Роль</Label>
                                        <Select value={userFilters.role} onValueChange={(value) => setUserFilters(prev => ({ ...prev, role: value }))}>
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
                                        <Select value={userFilters.school} onValueChange={(value) => setUserFilters(prev => ({ ...prev, school: value }))}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Выберите школу" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Все школы</SelectItem>
                                                {(() => {
                                                    const schoolNames = users.map(u => getUserSchoolName(u)).filter(Boolean);
                                                    console.log('Available school names for filter:', schoolNames);
                                                    return [...new Set(schoolNames)].map(schoolName => (
                                                        <SelectItem key={schoolName} value={schoolName!}>
                                                            {schoolName}
                                                        </SelectItem>
                                                    ));
                                                })()}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setUserFilters({ role: 'all', school: 'all' })}
                                        className="w-full"
                                    >
                                        Сбросить фильтры
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Пользователи ({usersTotal})</CardTitle>
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
                                    <div className="text-center py-4">Загрузка...</div>
                                ) : usersError ? (
                                    <div className="text-center py-4 text-red-500">{usersError}</div>
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
                                            {filteredUsers.map((user) => (
                                                <TableRow key={user.id}>
                                                    <TableCell>
                                                        <div className="flex items-center space-x-2">
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
                                                        {getUserSchoolName(user) || '-'}
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
                                            ))}
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
                                    <div className="text-center py-4">Загрузка...</div>
                                ) : schoolsError ? (
                                    <div className="text-center py-4 text-red-500">{schoolsError}</div>
                                ) : filteredSchools.length === 0 ? (
                                    <div className="text-center py-4 text-gray-500">
                                        Нет школ для отображения. Попробуйте изменить фильтры или поисковый запрос.
                                    </div>
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
                                    onChange={(e) => setServicesSearchTerm(e.target.value)}
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
                                        {filteredServices.map((service) => (
                                            <div key={service.id} className="w-full">
                                                <ServiceCard
                                                    service={service}
                                                    onAddStyle={handleAddStyle}
                                                    onAddOption={handleAddOption}
                                                    onViewStyle={handleViewStyle}
                                                    onViewOption={handleViewOption}
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
                        />
                    </TabsContent>

                    <TabsContent value="invoices" className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold">Счета</h2>
                                <p className="text-muted-foreground">
                                    {invoicesLoading ? 'Загрузка...' :
                                        invoicesError ? 'Ошибка загрузки' :
                                            `Всего счетов: ${invoicesData?.total ?? 0}`}
                                </p>
                            </div>
                        </div>
                        <InvoicesTab />
                    </TabsContent>

                    <TabsContent value="workshop-requests" className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Заявки на проведение мастер-классов</h2>
                        </div>
                        <WorkshopRequestsTab />
                    </TabsContent>

                    <TabsContent value="about" className="space-y-4">
                        <AboutTab />
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
                                    <Select value={chatStatusFilter} onValueChange={setChatStatusFilter}>
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
                                                {adminChats.length} всего
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {adminChats.filter(c => c.status === 'pending').length} ожидают ответа
                                        </div>
                                        {/* Отладочная информация для непрочитанных */}
                                        <div className="text-xs text-gray-400 mt-2 p-2 bg-gray-100 rounded">
                                            Debug: Всего непрочитанных: {adminChats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0)}
                                        </div>
                                        {/* Статус WebSocket */}
                                        <div className="text-xs mt-2 p-2 rounded flex items-center space-x-2">
                                            <div className={cn(
                                                "w-2 h-2 rounded-full",
                                                wsConnected ? "bg-green-500" : wsConnecting ? "bg-yellow-500" : "bg-red-500"
                                            )} />
                                            <span className={cn(
                                                wsConnected ? "text-green-600" : wsConnecting ? "text-yellow-600" : "text-red-600"
                                            )}>
                                                WebSocket: {wsConnected ? "Подключен" : wsConnecting ? "Подключение..." : "Отключен"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto">
                                        {isLoadingAdminChats ? (
                                            <div className="p-4 text-center text-gray-500">
                                                Загрузка чатов...
                                            </div>
                                        ) : adminChats.length === 0 ? (
                                            <div className="p-4 text-center text-gray-500">
                                                Нет чатов
                                            </div>
                                        ) : (
                                            adminChats.map((chat) => (
                                                <div
                                                    key={chat.id}
                                                    onClick={() => setSelectedAdminChat(chat)}
                                                    className={cn(
                                                        "p-4 border-b border-gray-100 cursor-pointer transition-colors",
                                                        selectedAdminChat?.id === chat.id && "bg-blue-50 border-blue-200"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center space-x-2">
                                                            <div className={cn(
                                                                "w-2 h-2 rounded-full",
                                                                getChatStatusColor(chat.status)
                                                            )} />
                                                            <span className="text-sm font-medium text-gray-900">
                                                                {getChatStatusText(chat.status)}
                                                            </span>
                                                        </div>
                                                        {getChatUnreadCount(chat) > 0 && (
                                                            <Badge variant="destructive" className="text-xs">
                                                                {getChatUnreadCount(chat)}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {chat.user?.name && chat.user?.surname
                                                            ? `${chat.user.name} ${chat.user.surname}`.trim()
                                                            : chat.user?.name || 'Пользователь'
                                                        }
                                                    </p>
                                                    {chat.lastMessage && (
                                                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                            {chat.lastMessage}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center justify-end mt-2">
                                                        <span className="text-xs text-gray-400">
                                                            {formatChatDateTime(chat.lastMessageAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
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
                                                        <div className="flex items-center space-x-2 mt-1">
                                                            <div className={cn(
                                                                "w-2 h-2 rounded-full",
                                                                getChatStatusColor(selectedAdminChat.status)
                                                            )} />
                                                            <span className="text-sm text-gray-600">
                                                                {getChatStatusText(selectedAdminChat.status)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Select
                                                            value={selectedAdminChat.status}
                                                            onValueChange={(value: 'active' | 'closed' | 'pending') =>
                                                                handleAdminChatStatusUpdate(selectedAdminChat.id, value)
                                                            }
                                                            disabled={isUpdatingAdminChatStatus}
                                                        >
                                                            <SelectTrigger className="w-32">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="pending">Ожидает</SelectItem>
                                                                <SelectItem value="active">Активен</SelectItem>
                                                                <SelectItem value="closed">Закрыт</SelectItem>
                                                            </SelectContent>
                                                        </Select>
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
                                                ) : adminMessages.length === 0 ? (
                                                    <div className="text-center text-gray-500">
                                                        Нет сообщений
                                                    </div>
                                                ) : (
                                                    adminMessages.map((msg) => (
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
                                                                        <User className="w-3 h-3" />
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
                            />
                        )}
                    </SheetContent>
                </Sheet>


            </div>
        </div>
    );
};

export default Dashboard; 
