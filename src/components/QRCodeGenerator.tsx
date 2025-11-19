/**
 * @file: QRCodeGenerator.tsx
 * @description: Компонент для генерации QR-кода ссылки установки
 * @dependencies: qrcode, Button
 * @created: 2025-09-22
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Copy, QrCode } from 'lucide-react';

interface QRCodeGeneratorProps {
    url: string;
    size?: number;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
    url,
    size = 200
}) => {
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        generateQRCode();
    }, [url, size]);

    const generateQRCode = async () => {
        setIsLoading(true);
        try {
            // Динамический импорт qrcode
            const QRCode = (await import('qrcode')).default;
            const dataUrl = await QRCode.toDataURL(url, {
                width: size,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            setQrCodeDataUrl(dataUrl);
        } catch (error) {
            console.error('Ошибка генерации QR-кода:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const downloadQRCode = () => {
        if (qrCodeDataUrl) {
            const link = document.createElement('a');
            link.download = 'waxhands-install-qr.png';
            link.href = qrCodeDataUrl;
            link.click();
        }
    };

    const copyUrl = () => {
        navigator.clipboard.writeText(url);
        // Можно добавить toast уведомление
    };

    return (
        <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
                QR-код для установки
            </h3>

            {isLoading ? (
                <div className="flex items-center justify-center" style={{ width: size, height: size }}>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
            ) : qrCodeDataUrl ? (
                <div className="space-y-4">
                    <div className="inline-block p-4 bg-white rounded-lg shadow-lg">
                        <img
                            src={qrCodeDataUrl}
                            alt="QR код для установки приложения"
                            style={{ width: size, height: size }}
                            className="rounded"
                        />
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                            Отсканируйте QR-код для установки приложения
                        </p>

                        <div className="flex justify-center space-x-2">
                            <Button
                                onClick={downloadQRCode}
                                size="sm"
                                variant="outline"
                                className="border-orange-300 text-orange-600 hover:bg-orange-50"
                            >
                                <Download className="w-4 h-4 mr-1" />
                                Скачать
                            </Button>

                            <Button
                                onClick={copyUrl}
                                size="sm"
                                variant="outline"
                                className="border-purple-300 text-purple-600 hover:bg-purple-50"
                            >
                                <Copy className="w-4 h-4 mr-1" />
                                Копировать ссылку
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-red-500 text-sm">
                    Ошибка генерации QR-кода
                </div>
            )}
        </div>
    );
};


