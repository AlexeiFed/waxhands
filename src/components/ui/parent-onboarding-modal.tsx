/**
 * @file: src/components/ui/parent-onboarding-modal.tsx
 * @description: Модальное окно онбординга для родителя
 * @dependencies: Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Button
 * @created: 2024-12-19
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface ParentOnboardingModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

const ParentOnboardingModal = ({ isOpen, onOpenChange }: ParentOnboardingModalProps) => {
    const [step, setStep] = useState(0);

    const slides = [
        {
            title: 'Добро пожаловать в студию! ✨',
            text: 'Мы рады, что вы выбрали наши мастер-классы для ваших детей. Давайте познакомимся с тем, как это работает.',
            icon: '🎨'
        },
        {
            title: 'Как записать ребенка? 📝',
            text: 'Выберите мастер-класс, подходящий для класса вашего ребенка, и нажмите "Записать детей". Мы автоматически создадим счета для оплаты.',
            icon: '📋'
        },
        {
            title: 'Что происходит дальше? ⏳',
            text: 'После записи вы получите счета на оплату. После оплаты дети автоматически будут записаны на мастер-класс.',
            icon: '💳'
        },
        {
            title: 'На мастер-классе 🎯',
            text: 'Дети создают уникальные восковые ручки под руководством наших опытных мастеров. Все материалы безопасны и гипоаллергенны.',
            icon: '🎭'
        },
        {
            title: 'Готово! 🎉',
            text: 'Через 5 минут у каждого ребенка будет своя неповторимая восковая ручка - отличный сувенир и память о веселом времяпрепровождении!',
            icon: '🏆'
        }
    ];

    const currentSlide = slides[Math.min(step, slides.length - 1)];

    const handleNext = () => {
        if (step < slides.length - 1) {
            setStep(step + 1);
        } else {
            onOpenChange(false);
            setStep(0);
        }
    };

    const handleBack = () => {
        if (step > 0) {
            setStep(step - 1);
        }
    };

    const handleSkip = () => {
        onOpenChange(false);
        setStep(0);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader className="text-center">
                    <DialogTitle className="text-2xl sm:text-3xl flex items-center justify-center space-x-2">
                        <span className="text-4xl">{currentSlide.icon}</span>
                        <span>{currentSlide.title}</span>
                    </DialogTitle>
                    <DialogDescription className="text-base sm:text-lg leading-relaxed mt-4">
                        {currentSlide.text}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Индикатор прогресса */}
                    <div className="flex justify-center gap-2">
                        {slides.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-3 w-3 rounded-full transition-all duration-200 ${idx === step ? 'bg-orange-500 scale-110' : 'bg-orange-200'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Кнопки навигации */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        {step > 0 && (
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                className="flex-1 sm:flex-none min-w-[120px]"
                            >
                                Назад
                            </Button>
                        )}

                        <Button
                            variant="secondary"
                            onClick={handleSkip}
                            className="flex-1 sm:flex-none min-w-[120px]"
                        >
                            Пропустить
                        </Button>

                        <Button
                            className="bg-gradient-to-r from-orange-500 to-purple-500 text-white hover:from-orange-600 hover:to-purple-600 flex-1 sm:flex-none min-w-[120px]"
                            onClick={handleNext}
                        >
                            {step < slides.length - 1 ? 'Далее' : 'Начать!'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ParentOnboardingModal;

