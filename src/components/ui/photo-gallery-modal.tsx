/**
 * @file: photo-gallery-modal.tsx
 * @description: Модальное окно галереи фотографий для стилей и опций с улучшенной обработкой ошибок
 * @dependencies: Dialog, Button, useState, useEffect
 * @created: 2024-12-19
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, AlertCircle, Image as ImageIcon } from 'lucide-react';

interface PhotoGalleryModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    images: string[];
    title: string;
}

export const PhotoGalleryModal = ({ isOpen, onOpenChange, images, title }: PhotoGalleryModalProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
    const [currentImageSrc, setCurrentImageSrc] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(0);
            setImageErrors(new Set());
            if (images.length > 0) {
                setCurrentImageSrc(images[0]);
                console.log(`PhotoGalleryModal: Открываем галерею для "${title}" с ${images.length} изображениями:`, images);
            }
        }
    }, [isOpen, images, title]);

    const nextImage = () => {
        const nextIndex = (currentIndex + 1) % images.length;
        setCurrentIndex(nextIndex);
        setCurrentImageSrc(images[nextIndex]);
    };

    const prevImage = () => {
        const prevIndex = (currentIndex - 1 + images.length) % images.length;
        setCurrentIndex(prevIndex);
        setCurrentImageSrc(images[prevIndex]);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft') prevImage();
        if (e.key === 'ArrowRight') nextImage();
        if (e.key === 'Escape') onOpenChange(false);
    };

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, currentIndex]);

    const handleImageError = (index: number) => {
        console.error(`PhotoGalleryModal: Ошибка загрузки изображения ${index}:`, images[index]);
        setImageErrors(prev => new Set(prev).add(index));
    };

    const handleImageLoad = (index: number) => {
        console.log(`PhotoGalleryModal: Изображение ${index} успешно загружено:`, images[index]);
    };

    const getValidImages = () => {
        return images.filter((_, index) => !imageErrors.has(index));
    };

    const validImages = getValidImages();
    const hasValidImages = validImages.length > 0;

    if (!isOpen || images.length === 0) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] bg-black/95 border-0 p-0 overflow-hidden">
                <DialogHeader className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-white text-lg font-semibold">
                            {title} - Фото {currentIndex + 1} из {images.length}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Галерея фотографий для просмотра
                        </DialogDescription>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="text-white hover:bg-white/20"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="relative h-full flex items-center justify-center">
                    {!hasValidImages ? (
                        // Показываем сообщение об ошибке, если все изображения недоступны
                        <div className="flex flex-col items-center justify-center text-white text-center p-8">
                            <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Изображения недоступны</h3>
                            <p className="text-gray-300 mb-4">
                                К сожалению, все изображения для этого элемента недоступны или повреждены.
                            </p>
                            <Button
                                onClick={() => onOpenChange(false)}
                                className="bg-orange-500 hover:bg-orange-600"
                            >
                                Закрыть
                            </Button>
                        </div>
                    ) : (
                        <>
                            {/* Навигационные кнопки */}
                            {validImages.length > 1 && (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={prevImage}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 z-20"
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={nextImage}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 z-20"
                                    >
                                        <ChevronRight className="w-6 h-6" />
                                    </Button>
                                </>
                            )}

                            {/* Текущее изображение */}
                            {currentImageSrc && !imageErrors.has(currentIndex) && (
                                <img
                                    src={currentImageSrc}
                                    alt={`${title} - фото ${currentIndex + 1}`}
                                    className="max-w-full max-h-full object-contain"
                                    onError={() => handleImageError(currentIndex)}
                                    onLoad={() => handleImageLoad(currentIndex)}
                                    crossOrigin="anonymous"
                                />
                            )}

                            {/* Fallback для текущего изображения */}
                            {imageErrors.has(currentIndex) && (
                                <div className="flex flex-col items-center justify-center text-white text-center p-8">
                                    <ImageIcon className="w-16 h-16 text-gray-400 mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">Изображение недоступно</h3>
                                    <p className="text-gray-300 mb-4">
                                        Файл изображения поврежден или недоступен
                                    </p>
                                    {validImages.length > 1 && (
                                        <Button
                                            onClick={nextImage}
                                            className="bg-orange-500 hover:bg-orange-600"
                                        >
                                            Следующее фото
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* Индикаторы */}
                            {validImages.length > 1 && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
                                    {images.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => {
                                                setCurrentIndex(index);
                                                setCurrentImageSrc(images[index]);
                                            }}
                                            className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentIndex
                                                ? 'bg-white scale-125'
                                                : imageErrors.has(index)
                                                    ? 'bg-red-500/50'
                                                    : 'bg-white/50 hover:bg-white/75'
                                                }`}
                                            title={imageErrors.has(index) ? 'Ошибка загрузки' : `Фото ${index + 1}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
