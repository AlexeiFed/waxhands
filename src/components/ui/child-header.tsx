import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
    Menu,
    Home,
    User,
    LogOut,
    Settings,
    Sparkles,
    Star,
    Palette,
} from "lucide-react";

interface ChildHeaderProps {
    className?: string;
}

export const ChildHeader = ({ className = "" }: ChildHeaderProps) => {
    const { user, logout } = useAuth();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        toast({
            title: "До свидания! 👋",
            description: "Ты успешно вышел из приложения",
        });
    };

    const menuItems = [
        {
            icon: <Home className="w-5 h-5" />,
            label: "Главная",
            action: () => { navigate('/child'); setIsOpen(false); },
        },
        {
            icon: <User className="w-5 h-5" />,
            label: "Мой профиль",
            action: () => { navigate('/child/profile'); setIsOpen(false); },
        },
        {
            icon: <Palette className="w-5 h-5" />,
            label: "О нас",
            action: () => { navigate('/child/about'); setIsOpen(false); },
        },
        {
            icon: <Settings className="w-5 h-5" />,
            label: "Настройки",
            action: () => {
                toast({
                    title: "Настройки",
                    description: "Здесь будут настройки",
                });
                setIsOpen(false);
            },
        },
    ];

    return (
        <header className={`bg-white/90 backdrop-blur-sm border-b border-orange-200 shadow-sm sticky top-0 z-40 ${className}`}>
            <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                    {/* Логотип */}
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full flex items-center justify-center shadow-glow">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <div className="absolute -top-1 -right-1 animate-bounce-gentle">
                                <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                                Восковые Ручки
                            </h1>
                            <p className="text-xs text-gray-500">Творческие мастер-классы</p>
                        </div>
                    </div>

                    {/* Гамбургер меню */}
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-full p-2 hover:bg-orange-100"
                            >
                                <Menu className="w-6 h-6 text-orange-600" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-80 bg-gradient-to-b from-orange-50 to-purple-50">
                            <SheetHeader>
                                <SheetTitle className="text-left">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full flex items-center justify-center">
                                            <Sparkles className="w-7 h-7 text-white" />
                                        </div>
                                        <div>
                                            <div className="text-lg font-bold text-gray-800">
                                                Привет, {user?.name}! 👋
                                            </div>
                                            <div className="text-sm text-gray-500">Творческий мастер</div>
                                        </div>
                                    </div>
                                </SheetTitle>
                            </SheetHeader>

                            <div className="mt-6 space-y-4">
                                {/* Статистика */}
                                {/*     <Card className="bg-white/80 border-orange-200">
                                    <CardContent className="p-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-orange-600">3</div>
                                                <div className="text-xs text-gray-600">Мастер-класса</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-purple-600">5</div>
                                                <div className="text-xs text-gray-600">Создано ручек</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card> */}

                                {/* Меню */}
                                <div className="space-y-2">
                                    {menuItems.map((item, index) => (
                                        <Button
                                            key={index}
                                            variant="ghost"
                                            className="w-full justify-start text-left h-12 hover:bg-orange-100"
                                            onClick={item.action}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="text-orange-600">{item.icon}</div>
                                                <span className="font-medium">{item.label}</span>
                                            </div>
                                        </Button>
                                    ))}
                                </div>

                                {/* Выход */}
                                <div className="pt-4 border-t border-orange-200">
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start text-left h-12 hover:bg-red-100 text-red-600"
                                        onClick={handleLogout}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <LogOut className="w-5 h-5" />
                                            <span className="font-medium">Выйти</span>
                                        </div>
                                    </Button>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}; 