/**
 * @file: src/components/admin/WorkshopRequestsTab.tsx
 * @description: Вкладка управления заявками на проведение мастер-классов для админа
 * @dependencies: useWorkshopRequests, Card, Badge, Button, Dialog, Textarea
 * @created: 2024-12-19
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWorkshopRequests } from '@/hooks/use-workshop-requests';
import { useWorkshopRequestsWebSocket } from '@/hooks/use-workshop-requests-websocket';
import { useSchools } from '@/hooks/use-schools';
import { useToast } from '@/hooks/use-toast';
import { WorkshopRequestWithParent, UpdateWorkshopRequestData, WorkshopRequest, SchoolWithAddress } from '@/types';
import {
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    Trash2,
    Calendar,
    MapPin,
    GraduationCap,
    User,
    Mail,
    AlertCircle,
    Phone
} from 'lucide-react';

export default function WorkshopRequestsTab() {
    console.log('🚀 WorkshopRequestsTab: Инициализация компонента...');

    const { getAllRequests, updateRequestStatus, deleteRequest, getRequestsStats, loading, error } = useWorkshopRequests();
    const { getSchoolsWithAddresses } = useSchools();
    const { toast } = useToast();

    // WebSocket для автоматических обновлений
    const { isConnected: wsConnected, sendMessage: wsSendMessage } = useWorkshopRequestsWebSocket(
        'admin',
        true,
        (message) => {
            // Обрабатываем WebSocket сообщения для автоматического обновления
            console.log('🔌 WorkshopRequestsTab: Получено WebSocket сообщение:', message);

            if (message.type === 'workshop_request_status_change' || message.type === 'workshop_request_update') {
                console.log('📋 WorkshopRequestsTab: Обновление заявки через WebSocket, перезагружаем данные...');
                loadData();
            } else if (message.type === 'workshop_request_created' || message.type === 'workshop_request_deleted') {
                console.log('📋 WorkshopRequestsTab: Изменение заявки через WebSocket, перезагружаем данные...');
                loadData();
            } else {
                console.log('🔌 WorkshopRequestsTab: Неизвестный тип сообщения:', message.type);
            }
        }
    );

    const [requests, setRequests] = useState<WorkshopRequestWithParent[]>([]);
    const [schoolsWithAddresses, setSchoolsWithAddresses] = useState<SchoolWithAddress[]>([]);
    const [stats, setStats] = useState<{
        total: number;
        pending: number;
        approved: number;
        rejected: number;
    }>({ total: 0, pending: 0, approved: 0, rejected: 0 });
    const [selectedRequest, setSelectedRequest] = useState<WorkshopRequestWithParent | null>(null);
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [statusData, setStatusData] = useState<UpdateWorkshopRequestData>({
        status: 'pending',
        admin_notes: ''
    });
    const [componentError, setComponentError] = useState<string | null>(null);

    // Состояние для фильтров
    const [filters, setFilters] = useState({
        city: '',
        school: '',
        classGroup: '',
        status: ''
    });

    // Получаем уникальные значения для фильтров
    const uniqueSchools = [...new Set(requests.map(req => req.school_name))].sort();
    const uniqueClassGroups = [...new Set(requests.map(req => req.class_group))].sort();

    // Получаем города из адресов школ (до запятой)
    const getCityFromAddress = (schoolName: string) => {
        // Ищем школу в списке школ с адресами
        const school = schoolsWithAddresses.find(s => s.name === schoolName);

        if (school && school.address) {
            // Извлекаем город из адреса (первое слово до запятой)
            const city = school.address.split(',')[0].trim();
            return city;
        }

        // Fallback - если адрес не найден, используем заглушку
        return 'Неизвестно';
    };

    // Получаем уникальные города из реальных адресов школ
    const uniqueCities = [...new Set(
        schoolsWithAddresses
            .map(school => school.address.split(',')[0].trim())
            .filter(city => city && city !== '')
    )].sort();

    // Отладочная информация для фильтрации
    console.log('🔍 WorkshopRequestsTab: Отладка фильтрации:', {
        schoolsWithAddresses: schoolsWithAddresses.length,
        uniqueCities: uniqueCities,
        filters: filters,
        requestsCount: requests.length
    });

    // Получаем классы для выбранной школы
    const getClassesForSchool = (schoolName: string) => {
        if (!schoolName) return [];

        // Сначала пытаемся получить классы из БД
        const school = schoolsWithAddresses.find(s => s.name === schoolName);
        if (school && school.classes && Array.isArray(school.classes)) {
            return school.classes.sort();
        }

        // Fallback - получаем классы из заявок
        return requests
            .filter(req => req.school_name === schoolName)
            .map(req => req.class_group)
            .filter((value, index, self) => self.indexOf(value) === index)
            .sort();
    };

    // Получаем школы для выбранного города
    const getSchoolsForCity = (city: string) => {
        if (!city) return uniqueSchools;

        // Фильтруем школы по городу из адреса
        return schoolsWithAddresses
            .filter(school => school.address && school.address.split(',')[0].trim() === city)
            .map(school => school.name)
            .sort();
    };

    // Фильтруем заявки
    const filteredRequests = requests.filter(request => {
        if (filters.city && getCityFromAddress(request.school_name) !== filters.city) return false;
        if (filters.school && request.school_name !== filters.school) return false;
        if (filters.classGroup && request.class_group !== filters.classGroup) return false;
        if (filters.status && request.status !== filters.status) return false;
        return true;
    });

    // Сбрасываем фильтры, если выбранные значения больше не существуют в данных
    useEffect(() => {
        if (filters.city && !uniqueCities.includes(filters.city)) {
            setFilters(prev => ({ ...prev, city: '', school: '', classGroup: '' }));
        }
        if (filters.school && !uniqueSchools.includes(filters.school)) {
            setFilters(prev => ({ ...prev, school: '', classGroup: '' }));
        }
        if (filters.classGroup && filters.school) {
            const availableClasses = getClassesForSchool(filters.school);
            if (!availableClasses.includes(filters.classGroup)) {
                setFilters(prev => ({ ...prev, classGroup: '' }));
            }
        }
    }, [requests, filters.city, filters.school, filters.classGroup, uniqueCities, uniqueSchools]);

    // Загружаем данные при монтировании компонента
    useEffect(() => {
        console.log('🚀 WorkshopRequestsTab: Компонент смонтирован, WebSocket состояние:', wsConnected);
        console.log('🚀 WorkshopRequestsTab: Проверяем авторизацию пользователя...');

        // Проверяем токен авторизации
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            console.error('❌ WorkshopRequestsTab: Токен авторизации отсутствует');
            setComponentError('Токен авторизации отсутствует. Войдите в систему заново.');
            return;
        }

        console.log('✅ WorkshopRequestsTab: Токен авторизации найден, загружаем данные...');
        console.log('🔍 WorkshopRequestsTab: Длина токена:', authToken.length);
        console.log('🔍 WorkshopRequestsTab: Начало токена:', authToken.substring(0, 20) + '...');

        loadData();
    }, []);

    // Отладка WebSocket состояния
    useEffect(() => {
        console.log('🔌 WorkshopRequestsTab: WebSocket состояние изменилось:', {
            isConnected: wsConnected,
            timestamp: new Date().toISOString()
        });

        // При подключении WebSocket подписываемся на обновления
        if (wsConnected) {
            console.log('🔌 WorkshopRequestsTab: WebSocket подключен, подписка активна');
        }
    }, [wsConnected]);

    const loadData = async () => {
        try {
            console.log('🔄 WorkshopRequestsTab.loadData: Начинаем загрузку данных...');
            console.log('🔍 WorkshopRequestsTab.loadData: Токен авторизации:', !!localStorage.getItem('authToken'));

            // Загружаем школы с адресами для фильтрации
            const schoolsResult = await getSchoolsWithAddresses();
            console.log('🏫 WorkshopRequestsTab.loadData: Результат загрузки школ:', schoolsResult);

            if (schoolsResult?.success && schoolsResult.data) {
                console.log('✅ WorkshopRequestsTab.loadData: Школы с адресами загружены, количество:', schoolsResult.data.length);
                console.log('🏫 WorkshopRequestsTab.loadData: Первая школа:', schoolsResult.data[0]);
                console.log('🏫 WorkshopRequestsTab.loadData: Все школы:', schoolsResult.data);
                setSchoolsWithAddresses(schoolsResult.data);
            } else {
                console.warn('⚠️ WorkshopRequestsTab.loadData: Школы с адресами не загружены');
                console.warn('⚠️ WorkshopRequestsTab.loadData: Результат:', schoolsResult);
                setSchoolsWithAddresses([]);
            }

            // Загружаем заявки
            const requestsResult = await getAllRequests();
            console.log('📋 WorkshopRequestsTab.loadData: Результат загрузки заявок:', requestsResult);
            console.log('📋 WorkshopRequestsTab.loadData: Тип результата:', typeof requestsResult);
            console.log('📋 WorkshopRequestsTab.loadData: Структура результата:', Object.keys(requestsResult || {}));

            if (requestsResult?.success && requestsResult.data) {
                console.log('✅ WorkshopRequestsTab.loadData: Заявки загружены, количество:', requestsResult.data.length);
                console.log('📋 WorkshopRequestsTab.loadData: Первая заявка:', requestsResult.data[0]);
                console.log('📋 WorkshopRequestsTab.loadData: Все заявки:', requestsResult.data);
                setRequests(requestsResult.data);
            } else if (Array.isArray(requestsResult)) {
                // Fallback для случая, когда API возвращает массив напрямую
                console.log('✅ WorkshopRequestsTab.loadData: Заявки загружены (массив), количество:', requestsResult.length);
                console.log('📋 WorkshopRequestsTab.loadData: Первая заявка:', requestsResult[0]);
                console.log('📋 WorkshopRequestsTab.loadData: Все заявки:', requestsResult);
                setRequests(requestsResult);
            } else {
                console.warn('⚠️ WorkshopRequestsTab.loadData: Заявки не загружены:', requestsResult);
                console.warn('⚠️ WorkshopRequestsTab.loadData: Устанавливаем пустой массив');
                setRequests([]);
            }

            // Загружаем статистику
            const statsResult = await getRequestsStats();
            console.log('📊 WorkshopRequestsTab.loadData: Результат загрузки статистики:', statsResult);
            console.log('📊 WorkshopRequestsTab.loadData: Тип результата:', typeof statsResult);

            if (statsResult?.success && statsResult.data) {
                console.log('✅ WorkshopRequestsTab.loadData: Статистика загружена:', statsResult.data);
                setStats(statsResult.data);
            } else if (statsResult && typeof statsResult === 'object' && 'total' in statsResult && 'pending' in statsResult && 'approved' in statsResult && 'rejected' in statsResult) {
                // Fallback для случая, когда API возвращает статистику напрямую
                console.log('✅ WorkshopRequestsTab.loadData: Статистика загружена (объект):', statsResult);
                setStats(statsResult as { total: number; pending: number; approved: number; rejected: number; });
            } else {
                console.warn('⚠️ WorkshopRequestsTab.loadData: Статистика не загружена:', statsResult);
                console.warn('⚠️ WorkshopRequestsTab.loadData: Устанавливаем нулевую статистику');
                setStats({ total: 0, pending: 0, approved: 0, rejected: 0 });
            }

            console.log('✅ WorkshopRequestsTab.loadData: Загрузка завершена');
            console.log('📊 WorkshopRequestsTab.loadData: Финальное состояние:', {
                requests: requests.length,
                schoolsWithAddresses: schoolsWithAddresses.length,
                stats: stats,
                filteredRequests: filteredRequests.length
            });

            // Очищаем ошибку компонента при успешной загрузке
            if (componentError) {
                setComponentError(null);
            }
        } catch (error) {
            console.error('❌ WorkshopRequestsTab.loadData: Ошибка при загрузке данных:', error);
            console.error('❌ WorkshopRequestsTab.loadData: Детали ошибки:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });

            // Устанавливаем ошибку для отображения пользователю
            const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка при загрузке данных';
            setComponentError(errorMessage);
        }
    };

    // Обработчик изменения статуса
    const handleStatusChange = (request: WorkshopRequestWithParent) => {
        setSelectedRequest(request);
        setStatusData({
            status: request.status,
            admin_notes: request.admin_notes || ''
        });
        setIsStatusOpen(true);
    };

    // Обработчик сохранения статуса
    const handleSaveStatus = async () => {
        if (!selectedRequest) return;

        console.log('🔍 WorkshopRequestsTab.handleSaveStatus: Начинаем обновление статуса');
        console.log('📋 WorkshopRequestsTab.handleSaveStatus: ID заявки:', selectedRequest.id);
        console.log('📋 WorkshopRequestsTab.handleSaveStatus: Данные для обновления:', statusData);

        try {
            const result = await updateRequestStatus(selectedRequest.id, statusData);
            console.log('📋 WorkshopRequestsTab.handleSaveStatus: Результат обновления:', result);

            // Проверяем успешность обновления
            if (result && (result.success || (result as unknown as WorkshopRequest).id || (result.data && result.data.id))) {
                console.log('✅ WorkshopRequestsTab.handleSaveStatus: Статус успешно обновлен:', result);
                toast({
                    title: "Статус обновлен! ✅",
                    description: "Заявка успешно обновлена",
                });

                // Оптимистично обновляем локальные данные
                setRequests(prev => prev.map(req =>
                    req.id === selectedRequest.id
                        ? { ...req, ...statusData, updated_at: new Date().toISOString() }
                        : req
                ));

                // Отправляем WebSocket уведомление об обновлении
                if (wsConnected) {
                    console.log('🔌 WorkshopRequestsTab: Отправляем WebSocket уведомление об обновлении статуса');
                    const wsMessage = {
                        type: 'workshop_request_status_change',
                        data: {
                            requestId: selectedRequest.id,
                            newStatus: statusData.status,
                            adminNotes: statusData.admin_notes,
                            updatedAt: new Date().toISOString()
                        },
                        timestamp: Date.now()
                    };
                    console.log('🔌 WorkshopRequestsTab: WebSocket сообщение:', wsMessage);

                    const sent = wsSendMessage(wsMessage);
                    console.log('🔌 WorkshopRequestsTab: WebSocket сообщение отправлено:', sent);
                } else {
                    console.warn('⚠️ WorkshopRequestsTab: WebSocket не подключен, уведомление не отправлено');
                }

                // Обновляем статистику
                await updateStats();

                // Закрываем модальное окно
                setIsStatusOpen(false);
                setSelectedRequest(null);
            } else {
                console.warn('⚠️ WorkshopRequestsTab.handleSaveStatus: Неожиданный формат ответа:', result);
                toast({
                    title: "Ошибка",
                    description: result?.error || "Не удалось обновить статус",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Ошибка при обновлении статуса:', error);
            toast({
                title: "Ошибка",
                description: "Произошла ошибка при обновлении статуса",
                variant: "destructive",
            });
        }
    };

    // Функция обновления статистики
    const updateStats = async () => {
        try {
            const statsResult = await getRequestsStats();
            if (statsResult?.success && statsResult.data) {
                setStats(statsResult.data);
            } else if (statsResult && typeof statsResult === 'object' && 'total' in statsResult && 'pending' in statsResult && 'approved' in statsResult && 'rejected' in statsResult) {
                setStats(statsResult as { total: number; pending: number; approved: number; rejected: number; });
            }
        } catch (error) {
            console.error('Ошибка при обновлении статистики:', error);
        }
    };

    // Обработчик удаления заявки
    const handleDeleteRequest = async (requestId: string) => {
        if (!confirm('Вы уверены, что хотите удалить эту заявку?')) return;

        try {
            const result = await deleteRequest(requestId);

            if (result?.success) {
                toast({
                    title: "Заявка удалена! 🗑️",
                    description: "Заявка успешно удалена из системы",
                });

                // Удаляем из локальных данных
                setRequests(prev => prev.filter(req => req.id !== requestId));

                // Перезагружаем статистику
                const statsResult = await getRequestsStats();
                if (statsResult?.success && statsResult.data) {
                    setStats(statsResult.data);
                }
            } else {
                toast({
                    title: "Ошибка",
                    description: result?.error || "Не удалось удалить заявку",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Ошибка при удалении заявки:', error);
            toast({
                title: "Ошибка",
                description: "Произошла ошибка при удалении заявки",
                variant: "destructive",
            });
        }
    };

    // Получение цвета для статуса
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'approved': return 'bg-green-100 text-green-800 border-green-200';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    // Получение иконки для статуса
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock className="w-4 h-4" />;
            case 'approved': return <CheckCircle className="w-4 h-4" />;
            case 'rejected': return <XCircle className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    // Получение текста статуса
    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending': return 'Ожидает рассмотрения';
            case 'approved': return 'Одобрено';
            case 'rejected': return 'Отклонено';
            default: return 'Неизвестно';
        }
    };

    // Рендер компонента
    console.log('🔄 WorkshopRequestsTab: Рендер компонента', {
        requestsCount: requests.length,
        filteredCount: filteredRequests.length,
        stats: stats,
        loading: loading,
        error: error,
        componentError: componentError,
        wsConnected: wsConnected
    });

    // Проверяем состояние данных
    console.log('🔍 WorkshopRequestsTab: Детали состояния:', {
        requests: requests,
        filteredRequests: filteredRequests,
        filters: filters,
        uniqueSchools: uniqueSchools,
        uniqueClassGroups: uniqueClassGroups
    });

    // Обработка ошибок
    if (componentError) {
        return (
            <div className="space-y-6">
                <Card className="bg-red-50/80 backdrop-blur-sm border-red-200">
                    <CardContent className="p-8 text-center">
                        <div className="text-4xl mb-4">❌</div>
                        <div className="text-lg font-semibold text-red-600 mb-2">
                            Ошибка загрузки заявок
                        </div>
                        <p className="text-red-500 mb-4">
                            {componentError}
                        </p>
                        <Button onClick={loadData} className="bg-red-600 hover:bg-red-700 text-white">
                            Попробовать снова
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Статистика */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-blue-50/80 backdrop-blur-sm border-blue-200">
                    <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                            <FileText className="w-6 h-6 text-blue-600 mr-2" />
                            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                        </div>
                        <div className="text-sm text-blue-600">Всего заявок</div>
                    </CardContent>
                </Card>
                <Card className="bg-yellow-50/80 backdrop-blur-sm border-yellow-200">
                    <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                            <Clock className="w-6 h-6 text-yellow-600 mr-2" />
                            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                        </div>
                        <div className="text-sm text-yellow-600">Ожидают рассмотрения</div>
                    </CardContent>
                </Card>
                <Card className="bg-green-50/80 backdrop-blur-sm border-green-200">
                    <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                            <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                        </div>
                        <div className="text-sm text-green-600">Одобрено</div>
                    </CardContent>
                </Card>
                <Card className="bg-red-50/80 backdrop-blur-sm border-red-200">
                    <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                            <XCircle className="w-6 h-6 text-red-600 mr-2" />
                            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                        </div>
                        <div className="text-sm text-red-600">Отклонено</div>
                    </CardContent>
                </Card>
            </div>

            {/* Список заявок */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold text-gray-800">
                            Заявки на проведение мастер-классов
                        </h2>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="text-sm text-gray-600">
                                {wsConnected ? 'Автообновление' : 'Ручное обновление'}
                            </span>
                        </div>
                    </div>
                    <Button
                        onClick={loadData}
                        disabled={loading}
                        variant="outline"
                        className="flex items-center gap-2"
                    >
                        <FileText className="w-4 h-4" />
                        Обновить
                    </Button>
                </div>

                {/* Фильтры */}
                <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50/80 rounded-lg border">
                    {/* Фильтр по городу */}
                    <div className="flex flex-col space-y-2">
                        <label className="text-sm font-medium text-gray-700">Город</label>
                        <Select value={filters.city || "all"} onValueChange={(value) => setFilters(prev => ({ ...prev, city: value === "all" ? "" : value }))}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Выберите город" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Все города</SelectItem>
                                {uniqueCities.map((city) => (
                                    <SelectItem key={city} value={city}>
                                        {city}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Фильтр по школе */}
                    <div className="flex flex-col space-y-2">
                        <label className="text-sm font-medium text-gray-700">Школа</label>
                        <Select value={filters.school || "all"} onValueChange={(value) => setFilters(prev => ({ ...prev, school: value === "all" ? "" : value }))}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Выберите школу" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Все школы</SelectItem>
                                {filters.city ? getSchoolsForCity(filters.city).map((school) => (
                                    <SelectItem key={school} value={school}>
                                        {school}
                                    </SelectItem>
                                )) : null}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Фильтр по классу */}
                    <div className="flex flex-col space-y-2">
                        <label className="text-sm font-medium text-gray-700">Класс</label>
                        <Select value={filters.classGroup || "all"} onValueChange={(value) => setFilters(prev => ({ ...prev, classGroup: value === "all" ? "" : value }))}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Выберите класс" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Все классы</SelectItem>
                                {filters.school ? getClassesForSchool(filters.school).map((classGroup) => (
                                    <SelectItem key={classGroup} value={classGroup}>
                                        {classGroup}
                                    </SelectItem>
                                )) : null}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Фильтр по статусу */}
                    <div className="flex flex-col space-y-2">
                        <label className="text-sm font-medium text-gray-700">Статус</label>
                        <Select value={filters.status || "all"} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === "all" ? "" : value }))}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Выберите статус" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Все статусы</SelectItem>
                                <SelectItem value="pending">Ожидает рассмотрения</SelectItem>
                                <SelectItem value="approved">Одобрено</SelectItem>
                                <SelectItem value="rejected">Отклонено</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-end">
                        <Button
                            variant="outline"
                            onClick={() => setFilters({ city: '', school: '', classGroup: '', status: '' })}
                            className="flex items-center gap-2"
                        >
                            <XCircle className="w-4 h-4" />
                            Сбросить
                        </Button>
                    </div>
                </div>

                {/* Счетчик отфильтрованных заявок */}
                <div className="text-sm text-gray-600">
                    Показано {filteredRequests.length} из {requests.length} заявок
                    {filters.city || filters.school || filters.classGroup ? (
                        <span className="ml-2 text-blue-600">
                            (применены фильтры)
                        </span>
                    ) : null}
                </div>

                {requests.length === 0 ? (
                    <Card className="bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-8 text-center">
                            <div className="text-4xl mb-4">📋</div>
                            <div className="text-lg font-semibold text-gray-600 mb-2">
                                Заявок пока нет
                            </div>
                            <p className="text-gray-500">
                                Когда родители будут подавать заявки, они появятся здесь
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {filteredRequests.map((request) => (
                            <Card key={request.id} className="hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-gray-500" />
                                                <span className="font-medium">{request.school_name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <GraduationCap className="w-4 h-4 text-gray-500" />
                                                <span className="font-medium">{request.class_group}</span>
                                            </div>
                                        </div>
                                        <Badge className={`${getStatusColor(request.status)} border flex items-center gap-1`}>
                                            {getStatusIcon(request.status)}
                                            {getStatusText(request.status)}
                                        </Badge>
                                    </div>
                                    <CardDescription className="text-gray-600 flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            <span>
                                                {request.parent_name}
                                                {request.parent_surname && ` ${request.parent_surname}`}
                                            </span>
                                        </div>
                                        {request.parent_phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-4 h-4" />
                                                <span>{request.parent_phone}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4" />
                                            <span>{request.parent_email}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>{new Date(request.desired_date).toLocaleDateString('ru-RU')}</span>
                                        </div>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {request.notes && (
                                        <div className="text-sm">
                                            <span className="font-medium text-gray-700">Примечания:</span>
                                            <div className="text-gray-600 mt-1">{request.notes}</div>
                                        </div>
                                    )}
                                    {request.admin_notes && (
                                        <div className="text-sm">
                                            <span className="font-medium text-gray-700">Заметки администратора:</span>
                                            <div className="text-gray-600 mt-1">{request.admin_notes}</div>
                                        </div>
                                    )}
                                    <div className="text-xs text-gray-500 border-t pt-2">
                                        Создано: {new Date(request.created_at).toLocaleString('ru-RU')}
                                        {request.updated_at !== request.created_at &&
                                            ` • Обновлено: ${new Date(request.updated_at).toLocaleString('ru-RU')}`
                                        }
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleStatusChange(request)}
                                            className="flex items-center gap-1"
                                        >
                                            <FileText className="w-4 h-4" />
                                            Статус
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDeleteRequest(request.id)}
                                            className="flex items-center gap-1 text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Удалить
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>



            {/* Модальное окно изменения статуса */}
            <Dialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-900">
                            Изменить статус заявки
                        </DialogTitle>
                        <DialogDescription>
                            Обновите статус заявки и добавьте заметки
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <span className="font-medium text-gray-700">Родитель:</span>
                            <div className="text-gray-600">
                                {selectedRequest?.parent_name}
                                {selectedRequest?.parent_surname && ` ${selectedRequest.parent_surname}`}
                            </div>
                        </div>
                        {selectedRequest?.parent_phone && (
                            <div>
                                <span className="font-medium text-gray-700">Телефон:</span>
                                <div className="text-gray-600">{selectedRequest.parent_phone}</div>
                            </div>
                        )}
                        <div>
                            <span className="font-medium text-gray-700">Email:</span>
                            <div className="text-gray-600">{selectedRequest?.parent_email}</div>
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">Школа:</span>
                            <div className="text-gray-600">{selectedRequest?.school_name}</div>
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">Класс:</span>
                            <div className="text-gray-600">{selectedRequest?.class_group}</div>
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">Статус:</span>
                            <Select value={statusData.status} onValueChange={(value) => setStatusData(prev => ({ ...prev, status: value as 'pending' | 'approved' | 'rejected' }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Выберите статус" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Ожидает рассмотрения</SelectItem>
                                    <SelectItem value="approved">Одобрено</SelectItem>
                                    <SelectItem value="rejected">Отклонено</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">Заметки администратора:</span>
                            <Textarea
                                value={statusData.admin_notes}
                                onChange={(e) => setStatusData(prev => ({ ...prev, admin_notes: e.target.value }))}
                                placeholder="Добавьте заметки по заявке..."
                                className="mt-1"
                                rows={3}
                            />
                        </div>
                        <div className="flex justify-end space-x-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setIsStatusOpen(false)}
                            >
                                Отмена
                            </Button>
                            <Button
                                onClick={handleSaveStatus}
                                className="bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600 text-white"
                            >
                                Сохранить
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
