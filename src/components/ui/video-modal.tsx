/**
 * @file: video-modal.tsx
 * @description: Модальное окно для воспроизведения видео с панелью управления
 * @dependencies: Dialog, Button, X, Play, Pause, Volume2, VolumeX
 * @created: 2025-09-22
 */

import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';

interface VideoModalProps {
    isOpen: boolean;
    onClose: () => void;
    videoSrc: string;
    title?: string;
}

export const VideoModal: React.FC<VideoModalProps> = ({
    isOpen,
    onClose,
    videoSrc,
    title
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showControls, setShowControls] = useState(true);

    // Сброс состояния при открытии/закрытии
    useEffect(() => {
        if (isOpen) {
            setIsPlaying(false);
            setIsMuted(true);
            setCurrentTime(0);
            setShowControls(true);
        }
    }, [isOpen]);

    // Обработчики видео
    const handlePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleMuteToggle = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
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
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (videoRef.current) {
            const time = parseFloat(e.target.value);
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const handleFullscreen = () => {
        if (videoRef.current) {
            if (!isFullscreen) {
                if (videoRef.current.requestFullscreen) {
                    videoRef.current.requestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
            setIsFullscreen(!isFullscreen);
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleVideoClick = () => {
        handlePlayPause();
    };

    const handleMouseMove = () => {
        setShowControls(true);
        // Скрываем контролы через 3 секунды
        setTimeout(() => setShowControls(false), 3000);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl w-full p-0 bg-black">
                <DialogHeader className="sr-only">
                    <DialogTitle>{title || 'Видео'}</DialogTitle>
                    <DialogDescription>
                        Воспроизведение видео с элементами управления
                    </DialogDescription>
                </DialogHeader>
                <div className="relative">
                    {/* Кнопка закрыть */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white"
                        onClick={onClose}
                    >
                        <X className="w-4 h-4" />
                    </Button>

                    {/* Видео */}
                    <div
                        className="relative bg-black"
                        onMouseMove={handleMouseMove}
                        onMouseLeave={() => setShowControls(false)}
                    >
                        <video
                            ref={videoRef}
                            src={videoSrc}
                            className="w-full h-auto max-h-[80vh] object-contain"
                            onClick={handleVideoClick}
                            onTimeUpdate={handleTimeUpdate}
                            onLoadedMetadata={handleLoadedMetadata}
                            onEnded={() => setIsPlaying(false)}
                            muted={isMuted}
                            preload="metadata"
                        />

                        {/* Панель управления */}
                        {showControls && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                                {/* Прогресс-бар */}
                                <div className="mb-4">
                                    <input
                                        type="range"
                                        min="0"
                                        max={duration || 0}
                                        value={currentTime}
                                        onChange={handleSeek}
                                        className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                                        style={{
                                            background: `linear-gradient(to right, #f97316 0%, #f97316 ${(currentTime / duration) * 100}%, #4b5563 ${(currentTime / duration) * 100}%, #4b5563 100%)`
                                        }}
                                    />
                                </div>

                                {/* Контролы */}
                                <div className="flex items-center justify-between text-white">
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handlePlayPause}
                                            className="text-white hover:bg-white/20"
                                        >
                                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleMuteToggle}
                                            className="text-white hover:bg-white/20"
                                        >
                                            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                        </Button>

                                        <span className="text-sm">
                                            {formatTime(currentTime)} / {formatTime(duration)}
                                        </span>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        {title && (
                                            <span className="text-sm font-medium truncate max-w-xs">
                                                {title}
                                            </span>
                                        )}

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleFullscreen}
                                            className="text-white hover:bg-white/20"
                                        >
                                            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};


