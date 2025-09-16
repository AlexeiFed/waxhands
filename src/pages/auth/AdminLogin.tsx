import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Shield, Lock } from "lucide-react";

export default function AdminLogin() {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const formData = new FormData(e.currentTarget);
            const username = formData.get("username") as string;
            const password = formData.get("password") as string;

            if (!username || !password) {
                toast({
                    title: "Ошибка",
                    description: "Заполните все поля",
                    variant: "destructive",
                });
                return;
            }

            const success = await login({
                name: username, // Используем поле name вместо username
                password,
                role: "admin",
            });

            if (success) {
                toast({
                    title: "Успешно",
                    description: "Добро пожаловать в систему",
                });
                navigate("/admin");
            } else {
                toast({
                    title: "Ошибка",
                    description: "Неверные учетные данные",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Ошибка",
                description: "Произошла ошибка при входе",
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
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                        <Shield className="h-6 w-6 text-orange-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                        Вход в систему
                    </CardTitle>
                    <CardDescription>
                        Введите данные для входа
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Имя пользователя</Label>
                            <Input
                                id="username"
                                name="username"
                                type="text"
                                placeholder="Введите имя пользователя"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Пароль</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Введите пароль"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Вход...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Lock className="h-4 w-4" />
                                    Войти
                                </div>
                            )}
                        </Button>
                    </form>

                </CardContent>
            </Card>
        </div>
    );
} 