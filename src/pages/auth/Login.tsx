/**
 * @file: Login.tsx
 * @description: Форма входа для родителей и администратора
 * @dependencies: AuthContext
 * @created: 2024-12-19
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [phone, setPhone] = useState("+7");
    const { toast } = useToast();
    const navigate = useNavigate();
    const { login, loading: authLoading, isAuthenticated, user } = useAuth();

    // Показываем индикатор загрузки пока проверяется аутентификация
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gradient-wax-hands flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto mb-4"></div>
                    <p className="text-orange-600 text-lg">Загрузка приложения...</p>
                </div>
            </div>
        );
    }

    // Если пользователь уже авторизован, показываем индикатор перенаправления
    if (isAuthenticated && user) {
        return (
            <div className="min-h-screen bg-gradient-wax-hands flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto mb-4"></div>
                    <p className="text-orange-600 text-lg">Перенаправление...</p>
                </div>
            </div>
        );
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value.startsWith("+7")) {
            const digits = value.replace(/\D/g, "").slice(1); // Убираем +7 и все нецифры
            if (digits.length <= 10) { // Максимум 10 цифр после +7
                setPhone("+7" + digits);
            }
        }
    };

    const handleParentLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const formData = new FormData(e.target as HTMLFormElement);
            const surname = formData.get("surname") as string;
            const phoneNumber = formData.get("phone") as string;

            // Валидация
            if (!surname || !phoneNumber) {
                toast({
                    title: "Ошибка",
                    description: "Заполните все поля",
                    variant: "destructive",
                });
                return;
            }

            if (phoneNumber.length !== 12 || !phoneNumber.startsWith("+7")) {
                toast({
                    title: "Ошибка",
                    description: "Неверный формат телефона. Используйте формат +7XXXXXXXXXX",
                    variant: "destructive",
                });
                return;
            }

            const parentData = {
                surname: surname,
                phone: phoneNumber,
                role: "parent" as const,
            };

            console.log('👨‍👩‍👧‍👦 Parent login data:', parentData);

            await login(parentData);

            toast({
                title: "Вход выполнен",
                description: `Добро пожаловать в систему!`,
            });

            navigate("/parent");
        } catch (error) {
            toast({
                title: "Ошибка входа",
                description: "Пользователь не найден. Зарегистрируйтесь или проверьте данные.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-wax-hands flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-gray-900">
                        Вход в систему
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                        Войдите в свой аккаунт
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleParentLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="surname">Фамилия</Label>
                            <Input
                                id="surname"
                                name="surname"
                                type="text"
                                placeholder="Введите фамилию"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Телефон</Label>
                            <Input
                                id="phone"
                                name="phone"
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
                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
                            disabled={isLoading}
                        >
                            {isLoading ? "Вход..." : "Войти"}
                        </Button>
                    </form>

                    <div className="mt-6 text-center space-y-3">
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/register")}
                            className="text-sm text-gray-600 hover:text-gray-900"
                        >
                            Зарегистрироваться
                        </Button>
                        {/*  <div>
                            <Button
                                variant="ghost"
                                onClick={() => navigate("/admin/login")}
                                className="text-xs text-gray-500 hover:text-gray-700"
                            >
                                Вход для администратора
                            </Button> 
                        </div>*/}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Login; 