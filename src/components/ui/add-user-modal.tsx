/**
 * @file: add-user-modal.tsx
 * @description: Модальное окно для добавления нового пользователя
 * @dependencies: @/components/ui/dialog, @/components/ui/form, @/hooks/use-toast, @/types
 * @created: 2024-12-19
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { User } from "@/types";

interface AddUserModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (userData: Pick<User, 'name' | 'surname' | 'role'> & { password?: string }) => Promise<void>;
    trigger?: React.ReactNode | null;
}

export const AddUserModal = ({
    isOpen,
    onOpenChange,
    onSubmit,
    trigger
}: AddUserModalProps) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<{
        name: string;
        surname: string;
        role: User['role'];
        password: string;
    }>({
        name: "",
        surname: "",
        role: "executor",
        password: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim() || !formData.role) {
            toast({
                title: "Ошибка валидации",
                description: "Имя и роль обязательны для заполнения",
                variant: "destructive",
            });
            return;
        }

        if (!formData.password.trim()) {
            toast({
                title: "Ошибка валидации",
                description: "Пароль обязателен для заполнения",
                variant: "destructive",
            });
            return;
        }

        if (formData.password.length < 4) {
            toast({
                title: "Ошибка валидации",
                description: "Пароль должен содержать минимум 4 символа",
                variant: "destructive",
            });
            return;
        }

        try {
            setLoading(true);
            await onSubmit({
                name: formData.name.trim(),
                surname: formData.surname.trim() || undefined,
                role: formData.role,
                password: formData.password.trim(),
            });

            // Сброс формы после успешного добавления
            setFormData({
                name: "",
                surname: "",
                role: "executor",
                password: "",
            });

            // Закрытие модального окна
            onOpenChange(false);

            toast({
                title: "Успешно",
                description: "Пользователь добавлен в систему",
            });
        } catch (error) {
            toast({
                title: "Ошибка",
                description: error instanceof Error ? error.message : "Не удалось добавить пользователя",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            // Сброс формы при закрытии
            setFormData({
                name: "",
                surname: "",
                role: "executor",
                password: "",
            });
        }
        onOpenChange(open);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            {trigger && (
                <DialogTrigger asChild>
                    {trigger}
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Добавить нового пользователя</DialogTitle>
                    <DialogDescription>
                        Заполните информацию о новом пользователе системы
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Имя *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Введите имя"
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="surname">Фамилия</Label>
                        <Input
                            id="surname"
                            value={formData.surname}
                            onChange={(e) => setFormData(prev => ({ ...prev, surname: e.target.value }))}
                            placeholder="Введите фамилию (необязательно)"
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Пароль *</Label>
                        <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                            placeholder="Минимум 4 символа"
                            disabled={loading}
                            required
                            minLength={4}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">Роль *</Label>
                        <Select
                            value={formData.role}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as User['role'] }))}
                            disabled={loading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Выберите роль" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="executor">Исполнитель</SelectItem>
                                <SelectItem value="admin">Администратор</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={loading}
                        >
                            Отмена
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Добавление..." : "Добавить пользователя"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
