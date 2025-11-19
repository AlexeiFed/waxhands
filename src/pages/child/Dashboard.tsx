import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useMasterClasses } from "@/hooks/use-master-classes";
import { useSchools } from "@/hooks/use-schools";
import { useServices } from "@/hooks/use-services";
import { useWorkshopParticipation, useParticipantInvoices } from "@/hooks/use-invoices";
import { useWorkshopRegistrations } from "@/hooks/use-workshop-registrations";
import { Invoice, WorkshopRegistration, MasterClass } from "@/types";
import { ChildHeader } from "@/components/ui/child-header";
import { AnimatedStars } from "@/components/ui/animated-stars";
import StyleSelectionModal from "@/components/ui/style-selection-modal";
import { EmptyWorkshopState } from "@/components/ui/empty-workshop-state";
import InvoiceDetailsModal from "@/components/ui/invoice-details-modal";
import {
    Palette,
    Calendar,
    Clock,
    MapPin,
    Users,
    Star,
    Sparkles,
    PlayCircle,
    CheckCircle,
    AlertCircle,
} from "lucide-react";

interface WorkshopCardData {
    id: string;
    title: string;
    date: string;
    time: string;
    classGroup: string;
    schoolName?: string;
    city?: string;
    participationStatus?: 'none' | 'pending' | 'paid' | 'cancelled';
    invoiceId?: string;
    registration?: WorkshopRegistration;
    invoice?: Invoice;
    participantsCount?: number;
}

