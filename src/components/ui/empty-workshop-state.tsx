import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Star, Palette, Gift, Users } from "lucide-react";

interface EmptyWorkshopStateProps {
    onRequestWorkshop: () => void;
}

export const EmptyWorkshopState = ({ onRequestWorkshop }: EmptyWorkshopStateProps) => {
    return (
        <div className="text-center py-12">
            {/* Анимированные элементы */}
            <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 bg-gradient-to-br from-orange-200 to-purple-200 rounded-full opacity-20 animate-pulse" />
                </div>
                <div className="relative z-10">
                    <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
                        <Sparkles className="w-12 h-12 text-white" />
                    </div>
                </div>

                {/* Плавающие звездочки */}
                <div className="absolute top-0 left-1/4 animate-bounce-gentle">
                    <Star className="w-6 h-6 text-yellow-400" fill="currentColor" />
                </div>
                <div className="absolute top-4 right-1/4 animate-float">
                    <Star className="w-4 h-4 text-orange-400" fill="currentColor" />
                </div>
                <div className="absolute bottom-0 left-1/3 animate-bounce-gentle" style={{ animationDelay: '1s' }}>
                    <Star className="w-5 h-5 text-purple-400" fill="currentColor" />
                </div>
            </div>

            {/* Заголовок */}
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
                Пока нет мастер-классов 😊
            </h2>

            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                Но ты можешь оставить заявку, и мы приедем в твою школу или детский сад!
            </p>

            {/* Карточка с информацией */}
            <Card className="max-w-md mx-auto bg-gradient-to-br from-orange-50 to-purple-50 border-orange-200 mb-8">
                <CardContent className="p-6">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                <Palette className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <div className="font-semibold text-gray-800">Творческие мастер-классы</div>
                                <div className="text-sm text-gray-600">Создаем уникальные сувениры</div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <div className="font-semibold text-gray-800">Приезжаем в школы</div>
                                <div className="text-sm text-gray-600">И детские сады</div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                <Gift className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                                <div className="font-semibold text-gray-800">Уникальные подарки</div>
                                <div className="text-sm text-gray-600">Восковые ручки за 5 минут</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Кнопка заявки */}
            <Button
                onClick={onRequestWorkshop}
                className="bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600 text-white text-lg py-4 px-8 rounded-full shadow-glow transform hover:scale-105 transition-all duration-200"
            >
                <Sparkles className="w-6 h-6 mr-2" />
                Подать заявку на мастер-класс
            </Button>

            {/* Дополнительная информация */}
            <div className="mt-8 text-sm text-gray-500">
                <p>Мы свяжемся с твоими родителями для подтверждения</p>
                <p className="mt-1">✨ Создай свою уникальную восковую ручку! ✨</p>
            </div>
        </div>
    );
}; 