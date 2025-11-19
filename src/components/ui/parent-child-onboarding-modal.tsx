/**
 * @file: parent-child-onboarding-modal.tsx
 * @description: Обобщенный онбординг для родителя и ребенка с медиа-контентом
 * @dependencies: Dialog, Button, useMemo
 * @created: 2024-12-19
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlayCircle, Baby, Palette, Users, Calendar, CheckCircle, Star } from 'lucide-react';

interface ParentChildOnboardingModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

const ParentChildOnboardingModal: React.FC<ParentChildOnboardingModalProps> = ({
    isOpen,
    onOpenChange
}) => {
    const [onboardingStep, setOnboardingStep] = useState(0);
    const navigate = useNavigate();

    // Постеры онбординга — статические изображения из папки onboarding
    const posterImages = useMemo(() => {
        const imageMap = new Map();

        // Добавляем изображения по номерам слайдов (только 2.png)
        imageMap.set(2, '/onboarding/2.png');

        return imageMap;
    }, []);

    // Видеогалерея компании — все .mp4 из папки onboarding
    const videoModules = useMemo(() => {
        const videoMap = new Map();

        // Добавляем видео по номерам слайдов
        videoMap.set(1, '/onboarding/1.mp4');
        videoMap.set(3, '/onboarding/3.mp4');
        videoMap.set(4, '/onboarding/4.mp4');
        videoMap.set(5, '/onboarding/5.mp4');

        return videoMap;
    }, []);

    const slides = [
        {
            title: 'Добро пожаловать в студию! 🎨',
            text: 'Мы создаем уникальные восковые ручки для детей. Каждый ребенок может проявить свою индивидуальность!',
            icon: <Star className="w-12 h-12 text-orange-500" />,
            slideNumber: 1
        },
        {
            title: 'Простой процесс регистрации 👨‍👩‍👧‍👦',
            text: 'Выберите школу и класс вашего ребенка, мы покажем доступные мастер-классы. Запись займет 2 минуты!',
            icon: <Users className="w-12 h-12 text-purple-500" />,
            slideNumber: 2
        },
        {
            title: 'Для детей: Придумай свой жест! ✋',
            text: 'Ребенок выбирает любую форму руки — показывает любимый жест, который станет основой ручки',
            icon: <Baby className="w-12 h-12 text-blue-500" />,
            slideNumber: 3
        },
        {
            title: 'Безопасность превыше всего 🛡️',
            text: 'Используем только теплый безопасный воск. Процесс контролируется опытными мастерами',
            icon: <CheckCircle className="w-12 h-12 text-green-500" />,
            slideNumber: 4
        },
        {
            title: 'Украшаем, персонализируем и создаем! ✨🎉',
            text: 'Выбираем стиль: световые ручки, блестки, лакировка, надписи. Каждая ручка уникальна! Быстрое создание за 5 минут, яркие эмоции и уникальный сувенир на память. Дети в восторге!',
            icon: <Palette className="w-12 h-12 text-pink-500" />,
            slideNumber: 5
        }
    ];

    // Отладочная информация для слайдов
    console.log('🎯 Слайды онбординга:', slides.map((slide, index) => ({
        index,
        title: slide.title,
        slideNumber: slide.slideNumber,
        hasImage: !!posterImages.get(slide.slideNumber),
        hasVideo: !!videoModules.get(slide.slideNumber)
    })));

    const currentSlide = slides[Math.min(onboardingStep, slides.length - 1)];

    const handleNext = () => {
        if (onboardingStep < slides.length - 1) {
            setOnboardingStep(onboardingStep + 1);
        }
    };

    const handlePrev = () => {
        if (onboardingStep > 0) {
            setOnboardingStep(onboardingStep - 1);
        }
    };

    const handleComplete = () => {
        onOpenChange(false);
        setOnboardingStep(0);
    };

    const handleSkip = () => {
        onOpenChange(false);
        setOnboardingStep(0);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="text-center">
                    <DialogTitle className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                        {currentSlide.title}
                    </DialogTitle>
                    <DialogDescription className="text-base sm:text-lg text-gray-600 leading-relaxed">
                        {currentSlide.text}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Медиа-контент */}
                    <div className="w-full overflow-hidden rounded-xl bg-white/50 shadow-lg">
                        {(() => {
                            const slideNumber = currentSlide.slideNumber;
                            const image = posterImages.get(slideNumber);
                            const video = videoModules.get(slideNumber);

                            if (image) {
                                return (
                                    <img
                                        src={image}
                                        className="w-full aspect-video object-cover"
                                        alt={currentSlide.title}
                                        onError={(e) => {
                                            console.error('❌ Ошибка загрузки изображения:', image);
                                            e.currentTarget.style.display = 'none';
                                        }}
                                        onLoad={() => {

                                        }}
                                    />
                                );
                            } else if (video) {
                                return (
                                    <video
                                        src={video}
                                        className="w-full aspect-video object-cover"
                                        muted
                                        autoPlay
                                        loop
                                        playsInline
                                    />
                                );
                            } else {
                                return (
                                    <div className="w-full aspect-video bg-gradient-to-r from-orange-100 to-purple-100 flex items-center justify-center">
                                        {currentSlide.icon}
                                    </div>
                                );
                            }
                        })()}
                    </div>

                    {/* Индикаторы прогресса */}
                    <div className="flex justify-center gap-2">
                        {slides.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-3 w-3 rounded-full transition-all duration-200 ${idx === onboardingStep
                                    ? 'bg-orange-500 scale-110'
                                    : 'bg-orange-200'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Навигация */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        {onboardingStep > 0 && (
                            <Button
                                variant="outline"
                                onClick={handlePrev}
                                className="flex-1 sm:flex-none min-w-[120px]"
                            >
                                ← Назад
                            </Button>
                        )}

                        {onboardingStep < slides.length - 1 ? (
                            <Button
                                className="bg-gradient-to-r from-orange-500 to-purple-500 text-white hover:from-orange-600 hover:to-purple-600 flex-1 sm:flex-none min-w-[120px]"
                                onClick={handleNext}
                            >
                                Далее →
                            </Button>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-3 w-full">
                                <Button
                                    variant="secondary"
                                    onClick={() => navigate('/about')}
                                    className="flex-1 sm:flex-none min-w-[120px]"
                                >
                                    Наши работы и мастер-классы
                                </Button>
                                <Button
                                    className="bg-gradient-to-r from-orange-500 to-purple-500 text-white hover:from-orange-600 hover:to-purple-600 flex-1 sm:flex-none min-w-[120px]"
                                    onClick={handleComplete}
                                >
                                    Начать! 🚀
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Кнопка пропуска */}
                    <div className="text-center">
                        <Button
                            variant="ghost"
                            onClick={handleSkip}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Пропустить онбординг
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ParentChildOnboardingModal;
