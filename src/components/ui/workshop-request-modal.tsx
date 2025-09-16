/**
 * @file: src/components/ui/workshop-request-modal.tsx
 * @description: Модальное окно для подачи заявки на проведение мастер-класса
 * @dependencies: Dialog, Button, Input, Label, Select, useWorkshopRequests, useToast
 * @created: 2024-12-19
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useWorkshopRequests } from '@/hooks/use-workshop-requests';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSchools } from '@/hooks/use-schools';
import { useCities } from '@/hooks/use-cities';
import { School } from '@/types';
import { MapPin, GraduationCap, FileText, AlertCircle, Plus } from 'lucide-react';

interface WorkshopRequestModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onRequestCreated?: () => void; // Callback для обновления списка заявок
}

export default function WorkshopRequestModal({ isOpen, onOpenChange, onRequestCreated }: WorkshopRequestModalProps) {
    const { user } = useAuth();
    const { schools } = useSchools();
    const { cities, getSchoolsByCity } = useCities();
    const { createRequest, loading } = useWorkshopRequests();
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        school_name: '',
        class_group: '',
        notes: '',
        // Новые поля для "другой" школы
        is_other_school: false,
        other_school_name: '',
        other_school_address: ''
    });

    const [selectedCity, setSelectedCity] = useState<string>('');
    const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
    const [availableClasses, setAvailableClasses] = useState<string[]>([]);
    const [citySchools, setCitySchools] = useState<School[]>([]);

    // Отладочный useEffect для отслеживания изменений citySchools
    useEffect(() => {
        console.log('🔍 WorkshopRequestModal: citySchools изменился:', citySchools);
        console.log('🔍 WorkshopRequestModal: citySchools.length:', citySchools.length);
    }, [citySchools]);

    // Обработчик изменения города
    const handleCityChange = async (city: string) => {
        console.log('🔍 WorkshopRequestModal: handleCityChange вызван с городом:', city);
        setSelectedCity(city);
        setSelectedSchoolId('');
        setFormData(prev => ({
            ...prev,
            school_name: '',
            class_group: '',
            is_other_school: false,
            other_school_name: '',
            other_school_address: ''
        }));
        setAvailableClasses([]);

        if (city) {
            try {
                console.log('🔍 WorkshopRequestModal: Загружаем школы для города:', city);
                console.log('🔍 WorkshopRequestModal: getSchoolsByCity функция:', getSchoolsByCity);
                const schools = await getSchoolsByCity(city);
                console.log('🔍 WorkshopRequestModal: Получены школы:', schools);
                console.log('🔍 WorkshopRequestModal: Тип schools:', typeof schools);
                console.log('🔍 WorkshopRequestModal: schools.length:', schools?.length);
                setCitySchools(schools);
                console.log('🔍 WorkshopRequestModal: citySchools установлен:', schools);
            } catch (error) {
                console.error('🔍 WorkshopRequestModal: Ошибка загрузки школ по городу:', error);
                toast({
                    title: "Ошибка",
                    description: "Не удалось загрузить школы для выбранного города",
                    variant: "destructive",
                });
            }
        } else {
            console.log('🔍 WorkshopRequestModal: Город не выбран, очищаем citySchools');
            setCitySchools([]);
        }
    };

    // Обработчик изменения школы
    const handleSchoolChange = (schoolId: string) => {
        if (schoolId === 'other') {
            setSelectedSchoolId('other');
            setFormData(prev => ({
                ...prev,
                is_other_school: true,
                school_name: '',
                class_group: ''
            }));
            setAvailableClasses([]);
        } else {
            setSelectedSchoolId(schoolId);
            setFormData(prev => ({
                ...prev,
                is_other_school: false,
                other_school_name: '',
                other_school_address: '',
                school_name: '',
                class_group: ''
            }));

            const school = citySchools.find(s => s.id === schoolId);
            if (school) {
                setAvailableClasses(school.classes || []);
                setFormData(prev => ({ ...prev, school_name: school.name }));
            }
        }
    };

    // Обработчик изменения класса
    const handleClassChange = (className: string) => {
        setFormData(prev => ({ ...prev, class_group: className }));
    };

    // Обработчик отправки формы
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user?.id) {
            toast({
                title: "Ошибка",
                description: "Необходимо войти в систему",
                variant: "destructive",
            });
            return;
        }

        // Валидация
        if (!selectedCity) {
            toast({
                title: "Ошибка",
                description: "Выберите город",
                variant: "destructive",
            });
            return;
        }

        if (!formData.is_other_school) {
            if (!selectedSchoolId || selectedSchoolId === 'other') {
                toast({
                    title: "Ошибка",
                    description: "Выберите школу или выберите 'Другая'",
                    variant: "destructive",
                });
                return;
            }
            if (!formData.class_group) {
                toast({
                    title: "Ошибка",
                    description: "Выберите класс/группу",
                    variant: "destructive",
                });
                return;
            }
        } else {
            if (!formData.other_school_name || !formData.other_school_address) {
                toast({
                    title: "Ошибка",
                    description: "Заполните название и адрес школы",
                    variant: "destructive",
                });
                return;
            }
            if (!formData.class_group) {
                toast({
                    title: "Ошибка",
                    description: "Введите класс/группу",
                    variant: "destructive",
                });
                return;
            }
        }

        try {
            const requestData = {
                parent_id: user.id,
                school_name: formData.is_other_school ? formData.other_school_name : formData.school_name,
                class_group: formData.class_group,
                notes: formData.notes || undefined,
                // Новые поля
                city: selectedCity,
                is_other_school: formData.is_other_school,
                other_school_name: formData.is_other_school ? formData.other_school_name : undefined,
                other_school_address: formData.is_other_school ? formData.other_school_address : undefined
            };

            console.log('🔍 WorkshopRequestModal.handleSubmit: Отправляем заявку:', requestData);

            const result = await createRequest(requestData);

            console.log('📋 WorkshopRequestModal.handleSubmit: Результат создания заявки:', result);
            console.log('🔍 WorkshopRequestModal.handleSubmit: Проверяем result?.success:', result?.success);
            console.log('🔍 WorkshopRequestModal.handleSubmit: Тип result:', typeof result);
            console.log('🔍 WorkshopRequestModal.handleSubmit: result === null:', result === null);
            console.log('🔍 WorkshopRequestModal.handleSubmit: result === undefined:', result === undefined);

            if (result && result.success) {
                toast({
                    title: "Заявка отправлена! 🎉",
                    description: "Мы рассмотрим вашу заявку и свяжемся с вами в ближайшее время",
                });

                // Сбрасываем форму
                setFormData({
                    school_name: '',
                    class_group: '',
                    notes: '',
                    is_other_school: false,
                    other_school_name: '',
                    other_school_address: ''
                });
                setSelectedCity('');
                setSelectedSchoolId('');
                setAvailableClasses([]);
                setCitySchools([]);

                // Закрываем модальное окно
                onOpenChange(false);

                // Вызываем callback для обновления списка заявок
                onRequestCreated?.();
            } else if (result && result.data && result.data.id) {
                // Fallback: если API вернул объект с ID, считаем что заявка создана успешно
                console.log('✅ WorkshopRequestModal.handleSubmit: Fallback - заявка создана (есть ID):', result);
                toast({
                    title: "Заявка отправлена! 🎉",
                    description: "Мы рассмотрим вашу заявку и свяжемся с вами в ближайшее время",
                });

                // Сбрасываем форму
                setFormData({
                    school_name: '',
                    class_group: '',
                    notes: '',
                    is_other_school: false,
                    other_school_name: '',
                    other_school_address: ''
                });
                setSelectedCity('');
                setSelectedSchoolId('');
                setAvailableClasses([]);
                setCitySchools([]);

                // Закрываем модальное окно
                onOpenChange(false);

                // Вызываем callback для обновления списка заявок
                onRequestCreated?.();
            } else {
                console.warn('⚠️ WorkshopRequestModal.handleSubmit: Неожиданный формат ответа:', result);
                toast({
                    title: "Ошибка",
                    description: result?.error || "Не удалось отправить заявку",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Ошибка при отправке заявки:', error);
            toast({
                title: "Ошибка",
                description: "Произошла ошибка при отправке заявки",
                variant: "destructive",
            });
        }
    };


    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-orange-500" />
                        Подать заявку на проведение мастер-класса
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-600 mt-1">
                        Заполните форму, и мы рассмотрим возможность проведения мастер-класса в вашем классе
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 py-2">
                    {/* Город */}
                    <div className="space-y-2">
                        <Label htmlFor="city" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Город *
                        </Label>
                        <Select onValueChange={handleCityChange} value={selectedCity}>
                            <SelectTrigger className="h-10 text-sm border-gray-200 focus:border-orange-400 focus:ring-orange-400/20">
                                <SelectValue placeholder="Выберите город" />
                            </SelectTrigger>
                            <SelectContent>
                                {cities.map((city) => (
                                    <SelectItem key={city} value={city}>
                                        {city}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Школа */}
                    <div className="space-y-2">
                        <Label htmlFor="school" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" />
                            Школа/сад *
                        </Label>
                        <Select onValueChange={handleSchoolChange} value={selectedSchoolId} disabled={!selectedCity}>
                            <SelectTrigger className="h-10 text-sm border-gray-200 focus:border-orange-400 focus:ring-orange-400/20 disabled:opacity-50">
                                <SelectValue placeholder="Выберите школу или сад" />
                            </SelectTrigger>
                            <SelectContent>
                                {citySchools.map((school) => (
                                    <SelectItem key={school.id} value={school.id}>
                                        <div>
                                            <div className="font-medium">{school.name}</div>
                                            <div className="text-sm text-gray-500">{school.address}</div>
                                        </div>
                                    </SelectItem>
                                ))}
                                <SelectItem value="other">
                                    <div className="flex items-center gap-2">
                                        <Plus className="w-4 h-4" />
                                        <span className="font-medium text-orange-600">Другая</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        {!selectedCity && (
                            <p className="text-sm text-gray-500">Сначала выберите город</p>
                        )}
                        {selectedCity && citySchools.length === 0 && (
                            <p className="text-sm text-gray-500">Загружаем школы...</p>
                        )}
                    </div>

                    {/* Поля для "другой" школы */}
                    {formData.is_other_school && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="other_school_name" className="text-sm font-semibold text-gray-700">
                                    Название школы/сада *
                                </Label>
                                <Input
                                    id="other_school_name"
                                    type="text"
                                    placeholder="Введите название школы или сада"
                                    value={formData.other_school_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, other_school_name: e.target.value }))}
                                    className="h-10 text-sm border-gray-200 focus:border-orange-400 focus:ring-orange-400/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="other_school_address" className="text-sm font-semibold text-gray-700">
                                    Адрес школы/сада *
                                </Label>
                                <Input
                                    id="other_school_address"
                                    type="text"
                                    placeholder="Введите адрес школы или сада"
                                    value={formData.other_school_address}
                                    onChange={(e) => setFormData(prev => ({ ...prev, other_school_address: e.target.value }))}
                                    className="h-10 text-sm border-gray-200 focus:border-orange-400 focus:ring-orange-400/20"
                                />
                            </div>
                        </>
                    )}

                    {/* Класс */}
                    <div className="space-y-2">
                        <Label htmlFor="class" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" />
                            Класс/группа *
                        </Label>
                        {formData.is_other_school ? (
                            <Input
                                id="class"
                                type="text"
                                placeholder="Введите класс или группу"
                                value={formData.class_group}
                                onChange={(e) => setFormData(prev => ({ ...prev, class_group: e.target.value }))}
                                className="h-10 text-sm border-gray-200 focus:border-orange-400 focus:ring-orange-400/20"
                            />
                        ) : (
                            <Select
                                onValueChange={handleClassChange}
                                value={formData.class_group}
                                disabled={!selectedSchoolId || selectedSchoolId === 'other'}
                            >
                                <SelectTrigger className="h-10 text-sm border-gray-200 focus:border-orange-400 focus:ring-orange-400/20 disabled:opacity-50">
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
                        )}
                        {!selectedSchoolId && (
                            <p className="text-sm text-gray-500">Сначала выберите школу</p>
                        )}
                        {selectedSchoolId && selectedSchoolId !== 'other' && availableClasses.length === 0 && (
                            <p className="text-sm text-gray-500">
                                Если не нашли свой класс, выберите "Другая" и введите класс вручную
                            </p>
                        )}
                    </div>

                    {/* Примечания */}
                    <div className="space-y-2">
                        <Label htmlFor="notes" className="text-sm font-semibold text-gray-700">
                            Дополнительная информация
                        </Label>
                        <Textarea
                            id="notes"
                            placeholder="Укажите любые дополнительные пожелания или требования..."
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            className="min-h-[80px] text-sm border-gray-200 focus:border-orange-400 focus:ring-orange-400/20"
                            rows={3}
                        />
                        <p className="text-xs text-gray-500">
                            Например: предпочтительное время, количество детей, особые пожелания
                        </p>
                    </div>

                    {/* Информационный блок */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-blue-800">
                                <p className="font-medium mb-1">Важно знать:</p>
                                <ul className="space-y-1 text-xs">
                                    <li>• Мы рассмотрим вашу заявку в течение 2-3 рабочих дней</li>
                                    <li>• Свяжемся с вами для уточнения деталей и согласования даты</li>
                                    <li>• Если не нашли свою школу, выберите "Другая" и введите данные вручную</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Кнопки */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="h-10 px-6 text-sm border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                            Отмена
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !selectedCity || !formData.class_group ||
                                (!formData.is_other_school && !selectedSchoolId) ||
                                (formData.is_other_school && (!formData.other_school_name || !formData.other_school_address))}
                            className="h-10 px-6 text-sm bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600 text-white font-medium disabled:opacity-50"
                        >
                            {loading ? 'Отправляем...' : 'Отправить заявку'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
