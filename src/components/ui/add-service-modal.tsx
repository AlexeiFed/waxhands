/**
 * @file: add-service-modal.tsx
 * @description: Модальное окно для добавления новой услуги
 * @dependencies: Dialog, Form, Button, Input, Textarea
 * @created: 2024-12-19
 */

import React, { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './dialog';
import { Service } from '../../types';

interface AddServiceModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    loading?: boolean;
}

export const AddServiceModal: React.FC<AddServiceModalProps> = ({
    open,
    onClose,
    onSubmit,
    loading = false
}) => {
    const [formData, setFormData] = useState({
        name: '',
        shortDescription: '',
        fullDescription: '',
        styles: [],
        options: []
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Очищаем ошибку при изменении поля
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Название услуги обязательно';
        }

        if (!formData.shortDescription.trim()) {
            newErrors.shortDescription = 'Краткое описание обязательно';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            await onSubmit(formData);
            // Очищаем форму после успешного создания
            setFormData({
                name: '',
                shortDescription: '',
                fullDescription: '',
                styles: [],
                options: []
            });
            setErrors({});
            onClose();
        } catch (error) {
            console.error('Error creating service:', error);
        }
    };

    const handleClose = () => {
        setFormData({
            name: '',
            shortDescription: '',
            fullDescription: '',
            styles: [],
            options: []
        });
        setErrors({});
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Добавить новую услугу</DialogTitle>
                    <DialogDescription>
                        Создайте новую услугу для мастер-классов. Заполните все необходимые поля.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            Название услуги <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="Введите название услуги"
                            className={errors.name ? 'border-red-500' : ''}
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500">{errors.name}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="shortDescription">
                            Краткое описание <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="shortDescription"
                            value={formData.shortDescription}
                            onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                            placeholder="Краткое описание услуги"
                            rows={2}
                            className={errors.shortDescription ? 'border-red-500' : ''}
                        />
                        {errors.shortDescription && (
                            <p className="text-sm text-red-500">{errors.shortDescription}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fullDescription">Полное описание</Label>
                        <Textarea
                            id="fullDescription"
                            value={formData.fullDescription}
                            onChange={(e) => handleInputChange('fullDescription', e.target.value)}
                            placeholder="Подробное описание услуги"
                            rows={3}
                        />
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
                            type="submit"
                            disabled={loading}
                            className="bg-primary hover:bg-primary/90"
                        >
                            {loading ? 'Создание...' : 'Создать услугу'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};