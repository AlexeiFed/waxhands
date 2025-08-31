/**
 * @file: style-selection-modal.tsx
 * @description: Модальное окно выбора стиля для восковой ручки с улучшенным дизайном, опциями и взаимоисключающим выбором стилей
 * @dependencies: Dialog, Card, Button, Checkbox, Badge, AnimatedStars, servicesAPI, PhotoGalleryModal, VideoPlayerModal
 * @created: 2024-12-19
 */

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AnimatedStars } from '@/components/ui/animated-stars';
import { PhotoGalleryModal } from '@/components/ui/photo-gallery-modal';
import { VideoPlayerModal } from '@/components/ui/video-player-modal';
import { Sparkles, Brain, MapPin, Users, Calendar, Clock, Palette, Gift, Star, Camera, Video, Lock, AlertCircle } from 'lucide-react';
import { servicesAPI, workshopRegistrationsAPI } from '@/lib/api';
import { Service, ServiceStyle, ServiceOption } from '@/types';
import { useCreateInvoice } from '@/hooks/use-invoices';
import { invoicesAPI } from '@/hooks/use-invoices';

interface WorkshopCardData {
    id: string;
    title: string;
    date: string;
    time: string;
    classGroup: string;
    schoolName?: string;
    city?: string;
}

interface StyleSelectionModalProps {
    workshop: WorkshopCardData;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    participantName?: string;
    participantId?: string;
    onRegistrationSuccess?: () => void;
}

// Группы взаимоисключающих стилей
const EXCLUSIVE_STYLE_GROUPS = [
    ['Обычная ручка', 'Световая ручка'],
    ['Двойные ручки', 'Двойные световые ручки']
];

