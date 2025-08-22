/**
 * @file: MasterClassesTab.tsx
 * @description: Вкладка управления мастер-классами для админ-панели
 * @dependencies: Card, Button, Badge, Input, Select, Calendar, useMasterClasses
 * @created: 2024-12-19
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardContentCompact, CardDescription, CardHeader, CardHeaderCompact, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { MasterClassEvent, Service } from '@/types/services';
import { School } from '@/types';
import { Plus, CalendarIcon, Clock, MapPin, Users, DollarSign, Trash2, UserPlus, Filter, BarChart3, FileSpreadsheet } from 'lucide-react';
import { ru } from 'date-fns/locale';
import { api } from '@/lib/api';
import * as XLSX from 'xlsx';

interface MasterClassesTabProps {
    services: Service[];
    schools: School[];
    masterClasses: MasterClassEvent[];
    onAddMasterClass: (masterClass: Omit<MasterClassEvent, 'id' | 'createdAt' | 'updatedAt' | 'participants' | 'statistics'>) => void;
    onEditMasterClass: (id: string, masterClass: Partial<MasterClassEvent>) => void;
    onViewMasterClass: (masterClass: MasterClassEvent) => void;
    onDeleteMasterClass: (id: string) => void;
}

export default function MasterClassesTab({
    services,
    schools,
    masterClasses,
    onAddMasterClass,
    onEditMasterClass,
    onViewMasterClass,
    onDeleteMasterClass
}: MasterClassesTabProps) {
    const { toast } = useToast();

    // Отладка при загрузке компонента
    console.log('MasterClassesTab: компонент загружен');
    console.log('MasterClassesTab: props:', { services: services.length, schools: schools.length, masterClasses: masterClasses.length });
    console.log('MasterClassesTab: masterClasses:', masterClasses);



    // Состояние формы
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        date: '',
        time: '',
        schoolId: '',
        classGroup: '',
        serviceId: '',
        executors: [] as string[],
        notes: ''
    });

    // Состояние для исполнителей
    const [availableExecutors, setAvailableExecutors] = useState<Array<{ id: string; name: string }>>([]);
    const [loadingExecutors, setLoadingExecutors] = useState(false);

    // Состояние для модального окна управления исполнителями
    const [executorsModalOpen, setExecutorsModalOpen] = useState(false);
    const [selectedMasterClass, setSelectedMasterClass] = useState<MasterClassEvent | null>(null);
    const [editingExecutors, setEditingExecutors] = useState<string[]>([]);

    // Фильтры
    const [filterCity, setFilterCity] = useState('all');
    const [filterSchool, setFilterSchool] = useState('all');
    const [filterClass, setFilterClass] = useState('all');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');

    // Получение уникальных городов
    const getUniqueCities = (): string[] => {
        const cities = schools.map(school => {
            // Извлекаем город из адреса школы
            return school.address ? school.address.split(',')[0].trim() : '';
        }).filter(Boolean);
        return [...new Set(cities)];
    };

    // Получение отфильтрованных школ
    const getFilteredSchools = (): School[] => {
        if (filterCity === 'all') return schools;
        return schools.filter(school => {
            const schoolCity = school.address ? school.address.split(',')[0].trim() : '';
            return schoolCity === filterCity;
        });
    };

    // Получение отфильтрованных классов
    const getFilteredClasses = (): string[] => {
        if (!formData.schoolId) return [];
        const school = schools.find(s => s.id === formData.schoolId);
        return school ? school.classes : [];
    };

    // Получение отфильтрованных мастер-классов
    const getFilteredMasterClasses = (): MasterClassEvent[] => {
        let filtered = masterClasses;

        // Фильтр по городу
        if (filterCity !== 'all') {
            filtered = filtered.filter(mc => {
                const school = schools.find(s => s.id === mc.schoolId);
                if (school && school.address) {
                    const schoolCity = school.address.split(',')[0].trim();
                    return schoolCity === filterCity;
                }
                return false;
            });
        }

        // Фильтр по школе
        if (filterSchool !== 'all') {
            filtered = filtered.filter(mc => mc.schoolId === filterSchool);
        }

        // Фильтр по классу
        if (filterClass !== 'all') {
            filtered = filtered.filter(mc => mc.classGroup === filterClass);
        }

        // Фильтр по дате от
        if (filterDateFrom) {
            filtered = filtered.filter(mc => mc.date >= filterDateFrom);
        }

        // Фильтр по дате до
        if (filterDateTo) {
            filtered = filtered.filter(mc => mc.date <= filterDateTo);
        }

        return filtered;
    };

    // Получение финансовой статистики по отфильтрованным мастер-классам
    const getFinancialStats = () => {
        const filteredClasses = getFilteredMasterClasses();

        const totalAmount = filteredClasses.reduce((sum, mc) => sum + mc.statistics.totalAmount, 0);
        const paidAmount = filteredClasses.reduce((sum, mc) => {
            const paidParticipants = mc.participants.filter(p => p.isPaid);
            return sum + paidParticipants.reduce((pSum, p) => pSum + p.totalAmount, 0);
        }, 0);
        const unpaidAmount = totalAmount - paidAmount;

        return {
            totalAmount,
            paidAmount,
            unpaidAmount,
            totalClasses: filteredClasses.length
        };
    };

    // Загрузка доступных исполнителей
    const loadExecutors = async () => {
        setLoadingExecutors(true);
        try {
            const response = await api.users.getUsers({ role: 'executor' });
            setAvailableExecutors(response.users.map(user => ({
                id: user.id,
                name: `${user.name}${user.surname ? ` ${user.surname}` : ''}`
            })));
        } catch (error) {
            console.error('Error loading executors:', error);
        } finally {
            setLoadingExecutors(false);
        }
    };

    // Открытие модального окна управления исполнителями
    const openExecutorsModal = (masterClass: MasterClassEvent) => {
        setSelectedMasterClass(masterClass);
        setEditingExecutors([...masterClass.executors]);
        setExecutorsModalOpen(true);
    };

    // Сохранение изменений исполнителей
    const saveExecutorsChanges = async () => {
        if (!selectedMasterClass) return;

        try {
            await onEditMasterClass(selectedMasterClass.id, {
                executors: editingExecutors
            });

            // Обновляем локальное состояние
            const updatedMasterClass = { ...selectedMasterClass, executors: editingExecutors };
            // Здесь можно обновить локальный список мастер-классов, если нужно

            setExecutorsModalOpen(false);
            setSelectedMasterClass(null);
            setEditingExecutors([]);

            // Показываем уведомление об успехе
            toast({
                title: "Успешно",
                description: "Исполнители обновлены",
            });
        } catch (error) {
            console.error('Error saving executors:', error);
            toast({
                title: "Ошибка",
                description: "Не удалось обновить исполнителей",
                variant: "destructive",
            });
        }
    };

    // Отмена изменений исполнителей
    const cancelExecutorsChanges = () => {
        setExecutorsModalOpen(false);
        setSelectedMasterClass(null);
        setEditingExecutors([]);
    };

    // Получение статистики по стилям и опциям
    const getStylesAndOptionsStats = () => {
        console.log('🔍 getStylesAndOptionsStats: ФУНКЦИЯ ВЫЗВАНА!');
        const filteredClasses = getFilteredMasterClasses();
        const stylesStats: Record<string, number> = {};
        const optionsStats: Record<string, number> = {};

        // Отладочная информация
        console.log('getStylesAndOptionsStats: начало подсчета статистики');
        console.log('getStylesAndOptionsStats: отфильтрованных мастер-классов:', filteredClasses.length);
        console.log('getStylesAndOptionsStats: все мастер-классы:', masterClasses.length);
        console.log('getStylesAndOptionsStats: все мастер-классы:', masterClasses);
        console.log('getStylesAndOptionsStats: отфильтрованные мастер-классы:', filteredClasses);

        // Детальная отладка участников
        filteredClasses.forEach((mc, index) => {
            console.log(`getStylesAndOptionsStats: Мастер-класс ${index + 1}:`, {
                id: mc.id,
                date: mc.date,
                participantsCount: mc.participants?.length || 0,
                participants: mc.participants
            });

            if (mc.participants && mc.participants.length > 0) {
                mc.participants.forEach((participant, pIndex) => {
                    console.log(`getStylesAndOptionsStats: Участник ${pIndex + 1} в МК ${index + 1}:`, {
                        id: participant.id,
                        selectedStyles: participant.selectedStyles,
                        selectedOptions: participant.selectedOptions
                    });

                    // Детальная отладка структуры selectedStyles и selectedOptions
                    if (participant.selectedStyles && participant.selectedStyles.length > 0) {
                        console.log(`getStylesAndOptionsStats: selectedStyles детально:`, participant.selectedStyles);
                        participant.selectedStyles.forEach((style, sIndex) => {
                            console.log(`getStylesAndOptionsStats: style ${sIndex}:`, {
                                type: typeof style,
                                value: style,
                                isObject: typeof style === 'object',
                                keys: typeof style === 'object' ? Object.keys(style) : 'N/A'
                            });
                        });
                    }

                    if (participant.selectedOptions && participant.selectedOptions.length > 0) {
                        console.log(`getStylesAndOptionsStats: selectedOptions детально:`, participant.selectedOptions);
                        participant.selectedOptions.forEach((option, oIndex) => {
                            console.log(`getStylesAndOptionsStats: option ${oIndex}:`, {
                                type: typeof option,
                                value: option,
                                isObject: typeof option === 'object',
                                keys: typeof option === 'object' ? Object.keys(option) : 'N/A'
                            });
                        });
                    }
                });
            }
        });

        filteredClasses.forEach((mc, mcIndex) => {
            console.log(`getStylesAndOptionsStats: мастер-класс ${mcIndex + 1}:`, {
                id: mc.id,
                date: mc.date,
                schoolName: mc.schoolName,
                classGroup: mc.classGroup,
                participantsCount: mc.participants?.length || 0,
                participants: mc.participants
            });

            if (!mc.participants || mc.participants.length === 0) {
                console.log(`getStylesAndOptionsStats: мастер-класс ${mcIndex + 1} не имеет участников`);
                return;
            }

            mc.participants.forEach((participant, pIndex) => {
                console.log(`getStylesAndOptionsStats: участник ${pIndex + 1}:`, {
                    id: participant.id,
                    childName: participant.childName,
                    selectedStyles: participant.selectedStyles,
                    selectedOptions: participant.selectedOptions
                });

                // Статистика по стилям
                if (participant.selectedStyles && participant.selectedStyles.length > 0) {
                    participant.selectedStyles.forEach((styleItem: string | { id: string }) => {
                        // Обрабатываем как ID строку или как объект с id
                        const styleId = typeof styleItem === 'string' ? styleItem : styleItem.id;

                        if (!styleId) {
                            console.log(`getStylesAndOptionsStats: не удалось извлечь styleId из:`, styleItem);
                            return;
                        }

                        const service = services.find(s => s.id === mc.serviceId);
                        if (!service) {
                            console.log(`getStylesAndOptionsStats: услуга не найдена для serviceId: ${mc.serviceId}`);
                            return;
                        }

                        const style = service.styles.find(st => st.id === styleId);
                        if (style) {
                            stylesStats[style.name] = (stylesStats[style.name] || 0) + 1;
                            console.log(`getStylesAndOptionsStats: добавлен стиль "${style.name}" (ID: ${styleId})`);
                        } else {
                            console.log(`getStylesAndOptionsStats: стиль не найден для styleId: ${styleId} из ${styleItem}`);
                        }
                    });
                } else {
                    console.log(`getStylesAndOptionsStats: участник ${pIndex + 1} не выбрал стили`);
                }

                // Статистика по опциям
                if (participant.selectedOptions && participant.selectedOptions.length > 0) {
                    participant.selectedOptions.forEach((optionItem: string | { id: string }) => {
                        // Обрабатываем как ID строку или как объект с id
                        const optionId = typeof optionItem === 'string' ? optionItem : optionItem.id;

                        if (!optionId) {
                            console.log(`getStylesAndOptionsStats: не удалось извлечь optionId из:`, optionItem);
                            return;
                        }

                        const service = services.find(s => s.id === mc.serviceId);
                        if (!service) {
                            console.log(`getStylesAndOptionsStats: услуга не найдена для serviceId: ${mc.serviceId}`);
                            return;
                        }

                        const option = service.options.find(opt => opt.id === optionId);
                        if (option) {
                            optionsStats[option.name] = (optionsStats[option.name] || 0) + 1;
                            console.log(`getStylesAndOptionsStats: добавлена опция "${option.name}" (ID: ${optionId})`);
                        } else {
                            console.log(`getStylesAndOptionsStats: опция не найдена для optionId: ${optionId} из ${optionItem}`);
                        }
                    });
                } else {
                    console.log(`getStylesAndOptionsStats: участник ${pIndex + 1} не выбрал опции`);
                }
            });
        });

        console.log('getStylesAndOptionsStats: итоговая статистика:', { stylesStats, optionsStats });

        return { stylesStats, optionsStats };
    };

    // Получение мастер-классов для календаря
    const getMasterClassesForDate = useCallback((date: Date): MasterClassEvent[] => {
        const dateStr = formatDateForComparison(date);

        // Отладочная информация для понимания проблемы
        console.log(`getMasterClassesForDate: ищем для даты ${dateStr}`);
        console.log(`getMasterClassesForDate: доступные даты в данных:`, masterClasses.map(mc => mc.date));

        const filtered = masterClasses.filter(mc => {
            // Обрабатываем разные форматы дат
            let mcDate = mc.date;
            if (mcDate.includes('T')) {
                mcDate = mcDate.split('T')[0];
            }
            const matches = mcDate === dateStr;

            // Отладочная информация для каждой даты
            console.log(`getMasterClassesForDate: проверяем ${mcDate} === ${dateStr} -> ${matches}`);

            if (matches) {
                console.log(`getMasterClassesForDate: найдено совпадение: ${mcDate} === ${dateStr}`);
            }
            return matches;
        });

        // Отладочная информация
        if (filtered.length > 0) {
            console.log(`getMasterClassesForDate: ${dateStr} -> ${filtered.length} мастер-классов`);
        } else {
            console.log(`getMasterClassesForDate: для ${dateStr} мастер-классов не найдено`);
        }

        return filtered;
    }, [masterClasses]);

    // Форматирование даты для сравнения
    const formatDateForComparison = (date: Date): string => {
        // Используем локальное время для избежания проблем с часовыми поясами
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formatted = `${year}-${month}-${day}`;

        // Отладочная информация для проверки корректности форматирования
        console.log(`formatDateForComparison: ${date.toLocaleDateString()} -> ${formatted}`);

        return formatted;
    };

    // Обработка выбора даты
    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            // Отладочная информация для понимания проблемы с датами
            console.log(`handleDateSelect: получена дата:`, {
                originalDate: date,
                toLocaleDateString: date.toLocaleDateString(),
                toISOString: date.toISOString(),
                getTime: date.getTime(),
                getFullYear: date.getFullYear(),
                getMonth: date.getMonth(),
                getDate: date.getDate()
            });

            // Устанавливаем выбранную дату в форму используя локальное форматирование
            const formattedDate = formatDateForComparison(date);
            setFormData(prev => ({ ...prev, date: formattedDate }));

            // Открываем модальное окно создания мастер-класса
            setIsAddDialogOpen(true);
            console.log(`Открыто модальное окно для даты ${date.toLocaleDateString()} -> ${formattedDate}`);
        }
    };

    // Обработка изменения школы
    const handleSchoolChange = (schoolId: string) => {
        setFormData(prev => ({ ...prev, schoolId, classGroup: '' }));
    };

    // Обработка отправки формы
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.executors.length === 0) {
            toast({
                title: "Ошибка",
                description: "Выберите хотя бы одного исполнителя",
                variant: "destructive",
            });
            return;
        }

        // Отладочная информация для проверки даты
        console.log(`handleSubmit: отправляем мастер-класс с датой:`, {
            formDataDate: formData.date,
            formDataType: typeof formData.date,
            currentFormData: formData,
            // Дополнительная отладка для понимания проблемы с датами
            parsedDate: new Date(formData.date),
            parsedDateISO: new Date(formData.date).toISOString(),
            parsedDateLocal: new Date(formData.date).toLocaleDateString()
        });

        // Дополнительная валидация даты
        if (!formData.date) {
            toast({
                title: "Ошибка",
                description: "Дата не выбрана",
                variant: "destructive",
            });
            return;
        }

        // Проверяем, что дата не в прошлом
        const selectedDate = new Date(formData.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            toast({
                title: "Ошибка",
                description: "Нельзя создавать мастер-класс в прошлом",
                variant: "destructive",
            });
            return;
        }

        onAddMasterClass({
            date: formData.date,
            time: formData.time,
            schoolId: formData.schoolId,
            classGroup: formData.classGroup,
            serviceId: formData.serviceId,
            executors: formData.executors,
            notes: formData.notes,
            city: schools.find(s => s.id === formData.schoolId)?.address?.split(',')[0]?.trim() || '',
            schoolName: schools.find(s => s.id === formData.schoolId)?.name || '',
            serviceName: services.find(s => s.id === formData.serviceId)?.name || ''
        });

        // Сброс формы
        setFormData({
            date: '',
            time: '',
            schoolId: '',
            classGroup: '',
            serviceId: '',
            executors: [],
            notes: ''
        });
        setIsAddDialogOpen(false);

        toast({
            title: "Успешно",
            description: "Мастер-класс создан",
        });
    };

    // Обработка изменения исполнителей
    const handleExecutorChange = (executorId: string, checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            executors: checked
                ? [...prev.executors, executorId]
                : prev.executors.filter(id => id !== executorId)
        }));
    };

    // Отладочная информация
    useEffect(() => {
        console.log('MasterClassesTab: useEffect сработал');
        console.log('MasterClassesTab: Получены данные:', {
            masterClassesCount: masterClasses.length,
            masterClasses: masterClasses,
            schoolsCount: schools.length,
            servicesCount: services.length
        });

        // Загружаем исполнителей при монтировании компонента
        loadExecutors();

        // Проверяем участников в каждом мастер-классе
        if (masterClasses.length > 0) {
            masterClasses.forEach((mc, index) => {
                console.log(`MasterClassesTab: Мастер-класс ${index + 1} (${mc.date}):`, {
                    id: mc.id,
                    participantsCount: mc.participants?.length || 0,
                    participants: mc.participants
                });
            });
        }

        // Дополнительная отладка для понимания структуры данных
        if (masterClasses.length > 0) {
            console.log('MasterClassesTab: Пример мастер-класса:', masterClasses[0]);
            console.log('MasterClassesTab: Все даты мастер-классов:', masterClasses.map(mc => mc.date));

            // Проверяем, какие даты будут найдены для текущего месяца
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();

            console.log('MasterClassesTab: Проверяем даты для текущего месяца:', currentMonth + 1, currentYear);

            // Проверяем несколько дат месяца
            for (let day = 1; day <= 31; day++) {
                const testDate = new Date(currentYear, currentMonth, day);
                const found = getMasterClassesForDate(testDate);
                if (found.length > 0) {
                    console.log(`MasterClassesTab: Тест даты ${testDate.toLocaleDateString()}: найдено ${found.length} мастер-классов`);
                }
            }

            // Принудительно вызываем функцию статистики для отладки
            console.log('🔍 MasterClassesTab: Принудительно вызываем getStylesAndOptionsStats()');
            const stats = getStylesAndOptionsStats();
            console.log('🔍 MasterClassesTab: Результат getStylesAndOptionsStats():', stats);
        }
    }, [masterClasses, schools, services, getMasterClassesForDate]);

    // Экспорт финансовой статистики в Excel
    const exportFinancialStats = () => {
        const stats = getFinancialStats();
        const filteredClasses = getFilteredMasterClasses();
        const { stylesStats, optionsStats } = getStylesAndOptionsStats();

        // Создаем рабочую книгу
        const workbook = XLSX.utils.book_new();

        // Создаем один лист для всех данных
        const worksheet = XLSX.utils.aoa_to_sheet([]);

        let currentRow = 0;

        // 1. Информация по школам (название, адрес)
        XLSX.utils.sheet_add_aoa(worksheet, [['ИНФОРМАЦИЯ ПО ШКОЛАМ']], { origin: { r: currentRow, c: 0 } });
        // Делаем заголовок жирным
        const schoolHeaderCell = XLSX.utils.encode_cell({ r: currentRow, c: 0 });
        if (!worksheet['!rows']) worksheet['!rows'] = [];
        if (!worksheet['!rows'][currentRow]) worksheet['!rows'][currentRow] = {};
        if (!worksheet[schoolHeaderCell]) worksheet[schoolHeaderCell] = {};
        worksheet[schoolHeaderCell].s = { font: { bold: true, sz: 14 } };
        currentRow += 1;

        // Заголовки для школ
        XLSX.utils.sheet_add_aoa(worksheet, [['Название школы', 'Адрес']], { origin: { r: currentRow, c: 0 } });
        // Делаем заголовки столбцов жирными
        ['A', 'B'].forEach((col, index) => {
            const cellRef = col + (currentRow + 1);
            if (!worksheet[cellRef]) worksheet[cellRef] = {};
            worksheet[cellRef].s = { font: { bold: true } };
        });
        currentRow += 1;

        // Данные по школам (уникальные)
        const uniqueSchools = Array.from(new Set(filteredClasses.map(mc => mc.schoolId)))
            .map(schoolId => schools.find(s => s.id === schoolId))
            .filter(Boolean);

        const schoolsData = uniqueSchools.map(school => [
            school?.name || 'Неизвестная школа',
            school?.address || 'Адрес не указан'
        ]);

        XLSX.utils.sheet_add_aoa(worksheet, schoolsData, { origin: { r: currentRow, c: 0 } });
        currentRow += schoolsData.length + 2;

        // 2. Финансовая статистика
        XLSX.utils.sheet_add_aoa(worksheet, [['ФИНАНСОВАЯ СТАТИСТИКА']], { origin: { r: currentRow, c: 0 } });
        // Делаем заголовок жирным
        const financeHeaderCell = XLSX.utils.encode_cell({ r: currentRow, c: 0 });
        if (!worksheet['!rows'][currentRow]) worksheet['!rows'][currentRow] = {};
        if (!worksheet[financeHeaderCell]) worksheet[financeHeaderCell] = {};
        worksheet[financeHeaderCell].s = { font: { bold: true, sz: 14 } };
        currentRow += 1;

        XLSX.utils.sheet_add_aoa(worksheet, [
            ['Общая сумма', stats.totalAmount.toLocaleString() + ' ₽'],
            ['Оплатили', stats.paidAmount.toLocaleString() + ' ₽'],
            ['Не оплатили', stats.unpaidAmount.toLocaleString() + ' ₽'],
            ['Всего мастер-классов', stats.totalClasses],
            ['Дата экспорта', new Date().toLocaleDateString('ru-RU')]
        ], { origin: { r: currentRow, c: 0 } });
        // Делаем названия параметров жирными
        for (let i = 0; i < 5; i++) {
            const cellRef = 'A' + (currentRow + i + 1);
            if (!worksheet[cellRef]) worksheet[cellRef] = {};
            worksheet[cellRef].s = { font: { bold: true } };
        }
        currentRow += 6;

        // 3. Статистика по вариантам ручек (варианты ручек)
        XLSX.utils.sheet_add_aoa(worksheet, [['СТАТИСТИКА ПО ВАРИАНТАМ РУЧЕК']], { origin: { r: currentRow, c: 0 } });
        // Делаем заголовок жирным
        const stylesHeaderCell = XLSX.utils.encode_cell({ r: currentRow, c: 0 });
        if (!worksheet['!rows'][currentRow]) worksheet['!rows'][currentRow] = {};
        if (!worksheet[stylesHeaderCell]) worksheet[stylesHeaderCell] = {};
        worksheet[stylesHeaderCell].s = { font: { bold: true, sz: 14 } };
        currentRow += 1;

        if (Object.keys(stylesStats).length > 0) {
            XLSX.utils.sheet_add_aoa(worksheet, [['Вариант ручки', 'Количество выборов']], { origin: { r: currentRow, c: 0 } });
            // Делаем заголовки столбцов жирными
            ['A', 'B'].forEach((col, index) => {
                const cellRef = col + (currentRow + 1);
                if (!worksheet[cellRef]) worksheet[cellRef] = {};
                worksheet[cellRef].s = { font: { bold: true } };
            });
            currentRow += 1;

            const stylesData = Object.entries(stylesStats).map(([styleName, count]) => [
                styleName,
                count
            ]);

            XLSX.utils.sheet_add_aoa(worksheet, stylesData, { origin: { r: currentRow, c: 0 } });
            currentRow += stylesData.length + 2;
        } else {
            XLSX.utils.sheet_add_aoa(worksheet, [['Нет данных по вариантам ручек']], { origin: { r: currentRow, c: 0 } });
            currentRow += 2;
        }

        // 4. Статистика по дополнительным услугам (дополнительные услуги)
        XLSX.utils.sheet_add_aoa(worksheet, [['СТАТИСТИКА ПО ДОПОЛНИТЕЛЬНЫМ УСЛУГАМ']], { origin: { r: currentRow, c: 0 } });
        // Делаем заголовок жирным
        const optionsHeaderCell = XLSX.utils.encode_cell({ r: currentRow, c: 0 });
        if (!worksheet['!rows'][currentRow]) worksheet['!rows'][currentRow] = {};
        if (!worksheet[optionsHeaderCell]) worksheet[optionsHeaderCell] = {};
        worksheet[optionsHeaderCell].s = { font: { bold: true, sz: 14 } };
        currentRow += 1;

        if (Object.keys(optionsStats).length > 0) {
            XLSX.utils.sheet_add_aoa(worksheet, [['Дополнительная услуга', 'Количество выборов']], { origin: { r: currentRow, c: 0 } });
            // Делаем заголовки столбцов жирными
            ['A', 'B'].forEach((col, index) => {
                const cellRef = col + (currentRow + 1);
                if (!worksheet[cellRef]) worksheet[cellRef] = {};
                worksheet[cellRef].s = { font: { bold: true } };
            });
            currentRow += 1;

            const optionsData = Object.entries(optionsStats).map(([optionName, count]) => [
                optionName,
                count
            ]);

            XLSX.utils.sheet_add_aoa(worksheet, optionsData, { origin: { r: currentRow, c: 0 } });
            currentRow += optionsData.length + 2;
        } else {
            XLSX.utils.sheet_add_aoa(worksheet, [['Нет данных по дополнительным услугам']], { origin: { r: currentRow, c: 0 } });
            currentRow += 2;
        }

        // Настраиваем ширину столбцов
        worksheet['!cols'] = [
            { wch: 30 }, // Название школы/Вариант ручки/Дополнительная услуга
            { wch: 25 }, // Адрес/Количество выборов
            { wch: 20 }, // Дополнительные столбцы
            { wch: 20 },
            { wch: 20 },
            { wch: 20 }
        ];

        // Добавляем лист в книгу
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Статистика');

        // Генерируем имя файла
        const fileName = `Финансовая_статистика_${new Date().toLocaleDateString('ru-RU')}.xlsx`;

        // Скачиваем файл
        XLSX.writeFile(workbook, fileName);

        toast({
            title: "Успешно!",
            description: "Финансовая статистика экспортирована в Excel",
            variant: "default"
        });
    };

    return (
        <div className="space-y-6">
            {/* Кнопка создания */}
            <div className="flex justify-between items-center">
                <div className="flex gap-2">
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Создать мастер-класс
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Создать мастер-класс</DialogTitle>
                                <DialogDescription>
                                    Заполните информацию о новом мастер-классе
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="date">Дата</Label>
                                        <Input
                                            id="date"
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => {
                                                console.log(`Форма: изменение даты с ${formData.date} на ${e.target.value}`);
                                                setFormData(prev => ({ ...prev, date: e.target.value }));
                                            }}
                                            required
                                        />
                                        {/* Отладочная информация */}
                                        <div className="text-xs text-muted-foreground">
                                            Установлена дата: {formData.date}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="time">Время</Label>
                                        <Input
                                            id="time"
                                            type="time"
                                            value={formData.time}
                                            onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="school">Школа/Садик</Label>
                                    <Select value={formData.schoolId} onValueChange={handleSchoolChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Выберите школу/садик" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {schools.map(school => (
                                                <SelectItem key={school.id} value={school.id}>
                                                    {school.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="class">Класс/Группа</Label>
                                    <Select
                                        value={formData.classGroup}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, classGroup: value }))}
                                        disabled={!formData.schoolId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Выберите класс/группу" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {getFilteredClasses().map(className => (
                                                <SelectItem key={className} value={className}>
                                                    {className}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="service">Услуга</Label>
                                    <Select value={formData.serviceId} onValueChange={(value) => setFormData(prev => ({ ...prev, serviceId: value }))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Выберите услугу" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {services.map(service => (
                                                <SelectItem key={service.id} value={service.id}>
                                                    {service.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Исполнители</Label>
                                    {loadingExecutors ? (
                                        <div className="text-sm text-muted-foreground">Загрузка исполнителей...</div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2">
                                            {availableExecutors.map((executor) => (
                                                <div key={executor.id} className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`executor-${executor.id}`}
                                                        checked={formData.executors.includes(executor.id)}
                                                        onChange={(e) => handleExecutorChange(executor.id, e.target.checked)}
                                                        className="rounded"
                                                    />
                                                    <Label htmlFor={`executor-${executor.id}`}>{executor.name}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {availableExecutors.length === 0 && !loadingExecutors && (
                                        <div className="text-sm text-muted-foreground">
                                            Нет доступных исполнителей
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="notes">Примечания</Label>
                                    <Textarea
                                        id="notes"
                                        value={formData.notes}
                                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="Дополнительная информация..."
                                    />
                                </div>

                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                        Отмена
                                    </Button>
                                    <Button type="submit">Создать</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Button
                        variant="outline"
                        onClick={() => {
                            console.log('Текущие мастер-классы:', masterClasses);
                            console.log('Даты мастер-классов:', masterClasses.map(mc => mc.date));
                        }}
                    >
                        Отладка данных
                    </Button>
                </div>

                <div className="text-sm text-muted-foreground">
                    Найдено: {getFilteredMasterClasses().length} мастер-классов
                </div>
            </div>

            {/* Фильтры и календарь в одной строке */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Фильтры - растягиваем на 3 колонки */}
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Фильтры поиска
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city-filter">Город</Label>
                                <Select value={filterCity} onValueChange={setFilterCity}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Выберите город" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Все города</SelectItem>
                                        {getUniqueCities().map(city => (
                                            <SelectItem key={city} value={city}>
                                                {city}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="school-filter">Школа/Садик</Label>
                                <Select value={filterSchool} onValueChange={setFilterSchool}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Выберите школу" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Все школы</SelectItem>
                                        {getFilteredSchools().map(school => (
                                            <SelectItem key={school.id} value={school.id}>
                                                {school.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="class-filter">Класс/Группа</Label>
                                <Select value={filterClass} onValueChange={setFilterClass}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Выберите класс" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Все классы</SelectItem>
                                        {getFilteredMasterClasses()
                                            .map(mc => mc.classGroup)
                                            .filter((value, index, self) => self.indexOf(value) === index)
                                            .map(className => (
                                                <SelectItem key={className} value={className}>
                                                    {className}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date-from-filter">Дата от</Label>
                                <Input
                                    id="date-from-filter"
                                    type="date"
                                    value={filterDateFrom}
                                    onChange={(e) => setFilterDateFrom(e.target.value)}
                                    placeholder="Выберите дату"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date-to-filter">Дата до</Label>
                                <Input
                                    id="date-to-filter"
                                    type="date"
                                    value={filterDateTo}
                                    onChange={(e) => setFilterDateTo(e.target.value)}
                                    placeholder="Выберите дату"
                                />
                            </div>

                            <div className="space-y-2 flex items-end">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setFilterCity("all");
                                        setFilterSchool("all");
                                        setFilterClass("all");
                                        setFilterDateFrom("");
                                        setFilterDateTo("");
                                    }}
                                    className="w-full"
                                >
                                    Сбросить фильтры
                                </Button>
                            </div>
                        </div>

                        {/* Статистика по вариантам ручек и дополнительным услугам */}
                        <div className="mt-6 pt-6 border-t">
                            <div className="flex items-center gap-2 mb-4">
                                <BarChart3 className="h-5 w-5" />
                                <h4 className="font-semibold text-lg">Статистика по вариантам ручек и дополнительным услугам</h4>
                            </div>
                            {(() => {
                                console.log('Компонент статистики: начало рендеринга');
                                const { stylesStats, optionsStats } = getStylesAndOptionsStats();
                                const totalStyles = Object.values(stylesStats).reduce((sum, count) => sum + count, 0);
                                const totalOptions = Object.values(optionsStats).reduce((sum, count) => sum + count, 0);

                                // Отладочная информация для компонента
                                console.log('Статистика в компоненте:', {
                                    stylesStats,
                                    optionsStats,
                                    totalStyles,
                                    totalOptions,
                                    masterClassesCount: masterClasses.length,
                                    filteredCount: getFilteredMasterClasses().length
                                });

                                return (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Статистика по вариантам ручек */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-sm">Варианты ручек</span>
                                                <Badge variant="secondary" className="text-xs px-2 py-1">
                                                    Всего: {totalStyles}
                                                </Badge>
                                            </div>
                                            <div className="space-y-2">
                                                {Object.entries(stylesStats).length > 0 ? (
                                                    Object.entries(stylesStats)
                                                        .sort(([, a], [, b]) => b - a)
                                                        .map(([styleName, count]) => (
                                                            <div key={styleName} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                                                                <span className="font-medium">{styleName}</span>
                                                                <Badge variant="outline" className="text-xs">
                                                                    {count}
                                                                </Badge>
                                                            </div>
                                                        ))
                                                ) : (
                                                    <div className="text-center text-muted-foreground py-2 text-sm">
                                                        Нет данных по вариантам ручек
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Статистика по дополнительным услугам */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-sm">Дополнительные услуги</span>
                                                <Badge variant="secondary" className="text-xs px-2 py-1">
                                                    Всего: {totalOptions}
                                                </Badge>
                                            </div>
                                            <div className="space-y-2">
                                                {Object.entries(optionsStats).length > 0 ? (
                                                    Object.entries(optionsStats)
                                                        .sort(([, a], [, b]) => b - a)
                                                        .map(([optionName, count]) => (
                                                            <div key={optionName} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                                                                <span className="font-medium">{optionName}</span>
                                                                <Badge variant="outline" className="text-xs">
                                                                    {count}
                                                                </Badge>
                                                            </div>
                                                        ))
                                                ) : (
                                                    <div className="text-center text-muted-foreground py-2 text-sm">
                                                        Нет данных по дополнительным услугам
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </CardContent>
                </Card>

                {/* Календарь - справа */}
                <Card className="w-fit">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5" />
                            Календарь
                        </CardTitle>
                        <CardDescription>
                            Кликните на дату для создания нового мастер-класса
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Calendar
                            mode="single"
                            onSelect={handleDateSelect}
                            locale={ru}
                            className="rounded-md border"
                            components={{
                                DayContent: ({ date, displayMonth, activeModifiers, ...props }) => {
                                    const masterClasses = getMasterClassesForDate(date);

                                    // Отладочная информация для каждой даты
                                    if (masterClasses.length > 0) {
                                        const formattedDate = formatDateForComparison(date);
                                        console.log(`DayContent: ${date.toLocaleDateString()} (${formattedDate}) -> ${masterClasses.length} мастер-классов`);
                                    } else {
                                        // Отладочная информация для дат без мастер-классов (только для нескольких дат)
                                        const day = date.getDate();
                                        if (day <= 5) { // Показываем только для первых 5 дней месяца
                                            const formattedDate = formatDateForComparison(date);
                                            console.log(`DayContent: ${date.toLocaleDateString()} (${formattedDate}) -> 0 мастер-классов`);
                                        }
                                    }

                                    return (
                                        <div className="relative w-full h-full">
                                            <div
                                                {...props}
                                                className="w-full h-full p-2 text-center hover:bg-accent rounded-md cursor-pointer"
                                            >
                                                {date.getDate()}
                                            </div>
                                            {masterClasses.length > 0 && (
                                                <div className="absolute -top-1 -right-1 bg-white/90 text-black text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg z-10 border border-gray-300">
                                                    {masterClasses.length}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                            }}
                            onMonthChange={(month) => {
                                console.log(`Calendar: месяц изменен на ${month.toLocaleDateString()}`);
                            }}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Карточка финансовой статистики */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-green-600" />
                                Финансовая статистика
                            </CardTitle>
                            <CardDescription>
                                Статистика по финансам {getFinancialStats().totalClasses > 0 ? `(${getFinancialStats().totalClasses} мастер-классов)` : ''}
                            </CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            className="flex items-center gap-2"
                            onClick={() => exportFinancialStats()}
                        >
                            <FileSpreadsheet className="h-4 w-4" />
                            Экспорт в Excel
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg border">
                            <div className="text-2xl font-bold text-green-600">
                                {getFinancialStats().totalAmount.toLocaleString()} ₽
                            </div>
                            <div className="text-sm text-green-700 font-medium">Общая сумма</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg border">
                            <div className="text-2xl font-bold text-blue-600">
                                {getFinancialStats().paidAmount.toLocaleString()} ₽
                            </div>
                            <div className="text-sm text-blue-700 font-medium">Оплатили</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg border">
                            <div className="text-2xl font-bold text-orange-600">
                                {getFinancialStats().unpaidAmount.toLocaleString()} ₽
                            </div>
                            <div className="text-sm text-orange-700 font-medium">Не оплатили</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Список мастер-классов */}
            <Card>
                <CardHeader>
                    <CardTitle>Список мастер-классов</CardTitle>
                    <CardDescription>
                        Все запланированные мастер-классы
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {getFilteredMasterClasses().map(masterClass => (
                            <Card key={masterClass.id} className="cursor-pointer hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">
                                                    {new Date(masterClass.date).toLocaleDateString('ru-RU')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <span>{masterClass.time}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                <span>{schools.find(s => s.id === masterClass.schoolId)?.name || 'Школа'}</span>
                                            </div>
                                            <Badge variant="outline">{masterClass.classGroup}</Badge>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-muted-foreground">Исполнители:</span>
                                                <div className="flex gap-1">
                                                    {masterClass.executors.map((executorId, index) => {
                                                        const executorName = availableExecutors.find(e => e.id === executorId)?.name || executorId;
                                                        return (
                                                            <Badge key={index} variant="secondary" className="text-xs">
                                                                {executorName}
                                                            </Badge>
                                                        );
                                                    })}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openExecutorsModal(masterClass);
                                                    }}
                                                >
                                                    <UserPlus className="h-3 w-3" />
                                                </Button>
                                            </div>

                                            {/* Примечания */}
                                            {masterClass.notes && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-muted-foreground">Примечания:</span>
                                                    <span className="text-sm text-muted-foreground max-w-48 truncate" title={masterClass.notes}>
                                                        {masterClass.notes}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                <span>{masterClass.statistics.totalParticipants}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                                <span>{masterClass.statistics.totalAmount} ₽</span>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onViewMasterClass(masterClass)}
                                            >
                                                Подробнее
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Удалить мастер-класс?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Это действие нельзя отменить. Мастер-класс будет удален навсегда.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => onDeleteMasterClass(masterClass.id)}
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                        >
                                                            Удалить
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Модальное окно управления исполнителями */}
            <Dialog open={executorsModalOpen} onOpenChange={setExecutorsModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Управление исполнителями</DialogTitle>
                        <DialogDescription>
                            {selectedMasterClass && (
                                <div className="space-y-2">
                                    <p>Мастер-класс: <strong>{selectedMasterClass.serviceName}</strong></p>
                                    <p>Дата: <strong>{new Date(selectedMasterClass.date).toLocaleDateString('ru-RU')}</strong></p>
                                    <p>Время: <strong>{selectedMasterClass.time}</strong></p>
                                    <p>Место: <strong>{schools.find(s => s.id === selectedMasterClass.schoolId)?.name}</strong></p>
                                    <p>Класс: <strong>{selectedMasterClass.classGroup}</strong></p>
                                </div>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label className="text-base font-semibold">Выберите исполнителей:</Label>
                            {loadingExecutors ? (
                                <div className="text-sm text-muted-foreground py-4">Загрузка исполнителей...</div>
                            ) : (
                                <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
                                    {availableExecutors.map((executor) => (
                                        <label key={executor.id} className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded">
                                            <input
                                                type="checkbox"
                                                checked={editingExecutors.includes(executor.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setEditingExecutors(prev => [...prev, executor.id]);
                                                    } else {
                                                        setEditingExecutors(prev => prev.filter(id => id !== executor.id));
                                                    }
                                                }}
                                                className="rounded"
                                            />
                                            <span className="text-sm">{executor.name}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                            {availableExecutors.length === 0 && !loadingExecutors && (
                                <div className="text-sm text-muted-foreground py-4 text-center">
                                    Нет доступных исполнителей
                                </div>
                            )}
                        </div>

                        {editingExecutors.length > 0 && (
                            <div className="bg-muted/30 p-3 rounded-md">
                                <Label className="text-sm font-medium">Выбрано исполнителей: {editingExecutors.length}</Label>
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {editingExecutors.map((executorId) => {
                                        const executorName = availableExecutors.find(e => e.id === executorId)?.name || executorId;
                                        return (
                                            <Badge key={executorId} variant="secondary" className="text-xs">
                                                {executorName}
                                            </Badge>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={cancelExecutorsChanges}>
                            Отмена
                        </Button>
                        <Button
                            onClick={saveExecutorsChanges}
                            disabled={loadingExecutors}
                        >
                            Сохранить изменения
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
} 