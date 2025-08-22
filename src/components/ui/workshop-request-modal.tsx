/**
 * @file: src/components/ui/workshop-request-modal.tsx
 * @description: Модальное окно для подачи заявки на проведение мастер-класса
 * @dependencies: Dialog, Button, Input, Label, Select, useWorkshopRequests, useToast
 * @created: 2024-12-19
 */

import { useState } from 'react';
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
import { Calendar, MapPin, GraduationCap, FileText, AlertCircle } from 'lucide-react';

interface WorkshopRequestModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function WorkshopRequestModal({ isOpen, onOpenChange }: WorkshopRequestModalProps) {
    const { user } = useAuth();
    const { schools } = useSchools();
    const { createRequest, loading } = useWorkshopRequests();
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        school_name: '',
        class_group: '',
        desired_date: '',
        notes: ''
    });

    const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
    const [availableClasses, setAvailableClasses] = useState<string[]>([]);

    // Обработчик изменения школы
    const handleSchoolChange = (schoolId: string) => {
        setSelectedSchoolId(schoolId);
        setFormData(prev => ({ ...prev, school_name: '', class_group: '' }));

        const school = schools.find(s => s.id === schoolId);
        if (school) {
            setAvailableClasses(school.classes);
            setFormData(prev => ({ ...prev, school_name: school.name }));
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
        if (!formData.school_name || !formData.class_group || !formData.desired_date) {
            toast({
                title: "Ошибка",
                description: "Заполните все обязательные поля",
                variant: "destructive",
            });
            return;
        }

        try {
            console.log('🔍 WorkshopRequestModal.handleSubmit: Отправляем заявку:', {
                parent_id: user.id,
                school_name: formData.school_name,
                class_group: formData.class_group,
                desired_date: formData.desired_date,
                notes: formData.notes || undefined
            });

            const result = await createRequest({
                parent_id: user.id,
                school_name: formData.school_name,
                class_group: formData.class_group,
                desired_date: formData.desired_date,
                notes: formData.notes || undefined
            });

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
                    desired_date: '',
                    notes: ''
                });
                setSelectedSchoolId('');
                setAvailableClasses([]);

                // Закрываем модальное окно
                onOpenChange(false);
            } else if (result && result.id) {
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
                    desired_date: '',
                    notes: ''
                });
                setSelectedSchoolId('');
                setAvailableClasses([]);

                // Закрываем модальное окно
                onOpenChange(false);
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

    // Получаем минимальную дату (сегодня)
    const today = new Date().toISOString().split('T')[0];

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
                    {/* Школа */}
                    <div className="space-y-2">
                        <Label htmlFor="school" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Школа/сад *
                        </Label>
                        <Select onValueChange={handleSchoolChange} value={selectedSchoolId}>
                            <SelectTrigger className="h-10 text-sm border-gray-200 focus:border-orange-400 focus:ring-orange-400/20">
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
                        {!selectedSchoolId && (
                            <p className="text-sm text-gray-500">
                                Если не нашли свою школу, напишите в поддержку
                            </p>
                        )}
                    </div>

                    {/* Класс */}
                    <div className="space-y-2">
                        <Label htmlFor="class" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" />
                            Класс/группа *
                        </Label>
                        <Select
                            onValueChange={handleClassChange}
                            value={formData.class_group}
                            disabled={!selectedSchoolId}
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
                        {!selectedSchoolId && (
                            <p className="text-sm text-gray-500">Сначала выберите школу</p>
                        )}
                        {selectedSchoolId && availableClasses.length === 0 && (
                            <p className="text-sm text-gray-500">
                                Если не нашли свой класс, напишите в поддержку
                            </p>
                        )}
                    </div>

                    {/* Желаемая дата */}
                    <div className="space-y-2">
                        <Label htmlFor="date" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Желаемая дата *
                        </Label>
                        <Input
                            id="date"
                            type="date"
                            min={today}
                            value={formData.desired_date}
                            onChange={(e) => setFormData(prev => ({ ...prev, desired_date: e.target.value }))}
                            className="h-10 text-sm border-gray-200 focus:border-orange-400 focus:ring-orange-400/20"
                            required
                        />
                        <p className="text-xs text-gray-500">
                            Выберите дату не ранее сегодняшнего дня
                        </p>
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
                                    <li>• Свяжемся с вами для уточнения деталей</li>
                                    <li>• Если не нашли свою школу или класс, напишите в поддержку</li>
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
                            disabled={loading || !formData.school_name || !formData.class_group || !formData.desired_date}
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
