/**
 * @file: multi-child-workshop-modal.tsx
 * @description: Модальное окно для записи нескольких детей на мастер-класс с пошаговым процессом
 * @dependencies: Dialog, Card, Button, Checkbox, useAuth, useServices, useToast
 * @created: 2024-12-19
 */

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AnimatedStars } from '@/components/ui/animated-stars';
import { PhotoGalleryModal } from '@/components/ui/photo-gallery-modal';
import { VideoPlayerModal } from '@/components/ui/video-player-modal';
import { useAuth } from '@/contexts/AuthContext';
import { useServices } from '@/hooks/use-services';
import { useToast } from '@/hooks/use-toast';
import { useIsSmallScreen } from '@/hooks/use-mobile';
import { api } from '@/lib/api';
import { getFileUrl } from '@/lib/config';
import { AvatarDisplay } from './avatar-display';
import { Service, ServiceStyle, ServiceOption } from '@/types/services';
import { WorkshopRegistration, Invoice } from '@/types';
import YandexPaymentButton from '@/components/ui/yandex-payment-button';
import {
    Calendar,
    Clock,
    MapPin,
    Users,
    Palette,
    Sparkles,
    CheckCircle,
    AlertCircle,
    Info,
    Image,
    Video,
    X,
    Star,
    Brain,
    Camera,
    Gift,
    Lock,
    CreditCard,
    FileText,
    MessageCircle
} from 'lucide-react';

// Компонент для выбора количества
interface QuantitySelectorProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    disabled?: boolean;
    size?: 'sm' | 'md';
}

const QuantitySelector = ({
    value,
    onChange,
    min = 1,
    max = 10,
    disabled = false,
    size = 'sm'
}: QuantitySelectorProps) => {
    const isSmall = size === 'sm';

    return (
        <div className="flex items-center space-x-1">
            <Button
                size={isSmall ? "sm" : "default"}
                variant="outline"
                onClick={() => onChange(Math.max(min, value - 1))}
                disabled={disabled || value <= min}
                className={`${isSmall ? 'h-6 w-6 p-0' : 'h-8 w-8 p-0'} text-xs font-bold`}
            >
                -
            </Button>
            <span className={`${isSmall ? 'w-6 text-xs' : 'w-8 text-sm'} text-center font-medium`}>{value}</span>
            <Button
                size={isSmall ? "sm" : "default"}
                variant="outline"
                onClick={() => onChange(Math.min(max, value + 1))}
                disabled={disabled || value >= max}
                className={`${isSmall ? 'h-6 w-6 p-0' : 'h-8 w-8 p-0'} text-xs font-bold`}
            >
                +
            </Button>
        </div>
    );
};

interface WorkshopCardData {
    id: string;
    title: string;
    schoolId: string;
    schoolName: string;
    classGroup: string;
    date: string;
    time: string;
    serviceId: string;
    eligibleChildren: ChildData[];
    participationStatus?: 'none' | 'pending' | 'paid' | 'cancelled';
    childrenWithStatus?: Array<{
        childId: string;
        childName: string;
        status: 'none' | 'pending' | 'paid' | 'cancelled';
        invoiceId?: string;
        registrationId?: string;
        registration?: WorkshopRegistration;
        invoice?: Invoice;
    }>;
    invoiceStatus?: 'pending' | 'paid' | 'cancelled';
}

interface ChildData {
    id: string;
    name: string;
    age: number;
    schoolId: string;
    classGroup: string;
    parentId?: string; // ID родителя (для регистрации админом)
    parentName?: string; // Имя родителя
    parentSurname?: string; // Фамилия родителя
    parentPhone?: string; // Телефон родителя
}

interface MultiChildWorkshopModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    workshop: WorkshopCardData | null;
    children: ChildData[];
    onRegistrationSuccess?: () => void;
    masterClasses?: Array<{
        id: string;
        participants?: Array<{
            childId: string;
            selectedStyles: string[];
            selectedOptions: string[];
            totalAmount: number;
        }>;
    }>;
}

interface SelectedOptions {
    [childId: string]: {
        styles: string[];
        options: string[];
        totalAmount: number;
        isCompleted: boolean;
    };
}

interface ChildRegistration {
    childId: string;
    childName: string;
    childAge: number;
    selectedStyles: Array<{
        styleId: string;
        quantity: number;
        price: number;
    }>;
    selectedOptions: Array<{
        optionId: string;
        quantity: number;
        price: number;
    }>;
    totalAmount: number;
    isCompleted: boolean;
    notes?: string; // Примечания к заказу
}

// Убрана группировка - теперь можно выбирать все стили и опции

// Возрастные ограничения для стилей
const AGE_RESTRICTIONS = {
    'Двойные ручки': { min: 5, max: 18 },
    'Двойные световые ручки': { min: 5, max: 18 }
};

