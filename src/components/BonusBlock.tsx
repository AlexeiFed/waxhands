/**
 * @file: BonusBlock.tsx
 * @description: Компонент для отображения блока бонусов с переливающимся текстом и постерами
 * @dependencies: React, API hooks
 * @created: 2025-01-25
 */

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface BonusData {
    id: string;
    title: string;
    media: string[];
    created_at: string;
    updated_at: string;
}

interface SlideShowProps {
    images: string[];
}

const SlideShow: React.FC<SlideShowProps> = ({ images }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        if (images.length <= 1) return;

        const interval = setInterval(() => {
            setIsTransitioning(true);

            // Ждем завершения анимации исчезновения, затем меняем изображение
            setTimeout(() => {
                setCurrentIndex((prevIndex) =>
                    prevIndex === images.length - 1 ? 0 : prevIndex + 1
                );
                setIsTransitioning(false);
            }, 600); // Половина времени анимации для плавного перехода

        }, 4000); // Увеличиваем интервал до 4 секунд для лучшего восприятия

        return () => clearInterval(interval);
    }, [images.length]);

    if (images.length === 0) return null;

    return (
        <div className="relative w-full h-64 sm:h-80 rounded-xl overflow-hidden shadow-lg">
            <img
                src={images[currentIndex]}
                alt={`Бонус ${currentIndex + 1}`}
                className={`w-full h-full object-cover transition-opacity duration-[1200ms] ease-in-out ${isTransitioning ? 'opacity-0' : 'opacity-100'
                    }`}
                loading="lazy"
            />

            {/* Индикаторы слайдов (если больше одного изображения) */}
            {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {images.map((_, index) => (
                        <button
                            key={index}
                            className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentIndex
                                ? 'bg-white scale-125'
                                : 'bg-white/50 hover:bg-white/75'
                                }`}
                            onClick={() => setCurrentIndex(index)}
                            aria-label={`Перейти к слайду ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

interface BonusesApiResponse {
    success?: boolean;
    data?: BonusData;
    media?: string | string[];
    id?: string;
    title?: string;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

const BonusBlock: React.FC = () => {
    const [bonusData, setBonusData] = useState<BonusData | null>(null);

    // Загружаем данные о бонусах
    const { data: bonusesResponse, isLoading, error } = useQuery({
        queryKey: ['bonuses'],
        queryFn: async (): Promise<BonusesApiResponse> => {
            const response = await api.get('/bonuses');
            return response.data as BonusesApiResponse;
        },
        staleTime: 5 * 60 * 1000, // 5 минут
    });

    useEffect(() => {
        if (bonusesResponse) {
            if (bonusesResponse.success && bonusesResponse.data) {
                // Обрабатываем media как массив, если это строка - парсим JSON
                const processedData = {
                    ...bonusesResponse.data,
                    media: typeof bonusesResponse.data.media === 'string'
                        ? JSON.parse(bonusesResponse.data.media)
                        : (bonusesResponse.data.media || [])
                };
                setBonusData(processedData);
            } else if (!bonusesResponse.success) {
                // Если API вернул данные напрямую (без success обертки)
                const processedData = {
                    id: bonusesResponse.id as string || '',
                    title: bonusesResponse.title as string || '',
                    media: typeof bonusesResponse.media === 'string'
                        ? JSON.parse(bonusesResponse.media)
                        : (bonusesResponse.media || []),
                    created_at: bonusesResponse.created_at as string || '',
                    updated_at: bonusesResponse.updated_at as string || ''
                };
                setBonusData(processedData);
            }
        }
    }, [bonusesResponse]);

    if (isLoading) {
        return (
            <div className="w-full flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
            </div>
        );
    }

    if (error) {
        return null;
    }

    if (!bonusData) {
        return null;
    }

    return (
        <div className="w-full mb-6 sm:mb-8">
            {/* Основной блок с переливающимся текстом */}
            <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                {/* Декоративные элементы */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                    <div className="absolute top-4 left-4 text-6xl">🎁</div>
                    <div className="absolute top-4 right-4 text-6xl">✨</div>
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-6xl">🎨</div>
                </div>

                {/* Переливающийся заголовок */}
                <div className="relative z-10 text-center">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
                        <span className="bg-gradient-to-r from-white via-yellow-100 to-white bg-clip-text text-transparent bg-[length:200%_100%] animate-shimmer">
                            {bonusData.title}
                        </span>
                    </h2>

                    {/* Дополнительный декоративный текст */}
                    <div className="text-lg sm:text-xl text-white/90 font-semibold">
                        🎉 Специальное предложение для участников мастер-классов! 🎉
                    </div>
                </div>
            </div>

            {/* Слайд-шоу постеров */}
            {bonusData.media && bonusData.media.length > 0 && (
                <div className="mt-6">
                    <SlideShow images={bonusData.media} />
                </div>
            )}
        </div>
    );
};

export default BonusBlock;
