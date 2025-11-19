/**
 * @file: refund-reason-modal.tsx
 * @description: Модальное окно для указания причины возврата
 * @dependencies: Dialog, Button, Textarea, Label
 * @created: 2025-01-27
 */

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './dialog';
import { Button } from './button';
import { Textarea } from './textarea';
import { Input } from './input';
import { Label } from './label';
import { Badge } from './badge';
import { useToast } from '@/hooks/use-toast';

interface RefundReasonModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (reason: string, email: string) => Promise<void>;
    loading?: boolean;
    defaultEmail?: string;
}

const PREDEFINED_REASONS = [
    'Заболел ребенок',
    'Не сможем прийти',
    'Изменились планы',
    'Проблемы с транспортом',
    'Другое'
];

export const RefundReasonModal: React.FC<RefundReasonModalProps> = ({
    open,
    onClose,
    onConfirm,
    loading = false,
    defaultEmail = ''
}) => {
    const [reason, setReason] = useState('');
    const [selectedPredefined, setSelectedPredefined] = useState<string | null>(null);
    const [customReason, setCustomReason] = useState('');
    const [email, setEmail] = useState(defaultEmail);
    const { toast } = useToast();

    const handlePredefinedReasonClick = (predefinedReason: string) => {
        setSelectedPredefined(predefinedReason);
        setCustomReason('');
        if (predefinedReason === 'Другое') {
            setReason('');
        } else {
            setReason(predefinedReason);
        }
    };

    const handleCustomReasonChange = (value: string) => {
        setCustomReason(value);
        setReason(value);
        if (value.trim()) {
            setSelectedPredefined('Другое');
        }
    };

    const handleConfirm = async () => {
        if (!reason.trim()) {
            toast({
                title: "Ошибка",
                description: "Пожалуйста, укажите причину возврата",
                variant: "destructive"
            });
            return;
        }

        if (!email.trim()) {
            toast({
                title: "Ошибка",
                description: "Пожалуйста, укажите e-mail, указанный при оплате",
                variant: "destructive"
            });
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            toast({
                title: "Ошибка",
                description: "Введите корректный e-mail",
                variant: "destructive"
            });
            return;
        }

        console.log('🔍 Кнопка "Подтвердить возврат" нажата');
        console.log('🔍 Причина возврата:', reason.trim());
        console.log('🔍 Текущий authToken:', localStorage.getItem('authToken') ? `${localStorage.getItem('authToken')?.substring(0, 20)}...` : 'НЕТ ТОКЕНА');

        try {
            await onConfirm(reason.trim(), email.trim());
            handleClose();
        } catch (error) {
            console.error('❌ Ошибка при подтверждении возврата:', error);
            // Ошибка обрабатывается в родительском компоненте
        }
    };

    const handleClose = () => {
        setReason('');
        setSelectedPredefined(null);
        setCustomReason('');
        setEmail(defaultEmail);
        onClose();
    };

    useEffect(() => {
        if (open) {
            setEmail(defaultEmail);
        }
    }, [defaultEmail, open]);

    const isConfirmDisabled = !reason.trim() || !email.trim() || loading;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Возврат средств</DialogTitle>
                    <DialogDescription>
                        Укажите причину возврата для обработки вашего запроса
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Предустановленные причины */}
                    <div className="space-y-2">
                        <Label>Выберите причину возврата:</Label>
                        <div className="flex flex-wrap gap-2">
                            {PREDEFINED_REASONS.map((predefinedReason) => (
                                <Badge
                                    key={predefinedReason}
                                    variant={selectedPredefined === predefinedReason ? "default" : "outline"}
                                    className="cursor-pointer hover:bg-primary/10"
                                    onClick={() => handlePredefinedReasonClick(predefinedReason)}
                                >
                                    {predefinedReason}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Поле для ввода причины */}
                    <div className="space-y-2">
                        <Label htmlFor="reason">
                            {selectedPredefined === 'Другое' ? 'Опишите причину возврата:' : 'Дополнительные комментарии (необязательно):'}
                        </Label>
                        <Textarea
                            id="reason"
                            placeholder={
                                selectedPredefined === 'Другое'
                                    ? "Опишите причину возврата..."
                                    : "Дополнительные комментарии..."
                            }
                            value={customReason}
                            onChange={(e) => handleCustomReasonChange(e.target.value)}
                            rows={3}
                            className="resize-none"
                        />
                    </div>

                    {/* Информация о возврате */}
                    <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <strong>Важно:</strong> Возврат средств возможен не позднее чем за 3 часа до начала мастер-класса.
                            Обработка возврата может занять до 3 рабочих дней.
                        </p>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="refund-email">E-mail, указанный при оплате</Label>
                        <Input
                            id="refund-email"
                            type="email"
                            placeholder="example@mail.ru"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        Отмена
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isConfirmDisabled}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {loading ? 'Обработка...' : 'Подтвердить возврат'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
