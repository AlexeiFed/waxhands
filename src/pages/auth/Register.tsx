/**
 * @file: Register.tsx
 * @description: Форма регистрации родителя с детьми
 * @dependencies: ChildFormSection, AuthContext, useSchools
 * @created: 2024-12-19
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSchools } from "@/hooks/use-schools";
import { ChildFormSection } from "@/components/ui/child-form-section";
import type { ChildData, School } from "@/types/index";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Register = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
    const [availableClasses, setAvailableClasses] = useState<string[]>([]);
    const [children, setChildren] = useState<ChildData[]>([]);
    const [phone, setPhone] = useState("+7");
    const { toast } = useToast();
    const navigate = useNavigate();
    const { register } = useAuth();
    const { schools, loading: schoolsLoading } = useSchools();

    const handleSchoolChange = (schoolId: string) => {
        setSelectedSchoolId(schoolId);
        const school = schools.find(s => s.id === schoolId);
        setAvailableClasses(school?.classes || []);
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value.startsWith("+7")) {
            const digits = value.replace(/\D/g, "").slice(1); // Убираем +7 и все нецифры
            if (digits.length <= 10) { // Максимум 10 цифр после +7
                setPhone("+7" + digits);
            }
        }
    };

    // Инициализируем первого ребенка при загрузке
    useEffect(() => {
        if (children.length === 0) {
            const emptyChild = {
                name: "",
                surname: "",
                age: undefined,
                role: "child" as const,
                schoolId: "",
                class: "",
            };
            setChildren([emptyChild]);
        }
    }, [children.length]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Валидация для родителя
            if (children.length === 0) {
                toast({
                    title: "Ошибка",
                    description: "Добавьте хотя бы одного ребенка",
                    variant: "destructive",
                });
                setIsLoading(false);
                return;
            }

            // Проверяем, что все дети заполнены корректно
            const invalidChildren = children.filter(
                child => !child.name || !child.surname || !child.schoolId || !child.class
            );

            if (invalidChildren.length > 0) {
                toast({
                    title: "Ошибка",
                    description: "Заполните все поля для всех детей",
                    variant: "destructive",
                });
                setIsLoading(false);
                return;
            }

            const formData = new FormData(e.target as HTMLFormElement);
            const parentData = {
                name: formData.get("parentName") as string,
                surname: formData.get("parentSurname") as string,
                phone: formData.get("parentPhone") as string,
                role: "parent" as const,
                children: children,
            };

            await register(parentData);

            toast({
                title: "Регистрация успешна!",
                description: `Добро пожаловать в систему, ${parentData.name}!`,
            });

            navigate("/parent");
        } catch (error) {
            toast({
                title: "Ошибка регистрации",
                description: "Не удалось зарегистрироваться. Попробуйте еще раз.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-wax-hands flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-gray-900">
                        Регистрация родителя
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                        Создайте аккаунт и добавьте своих детей
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Данные родителя */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">Данные родителя</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="parentName">Имя *</Label>
                                    <Input
                                        id="parentName"
                                        name="parentName"
                                        type="text"
                                        placeholder="Введите имя"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="parentSurname">Фамилия *</Label>
                                    <Input
                                        id="parentSurname"
                                        name="parentSurname"
                                        type="text"
                                        placeholder="Введите фамилию"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="parentPhone">Телефон *</Label>
                                <Input
                                    id="parentPhone"
                                    name="parentPhone"
                                    type="tel"
                                    placeholder="+7XXXXXXXXXX"
                                    value={phone}
                                    onChange={handlePhoneChange}
                                    required
                                    disabled={isLoading}
                                    maxLength={12}
                                />
                                <p className="text-xs text-gray-500">
                                    Формат: +7XXXXXXXXXX (10 цифр после +7)
                                </p>
                            </div>
                        </div>

                        {/* Секция для добавления детей */}
                        <ChildFormSection
                            children={children}
                            onChildrenChange={setChildren}
                            schools={schools}
                            selectedSchoolId={selectedSchoolId}
                            onSchoolChange={handleSchoolChange}
                            availableClasses={availableClasses}
                        />

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
                            disabled={isLoading}
                        >
                            {isLoading ? "Регистрация..." : "Зарегистрироваться"}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/login")}
                            className="text-sm text-gray-600 hover:text-gray-900"
                        >
                            Уже есть аккаунт? Войти
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Register; 