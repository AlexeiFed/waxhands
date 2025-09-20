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
import { MasterClassesFilters } from '@/contexts/AdminFiltersContext';
import { Plus, CalendarIcon, Clock, MapPin, Users, DollarSign, Trash2, UserPlus, Filter, BarChart3, FileSpreadsheet, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';
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
    onDeleteSchoolMasterClasses: (schoolId: string, date: string) => void;
    onRefreshMasterClasses: () => void;
    filters: MasterClassesFilters;
    onFiltersChange: (filters: Partial<MasterClassesFilters>) => void;
}

export default function MasterClassesTab({
    services,
    schools,
    masterClasses: initialMasterClasses,
    onAddMasterClass,
    onEditMasterClass,
    onViewMasterClass,
    onDeleteMasterClass,
    onDeleteSchoolMasterClasses,
    onRefreshMasterClasses,
    filters,
    onFiltersChange
}: MasterClassesTabProps) {
    // Используем мастер-классы напрямую из пропсов без локального состояния
    const { toast } = useToast();

    // Обертка для onEditMasterClass с обновлением через родительский компонент
    const handleEditMasterClass = useCallback(async (id: string, updates: Partial<MasterClassEvent>) => {
        try {
            await onEditMasterClass(id, updates);

            // Принудительно обновляем данные с сервера
            await onRefreshMasterClasses();

            // Дополнительно обновляем локальное состояние после обновления с сервера
            setTimeout(() => {
                onRefreshMasterClasses();
            }, 100);
        } catch (error) {
            console.error('Error updating master class:', error);
            throw error;
        }
    }, [onEditMasterClass, onRefreshMasterClasses]);

    // Отладка при загрузке компонента
    console.log('MasterClassesTab: компонент загружен');
    console.log('MasterClassesTab: props:', { services: services.length, schools: schools.length, masterClasses: initialMasterClasses.length });
    console.log('MasterClassesTab: masterClasses:', initialMasterClasses);



    // Состояние формы
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        city: '',
        date: '',
        time: '',
        schoolId: '',
        classGroups: [] as string[], // Изменено с classGroup на classGroups массив
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

    // Состояние для группировки по школам
    const [expandedSchools, setExpandedSchools] = useState<Set<string>>(new Set());

    // Состояние для скрытия прошедших мастер-классов
    const [hidePastClasses, setHidePastClasses] = useState(false);

    // Функция для переключения развернутого состояния школы
    const toggleSchoolExpansion = (schoolId: string) => {
        setExpandedSchools(prev => {
            const newSet = new Set(prev);
            if (newSet.has(schoolId)) {
                newSet.delete(schoolId);
            } else {
                newSet.add(schoolId);
            }
            return newSet;
        });
    };

    // Используем фильтры из пропсов
    const filterCity = filters.city;
    const filterSchool = filters.school;
    const filterClass = filters.class;
    const filterDateFrom = filters.dateFrom;
    const filterDateTo = filters.dateTo;

    // Получение уникальных городов
    const getUniqueCities = (): string[] => {
        const cities = (schools || []).map(school => {
            // Извлекаем город из адреса школы
            return school.address ? school.address.split(',')[0].trim() : '';
        }).filter(Boolean);
        return [...new Set(cities)];
    };

    // Получение отфильтрованных школ
    const getFilteredSchools = (): School[] => {
        if (filterCity === 'all') return schools || [];
        return (schools || []).filter(school => {
            const schoolCity = school.address ? school.address.split(',')[0].trim() : '';
            return schoolCity === filterCity;
        });
    };

    // Получение школ по выбранному городу
    const getSchoolsByCity = (): School[] => {
        if (!formData.city) return schools || [];
        return (schools || []).filter(school => {
            const schoolCity = school.address ? school.address.split(',')[0].trim() : '';
            return schoolCity === formData.city;
        });
    };

    // Получение отфильтрованных классов
    const getFilteredClasses = (): string[] => {
        if (!formData.schoolId) return [];
        const school = (schools || []).find(s => s.id === formData.schoolId);
        return school ? school.classes : [];
    };

    // Получение отфильтрованных мастер-классов
    const getFilteredMasterClasses = useCallback((): MasterClassEvent[] => {
        let filtered = initialMasterClasses || [];
        console.log('getFilteredMasterClasses: исходные мастер-классы:', filtered.length);
        console.log('getFilteredMasterClasses: фильтры:', { filterCity, filterSchool, filterClass, filterDateFrom, filterDateTo });

        // Фильтр по городу
        if (filterCity !== 'all' && filterCity !== '') {
            filtered = filtered.filter(mc => {
                const school = (schools || []).find(s => s.id === mc.schoolId);
                if (school && school.address) {
                    const schoolCity = school.address.split(',')[0].trim();
                    return schoolCity === filterCity;
                }
                return false;
            });
            console.log('getFilteredMasterClasses: после фильтра по городу:', filtered.length);
        }

        // Фильтр по школе
        if (filterSchool !== 'all' && filterSchool !== '') {
            filtered = filtered.filter(mc => mc.schoolId === filterSchool);
            console.log('getFilteredMasterClasses: после фильтра по школе:', filtered.length);
        }

        // Фильтр по классу
        if (filterClass !== 'all' && filterClass !== '') {
            filtered = filtered.filter(mc => mc.classGroup === filterClass);
            console.log('getFilteredMasterClasses: после фильтра по классу:', filtered.length);
        }

        // Фильтр по дате от
        if (filterDateFrom) {
            const fromDate = new Date(filterDateFrom);
            filtered = filtered.filter(mc => {
                const mcDate = new Date(mc.date);
                return mcDate >= fromDate;
            });
            console.log('getFilteredMasterClasses: после фильтра по дате от:', filtered.length);
        }

        // Фильтр по дате до
        if (filterDateTo) {
            const toDate = new Date(filterDateTo);
            filtered = filtered.filter(mc => {
                const mcDate = new Date(mc.date);
                return mcDate <= toDate;
            });
            console.log('getFilteredMasterClasses: после фильтра по дате до:', filtered.length);
        }

        // Фильтр по прошедшим мастер-классам
        if (hidePastClasses) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            filtered = filtered.filter(mc => {
                const mcDate = new Date(mc.date);
                return mcDate >= today;
            });
            console.log('getFilteredMasterClasses: после фильтра прошедших:', filtered.length);
        }

        console.log('getFilteredMasterClasses: итоговый результат:', filtered.length);
        return filtered;
    }, [initialMasterClasses, schools, filterCity, filterSchool, filterClass, filterDateFrom, filterDateTo, hidePastClasses]);

    // Группировка мастер-классов по школам и датам
    const getGroupedMasterClasses = useCallback(() => {
        const filtered = getFilteredMasterClasses();
        console.log('getGroupedMasterClasses: отфильтрованные мастер-классы:', filtered.length);

        const grouped = filtered.reduce((acc, masterClass) => {
            // Создаем ключ из schoolId + даты
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

        // Сортируем группы по дате, затем по школе
        const sortedGroups = Object.values(grouped).sort((a, b) => {
            const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
            if (dateCompare !== 0) return dateCompare;
            return a.schoolId.localeCompare(b.schoolId);
        });

        // Сортируем мастер-классы внутри каждой группы по классу (от меньшего к старшему, затем по алфавиту) и по времени
        sortedGroups.forEach(group => {
            group.masterClasses.sort((a, b) => {
                // Сначала сортируем по классу
                const classA = a.classGroup;
                const classB = b.classGroup;

                // Извлекаем числовую часть класса (например, "5А" -> 5, "10Б" -> 10)
                const numA = parseInt(classA.match(/\d+/)?.[0] || '0');
                const numB = parseInt(classB.match(/\d+/)?.[0] || '0');

                // Сортируем по числовой части (от меньшего к старшему)
                if (numA !== numB) {
                    return numA - numB;
                }

                // Если числовая часть одинаковая, сортируем по алфавиту
                if (classA !== classB) {
                    return classA.localeCompare(classB);
                }

                // Если классы одинаковые, сортируем по времени
                return a.time.localeCompare(b.time);
            });
        });

        console.log('getGroupedMasterClasses: сгруппированные группы:', sortedGroups.length);
        return sortedGroups;
    }, [getFilteredMasterClasses]);

    // Получение финансовой статистики по отфильтрованным мастер-классам
    const getFinancialStats = () => {
        const filteredClasses = getFilteredMasterClasses();

        const totalAmount = filteredClasses.reduce((sum, mc) => sum + mc.statistics.totalAmount, 0);
        const paidAmount = filteredClasses.reduce((sum, mc) => {
            const paidParticipants = mc.participants.filter(p => p.isPaid);
            return sum + paidParticipants.reduce((pSum, p) => pSum + p.totalAmount, 0);
        }, 0);
        const unpaidAmount = totalAmount - paidAmount;

        // Подсчитываем количество школ (группируем по школам и датам)
        const grouped = filteredClasses.reduce((acc, masterClass) => {
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

        const totalSchools = Object.keys(grouped).length;

        return {
            totalAmount,
            paidAmount,
            unpaidAmount,
            totalClasses: totalSchools // Теперь это количество школ, а не классов
        };
    };

    // Загрузка доступных исполнителей
    const loadExecutors = async () => {
        setLoadingExecutors(true);
        try {
            const response = await api.users.getUsers({ role: 'executor' });
            setAvailableExecutors((response.users || []).map(user => ({
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
            await handleEditMasterClass(selectedMasterClass.id, {
                executors: editingExecutors
            });

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
    const getStylesAndOptionsStats = useCallback(() => {
        console.log('🔍 getStylesAndOptionsStats: ФУНКЦИЯ ВЫЗВАНА!');
        const filteredClasses = getFilteredMasterClasses();
        const stylesStats: Record<string, number> = {};
        const optionsStats: Record<string, number> = {};

        // Отладочная информация
        console.log('getStylesAndOptionsStats: начало подсчета статистики');
        console.log('getStylesAndOptionsStats: отфильтрованных мастер-классов:', filteredClasses.length);
        console.log('getStylesAndOptionsStats: все мастер-классы:', initialMasterClasses.length);
        console.log('getStylesAndOptionsStats: все мастер-классы:', initialMasterClasses);
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
    }, [getFilteredMasterClasses, services, initialMasterClasses]);

    // Получение количества школ для календаря
    const getSchoolsCountForDate = useCallback((date: Date): number => {
        const dateStr = formatDateForComparison(date);

        const filtered = initialMasterClasses.filter(mc => {
            // Обрабатываем разные форматы дат
            let mcDate = mc.date;
            if (mcDate.includes('T')) {
                mcDate = mcDate.split('T')[0];
            }
            return mcDate === dateStr;
        });

        // Получаем уникальные школы для этой даты
        const uniqueSchools = [...new Set((filtered || []).map(mc => mc.schoolName))];
        return uniqueSchools.length;
    }, [initialMasterClasses]);

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

    // Обработка выбора даты с фильтрацией
    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            // Форматируем дату для фильтрации
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            // Применяем фильтр по дате
            onFiltersChange({ dateFrom: dateStr, dateTo: dateStr });

            console.log(`handleDateSelect: применен фильтр по дате:`, dateStr);
        } else {
            // Сбрасываем фильтр по дате
            onFiltersChange({ dateFrom: '', dateTo: '' });
            console.log(`handleDateSelect: сброшен фильтр по дате`);
        }
    };

    // Обработка изменения города
    const handleCityChange = (city: string) => {
        setFormData(prev => ({
            ...prev,
            city,
            schoolId: '',
            classGroups: []
        }));
    };

    // Обработка изменения школы
    const handleSchoolChange = (schoolId: string) => {
        setFormData(prev => ({ ...prev, schoolId, classGroups: [] }));
    };

    // Обработка отправки формы
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.classGroups.length === 0) {
            toast({
                title: "Ошибка",
                description: "Выберите хотя бы один класс/группу",
                variant: "destructive",
            });
            return;
        }

        if (formData.executors.length === 0) {
            toast({
                title: "Ошибка",
                description: "Выберите хотя бы одного исполнителя",
                variant: "destructive",
            });
            return;
        }

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

        // Создаем мастер-классы для всех выбранных классов через новый API
        try {
            console.log('🎯 Создание мастер-классов для:', {
                date: formData.date,
                schoolId: formData.schoolId,
                classGroups: formData.classGroups.length,
                serviceId: formData.serviceId,
                executors: formData.executors.length
            });

            const response = await api.masterClasses.createMultiple({
                date: formData.date,
                time: formData.time,
                schoolId: formData.schoolId,
                classGroups: formData.classGroups,
                serviceId: formData.serviceId,
                executors: formData.executors,
                notes: formData.notes
            });

            console.log('✅ Мастер-классы созданы:', response);

            // Проверяем структуру ответа и обновляем список мастер-классов
            if (response.success && response.data && Array.isArray(response.data)) {
                console.log(`Успешно создано ${response.data.length} мастер-классов`);

                // Обновляем список мастер-классов через callback
                onRefreshMasterClasses();

                // Дополнительное принудительное обновление через небольшую задержку
                setTimeout(() => {
                    onRefreshMasterClasses();
                }, 500);

                // Сброс формы
                setFormData({
                    city: '',
                    date: '',
                    time: '',
                    schoolId: '',
                    classGroups: [],
                    serviceId: '',
                    executors: [],
                    notes: ''
                });
                setIsAddDialogOpen(false);

                toast({
                    title: "Успешно",
                    description: `Создано ${response.data.length} мастер-класс${response.data.length === 1 ? '' : 'ов'}. Список обновится автоматически.`,
                });
            } else {
                console.error('Неожиданная структура ответа API:', response);
                throw new Error('Неожиданная структура ответа от сервера');
            }
        } catch (error) {
            console.error('❌ Ошибка создания мастер-классов:', error);
            toast({
                title: "Ошибка",
                description: error instanceof Error ? error.message : "Не удалось создать мастер-классы",
                variant: "destructive",
            });
            return;
        }
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
            masterClassesCount: initialMasterClasses.length,
            masterClasses: initialMasterClasses,
            schoolsCount: schools.length,
            servicesCount: services.length
        });

        // Загружаем исполнителей при монтировании компонента
        loadExecutors();

        // Проверяем участников в каждом мастер-классе
        if (initialMasterClasses.length > 0) {
            initialMasterClasses.forEach((mc, index) => {
                console.log(`MasterClassesTab: Мастер-класс ${index + 1} (${mc.date}):`, {
                    id: mc.id,
                    participantsCount: mc.participants?.length || 0,
                    participants: mc.participants
                });
            });
        }

        // Дополнительная отладка для понимания структуры данных
        if (initialMasterClasses.length > 0) {
            console.log('MasterClassesTab: Пример мастер-класса:', initialMasterClasses[0]);
            console.log('MasterClassesTab: Все даты мастер-классов:', (initialMasterClasses || []).map(mc => mc.date));

            // Проверяем, какие даты будут найдены для текущего месяца
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();

            console.log('MasterClassesTab: Проверяем даты для текущего месяца:', currentMonth + 1, currentYear);

            // Проверяем несколько дат месяца
            for (let day = 1; day <= 31; day++) {
                const testDate = new Date(currentYear, currentMonth, day);
                const schoolsCount = getSchoolsCountForDate(testDate);
                if (schoolsCount > 0) {
                    console.log(`MasterClassesTab: Тест даты ${testDate.toLocaleDateString()}: найдено ${schoolsCount} школ`);
                }
            }

            // Принудительно вызываем функцию статистики для отладки
            console.log('🔍 MasterClassesTab: Принудительно вызываем getStylesAndOptionsStats()');
            const stats = getStylesAndOptionsStats();
            console.log('🔍 MasterClassesTab: Результат getStylesAndOptionsStats():', stats);
        }
    }, [initialMasterClasses, schools, services, getSchoolsCountForDate, getStylesAndOptionsStats]);

    // Экспорт мастер-классов в Excel с новой структурой
    const exportFinancialStats = () => {
        const filteredClasses = getFilteredMasterClasses();

        // Группируем мастер-классы по школам
        const classesBySchool = (filteredClasses || []).reduce((acc, masterClass) => {
            const schoolId = masterClass.schoolId;
            if (!acc[schoolId]) {
                acc[schoolId] = [];
            }
            acc[schoolId].push(masterClass);
            return acc;
        }, {} as Record<string, typeof filteredClasses>);

        // Создаем рабочую книгу
        const workbook = XLSX.utils.book_new();

        // Создаем лист для каждой школы
        Object.entries(classesBySchool).forEach(([schoolId, schoolClasses]) => {
            const school = (schools || []).find(s => s.id === schoolId);
            if (!school || !schoolClasses) return;

            const worksheet = XLSX.utils.aoa_to_sheet([]);
            let currentRow = 0;

            // Заголовок школы - жирный увеличенный шрифт
            const schoolTitle = `Школа № ${school.name}`;
            const contactInfo = `${school.teacher || 'Контактное лицо не указано'} - ${school.teacherPhone || 'Телефон не указан'}`;

            XLSX.utils.sheet_add_aoa(worksheet, [[schoolTitle]], { origin: { r: currentRow, c: 0 } });

            // Делаем заголовок школы жирным и увеличенным
            const schoolTitleCell = XLSX.utils.encode_cell({ r: currentRow, c: 0 });
            if (!worksheet['!rows']) worksheet['!rows'] = [];
            if (!worksheet['!rows'][currentRow]) worksheet['!rows'][currentRow] = {};
            if (!worksheet[schoolTitleCell]) worksheet[schoolTitleCell] = {};
            worksheet[schoolTitleCell].s = { font: { bold: true, sz: 16 } };
            currentRow += 1;

            XLSX.utils.sheet_add_aoa(worksheet, [[contactInfo]], { origin: { r: currentRow, c: 0 } });

            // Делаем контактную информацию жирным и увеличенным
            const contactCell = XLSX.utils.encode_cell({ r: currentRow, c: 0 });
            if (!worksheet['!rows'][currentRow]) worksheet['!rows'][currentRow] = {};
            if (!worksheet[contactCell]) worksheet[contactCell] = {};
            worksheet[contactCell].s = { font: { bold: true, sz: 14 } };
            currentRow += 2;

            // Заголовки таблицы
            const headers = [
                'Прим',      // 1. Примечание
                'Кл',        // 2. Класс/группа
                '1ОБ',       // 3. Обычная ручка
                '1СВ',       // 4. Световая ручка
                '2ОБ',       // 5. Двойные ручка
                '2СВ',       // 6. Двойные световые ручка
                'Кор',       // 7. Коробки
                'Л.ОБ',      // 8. Лакировка
                'Л.БЛ',      // 9. Лакировка с блестками
                'Н.ОБ',      // 10. Надпись
                'Н.СВ',      // 11. Световая надпись
                'Нак.О',     // 12. Наклейка
                'Нак.ОБ',    // 13. Наклейка объемная
                'Сумма'      // 14. Сумма за класс/группу
            ];

            XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: { r: currentRow, c: 0 } });

            // Делаем заголовки таблицы жирными и выравниваем по центру
            headers.forEach((_, index) => {
                const cellRef = XLSX.utils.encode_cell({ r: currentRow, c: index });
                if (!worksheet[cellRef]) worksheet[cellRef] = {};
                worksheet[cellRef].s = {
                    font: { bold: true },
                    alignment: { horizontal: 'center', vertical: 'center' }
                };
            });
            currentRow += 1;

            // Данные по классам/группам
            const classData: (string | number)[][] = [];
            const totalRow = new Array(14).fill(0); // Массив для итогов

            // Сортируем мастер-классы по номеру класса
            const sortedClasses = [...schoolClasses].sort((a, b) => {
                const getClassNumber = (classGroup: string) => {
                    const match = classGroup.match(/\d+/);
                    return match ? parseInt(match[0]) : 0;
                };
                return getClassNumber(a.classGroup) - getClassNumber(b.classGroup);
            });

            sortedClasses.forEach(masterClass => {
                const service = (services || []).find(s => s.id === masterClass.serviceId);
                if (!service) return;

                // Подсчитываем количество по каждому типу
                const counts = {
                    '1ОБ': 0,   // Обычная ручка
                    '1СВ': 0,   // Световая ручка
                    '2ОБ': 0,   // Двойные ручка
                    '2СВ': 0,   // Двойные световые ручка
                    'Кор': 0,   // Коробки
                    'Л.ОБ': 0,  // Лакировка
                    'Л.БЛ': 0,  // Лакировка с блестками
                    'Н.ОБ': 0,  // Надпись
                    'Н.СВ': 0,  // Световая надпись
                    'Нак.О': 0, // Наклейка
                    'Нак.ОБ': 0 // Наклейка объемная
                };

                // Подсчитываем участников по стилям и опциям
                (masterClass.participants || []).forEach(participant => {
                    // Стили (ручки)
                    (participant.selectedStyles || []).forEach(style => {
                        const styleId = typeof style === 'string' ? style : (style as { id: string })?.id;
                        const styleObj = service.styles.find(s => s.id === styleId);
                        if (styleObj) {
                            const styleName = styleObj.name.toLowerCase();
                            if (styleName.includes('обычная')) counts['1ОБ']++;
                            else if (styleName.includes('световая') && !styleName.includes('двойная')) counts['1СВ']++;
                            else if (styleName.includes('двойная') && !styleName.includes('световая')) counts['2ОБ']++;
                            else if (styleName.includes('двойная') && styleName.includes('световая')) counts['2СВ']++;
                        }
                    });

                    // Опции
                    (participant.selectedOptions || []).forEach(option => {
                        const optionId = typeof option === 'string' ? option : (option as { id: string })?.id;
                        const optionObj = service.options.find(o => o.id === optionId);
                        if (optionObj) {
                            const optionName = optionObj.name.toLowerCase();
                            if (optionName.includes('коробка')) counts['Кор']++;
                            else if (optionName.includes('лакировка') && !optionName.includes('блестк')) counts['Л.ОБ']++;
                            else if (optionName.includes('лакировка') && optionName.includes('блестк')) counts['Л.БЛ']++;
                            else if (optionName.includes('надпись') && !optionName.includes('световая')) counts['Н.ОБ']++;
                            else if (optionName.includes('надпись') && optionName.includes('световая')) counts['Н.СВ']++;
                            else if (optionName.includes('наклейка') && !optionName.includes('объемная')) counts['Нак.О']++;
                            else if (optionName.includes('наклейка') && optionName.includes('объемная')) counts['Нак.ОБ']++;
                        }
                    });
                });

                // Считаем сумму за класс/группу
                const classSum = (masterClass.participants || []).reduce((sum, p) => sum + p.totalAmount, 0);

                // Создаем строку данных
                const row = [
                    masterClass.notes || '', // Прим
                    masterClass.classGroup || '', // Кл
                    counts['1ОБ'], // 1ОБ
                    counts['1СВ'], // 1СВ
                    counts['2ОБ'], // 2ОБ
                    counts['2СВ'], // 2СВ
                    counts['Кор'], // Кор
                    counts['Л.ОБ'], // Л.ОБ
                    counts['Л.БЛ'], // Л.БЛ
                    counts['Н.ОБ'], // Н.ОБ
                    counts['Н.СВ'], // Н.СВ
                    counts['Нак.О'], // Нак.О
                    counts['Нак.ОБ'], // Нак.ОБ
                    classSum // Сумма
                ];

                classData.push(row);

                // Добавляем к итогам (кроме первых двух столбцов)
                for (let i = 2; i < 14; i++) {
                    totalRow[i] += row[i] as number;
                }
            });

            // Добавляем данные
            XLSX.utils.sheet_add_aoa(worksheet, classData, { origin: { r: currentRow, c: 0 } });

            // Выравниваем данные по центру
            for (let row = currentRow; row < currentRow + classData.length; row++) {
                for (let col = 0; col < 14; col++) {
                    const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
                    if (!worksheet[cellRef]) worksheet[cellRef] = {};
                    worksheet[cellRef].s = {
                        alignment: { horizontal: 'center', vertical: 'center' }
                    };
                }
            }

            currentRow += classData.length;

            // Добавляем строку итогов
            XLSX.utils.sheet_add_aoa(worksheet, [['Всего', '', ...totalRow.slice(2)]], { origin: { r: currentRow, c: 0 } });

            // Делаем строку итогов жирной и выравниваем по центру
            for (let i = 0; i < 14; i++) {
                const cellRef = XLSX.utils.encode_cell({ r: currentRow, c: i });
                if (!worksheet[cellRef]) worksheet[cellRef] = {};
                worksheet[cellRef].s = {
                    font: { bold: true },
                    alignment: { horizontal: 'center', vertical: 'center' }
                };
            }

            // Настраиваем ширину столбцов
            worksheet['!cols'] = [
                { wch: 15 }, // Прим
                { wch: 8 },  // Кл
                { wch: 8 },  // 1ОБ
                { wch: 8 },  // 1СВ
                { wch: 8 },  // 2ОБ
                { wch: 8 },  // 2СВ
                { wch: 8 },  // Кор
                { wch: 8 },  // Л.ОБ
                { wch: 8 },  // Л.БЛ
                { wch: 8 },  // Н.ОБ
                { wch: 8 },  // Н.СВ
                { wch: 8 },  // Нак.О
                { wch: 8 },  // Нак.ОБ
                { wch: 12 }  // Сумма
            ];

            // Добавляем лист в книгу
            const sheetName = school.name.length > 31 ? school.name.substring(0, 31) : school.name;
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        });

        // Генерируем имя файла
        const fileName = `Мастер-классы_${new Date().toLocaleDateString('ru-RU')}.xlsx`;

        // Скачиваем файл
        XLSX.writeFile(workbook, fileName);

        toast({
            title: "Успешно!",
            description: "Мастер-классы экспортированы в Excel",
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
                                    <Label htmlFor="city">Город</Label>
                                    <Select value={formData.city} onValueChange={handleCityChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Выберите город" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {getUniqueCities().map(city => (
                                                <SelectItem key={city} value={city}>
                                                    {city}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="school">Школа/Садик</Label>
                                    <Select value={formData.schoolId} onValueChange={handleSchoolChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Выберите школу/садик" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {getSchoolsByCity().map(school => (
                                                <SelectItem key={school.id} value={school.id}>
                                                    {school.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Классы/Группы</Label>
                                    {!formData.schoolId ? (
                                        <div className="text-sm text-muted-foreground">
                                            Сначала выберите школу
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        const allClasses = getFilteredClasses();
                                                        setFormData(prev => ({ ...prev, classGroups: allClasses }));
                                                    }}
                                                >
                                                    Выбрать все классы
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setFormData(prev => ({ ...prev, classGroups: [] }))}
                                                >
                                                    Снять выбор
                                                </Button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                                                {getFilteredClasses().map(className => (
                                                    <label key={className} className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.classGroups.includes(className)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        classGroups: [...prev.classGroups, className]
                                                                    }));
                                                                } else {
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        classGroups: prev.classGroups.filter(c => c !== className)
                                                                    }));
                                                                }
                                                            }}
                                                            className="rounded"
                                                        />
                                                        <span className="text-sm">{className}</span>
                                                    </label>
                                                ))}
                                            </div>
                                            {formData.classGroups.length > 0 && (
                                                <div className="text-sm text-muted-foreground">
                                                    Выбрано классов: {formData.classGroups.length}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="service">Услуга</Label>
                                    <Select value={formData.serviceId} onValueChange={(value) => setFormData(prev => ({ ...prev, serviceId: value }))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Выберите услугу" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(services || []).map(service => (
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
                                            {(availableExecutors || []).map((executor) => (
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

                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRefreshMasterClasses()}
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Обновить
                    </Button>
                    <div className="text-sm text-muted-foreground">
                        Найдено: {(getGroupedMasterClasses() || []).length} школ
                    </div>
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
                                <Select value={filterCity} onValueChange={(value) => onFiltersChange({ city: value })}>
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
                                <Select value={filterSchool} onValueChange={(value) => onFiltersChange({ school: value })}>
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
                                <Select value={filterClass} onValueChange={(value) => onFiltersChange({ class: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Выберите класс" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Все классы</SelectItem>
                                        {(getFilteredMasterClasses() || [])
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
                                    onChange={(e) => onFiltersChange({ dateFrom: e.target.value })}
                                    placeholder="Выберите дату"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date-to-filter">Дата до</Label>
                                <Input
                                    id="date-to-filter"
                                    type="date"
                                    value={filterDateTo}
                                    onChange={(e) => onFiltersChange({ dateTo: e.target.value })}
                                    placeholder="Выберите дату"
                                />
                            </div>

                            <div className="space-y-2 flex items-end">
                                <Button
                                    variant="outline"
                                    onClick={() => onFiltersChange({
                                        city: "all",
                                        school: "all",
                                        class: "all",
                                        dateFrom: "",
                                        dateTo: ""
                                    })}
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
                                    masterClassesCount: initialMasterClasses.length,
                                    filteredCount: (getFilteredMasterClasses() || []).length
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
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <CalendarIcon className="h-5 w-5" />
                                    Календарь
                                </CardTitle>
                                <CardDescription>
                                    Кликните на дату для фильтрации мастер-классов
                                </CardDescription>
                            </div>
                            {(filters.dateFrom || filters.dateTo) && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onFiltersChange({ dateFrom: '', dateTo: '' })}
                                    className="text-xs"
                                >
                                    Сбросить фильтр
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Calendar
                            mode="single"
                            onSelect={handleDateSelect}
                            locale={ru}
                            className="rounded-md border"
                            components={{
                                DayContent: ({ date, displayMonth, activeModifiers, ...props }) => {
                                    const schoolsCount = getSchoolsCountForDate(date);

                                    return (
                                        <div className="relative w-full h-full">
                                            <div
                                                {...props}
                                                className="w-full h-full p-2 text-center hover:bg-accent rounded-md cursor-pointer"
                                            >
                                                {date.getDate()}
                                            </div>
                                            {schoolsCount > 0 && (
                                                <div className="absolute -top-1 -right-1 bg-red-400/80 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg z-10">
                                                    {schoolsCount}
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

            {/* Список мастер-классов с группировкой по школам */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Список мастер-классов</CardTitle>
                            <CardDescription>
                                Все запланированные мастер-классы, сгруппированные по школам
                                {(getGroupedMasterClasses() || []).length > 0 && (
                                    <span className="ml-2 text-blue-600 font-medium">
                                        ({(getGroupedMasterClasses() || []).length} мастер-классов)
                                    </span>
                                )}
                            </CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setHidePastClasses(!hidePastClasses)}
                            className="flex items-center gap-2"
                        >
                            {hidePastClasses ? (
                                <>
                                    <CalendarIcon className="h-4 w-4" />
                                    Показать прошедшие
                                </>
                            ) : (
                                <>
                                    <CalendarIcon className="h-4 w-4" />
                                    Скрыть прошедшие
                                </>
                            )}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {(getGroupedMasterClasses() || []).map((group) => {
                            const school = schools.find(s => s.id === group.schoolId);
                            const schoolName = school?.name || 'Неизвестная школа';
                            const groupKey = `${group.schoolId}_${group.date}`;
                            const isExpanded = expandedSchools.has(groupKey);
                            const firstMasterClass = group.masterClasses[0];

                            return (
                                <Card key={groupKey} className="border-l-4 border-l-blue-500">
                                    <CardContent className="p-4">
                                        {/* Заголовок школы */}
                                        <div className="flex items-center justify-between">
                                            <div
                                                className="flex items-center gap-4 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors flex-1"
                                                onClick={() => toggleSchoolExpansion(groupKey)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">
                                                        {new Date(firstMasterClass.date).toLocaleDateString('ru-RU')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <div className="font-semibold text-lg">{schoolName}</div>
                                                        {school?.address && (
                                                            <div className="text-sm text-muted-foreground">{school.address}</div>
                                                        )}
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                                    {group.masterClasses.length} класса(ов)
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => toggleSchoolExpansion(groupKey)}
                                                >
                                                    {isExpanded ? (
                                                        <ChevronUp className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4" />
                                                    )}
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
                                                            <AlertDialogTitle>Удалить все мастер-классы школы?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Это действие удалит все мастер-классы в школе "{schoolName}" за {new Date(firstMasterClass.date).toLocaleDateString('ru-RU')} ({group.masterClasses.length} класса(ов)).
                                                                <br /><br />
                                                                Также будут удалены все связанные счета.
                                                                <br /><br />
                                                                <strong>Это действие нельзя отменить!</strong>
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => onDeleteSchoolMasterClasses(group.schoolId, firstMasterClass.date)}
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            >
                                                                Удалить все
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </div>

                                        {/* Список мастер-классов школы */}
                                        {isExpanded && (
                                            <div className="mt-4 space-y-3 pl-4 border-l-2 border-gray-200">
                                                {group.masterClasses.map(masterClass => (
                                                    <Card key={masterClass.id} className="cursor-pointer hover:shadow-md transition-shadow bg-gray-50">
                                                        <CardContent className="p-4">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                                                        <span>{masterClass.time}</span>
                                                                    </div>
                                                                    <Badge variant="outline">{masterClass.classGroup}</Badge>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm text-muted-foreground">Исполнители:</span>
                                                                        <div className="flex gap-1">
                                                                            {(masterClass.executors || []).map((executorId, index) => {
                                                                                const executorName = (availableExecutors || []).find(e => e.id === executorId)?.name || executorId;
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
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}

                        {/* Сообщение когда нет мастер-классов */}
                        {(getGroupedMasterClasses() || []).length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium mb-2">
                                    {hidePastClasses ? 'Нет будущих мастер-классов' : 'Нет мастер-классов'}
                                </p>
                                <p className="text-sm">
                                    {hidePastClasses
                                        ? 'Все мастер-классы уже прошли. Нажмите "Показать прошедшие" чтобы увидеть их.'
                                        : 'Создайте первый мастер-класс, нажав кнопку "Создать мастер-класс"'
                                    }
                                </p>
                            </div>
                        )}
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
                                    <p>Место: <strong>{(schools || []).find(s => s.id === selectedMasterClass.schoolId)?.name}</strong></p>
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
                                    {(availableExecutors || []).map((executor) => (
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
                                    {(editingExecutors || []).map((executorId) => {
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