const StyleSelectionModal = ({ workshop, isOpen, onOpenChange, participantName, participantId, onRegistrationSuccess }: StyleSelectionModalProps) => {
    const { toast } = useToast();
    const { user } = useAuth();
    const createInvoiceMutation = useCreateInvoice();
    const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [currentService, setCurrentService] = useState<Service | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Состояния для модальных окон медиа
    const [photoGalleryOpen, setPhotoGalleryOpen] = useState(false);
    const [videoPlayerOpen, setVideoPlayerOpen] = useState(false);
    const [currentMedia, setCurrentMedia] = useState<{
        type: 'photo' | 'video';
        title: string;
        urls: string[];
    } | null>(null);

    // Состояние для отслеживания источника данных
    const [dataSource, setDataSource] = useState<'database' | 'fallback' | 'loading'>('loading');

    const loadServiceData = useCallback(async () => {
        try {
            setLoading(true);

            // Получаем реальные данные из API
            const response = await servicesAPI.getServices();

            if (response && response.services) {
                // Ищем услугу "Восковая ручка" среди полученных услуг
                const waxHandService = response.services.find(
                    (service: Service) => service.name.toLowerCase().includes('восковая ручка')
                );

                if (waxHandService) {
                    console.log('Найдена услуга "Восковая ручка":', waxHandService);

                    // Дополнительно загружаем медиафайлы из таблицы master_class_events
                    try {
                        const mediaResponse = await servicesAPI.getServiceMedia(waxHandService.id);
                        console.log('Загружены медиафайлы из БД:', mediaResponse);

                        // Проверяем, есть ли медиафайлы в БД
                        const hasMediaInDB = mediaResponse.styles.some(style =>
                            style.images && style.images.length > 0 ||
                            style.videos && style.videos.length > 0
                        ) || mediaResponse.options.some(option =>
                            option.images && option.images.length > 0 ||
                            option.videos && option.videos.length > 0
                        );

                        if (hasMediaInDB) {
                            console.log('В БД найдены медиафайлы, обновляем услугу');

                            // Валидируем и очищаем медиафайлы
                            const validatedStyles = mediaResponse.styles.map(style => ({
                                ...style,
                                images: Array.isArray(style.images) ? style.images.filter(url => url && typeof url === 'string') : [],
                                videos: Array.isArray(style.videos) ? style.videos.filter(url => url && typeof url === 'string') : []
                            }));

                            const validatedOptions = mediaResponse.options.map(option => ({
                                ...option,
                                images: Array.isArray(option.images) ? option.images.filter(url => url && typeof url === 'string') : [],
                                videos: Array.isArray(option.videos) ? option.videos.filter(url => url && typeof url === 'string') : []
                            }));

                            // Обновляем услугу с медиафайлами из БД
                            const enrichedService: Service = {
                                ...waxHandService,
                                styles: validatedStyles.length > 0 ? validatedStyles : waxHandService.styles,
                                options: validatedOptions.length > 0 ? validatedOptions : waxHandService.options
                            };

                            console.log('Обогащенная услуга с медиафайлами:', enrichedService);
                            setCurrentService(enrichedService);
                            setDataSource('database');
                        } else {
                            console.log('В БД нет медиафайлов, используем базовые данные услуги');
                            setCurrentService(waxHandService);
                            setDataSource('fallback');
                        }
                    } catch (mediaError) {
                        console.warn('Не удалось загрузить медиафайлы, используем базовые данные:', mediaError);
                        setCurrentService(waxHandService);
                        setDataSource('fallback');
                    }
                } else {
                    console.warn('Услуга "Восковая ручка" не найдена в базе данных');
                    // Создаем базовую структуру, если услуга не найдена
                    const defaultService: Service = {
                        id: 'wax-hand-service',
                        name: 'Восковая ручка',
                        shortDescription: 'Создание уникальных восковых ручек с персонализацией',
                        fullDescription: 'Мастер-класс по созданию восковых ручек с выбором стилей и дополнительных опций. Каждый ребенок создает свою уникальную ручку.',
                        styles: [],
                        options: [],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };
                    setCurrentService(defaultService);
                    setDataSource('fallback');
                }
            } else {
                console.error('Ошибка получения услуг из API:', response);
                throw new Error('Не удалось загрузить услуги из базы данных');
            }
        } catch (error) {
            console.error('Ошибка загрузки данных услуги:', error);
            toast({
                title: "Ошибка загрузки",
                description: "Не удалось загрузить данные услуги. Попробуйте обновить страницу.",
                variant: "destructive",
            });

            // В случае ошибки создаем минимальную структуру
            const fallbackService: Service = {
                id: 'wax-hand-service',
                name: 'Восковая ручка',
                shortDescription: 'Создание уникальных восковых ручек с персонализацией',
                fullDescription: 'Мастер-класс по созданию восковых ручек с выбором стилей и дополнительных опций. Каждый ребенок создает свою уникальную ручку.',
                styles: [],
                options: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            setCurrentService(fallbackService);
            setDataSource('fallback');
        } finally {
            setLoading(false);
        }
    }, [toast]);

    // Загружаем данные об услуге "Восковая ручка" при открытии модала
    useEffect(() => {
        if (isOpen) {
            loadServiceData();
        }
    }, [isOpen, loadServiceData]);

    // Стили услуги (динамические из текущей услуги)
    const availableStyles: ServiceStyle[] = currentService?.styles || [];

    // Опции услуги (динамические из текущей услуги)
    const workshopOptions: ServiceOption[] = currentService?.options || [];

    // Проверяем, заблокирован ли стиль из-за взаимоисключения или возрастных ограничений
    const isStyleLocked = (styleName: string): boolean => {
        // Проверяем возрастные ограничения для двойных ручек
        if (styleName === 'Двойные ручки' || styleName === 'Двойные световые ручки') {
            const userAge = user?.age;
            if (!userAge || userAge < 5) {
                return true; // Блокируем для детей младше 5 лет
            }
        }

        // Проверяем взаимоисключение стилей
        if (selectedStyles.length === 0) return false;

        for (const group of EXCLUSIVE_STYLE_GROUPS) {
            if (group.includes(styleName)) {
                // Если выбран другой стиль из этой группы, текущий заблокирован
                const selectedFromGroup = selectedStyles.find(selectedId => {
                    const selectedStyle = availableStyles.find(s => s.id === selectedId);
                    return selectedStyle && group.includes(selectedStyle.name);
                });

                if (selectedFromGroup) {
                    const selectedStyle = availableStyles.find(s => s.id === selectedFromGroup);
                    return selectedStyle && selectedStyle.name !== styleName;
                }
            }
        }
        return false;
    };

    const handleStyleToggle = (styleId: string) => {
        const style = availableStyles.find(s => s.id === styleId);
        if (!style) return;

        // Проверяем взаимоисключение
        for (const group of EXCLUSIVE_STYLE_GROUPS) {
            if (group.includes(style.name)) {
                // Убираем все стили из этой группы
                const stylesToRemove = availableStyles
                    .filter(s => group.includes(s.name))
                    .map(s => s.id);

                setSelectedStyles(prev => prev.filter(id => !stylesToRemove.includes(id)));

                // Если текущий стиль не был выбран, добавляем его
                if (!selectedStyles.includes(styleId)) {
                    setSelectedStyles(prev => [...prev, styleId]);
                }
                return;
            }
        }

        // Для обычных стилей (не взаимоисключающих)
        setSelectedStyles(prev =>
            prev.includes(styleId)
                ? prev.filter(id => id !== styleId)
                : [...prev, styleId]
        );
    };

    const handleOptionToggle = (optionId: string) => {
        setSelectedOptions(prev =>
            prev.includes(optionId)
                ? prev.filter(id => id !== optionId)
                : [...prev, optionId]
        );
    };

    // Проверка существования файла
    const checkFileExists = async (url: string): Promise<boolean> => {
        if (!url || typeof url !== 'string') return false;

        try {
            // Если URL относительный (начинается с /), преобразуем в абсолютный URL
            let absoluteUrl = url;
            if (url.startsWith('/')) {
                // Используем правильный URL в зависимости от окружения
                const baseUrl = import.meta.env.VITE_API_URL || 'https://waxhands.ru';
                // Убираем /api из базового URL для правильного формирования пути к файлам
                const cleanBaseUrl = baseUrl.replace('/api', '');
                absoluteUrl = `${cleanBaseUrl}${url}`;
                console.log(`Преобразуем относительный URL ${url} в абсолютный: ${absoluteUrl}`);
            }

            // Проверяем что URL валидный
            const urlObj = new URL(absoluteUrl);
            if (!urlObj.protocol.startsWith('http')) return false;

            console.log(`Проверяем файл: ${absoluteUrl}`);
            const response = await fetch(absoluteUrl, {
                method: 'HEAD',
                mode: 'cors',
                cache: 'no-cache'
            });

            const exists = response.ok;
            console.log(`Файл ${absoluteUrl} доступен: ${exists} (статус: ${response.status})`);
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

        console.log('Проверяем файлы:', validUrls);

        for (const url of validUrls) {
            const exists = await checkFileExists(url);
            console.log(`Файл ${url} существует: ${exists}`);
            if (exists) {
                // Возвращаем абсолютный URL для существующих файлов
                const baseUrl = import.meta.env.VITE_API_URL || 'https://waxhands.ru';
                const cleanBaseUrl = baseUrl.replace('/api', '');
                const absoluteUrl = url.startsWith('/') ? `${cleanBaseUrl}${url}` : url;
                existingFiles.push(absoluteUrl);
            }
        }

        console.log('Найдены существующие файлы:', existingFiles);
        return existingFiles;
    };

    // Открытие галереи фото
    const openPhotoGallery = async (images: string[], title: string) => {
        console.log(`openPhotoGallery: Получены изображения для "${title}":`, images);

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

            console.log(`openPhotoGallery: Открываем галерею для "${title}" с существующими изображениями:`, existingImages);
            setCurrentMedia({ type: 'photo', title, urls: existingImages });
            setPhotoGalleryOpen(true);
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
        console.log(`openVideoPlayer: Получены видео для "${title}":`, videos);

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

            console.log(`openVideoPlayer: Открываем видео для "${title}" с существующими видео:`, existingVideos);
            setCurrentMedia({ type: 'video', title, urls: existingVideos });
            setVideoPlayerOpen(true);
        } catch (error) {
            console.error('Ошибка при открытии видео:', error);
            toast({
                title: "Ошибка",
                description: "Не удалось открыть видео плеер",
                variant: "destructive",
            });
        }
    };

    // Вспомогательная функция для проверки наличия медиафайлов
    const hasValidMedia = (item: ServiceStyle | ServiceOption): boolean => {
        const hasValidImages = item.images && Array.isArray(item.images) && item.images.length > 0;
        const hasValidVideos = item.videos && Array.isArray(item.videos) && item.videos.length > 0;
        const hasMedia = hasValidImages || hasValidVideos;
        console.log(`hasValidMedia для "${item.name}":`, {
            hasImages: hasValidImages,
            hasVideos: hasValidVideos,
            images: item.images,
            videos: item.videos,
            result: hasMedia
        });
        return hasMedia;
    };

    // Вспомогательная функция для получения медиафайлов стиля
    const getStyleMedia = (style: ServiceStyle) => {
        const media = {
            images: style.images && Array.isArray(style.images) ? style.images : [],
            videos: style.videos && Array.isArray(style.videos) ? style.videos : []
        };
        console.log(`getStyleMedia для стиля "${style.name}":`, media);
        return media;
    };

    // Вспомогательная функция для получения медиафайлов опции
    const getOptionMedia = (option: ServiceOption) => {
        const media = {
            images: option.images && Array.isArray(option.images) ? option.images : [],
            videos: option.videos && Array.isArray(option.videos) ? option.videos : []
        };
        console.log(`getOptionMedia для опции "${option.name}":`, media);
        return media;
    };

    const handleSubmit = async () => {
        if (selectedStyles.length === 0) {
            toast({
                title: "Выберите стиль",
                description: "Пожалуйста, выберите хотя бы один стиль для вашей восковой ручки",
                variant: "destructive",
            });
            return;
        }

        if (!participantId) {
            toast({
                title: "Ошибка",
                description: "Не удалось определить участника. Пожалуйста, войдите в систему.",
                variant: "destructive",
            });
            return;
        }

        setSubmitting(true);

        try {
            // Проверка дубликатов происходит на бэкенде
            // Здесь просто пытаемся создать регистрацию и обрабатываем ошибки

            // Сначала создаем регистрацию на мастер-класс
            console.log('Создание регистрации на мастер-класс...');

            const registrationData = {
                workshopId: workshop.id,
                userId: participantId,
                style: (selectedStyles || []).map(styleId => {
                    const style = availableStyles.find(s => s.id === styleId);
                    return style?.name || 'Неизвестный стиль';
                }).join(', '),
                options: (selectedOptions || []).map(optionId => {
                    const option = workshopOptions.find(o => o.id === optionId);
                    return option?.name || 'Неизвестная опция';
                }),
                totalPrice: totalPrice
            };

            console.log('Данные для регистрации:', registrationData);

            // Создаем регистрацию через API
            let registrationResult;
            try {
                registrationResult = await workshopRegistrationsAPI.createRegistration(registrationData);
                console.log('Регистрация создана:', registrationResult);
            } catch (registrationError: unknown) {
                console.error('Ошибка при создании регистрации:', registrationError);

                // Проверяем, является ли ошибка дублированием регистрации
                const errorMessage = registrationError instanceof Error ? registrationError.message : String(registrationError);
                if (errorMessage.includes('already registered') ||
                    errorMessage.includes('User already registered')) {
                    toast({
                        title: "Уже зарегистрирован! 🎯",
                        description: "Ты уже записан на этот мастер-класс. Проверь свои записи.",
                        variant: "default",
                    });
                    onOpenChange(false);
                    return;
                }

                // Для других ошибок показываем общее сообщение
                toast({
                    title: "Ошибка регистрации",
                    description: "Не удалось записаться на мастер-класс. Попробуй еще раз.",
                    variant: "destructive",
                });
                return;
            }

            // Затем создаем счет через API
            // Исправляем проблему с датой - используем локальную дату без преобразования в UTC
            const workshopDate = new Date(workshop.date);
            const localDate = new Date(workshopDate.getTime() - (workshopDate.getTimezoneOffset() * 60000));
            const normalizedDate = localDate.toISOString().split('T')[0];

            console.log('Исходная дата:', workshop.date);
            console.log('Workshop объект даты:', workshopDate);
            console.log('Локальная дата:', localDate);
            console.log('Нормализованная дата:', normalizedDate);

            const invoiceData = {
                master_class_id: workshop.id,
                workshop_date: normalizedDate,
                city: workshop.city || 'Не указан',
                school_name: workshop.schoolName || 'Не указано',
                class_group: workshop.classGroup,
                participant_name: participantName || 'Не указано',
                participant_id: participantId,
                amount: totalPrice,
                selected_styles: (selectedStyles || []).map(styleId => {
                    const style = availableStyles.find(s => s.id === styleId);
                    return {
                        id: styleId,
                        name: style?.name || 'Неизвестный стиль',
                        price: style?.price || 0
                    };
                }),
                selected_options: (selectedOptions || []).map(optionId => {
                    const option = workshopOptions.find(o => o.id === optionId);
                    return {
                        id: optionId,
                        name: option?.name || 'Неизвестная опция',
                        price: option?.price || 0
                    };
                })
            };

            console.log('🔄 StyleSelectionModal: Создание счета - данные:', invoiceData);
            console.log('🔄 StyleSelectionModal: Workshop данные:', workshop);

            let result;
            try {
                result = await createInvoiceMutation.mutateAsync(invoiceData);
                console.log('✅ StyleSelectionModal: Счет создан успешно:', result);
                // Backend автоматически добавляет участника в master_class_events.participants
            } catch (invoiceError) {
                console.error('❌ StyleSelectionModal: Ошибка создания счета:', invoiceError);
                console.error('❌ StyleSelectionModal: Стек ошибки:', invoiceError instanceof Error ? invoiceError.stack : 'Неизвестно');
                console.error('❌ StyleSelectionModal: Данные которые не удалось обработать:', invoiceData);
                throw invoiceError; // Перебрасываем ошибку для обработки выше
            }

            console.log('Участник будет добавлен автоматически при создании счета');

            toast({
                title: "Заявка отправлена! 🎉",
                description: `Счет №${result.id} создан на сумму ${totalPrice} Р. Мы свяжемся с твоими родителями для подтверждения.`,
            });

            // Вызываем callback для обновления данных
            if (onRegistrationSuccess) {
                onRegistrationSuccess();
            }

            onOpenChange(false);
            setSelectedStyles([]);
            setSelectedOptions([]);
        } catch (error) {
            console.error('Ошибка при создании счета:', error);
            toast({
                title: "Ошибка",
                description: "Не удалось отправить заявку. Попробуйте еще раз или обратитесь к администратору.",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const totalPrice = selectedStyles.reduce((total, styleId) => {
        const style = availableStyles.find(s => s.id === styleId);
        return total + (style?.price || 0);
    }, 0) + selectedOptions.reduce((total, optionId) => {
        const option = workshopOptions.find(o => o.id === optionId);
        return total + (option?.price || 0);
    }, 0);

    if (loading) {
        return (
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-yellow-50 via-pink-50 to-blue-50 border-0 shadow-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="sr-only">Загрузка данных</DialogTitle>
                        <DialogDescription className="sr-only">
                            Загрузка данных для участия в мастер-классе
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                        <span className="ml-3 text-lg text-orange-600">Загрузка данных...</span>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-yellow-50 via-pink-50 to-blue-50 border-0 shadow-2xl p-4 sm:p-6">
                    {/* Анимированные звездочки */}
                    <AnimatedStars count={15} className="opacity-40" />

                    {/* Плавающие элементы */}
                    <div className="absolute top-8 left-4 sm:left-8 animate-bounce-gentle">
                        <div className="bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full p-2 sm:p-3 shadow-glow">
                            <Palette className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                    </div>

                    <div className="absolute top-16 right-4 sm:right-12 animate-float">
                        <div className="bg-gradient-to-br from-purple-400 to-pink-400 rounded-full p-2 shadow-glow">
                            <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                    </div>

                    <DialogHeader className="flex items-center space-x-2 sm:space-x-3 pb-4 sm:pb-6">
                        <div className="bg-gradient-to-r from-orange-500 to-purple-500 rounded-full p-1.5 sm:p-2">
                            <Sparkles className="w-5 h-5 sm:w-6 sm:w-6 text-white" />
                        </div>
                        <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                            Участие в мастер-классе
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Модальное окно для выбора стиля и опций участия в мастер-классе
                        </DialogDescription>
                    </DialogHeader>

                    {/* Информация об источнике данных */}
                    <div className="flex items-center justify-between mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${dataSource === 'database' ? 'bg-green-500' :
                                dataSource === 'fallback' ? 'bg-yellow-500' : 'bg-blue-500'
                                }`}></div>
                            <span className="text-sm text-gray-600">
                                {dataSource === 'database' ? 'Данные загружены из базы данных' :
                                    dataSource === 'fallback' ? 'Используются базовые данные' :
                                        'Загрузка данных...'}
                            </span>
                        </div>
                        <Button
                            onClick={loadServiceData}
                            size="sm"
                            variant="outline"
                            className="text-xs px-2 py-1 h-7"
                        >
                            Обновить
                        </Button>
                    </div>

                    {/* Информация о мастер-классе */}
                    <Card className="bg-white/90 backdrop-blur-sm border-orange-200 shadow-card mb-4 sm:mb-6">
                        <CardHeader className="pb-3 sm:pb-4">
                            <CardTitle className="text-xl sm:text-2xl font-bold text-orange-500 flex items-center space-x-2">
                                <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
                                <span>{workshop.title}</span>
                            </CardTitle>
                            <CardDescription className="text-gray-600 text-base sm:text-lg">
                                Информация о мастер-классе
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 sm:space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
                                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 flex-shrink-0" />
                                    <span className="text-gray-700 font-medium text-sm sm:text-base truncate">{workshop.schoolName}</span>
                                </div>
                                <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
                                    <span className="text-gray-700 font-medium text-sm sm:text-base">Класс: {workshop.classGroup}</span>
                                </div>
                                <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                                    <span className="text-gray-700 font-medium text-sm sm:text-base">{new Date(workshop.date).toLocaleDateString('ru-RU')}</span>
                                </div>
                                <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                                    <span className="text-gray-700 font-medium text-sm sm:text-base">{workshop.time}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Выбор стиля */}
                    <Card className="bg-white/90 backdrop-blur-sm border-purple-200 shadow-card mb-4 sm:mb-6">
                        <CardHeader className="pb-3 sm:pb-4">
                            <div className="flex items-center space-x-2 sm:space-x-3">
                                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-1.5 sm:p-2">
                                    <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                </div>
                                <CardTitle className="text-lg sm:text-xl font-bold text-gray-800">
                                    Выберите свой стиль
                                </CardTitle>
                            </div>
                            <CardDescription className="text-gray-600 text-base sm:text-lg">
                                Выберите свой стиль для вашей восковой ручки
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 sm:space-y-4">
                            {/* Предупреждение о возрастных ограничениях - вынесено из заголовка */}
                            {user?.age && user.age < 5 && (
                                <div className="p-3 border rounded-lg bg-orange-50 border-orange-200 mb-4">
                                    <div className="flex items-center space-x-2 text-sm text-orange-700">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        <span>Стили "Двойные ручки" и "Двойные световые ручки" доступны только с 5 лет</span>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-3 sm:gap-4">
                                {availableStyles.map((style) => {
                                    const isLocked = isStyleLocked(style.name);
                                    const styleMedia = getStyleMedia(style);
                                    const hasPhotos = styleMedia.images.length > 0;
                                    const hasVideos = styleMedia.videos.length > 0;

                                    return (
                                        <div
                                            key={style.id}
                                            className={`flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 border-2 rounded-xl transition-all duration-300 ${isLocked
                                                ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-60'
                                                : selectedStyles.includes(style.id)
                                                    ? 'border-purple-400 bg-gradient-to-r from-purple-50 to-pink-50 shadow-lg cursor-pointer hover:scale-105'
                                                    : 'border-gray-200 bg-white hover:border-orange-300 cursor-pointer hover:scale-105'
                                                }`}
                                            onClick={() => !isLocked && handleStyleToggle(style.id)}
                                        >
                                            <Checkbox
                                                id={style.id}
                                                checked={selectedStyles.includes(style.id)}
                                                onCheckedChange={() => !isLocked && handleStyleToggle(style.id)}
                                                disabled={isLocked}
                                                className="mt-1 flex-shrink-0 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500 disabled:opacity-50"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-2">
                                                    <label
                                                        htmlFor={style.id}
                                                        className="text-base sm:text-lg font-semibold text-gray-800 cursor-pointer flex items-center space-x-2 min-w-0"
                                                    >
                                                        <span className="text-xl sm:text-2xl flex-shrink-0">✋</span>
                                                        <span className="truncate">{style.name}</span>
                                                        {isLocked && <Lock className="w-4 h-4 text-gray-500 ml-2" />}
                                                    </label>
                                                    <div className="flex items-center space-x-2">
                                                        {/* Иконки медиа */}
                                                        {hasPhotos && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    await openPhotoGallery(styleMedia.images, style.name);
                                                                }}
                                                                className="p-1 h-auto text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                title="Посмотреть фото"
                                                            >
                                                                <Camera className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                        {hasVideos && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    await openVideoPlayer(styleMedia.videos, style.name);
                                                                }}
                                                                className="p-1 h-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                title="Смотреть видео"
                                                            >
                                                                <Video className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                        <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white border-0 px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold flex-shrink-0 ml-2">
                                                            {style.price} Р
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                                                    {style.shortDescription || style.fullDescription}
                                                    {isLocked && (style.name === 'Двойные ручки' || style.name === 'Двойные световые ручки') && (
                                                        <span className="block text-orange-600 text-sm mt-1">
                                                            🔒 Доступно только с 5 лет
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Выбор опций услуги */}
                    <Card className="bg-white/90 backdrop-blur-sm border-blue-200 shadow-card mb-4 sm:mb-6">
                        <CardHeader className="pb-3 sm:pb-4">
                            <div className="flex items-center space-x-2 sm:space-x-3">
                                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full p-1.5 sm:p-2">
                                    <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                </div>
                                <CardTitle className="text-lg sm:text-xl font-bold text-gray-800">
                                    Выберите опции
                                </CardTitle>
                            </div>
                            <CardDescription className="text-gray-600 text-base sm:text-lg">
                                Выберите дополнительные опции для вашей восковой ручки
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 sm:space-y-4">
                            <div className="grid grid-cols-1 gap-3 sm:gap-4">
                                {workshopOptions.map((option) => {
                                    const optionMedia = getOptionMedia(option);
                                    const hasPhotos = optionMedia.images.length > 0;
                                    const hasVideos = optionMedia.videos.length > 0;

                                    return (
                                        <div
                                            key={option.id}
                                            className={`flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 border-2 rounded-xl transition-all duration-300 cursor-pointer hover:scale-105 ${selectedOptions.includes(option.id)
                                                ? 'border-blue-400 bg-gradient-to-r from-blue-50 to-cyan-50 shadow-lg'
                                                : 'border-gray-200 bg-white hover:border-blue-300'
                                                }`}
                                            onClick={() => handleOptionToggle(option.id)}
                                        >
                                            <Checkbox
                                                id={`option-${option.id}`}
                                                checked={selectedOptions.includes(option.id)}
                                                onCheckedChange={() => handleOptionToggle(option.id)}
                                                className="mt-1 flex-shrink-0 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-2">
                                                    <label
                                                        htmlFor={`option-${option.id}`}
                                                        className="text-base sm:text-lg font-semibold text-gray-800 cursor-pointer flex items-center space-x-2 min-w-0"
                                                    >
                                                        <span className="text-xl sm:text-2xl flex-shrink-0">✨</span>
                                                        <span className="truncate">{option.name}</span>
                                                    </label>
                                                    <div className="flex items-center space-x-2">
                                                        {/* Иконки медиа */}
                                                        {hasPhotos && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    await openPhotoGallery(optionMedia.images, option.name);
                                                                }}
                                                                className="p-1 h-auto text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                title="Посмотреть фото"
                                                            >
                                                                <Camera className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                        {hasVideos && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    await openVideoPlayer(optionMedia.videos, option.name);
                                                                }}
                                                                className="p-1 h-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                title="Смотреть видео"
                                                            >
                                                                <Video className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                        <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold flex-shrink-0 ml-2">
                                                            {option.price} Р
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                                                    {option.shortDescription || option.fullDescription}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Итоговая стоимость и кнопки */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 pt-4 sm:pt-6 border-t-2 border-gradient-to-r from-orange-200 via-purple-200 to-blue-200">
                        <div className="text-center sm:text-left">
                            <p className="text-base sm:text-lg text-gray-600 mb-2">Общая стоимость:</p>
                            <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                                {totalPrice} Р
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="w-full sm:w-auto min-w-[140px] py-2.5 sm:py-3 px-4 sm:px-6 text-base sm:text-lg border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
                            >
                                Отмена
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={selectedStyles.length === 0 || submitting}
                                className="w-full sm:w-auto min-w-[180px] py-2.5 sm:py-3 px-4 sm:px-6 text-base sm:text-lg bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600 text-white shadow-glow transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {submitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                                        Создание счета...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                        Отправить заявку
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Модальные окна для медиа */}
            {currentMedia && (
                <>
                    <PhotoGalleryModal
                        isOpen={photoGalleryOpen && currentMedia.type === 'photo'}
                        onOpenChange={setPhotoGalleryOpen}
                        images={currentMedia.urls}
                        title={currentMedia.title}
                    />
                    <VideoPlayerModal
                        isOpen={videoPlayerOpen && currentMedia.type === 'video'}
                        onOpenChange={setVideoPlayerOpen}
                        videoUrl={currentMedia.urls[0]} // Берем первое видео
                        title={currentMedia.title}
                    />
                </>
            )}
        </>
    );
};

export default StyleSelectionModal;