export default function MultiChildWorkshopModal({
    isOpen,
    onOpenChange,
    workshop,
    children,
    onRegistrationSuccess,
    masterClasses = []
}: MultiChildWorkshopModalProps) {

    const { user } = useAuth();
    const { services } = useServices();
    const { toast } = useToast();
    const isSmallScreen = useIsSmallScreen();

    // Состояния для модальных окон медиа
    const [isPhotoCarouselOpen, setIsPhotoCarouselOpen] = useState(false);
    const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
    const [currentMedia, setCurrentMedia] = useState<{
        type: 'photo' | 'video';
        urls: string[];
        currentIndex: number;
        title: string;
    } | null>(null);

    // Состояния для регистраций детей
    const [childRegistrations, setChildRegistrations] = useState<ChildRegistration[]>([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [currentService, setCurrentService] = useState<Service | null>(null);

    // Состояния для отправки
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCancelled, setIsCancelled] = useState(false);
    const [submitProgress, setSubmitProgress] = useState(0);
    const [currentSubmittingChild, setCurrentSubmittingChild] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    // Состояния для оплаты
    const [createdInvoices, setCreatedInvoices] = useState<Invoice[]>([]);
    const [showPaymentSection, setShowPaymentSection] = useState(false);

    // Флаг для отмены отправки
    const cancelRef = useRef(false);

    // Сброс состояния при закрытии окна
    useEffect(() => {
        if (!isOpen) {
            // Сбрасываем состояние только если окно закрыто
            setShowPaymentSection(false);
            setCreatedInvoices([]);
            setIsSuccess(false);
        }
    }, [isOpen]);

    // Определяем режим модального окна
    const isViewMode = workshop?.participationStatus && workshop.participationStatus !== 'none';

    // Инициализация регистраций для каждого ребенка
    useEffect(() => {
        if (children && children.length > 0) {
            // Проверяем, есть ли уже данные в childRegistrations
            const hasExistingData = childRegistrations.length > 0 &&
                childRegistrations.some(reg =>
                    reg.selectedStyles.length > 0 ||
                    reg.selectedOptions.length > 0 ||
                    reg.totalAmount > 0
                );

            // Если есть существующие данные, не обнуляем их
            if (hasExistingData) {
                console.log('🔒 Сохраняем существующие данные регистрации');
                return;
            }

            const registrations = children.map(child => ({
                childId: child.id,
                childName: child.name,
                childAge: child.age,
                selectedStyles: [],
                selectedOptions: [],
                totalAmount: 0,
                isCompleted: false
            }));
            setChildRegistrations(registrations);
        }
    }, [children, childRegistrations]);

    // Проверка и фильтрация уже записанных детей (только при открытии модального окна)
    useEffect(() => {
        const checkExistingRegistrations = async () => {
            if (!workshop || !children || children.length === 0 || !isOpen) return;

            try {

                const existingRegistrations = await api.workshopRegistrations.getRegistrations(workshop.id);
                const existingUserIds = existingRegistrations.map(reg => reg.userId);

                const alreadyRegistered = children.filter(child =>
                    existingUserIds.includes(child.id)
                );

                if (alreadyRegistered.length > 0) {
                    const names = alreadyRegistered.map(child => child.name).join(', ');
                    toast({
                        title: "Внимание",
                        description: `Следующие дети уже записаны на этот мастер-класс: ${names}. Они будут исключены из формы записи.`,
                        variant: "default",
                        duration: 8000,
                    });

                    // Фильтруем детей, исключая уже записанных
                    const availableChildren = children.filter(child =>
                        !existingUserIds.includes(child.id)
                    );

                    if (availableChildren.length === 0) {
                        toast({
                            title: "Все дети уже записаны",
                            description: "Все ваши дети уже записаны на этот мастер-класс. Закройте это окно.",
                            variant: "destructive",
                            duration: 10000,
                        });
                        // Закрываем модальное окно
                        setTimeout(() => onOpenChange(false), 2000);
                        return;
                    }

                    // Обновляем список детей только доступными, но сохраняем существующие данные
                    const registrations = availableChildren.map(child => ({
                        childId: child.id,
                        childName: child.name,
                        childAge: child.age,
                        selectedStyles: [],
                        selectedOptions: [],
                        totalAmount: 0,
                        isCompleted: false
                    }));

                    // Проверяем, есть ли уже данные в childRegistrations для этих детей
                    const existingRegistrationsData = childRegistrations.filter(reg =>
                        availableChildren.some(child => child.id === reg.childId)
                    );

                    // Если есть существующие данные, сохраняем их
                    if (existingRegistrationsData.length > 0) {
                        const updatedRegistrations = registrations.map(newReg => {
                            const existing = existingRegistrationsData.find(existing => existing.childId === newReg.childId);
                            return existing || newReg;
                        });
                        setChildRegistrations(updatedRegistrations);
                    } else {
                        setChildRegistrations(registrations);
                    }
                }
            } catch (error) {
                console.warn('⚠️ Не удалось проверить существующие регистрации при инициализации:', error);
                // Продолжаем с исходным списком детей
            }
        };

        checkExistingRegistrations();
    }, [workshop?.id, children, toast, isOpen]); // Убрали onOpenChange из зависимостей

    // Поиск сервиса по названию мастер-класса
    useEffect(() => {
        if (workshop && services) {
            const service = services.find(s => s.id === workshop.serviceId);
            setCurrentService(service || null);
        }
    }, [workshop, services]);

    const getCurrentChild = () => childRegistrations[currentStep];
    const getCurrentChildTotal = () => getCurrentChild()?.totalAmount || 0;

    // Вспомогательные функции для работы с количеством
    const getStyleQuantity = (styleId: string) => {
        const currentChild = getCurrentChild();
        const styleSelection = currentChild?.selectedStyles.find(s => s.styleId === styleId);
        return styleSelection?.quantity || 0;
    };

    const getOptionQuantity = (optionId: string) => {
        const currentChild = getCurrentChild();
        const optionSelection = currentChild?.selectedOptions.find(o => o.optionId === optionId);
        return optionSelection?.quantity || 0;
    };

    const isStyleSelected = (styleId: string) => {
        return getStyleQuantity(styleId) > 0;
    };

    const isOptionSelected = (optionId: string) => {
        return getOptionQuantity(optionId) > 0;
    };

    // Убрана проверка взаимоисключающих стилей - теперь можно выбирать все

    // Проверка возрастных ограничений
    const isStyleAgeRestricted = (styleName: string, childAge: number) => {
        const restriction = AGE_RESTRICTIONS[styleName as keyof typeof AGE_RESTRICTIONS];
        if (!restriction) return true;

        return childAge >= restriction.min && childAge <= restriction.max;
    };

    // Проверка блокировки стиля (только возрастные ограничения)
    const isStyleBlocked = (styleName: string, childAge: number, selectedStyles: Array<{ styleId: string; quantity: number; price: number }>) => {
        return !isStyleAgeRestricted(styleName, childAge);
    };

    // Получение доступных стилей для ребенка
    const getAvailableStyles = (childAge: number, selectedStyles: Array<{ styleId: string; quantity: number; price: number }>) => {
        if (!currentService) return [];

        return currentService.styles.filter(style => {
            const isBlocked = isStyleBlocked(style.name, childAge, selectedStyles);
            return !isBlocked;
        });
    };

    // Получение заблокированных стилей для ребенка
    const getBlockedStyles = (childAge: number, selectedStyles: Array<{ styleId: string; quantity: number; price: number }>) => {
        if (!currentService) return [];

        return currentService.styles.filter(style => {
            return isStyleBlocked(style.name, childAge, selectedStyles);
        });
    };

    // Получение описания стиля
    const getStyleDescription = (styleName: string): string => {
        const descriptions: { [key: string]: string } = {
            'Обычная ручка': 'Интерактивная раскраска руки с выбором жестов и подставок',
            'Световая ручка': 'Во внутрь руки помещается светодиод, который мигает различными цветами',
            'Двойные ручки': 'Двойные обычные ручки для детей от 5 лет: запястья вместе, выбор формы (сердечко, замок и др.) и раскраска в любые цвета',
            'Двойные световые ручки': 'Во внутрь рук помещается 2 светодиода, которые мигают различными цветами'
        };
        return descriptions[styleName] || styleName;
    };

    // Получение описания опции
    const getOptionDescription = (optionName: string): string => {
        const descriptions: { [key: string]: string } = {
            'Лакировка': 'Покрытие специальным лаком для блеска и защиты',
            'Лакировка с блестками': 'Лакировка с добавлением блесток для особого эффекта',
            'Надпись': 'Персонализированная надпись на ручке',
            'Надпись световая': 'Светящаяся надпись с LED подсветкой',
            'Наклейка': 'Декоративная наклейка на ручку',
            'Наклейка объемная': 'Объемная 3D наклейка для особого эффекта'
        };
        return descriptions[optionName] || optionName;
    };

    // Проверка существования файла
    const checkFileExists = async (url: string): Promise<boolean> => {
        if (!url || typeof url !== 'string') return false;

        try {
            // Используем getFileUrl для правильного формирования URL
            const absoluteUrl = getFileUrl(url);

            // Проверяем что URL валидный
            const urlObj = new URL(absoluteUrl);
            if (!urlObj.protocol.startsWith('http')) return false;

            const response = await fetch(absoluteUrl, {
                method: 'HEAD',
                mode: 'cors',
                cache: 'no-cache'
            });

            const exists = response.ok;

            return exists;
        } catch (error) {
            console.error(`Ошибка при проверке файла ${url}:`, error);
            return false;
        }
    };

    // Фильтрация существующих файлов
    const filterExistingFiles = async (urls: string[]): Promise<string[]> => {
        if (!Array.isArray(urls) || urls.length === 0) return [];

        const existingFiles: string[] = [];
        const validUrls = urls.filter(url => url && typeof url === 'string');

        for (const url of validUrls) {
            const exists = await checkFileExists(url);

            if (exists) {
                // Возвращаем абсолютный URL для существующих файлов
                const absoluteUrl = getFileUrl(url);
                existingFiles.push(absoluteUrl);
            }
        }

        return existingFiles;
    };

    // Открытие галереи фото
    const openPhotoCarousel = async (images: string[], title: string) => {

        if (!Array.isArray(images) || images.length === 0) {
            toast({
                title: "Нет фотографий",
                description: "Для этого элемента фотографии не найдены",
                variant: "destructive",
            });
            return;
        }

        try {
            // Проверяем существование файлов
            const existingImages = await filterExistingFiles(images);

            if (existingImages.length === 0) {
                toast({
                    title: "Фотографии недоступны",
                    description: "Файлы изображений не найдены или недоступны",
                    variant: "destructive",
                });
                return;
            }

            // Плавная анимация открытия
            setCurrentMedia({ type: 'photo', urls: existingImages, currentIndex: 0, title });

            // Небольшая задержка для плавности
            setTimeout(() => {
                setIsPhotoCarouselOpen(true);
            }, 100);
        } catch (error) {
            console.error('Ошибка при открытии галереи:', error);
            toast({
                title: "Ошибка",
                description: "Не удалось открыть галерею фотографий",
                variant: "destructive",
            });
        }
    };

    // Открытие видео плеера
    const openVideoPlayer = async (videos: string[], title: string) => {

        if (!Array.isArray(videos) || videos.length === 0) {
            toast({
                title: "Нет видео",
                description: "Для этого элемента видео не найдены",
                variant: "destructive",
            });
            return;
        }

        try {
            // Проверяем существование файлов
            const existingVideos = await filterExistingFiles(videos);

            if (existingVideos.length === 0) {
                toast({
                    title: "Видео недоступно",
                    description: "Файлы видео не найдены или недоступны",
                    variant: "destructive",
                });
                return;
            }

            // Плавная анимация открытия
            setCurrentMedia({ type: 'video', urls: existingVideos, currentIndex: 0, title });

            // Небольшая задержка для плавности
            setTimeout(() => {
                setIsVideoPlayerOpen(true);
            }, 100);
        } catch (error) {
            console.error('Ошибка при открытии видео:', error);
            toast({
                title: "Ошибка",
                description: "Не удалось открыть видео плеер",
                variant: "destructive",
            });
        }
    };

    // Изменение количества стиля
    const handleStyleQuantityChange = (styleId: string, quantity: number) => {
        const currentChild = getCurrentChild();
        if (!currentChild) return;

        setChildRegistrations(prev => prev.map(reg => {
            if (reg.childId === currentChild.childId) {
                let newStyles = [...reg.selectedStyles];
                const style = currentService?.styles.find(s => s.id === styleId);

                if (!style) return reg;

                if (quantity === 0) {
                    // Удаляем стиль если количество 0
                    newStyles = newStyles.filter(s => s.styleId !== styleId);
                } else {
                    // Добавляем или обновляем стиль (группировка убрана)
                    const existingIndex = newStyles.findIndex(s => s.styleId === styleId);
                    if (existingIndex >= 0) {
                        newStyles[existingIndex] = {
                            styleId,
                            quantity,
                            price: style.price
                        };
                    } else {
                        newStyles.push({
                            styleId,
                            quantity,
                            price: style.price
                        });
                    }
                }

                // Пересчитываем стоимость
                const stylesCost = newStyles.reduce((sum, s) => sum + (s.price * s.quantity), 0);
                const optionsCost = reg.selectedOptions.reduce((sum, o) => sum + (o.price * o.quantity), 0);

                return {
                    ...reg,
                    selectedStyles: newStyles,
                    totalAmount: stylesCost + optionsCost
                };
            }
            return reg;
        }));
    };

    // Изменение количества опции
    const handleOptionQuantityChange = (optionId: string, quantity: number) => {
        const currentChild = getCurrentChild();
        if (!currentChild) return;

        const option = currentService?.options.find(o => o.id === optionId);
        if (!option) return;

        setChildRegistrations(prev => prev.map(reg => {
            if (reg.childId === currentChild.childId) {
                let newOptions = [...reg.selectedOptions];

                if (quantity === 0) {
                    // Удаляем опцию если количество 0
                    newOptions = newOptions.filter(o => o.optionId !== optionId);
                } else {
                    // Добавляем или обновляем опцию (группировка убрана)
                    const existingIndex = newOptions.findIndex(o => o.optionId === optionId);
                    if (existingIndex >= 0) {
                        newOptions[existingIndex] = {
                            optionId,
                            quantity,
                            price: option.price
                        };
                    } else {
                        newOptions.push({
                            optionId,
                            quantity,
                            price: option.price
                        });
                    }
                }

                // Пересчитываем стоимость
                const stylesCost = reg.selectedStyles.reduce((sum, s) => sum + (s.price * s.quantity), 0);
                const optionsCost = newOptions.reduce((sum, o) => sum + (o.price * o.quantity), 0);

                return {
                    ...reg,
                    selectedOptions: newOptions,
                    totalAmount: stylesCost + optionsCost
                };
            }
            return reg;
        }));
    };

    // Переход к следующему шагу
    const handleNextStep = () => {
        const currentChild = getCurrentChild();
        if (!currentChild) return;

        // Проверяем, что выбран хотя бы один стиль
        const hasSelectedStyles = currentChild.selectedStyles.some(s => s.quantity > 0);
        if (!hasSelectedStyles) {
            toast({
                title: "Ошибка",
                description: `Выберите хотя бы один вариант ручки для ${currentChild.childName}`,
                variant: "destructive"
            });
            return;
        }

        // Отмечаем текущего ребенка как завершенного
        setChildRegistrations(prev => prev.map(reg => {
            if (reg.childId === currentChild.childId) {
                return { ...reg, isCompleted: true };
            }
            return reg;
        }));

        // Переходим к следующему ребенку или к итоговой информации
        if (currentStep < children.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            // Все дети завершены, показываем итоговую информацию
            setCurrentStep(currentStep + 1);
        }
    };

    // Переход к предыдущему шагу
    const handlePrevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    // Валидация данных регистрации
    const validateRegistrationData = (): { isValid: boolean; errors: string[] } => {
        const errors: string[] = [];

        if (!currentService) {
            errors.push("Сервис не найден");
            return { isValid: false, errors };
        }

        for (const reg of childRegistrations) {
            // Проверяем что у каждого ребенка выбран хотя бы один стиль
            const hasSelectedStyles = reg.selectedStyles.some(s => s.quantity > 0);
            if (!hasSelectedStyles) {
                errors.push(`${reg.childName}: не выбран ни один вариант ручки`);
                continue;
            }

            // Проверяем валидность выбранных стилей
            for (const styleSelection of reg.selectedStyles) {
                if (styleSelection.quantity > 0) {
                    const style = currentService.styles.find(s => s.id === styleSelection.styleId);
                    if (!style) {
                        errors.push(`${reg.childName}: недопустимый вариант ручки (ID: ${styleSelection.styleId})`);
                    }
                    if (styleSelection.quantity < 1 || styleSelection.quantity > 5) {
                        errors.push(`${reg.childName}: недопустимое количество для стиля (${styleSelection.quantity})`);
                    }
                }
            }

            // Проверяем валидность выбранных опций
            for (const optionSelection of reg.selectedOptions) {
                if (optionSelection.quantity > 0) {
                    const option = currentService.options.find(o => o.id === optionSelection.optionId);
                    if (!option) {
                        errors.push(`${reg.childName}: недопустимая дополнительная услуга (ID: ${optionSelection.optionId})`);
                    }
                    if (optionSelection.quantity < 1 || optionSelection.quantity > 3) {
                        errors.push(`${reg.childName}: недопустимое количество для опции (${optionSelection.quantity})`);
                    }
                }
            }

            // Проверяем совместимость стилей и опций
            const selectedStyleNames = (reg.selectedStyles || [])
                .filter(s => s.quantity > 0)
                .map(s => {
                    const style = currentService.styles.find(st => st.id === s.styleId);
                    return style?.name;
                }).filter(Boolean);

            const selectedOptionNames = (reg.selectedOptions || [])
                .filter(o => o.quantity > 0)
                .map(o => {
                    const option = currentService.options.find(op => op.id === o.optionId);
                    return option?.name;
                }).filter(Boolean);

            // Убрана проверка взаимоисключающих стилей и опций - теперь можно выбирать все

            // Проверяем возрастные ограничения
            for (const styleName of selectedStyleNames) {
                if (styleName && !isStyleAgeRestricted(styleName, reg.childAge)) {
                    errors.push(`${reg.childName}: стиль "${styleName}" недоступен для возраста ${reg.childAge} лет`);
                }
            }

            // Проверяем соответствие стоимости
            const calculatedStylesCost = (reg.selectedStyles || []).reduce((sum, s) => {
                return sum + (s.price * s.quantity);
            }, 0);

            const calculatedOptionsCost = (reg.selectedOptions || []).reduce((sum, o) => {
                return sum + (o.price * o.quantity);
            }, 0);

            const calculatedTotal = calculatedStylesCost + calculatedOptionsCost;
            if (Math.abs(calculatedTotal - reg.totalAmount) > 0.01) {
                errors.push(`${reg.childName}: несоответствие стоимости (ожидается: ${calculatedTotal}₽, указано: ${reg.totalAmount}₽)`);
            }
        }

        return { isValid: errors.length === 0, errors };
    };

    // Отмена отправки заявок
    const handleCancelSubmit = () => {

        cancelRef.current = true;
        setIsSubmitting(false);
        setSubmitProgress(0);
        setCurrentSubmittingChild('');
        toast({
            title: "Отменено",
            description: "Отправка заявок была отменена",
            variant: "default"
        });
    };

    // Отправка заявок с транзакционностью и прогрессом
    const handleSubmit = async () => {

        if (!workshop || !user) return;

        // Логируем начало процесса

        // Валидация данных перед отправкой
        const validation = validateRegistrationData();
        if (!validation.isValid) {
            console.warn('⚠️ Ошибки валидации:', validation.errors);
            toast({
                title: "Ошибка валидации",
                description: validation.errors.join('\n'),
                variant: "destructive",
                duration: 10000, // Увеличиваем время показа для длинных ошибок
            });
            return;
        }

        // Проверяем существующие регистрации для предотвращения дублирования

        try {
            const existingRegistrations = await api.workshopRegistrations.getRegistrations(workshop.id);
            const existingUserIds = existingRegistrations.map(reg => reg.userId);

            const alreadyRegistered = childRegistrations.filter(reg =>
                existingUserIds.includes(reg.childId)
            );

            if (alreadyRegistered.length > 0) {
                const names = alreadyRegistered.map(reg => reg.childName).join(', ');
                toast({
                    title: "Ошибка записи",
                    description: `Следующие дети уже записаны на этот мастер-класс: ${names}. Пожалуйста, выберите других детей или закройте это окно.`,
                    variant: "destructive",
                    duration: 10000,
                });
                return; // Прерываем выполнение
            }

        } catch (checkError) {
            console.warn('⚠️ Не удалось проверить существующие регистрации:', checkError);
            // Продолжаем выполнение, backend все равно проверит
        }

        setIsSubmitting(true);
        cancelRef.current = false;
        setSubmitProgress(0);
        setCurrentSubmittingChild('');

        try {
            // Создаем групповую регистрацию для всех детей
            const totalChildren = childRegistrations.length;

            // Подготавливаем данные для групповой регистрации
            // Определяем parentId: если есть дети с parentId, используем его, иначе используем user.id
            const firstChild = children && children.length > 0 ? children[0] : null;
            const actualParentId = firstChild?.parentId || user.id;

            console.log('👪 Определяем parentId для групповой регистрации:', {
                firstChildParentId: firstChild?.parentId,
                currentUserId: user.id,
                actualParentId,
                isAdmin: user.role === 'admin'
            });

            const groupRegistrationData = {
                workshopId: workshop.id,
                parentId: actualParentId, // Используем parentId из данных ребенка или user.id
                children: childRegistrations.map(reg => {
                    // Преобразуем новую структуру в старый формат для API
                    const styles = reg.selectedStyles.flatMap(s =>
                        Array(s.quantity).fill(s.styleId)
                    );
                    const options = reg.selectedOptions.flatMap(o =>
                        Array(o.quantity).fill(o.optionId)
                    );

                    return {
                        childId: reg.childId,
                        childName: reg.childName,
                        style: styles.join(', '),
                        options: options,
                        totalPrice: reg.totalAmount,
                        notes: reg.notes || '' // Добавляем примечания
                    };
                })
            };

            // Используем групповой API

            const response = await api.workshopRegistrations.createGroupRegistration(groupRegistrationData);

            // Обновляем прогресс
            setSubmitProgress(100);
            setCurrentSubmittingChild('');

            console.log('🎉 MODAL: Групповая регистрация успешно создана:', {
                invoiceId: response.invoice.id,
                totalRegistrations: response.registrations.length,
                participantsCount: response.participants,
                registrations: response.registrations.map((r, index) => ({
                    childName: childRegistrations[index]?.childName || 'Неизвестно',
                    registrationId: r.id,
                    totalPrice: r.totalPrice
                }))
            });

            setIsSuccess(true);

            // Сохраняем созданные счета для оплаты
            if (response.invoice) {
                setCreatedInvoices([response.invoice]);
                setShowPaymentSection(true);
            }

            // Вызываем callback для обновления Dashboard

            if (onRegistrationSuccess) {

                onRegistrationSuccess();

            } else {
                console.warn('⚠️ MODAL: Callback onRegistrationSuccess не найден!');
            }

            toast({
                title: "Успешно!",
                description: `Все ${childRegistrations.length} детей записаны на мастер-класс. Создан один счет за ${response.participants} участников. Теперь вы можете оплатить участие.`,
                variant: "default"
            });

        } catch (error) {
            console.error('❌ Критическая ошибка при записи на мастер-класс:', {
                error: error.message,
                stack: error.stack,
                workshopId: workshop.id,
                userId: user.id,
                childrenCount: childRegistrations.length,
                timestamp: new Date().toISOString()
            });

            // Детализированное сообщение об ошибке
            const errorMessage = error.message || 'Неизвестная ошибка';

            // Специальная обработка для дублирующихся регистраций
            if (errorMessage.includes('already registered')) {
                toast({
                    title: "Ребенок уже записан",
                    description: "Один или несколько детей уже записаны на этот мастер-класс. Пожалуйста, обновите страницу и попробуйте снова.",
                    variant: "destructive",
                    duration: 10000,
                });
            } else {
                toast({
                    title: "Ошибка записи",
                    description: `Не удалось записать детей на мастер-класс: ${errorMessage}`,
                    variant: "destructive",
                    duration: 8000,
                });
            }
        } finally {

            setIsSubmitting(false);
            cancelRef.current = false;
            setSubmitProgress(0);
            setCurrentSubmittingChild('');

            // Дополнительная проверка состояния

        }
    };

    // Получение общей суммы
    const getTotalAmount = () => {
        return childRegistrations.reduce((sum, reg) => sum + reg.totalAmount, 0);
    };

    // Проверка, что все дети завершили регистрацию
    const allChildrenCompleted = childRegistrations.every(reg => reg.isCompleted);

    if (!workshop || !currentService) return null;

    const schoolName = workshop.schoolName; // Упрощенно, в реальности нужно получать название школы
    const classGroup = workshop.classGroup;

    if (isSuccess) {

        return (
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl p-6 bg-gradient-wax-hands border-0 shadow-2xl mx-auto">
                    {/* Анимированные звездочки */}
                    <AnimatedStars count={15} className="opacity-40" />

                    <div className="text-center mb-6">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <DialogTitle className="text-xl font-bold text-white mb-2 drop-shadow-lg">
                            Запись завершена!
                        </DialogTitle>
                        <DialogDescription className="text-white/90 drop-shadow-md">
                            Все дети успешно записаны на мастер-класс "{workshop.title}"
                        </DialogDescription>
                    </div>

                    {/* Секция оплаты */}
                    {showPaymentSection && createdInvoices.length > 0 && (
                        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 sm:p-6 mb-6 border border-white/20 shadow-lg max-w-full overflow-hidden">
                            <div className="flex items-center space-x-2 mb-4">
                                <CreditCard className="w-6 h-6 text-blue-600" />
                                <h3 className="text-lg font-semibold text-gray-800">
                                    Оплата участия
                                </h3>
                            </div>

                            <div className="space-y-4">
                                {createdInvoices.map((invoice) => (
                                    <div key={invoice.id} className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 w-full max-w-full overflow-hidden">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 truncate">
                                                    Счет №{invoice.id.slice(-8)}
                                                </p>
                                                <p className="text-sm text-gray-600 truncate">
                                                    {invoice.participant_name} - {new Date(invoice.workshop_date || '').toLocaleDateString('ru-RU')}
                                                </p>
                                            </div>
                                            <div className="text-left sm:text-right flex-shrink-0">
                                                <p className="text-lg font-bold text-green-600">
                                                    {invoice.amount} ₽
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {invoice.status === 'pending' ? 'Ожидает оплаты' : invoice.status}
                                                </p>
                                            </div>
                                        </div>

                                        {invoice.status === 'pending' && (
                                            <div className="w-full max-w-full overflow-hidden space-y-3">
                                                {/* Кнопки для админа */}
                                                {user?.role === 'admin' && (
                                                    <div className="space-y-3">
                                                        {/* Кнопка ТЕСТ оплаты для админа */}
                                                        <Button
                                                            onClick={async () => {
                                                                try {
                                                                    console.log('🧪 ТЕСТ: Получаем ссылку Robokassa...');
                                                                    const response = await api.post(`/payment/invoices/${invoice.id}/pay`);

                                                                    console.log('📦 Ответ API:', response.data);

                                                                    if (response.data?.paymentUrl) {
                                                                        console.log('✅ Ссылка Robokassa:', response.data.paymentUrl);
                                                                        console.log('📋 FormData:', response.data.formData);

                                                                        // Открываем ссылку в новой вкладке для теста
                                                                        window.open(response.data.paymentUrl, '_blank');

                                                                        toast({
                                                                            title: "ТЕСТ: Ссылка создана! 🔗",
                                                                            description: `Открыта ссылка: ${response.data.paymentUrl}`,
                                                                        });
                                                                    } else {
                                                                        toast({
                                                                            title: "ТЕСТ: Нет ссылки ⚠️",
                                                                            description: "API не вернул paymentUrl",
                                                                            variant: "destructive"
                                                                        });
                                                                    }
                                                                } catch (error) {
                                                                    console.error('❌ Ошибка при создании ссылки:', error);
                                                                    toast({
                                                                        title: "ТЕСТ: Ошибка ❌",
                                                                        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
                                                                        variant: "destructive"
                                                                    });
                                                                }
                                                            }}
                                                            className="w-full bg-blue-600 hover:bg-blue-700"
                                                            size="lg"
                                                        >
                                                            <CreditCard className="w-5 h-5 mr-2" />
                                                            ТЕСТ: Оплатить (открыть Robokassa)
                                                        </Button>

                                                        {/* Кнопка отправки в WhatsApp */}
                                                        <Button
                                                            onClick={async () => {
                                                                try {
                                                                    console.log('📱 Создаем ссылку Robokassa для WhatsApp...');

                                                                    let paymentUrl = `${window.location.origin}/parent`; // Fallback

                                                                    try {
                                                                        const response = await api.post(`/payment/invoices/${invoice.id}/pay`);

                                                                        if (response.data?.paymentUrl) {
                                                                            paymentUrl = response.data.paymentUrl;
                                                                            console.log('✅ Получена ссылка Robokassa:', paymentUrl);
                                                                        } else {
                                                                            console.warn('⚠️ Не удалось получить ссылку Robokassa, используем fallback');
                                                                        }
                                                                    } catch (apiError) {
                                                                        console.error('❌ Ошибка API при создании ссылки:', apiError);
                                                                        console.log('📌 Используем fallback ссылку на ЛК');
                                                                    }

                                                                    // Формируем сообщение для WhatsApp
                                                                    const message = `🎨 Счет на оплату мастер-класса\n\n` +
                                                                        `📋 Счет №${invoice.id.slice(-8)}\n` +
                                                                        `👤 Участник: ${invoice.participant_name}\n` +
                                                                        `📅 Дата: ${new Date(invoice.workshop_date || '').toLocaleDateString('ru-RU')}\n` +
                                                                        `🎯 Мастер-класс: ${workshop.title}\n` +
                                                                        `💰 Сумма: ${invoice.amount} ₽\n\n` +
                                                                        `Для оплаты перейдите по ссылке:\n${paymentUrl}`;

                                                                    const encodedMessage = encodeURIComponent(message);
                                                                    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
                                                                    window.open(whatsappUrl, '_blank');

                                                                    toast({
                                                                        title: "Счет отправлен! 📱",
                                                                        description: "Откройте WhatsApp и отправьте счет родителю",
                                                                    });
                                                                } catch (error) {
                                                                    console.error('Ошибка при отправке ссылки:', error);
                                                                    toast({
                                                                        title: "Ошибка",
                                                                        description: "Не удалось отправить ссылку",
                                                                        variant: "destructive"
                                                                    });
                                                                }
                                                            }}
                                                            className="w-full bg-green-600 hover:bg-green-700"
                                                            size="lg"
                                                        >
                                                            <MessageCircle className="w-5 h-5 mr-2" />
                                                            Отправить счет в WhatsApp
                                                        </Button>
                                                    </div>
                                                )}

                                                {/* Кнопка оплаты - только для родителя */}
                                                {user?.role === 'parent' && (
                                                    <YandexPaymentButton
                                                        invoiceId={invoice.id}
                                                        amount={invoice.amount}
                                                        description={`Участие в мастер-классе "${workshop.title}" для ${invoice.participant_name}`}
                                                        children={[{
                                                            id: invoice.participant_id || '',
                                                            name: invoice.participant_name || '',
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
                                                            // Обновляем статус счета локально
                                                            setCreatedInvoices(prev =>
                                                                prev.map(inv =>
                                                                    inv.id === invoice.id
                                                                        ? { ...inv, status: 'paid' as const }
                                                                        : inv
                                                                )
                                                            );
                                                        }}
                                                        onPaymentError={(error) => {
                                                            console.error('Ошибка оплаты:', error);
                                                        }}
                                                        className="w-full max-w-full"
                                                        variant="default"
                                                        size="lg"
                                                    />
                                                )}
                                            </div>
                                        )}

                                        {invoice.status === 'paid' && (
                                            <div className="flex items-center justify-center space-x-2 text-green-600 bg-green-50 rounded-lg p-3">
                                                <CheckCircle className="w-5 h-5" />
                                                <span className="font-medium">Оплачено</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-center space-x-4">
                        <Button
                            onClick={() => {
                                // Сбрасываем состояние при закрытии
                                setShowPaymentSection(false);
                                setCreatedInvoices([]);
                                setIsSuccess(false);
                                setCurrentStep(0);
                                setChildRegistrations([]);
                                onOpenChange(false);
                            }}
                            variant="outline"
                            className="px-6"
                        >
                            Закрыть
                        </Button>

                        {showPaymentSection && (
                            <Button
                                onClick={() => {
                                    setShowPaymentSection(false);
                                    setCreatedInvoices([]);
                                    setIsSuccess(false);
                                    setCurrentStep(0);
                                    setChildRegistrations([]);
                                }}
                                className="px-6 bg-blue-600 hover:bg-blue-700"
                            >
                                Записать еще детей
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className={`w-[98vw] max-w-[98vw] sm:w-[95vw] sm:max-w-[95vw] md:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto bg-gradient-wax-hands border-0 shadow-2xl mx-auto ${isSmallScreen ? 'p-1 px-4 pt-8 pb-8 scrollbar-hide' : 'p-2 sm:p-4 md:p-6 pt-12 pb-12'} animate-in fade-in-0 zoom-in-95 duration-300`}>

                    {/* Анимированные звездочки */}
                    <AnimatedStars count={15} className="opacity-40" />

                    {/* Плавающие элементы убраны */}

                    <div className={`text-center ${isSmallScreen ? 'mt-2 mb-2' : 'mt-8 mb-6 sm:mt-12 sm:mb-8'} animate-in fade-in-0 slide-in-from-top-4 duration-500 delay-100`}>
                        <div className={`flex items-center justify-center space-x-2 sm:space-x-4 ${isSmallScreen ? 'mb-2' : 'mb-4 sm:mb-6'}`}>
                            <div className={`bg-gradient-to-r from-orange-500 to-purple-500 rounded-full ${isSmallScreen ? 'p-1.5' : 'p-3 sm:p-4'} shadow-lg`}>
                                <Sparkles className={`${isSmallScreen ? 'w-5 h-5' : 'w-8 h-8 sm:w-10 sm:h-10'} text-white`} />
                            </div>
                            <DialogTitle className={`${isSmallScreen ? 'text-lg sm:text-xl' : 'text-3xl sm:text-4xl md:text-5xl'} font-bold bg-gradient-to-r from-orange-600 via-purple-600 to-blue-600 bg-clip-text text-transparent leading-tight`}>
                                {isViewMode ?
                                    (isSmallScreen ? 'Детали заказа' : 'Детали заказа на мастер-класс') :
                                    (isSmallScreen ? 'Запись на мастер-класс' : 'Запись детей на мастер-класс')
                                }
                            </DialogTitle>
                        </div>
                        <DialogDescription className={`${isSmallScreen ? 'text-xs' : 'text-base sm:text-lg'} text-gray-600 max-w-2xl mx-auto`}>
                            {isViewMode ?
                                (isSmallScreen ? 'Просмотр выбранных вариантов ручек и дополнительных услуг' : 'Просмотр выбранных вариантов ручек, дополнительных услуг и общей стоимости заказа') :
                                (isSmallScreen ? 'Заполните форму для каждого ребенка' : 'Пошагово заполните форму для каждого ребенка. Сначала выберите варианты ручек и дополнительные услуги для первого ребенка, затем переходите к следующему.')
                            }
                        </DialogDescription>
                    </div>

                    <div className={`space-y-2 sm:space-y-4`}>

                        {/* Информация о мастер-классе */}
                        <Card className={`bg-white/90 backdrop-blur-sm border-orange-200 shadow-card ${isSmallScreen ? 'mb-3' : 'mb-4 sm:mb-6'} animate-in fade-in-0 slide-in-from-top-4 duration-500 delay-200`}>
                            <CardHeader className={`${isSmallScreen ? 'pb-2' : 'pb-3 sm:pb-4'}`}>
                                <CardTitle className={`${isSmallScreen ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'} font-bold text-orange-500 flex items-center space-x-2`}>
                                    <Star className={`${isSmallScreen ? 'w-4 h-4' : 'w-5 h-5 sm:w-6 sm:h-6'} text-yellow-500`} />
                                    <span>{workshop.title}</span>
                                </CardTitle>
                                <CardDescription className={`text-gray-600 ${isSmallScreen ? 'text-sm' : 'text-base sm:text-lg'}`}>
                                    Информация о мастер-классе
                                </CardDescription>
                            </CardHeader>
                            <CardContent className={`${isSmallScreen ? 'space-y-2' : 'space-y-3 sm:space-y-4'}`}>
                                <div className={`grid ${isSmallScreen ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'} gap-2 sm:gap-3 sm:gap-4`}>
                                    <div className={`flex items-center space-x-2 sm:space-x-3 ${isSmallScreen ? 'p-2' : 'p-2 sm:p-3'} bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200`}>
                                        <MapPin className={`${isSmallScreen ? 'w-4 h-4' : 'w-4 h-4 sm:w-5 sm:h-5'} text-orange-600 flex-shrink-0`} />
                                        <span className={`text-gray-700 font-medium ${isSmallScreen ? 'text-sm' : 'text-sm sm:text-base'} truncate`}>{schoolName}, класс {classGroup}</span>
                                    </div>
                                    <div className={`flex items-center space-x-2 sm:space-x-3 ${isSmallScreen ? 'p-2' : 'p-2 sm:p-3'} bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200`}>
                                        <Calendar className={`${isSmallScreen ? 'w-4 h-4' : 'w-4 h-4 sm:w-5 sm:h-5'} text-purple-600 flex-shrink-0`} />
                                        <span className={`text-gray-700 font-medium ${isSmallScreen ? 'text-sm' : 'text-sm sm:text-base'}`}>{new Date(workshop.date).toLocaleDateString('ru-RU')}</span>
                                    </div>
                                    <div className={`flex items-center space-x-2 sm:space-x-3 ${isSmallScreen ? 'p-2' : 'p-2 sm:p-3'} bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200`}>
                                        <Clock className={`${isSmallScreen ? 'w-4 h-4' : 'w-4 h-4 sm:w-5 sm:h-5'} text-blue-600 flex-shrink-0`} />
                                        <span className={`text-gray-700 font-medium ${isSmallScreen ? 'text-sm' : 'text-sm sm:text-base'}`}>{workshop.time}</span>
                                    </div>
                                    <div className={`flex items-center space-x-2 sm:space-x-3 ${isSmallScreen ? 'p-2' : 'p-2 sm:p-3'} bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200`}>
                                        <div className={`${isSmallScreen ? 'w-4 h-4' : 'w-4 h-4 sm:w-5 sm:h-5'} text-green-600 flex-shrink-0`}>
                                            <Users className="w-full h-full" />
                                        </div>
                                        <span className={`text-gray-700 font-medium ${isSmallScreen ? 'text-sm' : 'text-sm sm:text-base'}`}>{workshop.eligibleChildren.length} детей</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Детали заказа (режим просмотра) */}
                        {isViewMode && workshop.childrenWithStatus && (
                            <Card className={`bg-white/90 backdrop-blur-sm border-green-200 shadow-card ${isSmallScreen ? 'mb-3' : 'mb-4 sm:mb-6'} animate-in fade-in-0 slide-in-from-top-4 duration-500 delay-300`}>
                                <CardHeader className={`${isSmallScreen ? 'pb-2' : 'pb-3 sm:pb-4'}`}>
                                    <div className={`flex items-center space-x-2 sm:space-x-3`}>
                                        <div className={`bg-gradient-to-r from-green-500 to-emerald-500 rounded-full ${isSmallScreen ? 'p-1.5' : 'p-1.5 sm:p-2'}`}>
                                            <CheckCircle className={`${isSmallScreen ? 'w-4 h-4' : 'w-5 h-5 sm:w-6 sm:h-6'} text-white`} />
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className={`${isSmallScreen ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'} font-bold text-green-700`}>
                                                Детали заказа
                                            </CardTitle>
                                            <CardDescription className={`text-green-600 ${isSmallScreen ? 'text-sm' : 'text-base sm:text-lg'}`}>
                                                Выбранные варианты ручек, дополнительные услуги и стоимость для каждого ребенка
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className={`${isSmallScreen ? 'space-y-2' : 'space-y-3 sm:gap-4'}`}>
                                    {workshop.childrenWithStatus.map((childStatus, index) => {
                                        const child = children.find(c => c.id === childStatus.childId);
                                        if (!child) return null;

                                        // Получаем данные о выбранных стилях и опциях из API
                                        // Ищем мастер-класс в списке мастер-классов
                                        const masterClass = masterClasses.find(mc => mc.id === workshop.id);
                                        let selectedStyleIds: string[] = [];
                                        let selectedOptionIds: string[] = [];
                                        let totalAmount = 0;

                                        if (masterClass && masterClass.participants) {
                                            const participant = masterClass.participants.find(p => p.childId === child.id);
                                            if (participant) {
                                                selectedStyleIds = participant.selectedStyles || [];
                                                selectedOptionIds = participant.selectedOptions || [];
                                                totalAmount = participant.totalAmount || 0;
                                            }
                                        }

                                        // Преобразуем ID в названия стилей и опций
                                        const selectedStyles = (selectedStyleIds || []).map(styleId => {
                                            const style = currentService?.styles?.find(s => s.id === styleId);
                                            return style?.name || styleId; // Возвращаем название или ID если не найдено
                                        }).filter(Boolean);

                                        const selectedOptions = (selectedOptionIds || []).map(optionId => {
                                            const option = currentService?.options?.find(o => o.id === optionId);
                                            return option?.name || optionId; // Возвращаем название или ID если не найдено
                                        }).filter(Boolean);

                                        // Если данные не найдены в API, пробуем получить из workshop.childrenWithStatus
                                        if (selectedStyleIds.length === 0 && selectedOptionIds.length === 0 && totalAmount === 0) {
                                            // TODO: В будущем можно получать эти данные из workshop.childrenWithStatus
                                            console.warn('Данные о выборе стилей и опций не найдены для ребенка:', childStatus.childId);
                                        }

                                        return (
                                            <div key={childStatus.childId} className={`p-3 ${isSmallScreen ? 'p-2' : 'p-4'} bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 animate-in fade-in-0 slide-in-from-left-4 duration-300 delay-${400 + index * 100}`}>
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-800">{child.name}</div>
                                                            <div className="text-sm text-gray-600">{child.age} лет</div>
                                                        </div>
                                                    </div>
                                                    <Badge
                                                        variant={
                                                            childStatus.status === 'paid' ? 'default' :
                                                                childStatus.status === 'pending' ? 'secondary' : 'destructive'
                                                        }
                                                        className="text-xs"
                                                    >
                                                        {childStatus.status === 'paid' ? '✅ Оплачено' :
                                                            childStatus.status === 'pending' ? '⏳ Ожидает оплаты' :
                                                                '❌ Отменено'}
                                                    </Badge>
                                                </div>

                                                {/* Выбранные стили */}
                                                {(selectedStyles || []).length > 0 && (
                                                    <div className="mb-3">
                                                        <div className="text-sm font-medium text-gray-700 mb-2">Выбранные варианты ручек:</div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {(selectedStyles || []).map((style, styleIndex) => (
                                                                <Badge key={styleIndex} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                                                    🎨 {style}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Выбранные опции */}
                                                {(selectedOptions || []).length > 0 && (
                                                    <div className="mb-3">
                                                        <div className="text-sm font-medium text-gray-700 mb-2">Дополнительные услуги:</div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {(selectedOptions || []).map((option, optionIndex) => (
                                                                <Badge key={optionIndex} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                                    🎁 {option}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Стоимость */}
                                                <div className="flex items-center justify-between pt-2 border-t border-green-200">
                                                    <span className="text-sm font-medium text-gray-700">Стоимость:</span>
                                                    <span className="text-lg font-bold text-green-600">{totalAmount} ₽</span>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Общая информация о заказе */}
                                    <div className="mt-4 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 animate-in fade-in-0 slide-in-from-bottom-4 duration-300 delay-500">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-semibold text-gray-800">Общая информация:</span>
                                            <Badge
                                                variant={
                                                    workshop.invoiceStatus === 'paid' ? 'default' :
                                                        workshop.invoiceStatus === 'pending' ? 'secondary' : 'destructive'
                                                }
                                                className="text-xs"
                                            >
                                                {workshop.invoiceStatus === 'paid' ? '💰 Счет оплачен' :
                                                    workshop.invoiceStatus === 'pending' ? '📋 Счет ожидает оплаты' :
                                                        '❌ Счет отменен'}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            <div>Дата: {new Date(workshop.date).toLocaleDateString('ru-RU')}</div>
                                            <div>Время: {workshop.time}</div>
                                            <div>Место: {workshop.schoolName}, класс {workshop.classGroup}</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Текущий ребенок */}
                        {!isViewMode && currentStep < children.length && (
                            <Card className={`bg-white/90 backdrop-blur-sm border-orange-300 border-2 shadow-card ${isSmallScreen ? 'mb-3' : 'mb-4 sm:mb-6'}`}>
                                <CardHeader className={`${isSmallScreen ? 'pb-2' : 'pb-3 sm:pb-4'}`}>
                                    <div className={`flex items-center space-x-2 sm:space-x-3`}>
                                        <div className={`bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full ${isSmallScreen ? 'p-1.5' : 'p-1.5 sm:p-2'}`}>
                                            <Palette className={`${isSmallScreen ? 'w-4 h-4' : 'w-5 h-5 sm:w-6 sm:h-6'} text-white`} />
                                        </div>
                                        <div>
                                            <CardTitle className={`${isSmallScreen ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'} font-bold text-orange-700`}>
                                                Заполняем форму для: {getCurrentChild()?.childName}
                                            </CardTitle>
                                            <CardDescription className={`text-orange-600 ${isSmallScreen ? 'text-sm' : 'text-base sm:text-lg'}`}>
                                                Возраст: {getCurrentChild()?.childAge} лет
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        )}

                        {/* Выбор стилей */}
                        {!isViewMode && currentStep < children.length && (
                            <Card className={`bg-white/90 backdrop-blur-sm border-purple-200 shadow-card ${isSmallScreen ? 'mb-3' : 'mb-4 sm:mb-6'}`}>
                                <CardHeader className={`${isSmallScreen ? 'pb-2' : 'pb-3 sm:pb-4'}`}>
                                    <div className={`flex items-center space-x-2 sm:space-x-3`}>
                                        <div className={`bg-gradient-to-r from-purple-500 to-pink-500 rounded-full ${isSmallScreen ? 'p-1.5' : 'p-1.5 sm:p-2'}`}>
                                            <Brain className={`${isSmallScreen ? 'w-4 h-4' : 'w-5 h-5 sm:w-6 sm:h-6'} text-white`} />
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className={`${isSmallScreen ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'} font-bold text-gray-800`}>
                                                Выберите вариант ручки
                                            </CardTitle>
                                            <CardDescription className={`text-gray-600 ${isSmallScreen ? 'text-sm' : 'text-base sm:text-lg'}`}>
                                                Выберите вариант ручки для {getCurrentChild()?.childName}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className={`${isSmallScreen ? 'space-y-2' : 'space-y-3 sm:space-y-4'}`}>
                                    {/* Предупреждение о возрастных ограничениях - вынесено из заголовка */}
                                    {getCurrentChild()?.childAge && getCurrentChild()?.childAge < 5 && (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
                                            <div className="flex items-start space-x-2 sm:space-x-3">
                                                <AlertCircle className={`${isSmallScreen ? 'w-4 h-4' : 'w-5 h-5'} text-yellow-600 flex-shrink-0 mt-0.5`} />
                                                <div className="flex-1">
                                                    <div className={`font-medium text-yellow-800 ${isSmallScreen ? 'text-sm' : 'text-base'}`}>
                                                        Возрастные ограничения
                                                    </div>
                                                    <div className={`text-yellow-700 ${isSmallScreen ? 'text-xs' : 'text-sm'} mt-1`}>
                                                        <span>"Двойные ручки" доступны только с 5 лет</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Стили */}
                                    <div className={`grid ${isSmallScreen ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'} gap-2 sm:gap-4`}>
                                        {currentService?.styles.map((style) => {
                                            const isSelected = isStyleSelected(style.id);
                                            const quantity = getStyleQuantity(style.id);
                                            const isBlocked = isStyleBlocked(style.name, getCurrentChild()?.childAge || 0, getCurrentChild()?.selectedStyles || []);
                                            const isAgeRestricted = !isStyleAgeRestricted(style.name, getCurrentChild()?.childAge || 0);

                                            // Отладочная информация для аватаров
                                            const avatarUrl = getFileUrl(style.avatar || '');

                                            return (
                                                <div
                                                    key={style.id}
                                                    className={`relative border-2 rounded-xl ${isSmallScreen ? 'p-2' : 'p-4 sm:p-5'} transition-all duration-300 cursor-pointer transform hover:scale-[1.02] ${isSelected
                                                        ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg shadow-purple-200'
                                                        : isBlocked
                                                            ? 'border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 cursor-not-allowed opacity-60'
                                                            : 'border-gray-200 bg-gradient-to-br from-white to-gray-50 hover:border-purple-300 hover:shadow-md hover:shadow-purple-100'
                                                        }`}
                                                    onClick={() => !isBlocked && handleStyleQuantityChange(style.id, isSelected ? 0 : 1)}
                                                >
                                                    {/* Бейдж для возрастных ограничений */}
                                                    {isAgeRestricted && (
                                                        <div className="absolute top-3 right-3">
                                                            <Badge variant="secondary" className={`${isSmallScreen ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5'} bg-red-100 text-red-700 border-red-200 shadow-sm`}>
                                                                <Lock className={`${isSmallScreen ? 'w-3 h-3' : 'w-4 h-4'} mr-1.5`} />
                                                                {isSmallScreen ? '5+' : '5+ лет'}
                                                            </Badge>
                                                        </div>
                                                    )}

                                                    <div className={`${isSmallScreen ? 'space-y-2' : 'space-y-3'}`}>
                                                        {/* Заголовок и чекбокс */}
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
                                                                {/* Аватар стиля */}
                                                                <AvatarDisplay
                                                                    images={style.images}
                                                                    type="style"
                                                                    alt={style.name}
                                                                    size={isSmallScreen ? 'sm' : 'md'}
                                                                    className={`${isSmallScreen ? 'w-10 h-12' : 'w-14 h-18'}`}
                                                                />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className={`font-bold text-gray-900 ${isSmallScreen ? 'text-base' : 'text-lg'} mb-2`}>
                                                                        {style.name}
                                                                    </div>
                                                                    <div className={`text-gray-600 ${isSmallScreen ? 'text-sm' : 'text-base'} leading-relaxed`}>
                                                                        {getStyleDescription(style.name)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <Checkbox
                                                                checked={isSelected}
                                                                disabled={isBlocked}
                                                                className={`mt-1 ${isSmallScreen ? 'scale-110' : 'scale-125'}`}
                                                            />
                                                        </div>

                                                        {/* Цена и количество */}
                                                        <div className="flex items-center justify-between">
                                                            <div className={`font-bold text-purple-600 ${isSmallScreen ? 'text-lg' : 'text-xl'} bg-purple-50 px-3 py-2 rounded-lg`}>
                                                                {isSelected ? (
                                                                    <>
                                                                        {style.price * quantity} ₽
                                                                        {quantity > 1 && (
                                                                            <span className="text-sm text-gray-500 ml-1">
                                                                                ({style.price} ₽ × {quantity})
                                                                            </span>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    `${style.price} ₽`
                                                                )}
                                                            </div>
                                                            {isSelected && (
                                                                <div onClick={(e) => e.stopPropagation()}>
                                                                    <QuantitySelector
                                                                        value={quantity}
                                                                        onChange={(newQuantity) => handleStyleQuantityChange(style.id, newQuantity)}
                                                                        min={1}
                                                                        max={5}
                                                                        disabled={isBlocked}
                                                                        size="sm"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Медиа контент */}
                                                        <div className={`flex items-center ${isSmallScreen ? 'space-x-2' : 'space-x-3'} pt-2`} onClick={(e) => e.stopPropagation()}>
                                                            {style.images && style.images.length > 0 && (
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openPhotoCarousel(style.images || [], style.name);
                                                                    }}
                                                                    className={`${isSmallScreen ? 'h-8 px-2 text-xs' : 'h-10 px-4 text-base'} bg-white hover:bg-purple-50 border-purple-200 hover:border-purple-300 transition-all duration-200 hover:shadow-md`}
                                                                >
                                                                    <Image className={`${isSmallScreen ? 'w-3 h-3' : 'w-5 h-5'} mr-1 sm:mr-2 text-purple-600`} />
                                                                    {isSmallScreen ? 'Фото' : 'Фотографии'}
                                                                </Button>
                                                            )}

                                                            {style.videos && style.videos.length > 0 && (
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        // Преобразуем относительные URL в абсолютные для видео
                                                                        const videoUrls = style.videos?.map(url => getFileUrl(url)) || [];
                                                                        setCurrentMedia({ type: 'video', urls: videoUrls, currentIndex: 0, title: style.name });
                                                                        setIsVideoPlayerOpen(true);
                                                                    }}
                                                                    className={`${isSmallScreen ? 'h-8 px-2 text-xs' : 'h-10 px-4 text-base'} bg-white hover:bg-purple-50 border-purple-200 hover:border-purple-300 transition-all duration-200 hover:shadow-md`}
                                                                >
                                                                    <Video className={`${isSmallScreen ? 'w-3 h-3' : 'w-5 h-5'} mr-1 sm:mr-2 text-purple-600`} />
                                                                    {isSmallScreen ? 'Видео' : 'Видео'}
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Выбор опций */}
                        {!isViewMode && currentStep < children.length && (
                            <Card className={`bg-white/90 backdrop-blur-sm border-blue-200 shadow-card ${isSmallScreen ? 'mb-3' : 'mb-4 sm:mb-6'}`}>
                                <CardHeader className={`${isSmallScreen ? 'pb-2' : 'pb-3 sm:pb-4'}`}>
                                    <div className={`flex items-center space-x-2 sm:space-x-3`}>
                                        <div className={`bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full ${isSmallScreen ? 'p-1.5' : 'p-1.5 sm:p-2'}`}>
                                            <Gift className={`${isSmallScreen ? 'w-4 h-4' : 'w-5 h-5 sm:w-6 sm:h-6'} text-white`} />
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className={`${isSmallScreen ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'} font-bold text-gray-800`}>
                                                Дополнительные услуги
                                            </CardTitle>
                                            <CardDescription className={`text-gray-600 ${isSmallScreen ? 'text-sm' : 'text-base sm:text-lg'}`}>
                                                Выберите дополнительные услуги для {getCurrentChild()?.childName}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className={`${isSmallScreen ? 'space-y-2' : 'space-y-3 sm:space-y-4'}`}>
                                    {/* Опции */}
                                    <div className={`grid ${isSmallScreen ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'} gap-2 sm:gap-4`}>
                                        {currentService?.options.map((option) => {
                                            const isSelected = isOptionSelected(option.id);
                                            const quantity = getOptionQuantity(option.id);
                                            // Убрана проверка взаимоисключающих опций

                                            // Отладочная информация для аватаров
                                            const avatarUrl = getFileUrl(option.avatar || '');

                                            return (
                                                <div
                                                    key={option.id}
                                                    className={`relative border-2 rounded-xl ${isSmallScreen ? 'p-2' : 'p-4 sm:p-5'} transition-all duration-300 cursor-pointer transform hover:scale-[1.02] ${isSelected
                                                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg shadow-blue-200'
                                                        : 'border-gray-200 bg-gradient-to-br from-white to-gray-50 hover:border-blue-300 hover:shadow-md hover:shadow-blue-100'
                                                        }`}
                                                    onClick={() => handleOptionQuantityChange(option.id, isSelected ? 0 : 1)}
                                                >

                                                    <div className={`${isSmallScreen ? 'space-y-2' : 'space-y-3'}`}>
                                                        {/* Заголовок и чекбокс */}
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
                                                                {/* Аватар опции */}
                                                                <AvatarDisplay
                                                                    images={option.images}
                                                                    type="option"
                                                                    alt={option.name}
                                                                    size={isSmallScreen ? 'sm' : 'md'}
                                                                    className={`${isSmallScreen ? 'w-10 h-12' : 'w-14 h-18'}`}
                                                                />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className={`font-bold text-gray-900 ${isSmallScreen ? 'text-base' : 'text-lg'} mb-2`}>
                                                                        {option.name}
                                                                    </div>
                                                                    <div className={`text-gray-600 ${isSmallScreen ? 'text-sm' : 'text-base'} leading-relaxed`}>
                                                                        {getOptionDescription(option.name)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <Checkbox
                                                                checked={isSelected}
                                                                className={`mt-1 ${isSmallScreen ? 'scale-110' : 'scale-125'}`}
                                                            />
                                                        </div>

                                                        {/* Цена и количество */}
                                                        <div className="flex items-center justify-between">
                                                            <div className={`font-bold text-blue-600 ${isSmallScreen ? 'text-lg' : 'text-xl'} bg-blue-50 px-3 py-2 rounded-lg`}>
                                                                {isSelected ? (
                                                                    <>
                                                                        {option.price * quantity} ₽
                                                                        {quantity > 1 && (
                                                                            <span className="text-sm text-gray-500 ml-1">
                                                                                ({option.price} ₽ × {quantity})
                                                                            </span>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    `${option.price} ₽`
                                                                )}
                                                            </div>
                                                            {isSelected && (
                                                                <div onClick={(e) => e.stopPropagation()}>
                                                                    <QuantitySelector
                                                                        value={quantity}
                                                                        onChange={(newQuantity) => handleOptionQuantityChange(option.id, newQuantity)}
                                                                        min={1}
                                                                        max={3}
                                                                        size="sm"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Медиа контент */}
                                                        <div className={`flex items-center ${isSmallScreen ? 'space-x-2' : 'space-x-3'} pt-2`} onClick={(e) => e.stopPropagation()}>
                                                            {option.images && option.images.length > 0 && (
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openPhotoCarousel(option.images || [], option.name);
                                                                    }}
                                                                    className={`${isSmallScreen ? 'h-8 px-2 text-xs' : 'h-10 px-4 text-base'} bg-white hover:bg-blue-50 border-blue-200 hover:border-blue-300 transition-all duration-200 hover:shadow-md`}
                                                                >
                                                                    <Image className={`${isSmallScreen ? 'w-3 h-3' : 'w-5 h-5'} mr-1 sm:mr-2 text-blue-600`} />
                                                                    {isSmallScreen ? 'Фото' : 'Фотографии'}
                                                                </Button>
                                                            )}

                                                            {option.videos && option.videos.length > 0 && (
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        // Преобразуем относительные URL в абсолютные для видео
                                                                        const videoUrls = option.videos?.map(url => getFileUrl(url)) || [];
                                                                        setCurrentMedia({ type: 'video', urls: videoUrls, currentIndex: 0, title: option.name });
                                                                        setIsVideoPlayerOpen(true);
                                                                    }}
                                                                    className={`${isSmallScreen ? 'h-8 px-2 text-xs' : 'h-10 px-4 text-base'} bg-white hover:bg-blue-50 border-blue-200 hover:border-blue-300 transition-all duration-200 hover:shadow-md`}
                                                                >
                                                                    <Video className={`${isSmallScreen ? 'w-3 h-3' : 'w-5 h-5'} mr-1 sm:mr-2 text-blue-600`} />
                                                                    {isSmallScreen ? 'Видео' : 'Видео'}
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Итоговая стоимость для текущего ребенка */}
                                    <div className="border-t pt-2 sm:pt-4">
                                        <div className={`${isSmallScreen ? 'text-sm sm:text-base' : 'text-base sm:text-lg'} font-bold text-green-700`}>
                                            Стоимость для {getCurrentChild()?.childName}: {getCurrentChildTotal()} ₽
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Итоговая информация */}
                        {!isViewMode && currentStep === children.length && (
                            <Card className={`bg-white/90 backdrop-blur-sm border-green-200 shadow-card ${isSmallScreen ? 'mb-3' : 'mb-4 sm:mb-6'}`}>
                                <CardHeader className={`${isSmallScreen ? 'pb-2' : 'pb-3 sm:pb-4'}`}>
                                    <div className={`flex items-center space-x-2 sm:space-x-3`}>
                                        <div className={`bg-gradient-to-r from-green-500 to-emerald-500 rounded-full ${isSmallScreen ? 'p-1' : 'p-1.5 sm:p-2'}`}>
                                            <CheckCircle className={`${isSmallScreen ? 'w-4 h-4' : 'w-5 h-5 sm:w-6 sm:h-6'} text-white`} />
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className={`${isSmallScreen ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'} font-bold text-gray-800`}>
                                                Итоговая информация
                                            </CardTitle>
                                            <CardDescription className={`text-gray-600 ${isSmallScreen ? 'text-sm sm:text-base' : 'text-base sm:text-lg'}`}>
                                                Проверьте данные перед отправкой
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className={`${isSmallScreen ? 'space-y-2' : 'space-y-3 sm:space-y-4'}`}>
                                    {/* Детали по каждому ребенку */}
                                    {childRegistrations.map((reg) => (
                                        <div key={reg.childId} className="border border-gray-200 rounded-lg p-2 sm:p-3">
                                            <div className={`font-medium text-gray-900 ${isSmallScreen ? 'text-sm' : 'text-base'} mb-2`}>
                                                {reg.childName} ({reg.childAge} лет)
                                            </div>
                                            <div className={`space-y-1 ${isSmallScreen ? 'text-xs' : 'text-sm'} text-gray-600`}>
                                                <div>
                                                    <span className="font-medium">Варианты ручек:</span> {(reg.selectedStyles || []).length > 0 ? (reg.selectedStyles || []).map(styleSelection => {
                                                        const style = currentService?.styles.find(s => s.id === styleSelection.styleId);
                                                        return style ? `${style.name} × ${styleSelection.quantity}` : '';
                                                    }).filter(Boolean).join(', ') : 'Не выбрано'}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Дополнительные услуги:</span> {(reg.selectedOptions || []).length > 0 ? (reg.selectedOptions || []).map(optionSelection => {
                                                        const option = currentService?.options.find(o => o.id === optionSelection.optionId);
                                                        return option ? `${option.name} × ${optionSelection.quantity}` : '';
                                                    }).filter(Boolean).join(', ') : 'Не выбрано'}
                                                </div>
                                                <div className="font-medium text-green-600">
                                                    Стоимость: {reg.totalAmount} ₽
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="border-t pt-2 sm:pt-4">
                                        <div className={`${isSmallScreen ? 'text-base sm:text-lg' : 'text-base sm:text-lg'} font-bold text-green-700`}>
                                            Общая стоимость: {getTotalAmount()} ₽
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Поле примечаний */}
                        {!isViewMode && currentStep === children.length && (
                            <Card className={`bg-white/90 backdrop-blur-sm border-yellow-200 shadow-card ${isSmallScreen ? 'mb-3' : 'mb-4 sm:mb-6'}`}>
                                <CardHeader className={`${isSmallScreen ? 'pb-2' : 'pb-3 sm:pb-4'}`}>
                                    <div className={`flex items-center space-x-2 sm:space-x-3`}>
                                        <div className={`bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full ${isSmallScreen ? 'p-1' : 'p-1.5 sm:p-2'}`}>
                                            <FileText className={`${isSmallScreen ? 'w-4 h-4' : 'w-5 h-5 sm:w-6 sm:h-6'} text-white`} />
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className={`${isSmallScreen ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'} font-bold text-gray-800`}>
                                                Примечания к заказу
                                            </CardTitle>
                                            <CardDescription className={`text-gray-600 ${isSmallScreen ? 'text-sm sm:text-base' : 'text-base sm:text-lg'}`}>
                                                Опишите, как вы хотите украсить ручку или добавьте особые пожелания
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className={`${isSmallScreen ? 'space-y-2' : 'space-y-3 sm:space-y-4'}`}>
                                    <Textarea
                                        placeholder="Пожелания по украшению ручки"
                                        value={childRegistrations[0]?.notes || ''}
                                        onChange={(e) => {
                                            const notes = e.target.value;
                                            setChildRegistrations(prev => prev.map(reg => ({ ...reg, notes })));
                                        }}
                                        className="min-h-[100px] resize-none"
                                        maxLength={500}
                                    />
                                    <div className="text-xs text-gray-500 text-right">
                                        {childRegistrations[0]?.notes?.length || 0}/500 символов
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Навигация */}
                        {!isViewMode && (
                            <div className={`flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4`}>
                                <Button
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    className={`${isSmallScreen ? 'flex-1 text-sm h-10' : 'flex-1 sm:flex-none'}`}
                                >
                                    Отмена
                                </Button>

                                {currentStep > 0 && (
                                    <Button
                                        variant="outline"
                                        onClick={handlePrevStep}
                                        className={`${isSmallScreen ? 'flex-1 text-sm h-10' : 'flex-1 sm:flex-none'}`}
                                    >
                                        {isSmallScreen ? 'Назад' : 'Предыдущий ребенок'}
                                    </Button>
                                )}

                                {currentStep < children.length && (
                                    <Button
                                        onClick={handleNextStep}
                                        disabled={!getCurrentChild()?.selectedStyles?.some(s => s.quantity > 0)}
                                        className={`${isSmallScreen ? 'flex-1 text-sm h-10' : 'flex-1 sm:flex-none'} bg-orange-600 hover:bg-orange-700`}
                                    >
                                        {currentStep === children.length - 1 ? (isSmallScreen ? 'Завершить' : 'Завершить запись') : (isSmallScreen ? 'Далее' : 'Следующий ребенок')}
                                    </Button>
                                )}

                                {currentStep === children.length && (
                                    <div className={`${isSmallScreen ? 'flex-1' : 'flex-1 sm:flex-none'} space-y-2`}>
                                        {isSubmitting && (
                                            <div className="space-y-2">
                                                <div className={`flex items-center justify-between ${isSmallScreen ? 'text-xs' : 'text-sm'} text-gray-600`}>
                                                    <span>Прогресс отправки</span>
                                                    <span>{Math.round(submitProgress)}%</span>
                                                </div>
                                                {currentSubmittingChild && (
                                                    <div className={`${isSmallScreen ? 'text-xs' : 'text-xs'} text-gray-500 text-center`}>
                                                        Обрабатываем: {currentSubmittingChild}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            <Button
                                                onClick={handleSubmit}
                                                disabled={isSubmitting || !allChildrenCompleted}
                                                className="flex-1 bg-green-600 hover:bg-green-700"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <span className="hidden sm:inline">Отправляем заявки...</span>
                                                        <span className="sm:hidden">Отправка...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="w-4 h-4 mr-2" />
                                                        <span className="hidden sm:inline">Отправить заявки</span>
                                                        <span className="sm:hidden">Отправить</span>
                                                    </>
                                                )}
                                            </Button>

                                            {isSubmitting && (
                                                <Button
                                                    variant="outline"
                                                    onClick={handleCancelSubmit}
                                                    className={`${isSmallScreen ? 'px-2' : 'px-4'}`}
                                                >
                                                    Отмена
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Кнопка закрытия для режима просмотра */}
                        {isViewMode && (
                            <div className="flex justify-center pt-8 pb-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-600">
                                <Button
                                    onClick={() => onOpenChange(false)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                                >
                                    Закрыть
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Модальные окна для медиа */}
            {currentMedia && (
                <>
                    <PhotoGalleryModal
                        isOpen={isPhotoCarouselOpen && currentMedia.type === 'photo'}
                        onOpenChange={setIsPhotoCarouselOpen}
                        images={currentMedia.urls}
                        title={currentMedia.title}
                    />
                    <VideoPlayerModal
                        isOpen={isVideoPlayerOpen && currentMedia.type === 'video'}
                        onOpenChange={setIsVideoPlayerOpen}
                        videoUrl={currentMedia.urls[0]} // Берем первое видео
                        title={currentMedia.title}
                    />
                </>
            )}
        </>
    );

}