const ChildDashboard = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { masterClasses, fetchMasterClasses } = useMasterClasses();
    const { schools } = useSchools();
    const { services } = useServices();
    const { data: participantInvoices } = useParticipantInvoices(user?.id || '');
    const { getUserRegistrations } = useWorkshopRegistrations();
    const [selectedWorkshop, setSelectedWorkshop] = useState<WorkshopCardData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => {
        // Проверяем, был ли уже показан онбординг
        const hasSeenOnboarding = localStorage.getItem('child-onboarding-completed');
        return !hasSeenOnboarding;
    });
    const [onboardingStep, setOnboardingStep] = useState(0);
    const [videoDialogSrc, setVideoDialogSrc] = useState<string | null>(null);
    const [userRegistrations, setUserRegistrations] = useState<WorkshopRegistration[]>([]);
    const navigate = useNavigate();

    // Функция для правильного склонения слова "записался"
    const getParticipantsText = (count: number): string => {
        if (count === 0) return 'записались';
        if (count === 1) return 'записался';
        if (count >= 2 && count <= 4) return 'записались';
        return 'записалось';
    };

    // Загружаем мастер-классы с учетом школы и класса пользователя
    useEffect(() => {
        if (user?.id) {

            fetchMasterClasses({ userId: user.id });
        }
    }, [user?.id, fetchMasterClasses]);

    // Загружаем регистрации пользователя
    useEffect(() => {
        if (user?.id) {

            getUserRegistrations(user.id)
                .then(setUserRegistrations)
                .catch(console.error);
        }
    }, [user?.id, getUserRegistrations]);

    // Убираем фильтры - мастер-классы автоматически сортируются по релевантности

    // Видеогалерея компании — все .mp4 из src/assets/video
    const videoModules = useMemo(() => {
        const mods = import.meta.glob("@/assets/video/*.mp4", { eager: true }) as Record<string, { default: string }>;
        return Object.values(mods).map(m => m.default);
    }, []);

    const posterImages = useMemo(() => {
        const mods = import.meta.glob("@/assets/posters/*.{png,jpg,jpeg,webp}", { eager: true }) as Record<string, { default: string }>;
        const list = Object.entries(mods).map(([path, mod]) => ({
            src: (mod as { default: string }).default,
            order: (() => {
                const match = path.match(/onboarding-(\d+)/i);
                return match ? parseInt(match[1], 10) : 999;
            })(),
        }));
        return list.sort((a, b) => a.order - b.order).map(i => i.src);
    }, []);

    // Все доступные мастер-классы, отсортированные по приоритету школы и класса
    const availableEvents = useMemo(() => {
        const today = new Date().toISOString().slice(0, 10);

        console.log('Dashboard: Processing master classes for user:', {
            userId: user?.id,
            totalMasterClasses: masterClasses.length,
            today,
            masterClasses: masterClasses.map(mc => ({
                id: mc.id,
                date: mc.date,
                schoolName: mc.schoolName,
                classGroup: mc.classGroup,
                isAfterToday: mc.date >= today
            }))
        });

        const filteredEvents = masterClasses.filter(ev => {
            const isAfterToday = ev.date >= today;

            return isAfterToday;
        });

        return filteredEvents
            .sort((a, b) => {
                // Сортировка уже происходит на бэкенде по приоритету
                // Дополнительно сортируем по дате и времени
                if (a.date !== b.date) {
                    return a.date.localeCompare(b.date);
                }
                return a.time.localeCompare(b.time);
            });
    }, [masterClasses, user?.id]);

    const workshops: WorkshopCardData[] = useMemo(() => {
        console.log('Dashboard: Creating workshops from availableEvents:', {
            availableEventsCount: availableEvents.length,
            availableEvents: availableEvents.map(ev => ({
                id: ev.id,
                schoolName: ev.schoolName,
                classGroup: ev.classGroup,
                date: ev.date
            }))
        });

        return availableEvents.map(ev => {
            // Проверяем статус участия по счетам
            const invoice = participantInvoices?.invoices?.find(inv => inv.master_class_id === ev.id);
            const participationStatus = invoice ? invoice.status : 'none';

            // Проверяем регистрацию пользователя
            const registration = userRegistrations.find(reg => reg.workshopId === ev.id);

            // Получаем количество участников из master_class_events
            const participantsCount = ev.participants ? ev.participants.length : 0;

            return {
                id: ev.id,
                title: (services.find(s => s.id === ev.serviceId)?.name) || 'Мастер‑класс',
                date: ev.date,
                time: ev.time,
                classGroup: ev.classGroup,
                schoolName: (schools.find(s => s.id === ev.schoolId)?.name) || ev.schoolName || user?.schoolName,
                city: ev.city || (schools.find(s => s.id === ev.schoolId)?.address.split(',')[0].trim()) || 'Не указан',
                participationStatus,
                invoiceId: invoice?.id,
                registration,
                invoice,
                participantsCount
            };
        });
    }, [availableEvents, services, schools, user?.schoolName, participantInvoices, userRegistrations]);

    // Флаг localStorage отключён на время разработки — онбординг показывается всегда

    const handleWorkshopClick = (workshop: WorkshopCardData) => {
        setSelectedWorkshop(workshop);
        setIsModalOpen(true);
    };

    // Функция для обновления данных после успешной записи
    const refreshData = async () => {
        if (user?.id) {
            try {

                // Инвалидируем все связанные кэши React Query
                await queryClient.invalidateQueries({ queryKey: ['masterClasses'] });
                await queryClient.invalidateQueries({ queryKey: ['invoices'] });
                await queryClient.invalidateQueries({ queryKey: ['workshop-registrations'] });
                await queryClient.invalidateQueries({ queryKey: ['invoices', 'participant', user.id] });

                // Обновляем регистрации пользователя
                const updatedRegistrations = await getUserRegistrations(user.id);
                setUserRegistrations(updatedRegistrations);

                // Обновляем мастер-классы с актуальными данными
                await fetchMasterClasses({ userId: user.id });

            } catch (error) {
                console.error('Ошибка при обновлении данных:', error);
            }
        }
    };

    const handleRequestWorkshop = () => {
        setIsRequestModalOpen(true);
    };

    const handleSubmitApplication = () => {
        toast({
            title: "Заявка отправлена! 🎉",
            description: "Мы свяжемся с твоими родителями для подтверждения",
        });
        setIsRequestModalOpen(false);
    };

    // Обработчик просмотра деталей заказа
    const handleViewOrderDetails = (workshop: WorkshopCardData) => {
        const statusText = workshop.participationStatus === 'paid' ? 'оплачен' :
            workshop.participationStatus === 'pending' ? 'ожидает оплаты' : 'отменен';

        toast({
            title: "Детали заказа",
            description: `Твой заказ на мастер-класс "${workshop.title}" - ${statusText}`,
        });

        // TODO: Открыть модальное окно с деталями заказа

    };

    return (
        <div className="min-h-screen bg-gradient-wax-hands relative overflow-hidden">
            {/* Анимированные звездочки */}
            <AnimatedStars count={20} className="opacity-60" />

            {/* Заголовок */}
            <ChildHeader />

            {/* Основной контент */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
                {/* Приветствие */}
                <div className="text-center mb-6 sm:mb-8">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-3 sm:mb-4">
                        Привет, {user?.name}! 👋
                    </h1>
                    <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-2">
                        Выбери мастер-класс и создай свою уникальную восковую ручку!
                    </p>
                </div>

                {/* Информационная карточка */}
                <Card className="bg-white/80 backdrop-blur-sm border-orange-200 mb-6 sm:mb-8 mx-2 sm:mx-0">
                    <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="flex items-center space-x-2 text-gray-800 text-lg sm:text-xl">
                            <Sparkles className="w-5 h-5 text-orange-600" />
                            <span>Твои мастер-классы</span>
                        </CardTitle>
                        <CardDescription className="text-sm sm:text-base">
                            Мастер-классы отсортированы специально для тебя: сначала в твоем классе, потом в твоей школе
                        </CardDescription>
                    </CardHeader>
                </Card>

                {/* Мастер-классы или заглушка */}
                {workshops.length > 0 ? (
                    <div className="space-y-4 sm:space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center space-x-2">
                                <Palette className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                                <span>Мастер‑классы в твоем классе</span>
                            </h2>
                            <Badge variant="secondary" className="text-sm self-start sm:self-auto">
                                {workshops.length} найдено
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:gap-6">
                            {workshops.map((workshop) => (
                                <Card
                                    key={workshop.id}
                                    className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl bg-gradient-to-br from-orange-50 to-purple-50 border-orange-300 mx-2 sm:mx-0`}
                                    onClick={() => handleWorkshopClick(workshop)}
                                >
                                    <CardHeader className="relative p-4 sm:p-6">
                                        <div className="absolute top-2 right-2 flex flex-col gap-1">
                                            <Badge className="bg-orange-500 text-white text-xs">⭐ Твой класс</Badge>
                                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                                🎯 {workshop.participantsCount || 0} {getParticipantsText(workshop.participantsCount || 0)}
                                            </Badge>
                                            {workshop.participationStatus !== 'none' && (
                                                <Badge
                                                    variant={workshop.participationStatus === 'paid' ? 'default' :
                                                        workshop.participationStatus === 'pending' ? 'secondary' : 'destructive'}
                                                    className="text-xs"
                                                >
                                                    {workshop.participationStatus === 'paid' ? '✅ Оплачено' :
                                                        workshop.participationStatus === 'pending' ? '⏳ Ожидает оплаты' :
                                                            '❌ Отменено'}
                                                </Badge>
                                            )}
                                        </div>
                                        <CardTitle className="text-lg sm:text-xl text-orange-600 flex items-center space-x-2">
                                            <Palette className="w-5 h-5" />
                                            <span>{workshop.title}</span>
                                        </CardTitle>
                                        <CardDescription className="text-sm">Студия: МК Восковые ручки</CardDescription>
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
                                                <div className="w-4 h-4 text-gray-500 flex items-center justify-center">
                                                    <span className="text-lg">🎯</span>
                                                </div>
                                                <span>Записались: {workshop.participantsCount || 0} {getParticipantsText(workshop.participantsCount || 0)}</span>
                                            </div>
                                        </div>

                                        {/* Детальная информация о статусе участия */}
                                        {workshop.participationStatus !== 'none' && (
                                            <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                                                <div className="text-sm font-medium text-gray-700 mb-2">
                                                    Твой статус участия:
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-gray-600">Статус:</span>
                                                    <Badge
                                                        variant={
                                                            workshop.participationStatus === 'paid' ? 'default' :
                                                                workshop.participationStatus === 'pending' ? 'secondary' : 'destructive'
                                                        }
                                                        className="text-xs"
                                                    >
                                                        {workshop.participationStatus === 'paid' ? '✅ Оплачено' :
                                                            workshop.participationStatus === 'pending' ? '⏳ Ожидает оплаты' :
                                                                '❌ Отменено'}
                                                    </Badge>
                                                </div>
                                                {workshop.registration && (
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-gray-600">Регистрация:</span>
                                                        <span className="text-blue-600">#{workshop.registration.id?.slice(0, 8)}</span>
                                                    </div>
                                                )}
                                                {workshop.invoice && (
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-gray-600">Счет:</span>
                                                        <span className="text-green-600">#{workshop.invoice.id?.slice(0, 8)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Кнопки в зависимости от статуса участия */}
                                        {workshop.participationStatus === 'none' ? (
                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleWorkshopClick(workshop);
                                                }}
                                                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                                            >
                                                🎨 Хочу участвовать
                                            </Button>
                                        ) : workshop.participationStatus === 'pending' ? (
                                            <div className="space-y-2">
                                                <Button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Показать детали счета
                                                        const invoice = participantInvoices?.invoices?.find(inv => inv.id === workshop.invoiceId);
                                                        if (invoice) {
                                                            setSelectedInvoice(invoice);
                                                            setIsInvoiceModalOpen(true);
                                                        }
                                                    }}
                                                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                                                >
                                                    📋 Посмотреть счет
                                                </Button>
                                                <Button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewOrderDetails(workshop);
                                                    }}
                                                    variant="outline"
                                                    className="w-full"
                                                >
                                                    🔍 Детали заказа
                                                </Button>
                                                <p className="text-xs text-gray-600 text-center">
                                                    Ожидаем оплату
                                                </p>
                                            </div>
                                        ) : workshop.participationStatus === 'paid' ? (
                                            <div className="space-y-2">
                                                <Button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewOrderDetails(workshop);
                                                    }}
                                                    className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                                                >
                                                    ✅ Посмотреть детали
                                                </Button>
                                                <p className="text-xs text-green-600 text-center">
                                                    Ждем тебя на мастер-классе!
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewOrderDetails(workshop);
                                                    }}
                                                    variant="outline"
                                                    className="w-full"
                                                >
                                                    🔍 Детали отмены
                                                </Button>
                                                <p className="text-xs text-gray-600 text-center">
                                                    Счет был отменен
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        {/* О компании */}
                        <Card className="bg-white/80 backdrop-blur-sm border-purple-200 mx-2 sm:mx-0">
                            <CardHeader className="p-4 sm:p-6">
                                <CardTitle className="text-lg sm:text-xl">О студии «МК Восковые ручки»</CardTitle>
                                <CardDescription className="text-sm sm:text-base">Захватывающий процесс, море эмоций и безопасно!</CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6 pt-0">
                                <div className="grid grid-cols-1 gap-4">
                                    {videoModules.map((src) => (
                                        <div key={src} className="relative group rounded-lg overflow-hidden border">
                                            <video src={src} className="w-full h-44 object-cover" muted preload="metadata" />
                                            <button
                                                className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition"
                                                onClick={() => setVideoDialogSrc(src)}
                                                aria-label="Смотреть видео"
                                            >
                                                <PlayCircle className="w-12 h-12 text-white" />
                                            </button>
                                        </div>
                                    ))}
                                    {videoModules.length === 0 && (
                                        <div className="text-sm text-gray-600 text-center py-4">Добавьте видео в папку `src/assets/video` — они появятся здесь автоматически.</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <EmptyWorkshopState onRequestWorkshop={handleRequestWorkshop} />
                )}
            </div>

            {/* Модальное окно выбора стиля для восковой ручки */}
            {selectedWorkshop && (
                <StyleSelectionModal
                    workshop={selectedWorkshop}
                    isOpen={isModalOpen}
                    onOpenChange={(open) => {
                        if (!open) {
                            setIsModalOpen(false);
                            setSelectedWorkshop(null);
                        }
                    }}
                    participantId={user?.id}
                    participantName={user?.name ? `${user.name} ${user.surname || ''}`.trim() : undefined}
                    onRegistrationSuccess={refreshData}
                />
            )}

            {/* Видео диалог */}
            <Dialog open={!!videoDialogSrc} onOpenChange={(o) => !o && setVideoDialogSrc(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader className="text-center">
                        <DialogTitle className="text-lg sm:text-xl">Видео о мастер‑классе</DialogTitle>
                        <DialogDescription>
                            Просмотр видео о мастер-классе
                        </DialogDescription>
                    </DialogHeader>
                    {videoDialogSrc && (
                        <video src={videoDialogSrc} className="w-full rounded-lg" controls autoPlay />
                    )}
                </DialogContent>
            </Dialog>

            {/* Онбординг */}
            <Dialog open={isOnboardingOpen} onOpenChange={setIsOnboardingOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader className="text-center">
                        <DialogTitle className="text-2xl sm:text-xl">Давай познакомимся! ✨</DialogTitle>
                        <DialogDescription className="text-base sm:text-sm">Как проходит мастер‑класс «Восковые ручки»</DialogDescription>
                    </DialogHeader>
                    {(() => {
                        const slides = [
                            {
                                title: 'Придумай жест',
                                text: 'Выбери любую форму руки — покажи любимый жест!',
                                image: posterImages[0],
                            },
                            {
                                title: 'Тёплый безопасный воск',
                                text: 'Быстро окунаем руку в тёплый воск — это приятно и безопасно.',
                                media: videoModules[0],
                                image: posterImages[1],
                            },
                            {
                                title: 'Украшаем',
                                text: 'Выбирай стиль и опции: световые ручки, блёстки, лакировка и надпись.',
                                image: posterImages[2],
                            },
                            {
                                title: 'Готово за 5 минут!',
                                text: 'Забирай готовый сувенир и делись с друзьями!',
                                image: posterImages[3],
                            },
                        ];
                        const step = slides[Math.min(onboardingStep, slides.length - 1)];
                        return (
                            <div className="space-y-6">
                                <div className="space-y-3 text-center">
                                    <h3 className="text-xl font-bold text-gray-800">{step.title}</h3>
                                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{step.text}</p>
                                </div>

                                <div className="w-full overflow-hidden rounded-xl bg-white/50 shadow-lg">
                                    {step.media && onboardingStep >= 1 ? (
                                        <video src={step.media} className="w-full aspect-video object-cover" muted autoPlay loop playsInline />
                                    ) : step.image ? (
                                        <img src={step.image} className="w-full aspect-video object-cover" alt={step.title} />
                                    ) : (
                                        <div className="w-full aspect-video bg-gradient-to-r from-orange-100 to-purple-100 flex items-center justify-center">
                                            <div className="text-gray-500 text-sm">Изображение</div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-center gap-2">
                                        {slides.map((_, idx) => (
                                            <div key={idx} className={`h-3 w-3 rounded-full transition-all duration-200 ${idx === onboardingStep ? 'bg-orange-500 scale-110' : 'bg-orange-200'}`} />
                                        ))}
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                        {onboardingStep > 0 && (
                                            <Button
                                                variant="outline"
                                                onClick={() => setOnboardingStep(s => Math.max(0, s - 1))}
                                                className="flex-1 sm:flex-none min-w-[120px]"
                                            >
                                                Назад
                                            </Button>
                                        )}

                                        {onboardingStep < slides.length - 1 ? (
                                            <Button
                                                className="bg-gradient-to-r from-orange-500 to-purple-500 text-white hover:from-orange-600 hover:to-purple-600 flex-1 sm:flex-none min-w-[120px]"
                                                onClick={() => setOnboardingStep(s => Math.min(slides.length - 1, s + 1))}
                                            >
                                                Далее
                                            </Button>
                                        ) : (
                                            <div className="flex flex-col sm:flex-row gap-3 w-full">
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => {
                                                        setIsOnboardingOpen(false);
                                                        localStorage.setItem('child-onboarding-completed', 'true');
                                                        navigate('/child/about');
                                                    }}
                                                    className="flex-1 sm:flex-none min-w-[120px]"
                                                >
                                                    Больше видео
                                                </Button>
                                                <Button
                                                    className="bg-gradient-to-r from-orange-500 to-purple-500 text-white hover:from-orange-600 hover:to-purple-600 flex-1 sm:flex-none min-w-[120px]"
                                                    onClick={() => {
                                                        setIsOnboardingOpen(false);
                                                        localStorage.setItem('child-onboarding-completed', 'true');
                                                    }}
                                                >
                                                    Погнали!
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </DialogContent>
            </Dialog>

            {/* Модальное окно деталей счета */}
            {selectedInvoice && (
                <InvoiceDetailsModal
                    invoice={selectedInvoice}
                    isOpen={isInvoiceModalOpen}
                    onOpenChange={(open) => {
                        if (!open) {
                            setIsInvoiceModalOpen(false);
                            setSelectedInvoice(null);
                        }
                    }}
                />
            )}
        </div>
    );
};

export default ChildDashboard; 