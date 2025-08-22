/**
 * @file: video-player-modal.tsx
 * @description: Модальное окно видео плеера для стилей и опций с улучшенной обработкой ошибок
 * @dependencies: Dialog, Button, useState, useEffect
 * @created: 2024-12-19
 */

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Play, Pause, Volume2, VolumeX, Maximize2, AlertCircle, Video as VideoIcon } from 'lucide-react';

interface VideoPlayerModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    videoUrl: string;
    title: string;
}

export const VideoPlayerModal = ({ isOpen, onOpenChange, videoUrl, title }: VideoPlayerModalProps) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (isOpen) {
            setIsPlaying(false);
            setCurrentTime(0);
            setHasError(false);
            setIsLoading(true);

            // Проверяем валидность URL видео
            if (!videoUrl || typeof videoUrl !== 'string') {
                console.error('VideoPlayerModal: Некорректный URL видео:', videoUrl);
                setHasError(true);
                setErrorMessage('Некорректный URL видео');
                setIsLoading(false);
                return;
            }

            // Проверяем, что URL начинается с http или https
            if (!videoUrl.startsWith('http://') && !videoUrl.startsWith('https://')) {
                console.error('VideoPlayerModal: Неподдерживаемый протокол URL:', videoUrl);
                setHasError(true);
                setErrorMessage('Неподдерживаемый протокол URL видео');
                setIsLoading(false);
                return;
            }

            if (videoRef.current) {
                videoRef.current.currentTime = 0;
            }
            console.log(`VideoPlayerModal: Открываем видео для "${title}":`, videoUrl);
        }
    }, [isOpen, videoUrl, title]);

    const togglePlay = async () => {
        if (videoRef.current && !hasError) {
            try {
                if (isPlaying) {
                    videoRef.current.pause();
                    setIsPlaying(false);
                } else {
                    await videoRef.current.play();
                    setIsPlaying(true);
                }
            } catch (error) {
                console.error('Ошибка воспроизведения видео:', error);
                setHasError(true);
                setErrorMessage('Ошибка воспроизведения видео');
            }
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const toggleFullscreen = () => {
        if (videoRef.current) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                videoRef.current.requestFullscreen();
            }
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
            console.log(`VideoPlayerModal: Метаданные видео загружены, длительность: ${videoRef.current.duration}s`);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === ' ') {
            e.preventDefault();
            togglePlay();
        }
        if (e.key === 'm' || e.key === 'M') {
            toggleMute();
        }
        if (e.key === 'f' || e.key === 'F') {
            toggleFullscreen();
        }
        if (e.key === 'Escape') {
            onOpenChange(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen]);

    const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
        const videoElement = e.currentTarget;
        const error = videoElement.error;

        console.error('VideoPlayerModal: Video error:', {
            event: e,
            videoUrl: videoUrl,
            error: error,
            errorCode: error?.code,
            errorMessage: error?.message,
            videoElement: videoElement
        });

        let errorMessage = 'Не удалось загрузить видео.';
        if (error) {
            switch (error.code) {
                case MediaError.MEDIA_ERR_ABORTED:
                    errorMessage = 'Загрузка видео была прервана.';
                    break;
                case MediaError.MEDIA_ERR_NETWORK:
                    errorMessage = 'Ошибка сети при загрузке видео.';
                    break;
                case MediaError.MEDIA_ERR_DECODE:
                    errorMessage = 'Видео имеет неподдерживаемый формат.';
                    break;
                case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    errorMessage = 'Формат видео не поддерживается браузером.';
                    break;
                default:
                    errorMessage = `Произошла ошибка при загрузке видео (код: ${error.code}).`;
            }
        } else {
            // Если error объект недоступен, анализируем событие
            const target = e.target as HTMLVideoElement;
            if (target.networkState === 3) {
                errorMessage = 'Ошибка сети при загрузке видео.';
            } else if (target.readyState === 0) {
                errorMessage = 'Видео не может быть загружено.';
            } else {
                errorMessage = 'Неизвестная ошибка при загрузке видео.';
            }
        }

        setHasError(true);
        setIsLoading(false);
        setErrorMessage(errorMessage);
    };

    const handleVideoLoad = () => {
        console.log(`VideoPlayerModal: Видео успешно загружено:`, videoUrl);
        setIsLoading(false);
        setHasError(false);
    };

    const handleRetry = () => {
        setHasError(false);
        setErrorMessage('');
        setIsLoading(true);
        if (videoRef.current) {
            videoRef.current.load();
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] bg-black/95 border-0 p-0 overflow-hidden">
                <DialogHeader className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-white text-lg font-semibold">
                            {title} - Видео
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Модальное окно для просмотра видео
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
                    {hasError ? (
                        <div className="flex flex-col items-center justify-center text-white text-center p-8">
                            <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Ошибка загрузки видео</h3>
                            <p className="text-gray-300 mb-4">
                                {errorMessage}
                            </p>
                            <div className="flex space-x-3">
                                <Button
                                    onClick={handleRetry}
                                    className="bg-orange-500 hover:bg-orange-600"
                                >
                                    Попробовать снова
                                </Button>
                                <Button
                                    onClick={() => onOpenChange(false)}
                                    variant="outline"
                                    className="border-white/30 text-white hover:bg-white/20"
                                >
                                    Закрыть
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {videoUrl && (
                                <video
                                    ref={videoRef}
                                    src={videoUrl}
                                    className="w-full h-full object-contain"
                                    onTimeUpdate={handleTimeUpdate}
                                    onLoadedMetadata={handleLoadedMetadata}
                                    onLoadStart={() => setIsLoading(true)}
                                    onCanPlay={() => setIsLoading(false)}
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => setIsPlaying(false)}
                                    onError={handleVideoError}
                                    onLoadedData={handleVideoLoad}
                                    onAbort={() => {
                                        console.warn('VideoPlayerModal: Загрузка видео прервана');
                                        setIsLoading(false);
                                    }}
                                    onSuspend={() => {
                                        console.log('VideoPlayerModal: Загрузка видео приостановлена');
                                    }}
                                    preload="metadata"
                                    controls={false}
                                    crossOrigin="anonymous"
                                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                                />
                            )}

                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                    <div className="text-white text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-2"></div>
                                        <p>Загрузка видео...</p>
                                    </div>
                                </div>
                            )}

                            {/* Видео контролы */}
                            {!isLoading && !hasError && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                                    <div className="flex flex-col space-y-3">
                                        {/* Прогресс бар */}
                                        <input
                                            type="range"
                                            min="0"
                                            max={duration || 0}
                                            value={currentTime}
                                            onChange={handleSeek}
                                            className="w-full h-2 bg-white/30 rounded-lg appearance-none cursor-pointer slider"
                                            style={{
                                                background: `linear-gradient(to right, #f97316 0%, #f97316 ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.3) ${(currentTime / (duration || 1)) * 100}%)`
                                            }}
                                        />

                                        {/* Контролы */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={togglePlay}
                                                    className="text-white hover:bg-white/20"
                                                    disabled={hasError}
                                                >
                                                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={toggleMute}
                                                    className="text-white hover:bg-white/20"
                                                    disabled={hasError}
                                                >
                                                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                                </Button>
                                                <span className="text-white text-sm">
                                                    {formatTime(currentTime)} / {formatTime(duration)}
                                                </span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={toggleFullscreen}
                                                className="text-white hover:bg-white/20"
                                                disabled={hasError}
                                            >
                                                <Maximize2 className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
