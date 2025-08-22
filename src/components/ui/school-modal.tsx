/**
 * @file: school-modal.tsx
 * @description: Модальное окно для добавления и редактирования школ
 * @dependencies: @/components/ui/dialog, @/components/ui/form, @/hooks/use-toast
 * @created: 2024-12-19
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit } from "lucide-react";

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

interface SchoolModalProps {
    school?: School | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (schoolData: Omit<School, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    trigger?: React.ReactNode;
}

export const SchoolModal = ({
    school,
    isOpen,
    onOpenChange,
    onSubmit,
    trigger
}: SchoolModalProps) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        teacher: "",
        teacherPhone: "",
        notes: "",
        classes: [] as string[],
    });

    // Отдельное состояние для отображения введенного текста в поле классов
    const [classesInputValue, setClassesInputValue] = useState("");

    // Заполняем форму данными школы при редактировании
    useEffect(() => {
        if (school) {
            setFormData({
                name: school.name,
                address: school.address,
                teacher: school.teacher || "",
                teacherPhone: school.teacherPhone || "",
                notes: school.notes || "",
                classes: school.classes || [],
            });
            // Устанавливаем значение для отображения в поле ввода
            setClassesInputValue(school.classes?.join(', ') || "");
        } else {
            setFormData({
                name: "",
                address: "",
                teacher: "",
                notes: "",
                classes: [],
            });
            setClassesInputValue("");
        }
    }, [school, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim() || !formData.address.trim()) {
            toast({
                title: "Ошибка валидации",
                description: "Название и адрес школы обязательны для заполнения",
                variant: "destructive",
            });
            return;
        }

        try {
            setLoading(true);
            await onSubmit(formData);
            toast({
                title: school ? "Школа обновлена" : "Школа добавлена",
                description: school
                    ? "Школа успешно обновлена в системе"
                    : "Школа успешно добавлена в систему",
            });
            onOpenChange(false);
        } catch (error) {
            toast({
                title: "Ошибка",
                description: "Не удалось сохранить школу",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleClassesChange = (value: string) => {
        // Обновляем отображаемое значение в поле ввода
        setClassesInputValue(value);

        // Разбиваем по запятым, убираем пробелы и фильтруем пустые значения
        const classes = value.split(',').map(c => c.trim()).filter(c => c);

        // Обновляем formData
        setFormData(prev => ({
            ...prev,
            classes
        }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        {school ? "Редактировать школу" : "Добавить школу"}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {school ? "Редактировать школу" : "Добавить школу"}
                    </DialogTitle>
                    <DialogDescription>
                        {school
                            ? "Внесите изменения в информацию о школе"
                            : "Заполните информацию о новой школе"
                        }
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Название школы *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleInputChange("name", e.target.value)}
                            placeholder="Введите название школы"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Адрес *</Label>
                        <Textarea
                            id="address"
                            value={formData.address}
                            onChange={(e) => handleInputChange("address", e.target.value)}
                            placeholder="Введите адрес школы"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="teacher">Контактное лицо</Label>
                            <Input
                                id="teacher"
                                value={formData.teacher}
                                onChange={(e) => handleInputChange("teacher", e.target.value)}
                                placeholder="ФИО контактного лица"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="teacherPhone">Телефон</Label>
                            <Input
                                id="teacherPhone"
                                value={formData.teacherPhone}
                                onChange={(e) => handleInputChange("teacherPhone", e.target.value)}
                                placeholder="+7 (999) 123-45-67"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="classes">Классы/группы</Label>
                        <Input
                            id="classes"
                            value={classesInputValue}
                            onChange={(e) => handleClassesChange(e.target.value)}
                            placeholder="1А, 2Б, 3В (через запятую)"
                        />
                        <p className="text-xs text-muted-foreground">
                            Введите классы через запятую (например: 1А, 2Б, 3В)
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Примечания</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => handleInputChange("notes", e.target.value)}
                            placeholder="Дополнительная информация о школе"
                        />
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Отмена
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Сохранение..." : (school ? "Обновить" : "Добавить")}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}; 