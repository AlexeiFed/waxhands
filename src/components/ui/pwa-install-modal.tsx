/**
 * @file: pwa-install-modal.tsx
 * @description: Модальное окно с инструкциями по установке PWA
 * @dependencies: Dialog, Button, Download icon
 * @created: 2025-01-18
 */

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, Share, Plus } from 'lucide-react';

interface PWAInstallModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    const getInstructions = () => {
        if (isIOS || isSafari) {
            return {
                title: 'Установка на iPhone/iPad',
                steps: [
                    { icon: <Share className="w-6 h-6 text-blue-500" />, text: 'Нажмите кнопку "Поделиться" внизу экрана' },
                    { icon: <Plus className="w-6 h-6 text-green-500" />, text: 'Выберите "На экран Домой"' },
                    { icon: <Download className="w-6 h-6 text-purple-500" />, text: 'Нажмите "Добавить" в правом верхнем углу' }
                ]
            };
        } else if (isAndroid) {
            return {
                title: 'Установка на Android',
                steps: [
                    { icon: <Download className="w-6 h-6 text-blue-500" />, text: 'Нажмите на иконку установки в адресной строке' },
                    { icon: <Plus className="w-6 h-6 text-green-500" />, text: 'Или используйте меню браузера (три точки) → "Установить приложение"' },
                    { icon: <Smartphone className="w-6 h-6 text-purple-500" />, text: 'Подтвердите установку' }
                ]
            };
        } else {
            return {
                title: 'Установка на компьютере',
                steps: [
                    { icon: <Download className="w-6 h-6 text-blue-500" />, text: 'Нажмите на иконку установки в адресной строке' },
                    { icon: <Plus className="w-6 h-6 text-green-500" />, text: 'Или используйте меню браузера (три точки) → "Установить приложение"' },
                    { icon: <Smartphone className="w-6 h-6 text-purple-500" />, text: 'Подтвердите установку' }
                ]
            };
        }
    };

    const instructions = getInstructions();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Download className="w-5 h-5 text-orange-500" />
                        {instructions.title}
                    </DialogTitle>
                    <DialogDescription>
                        Следуйте инструкциям ниже для установки приложения на ваше устройство
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {instructions.steps.map((step, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                            <div className="flex-shrink-0 mt-0.5">
                                {step.icon}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="w-6 h-6 bg-orange-500 text-white text-sm font-bold rounded-full flex items-center justify-center">
                                        {index + 1}
                                    </span>
                                    <span className="font-medium text-gray-900">Шаг {index + 1}</span>
                                </div>
                                <p className="text-gray-700 text-sm">{step.text}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={onClose}>
                        Понятно
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
