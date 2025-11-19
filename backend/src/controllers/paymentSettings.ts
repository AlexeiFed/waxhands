/**
 * @file: paymentSettings.ts
 * @description: Контроллеры для управления настройками оплаты
 * @dependencies: express, paymentSettings database module
 * @created: 2025-11-09
 */

import { Request, Response } from 'express';
import { getPaymentSettings, updatePaymentSettings } from '../database/paymentSettings.js';
import { wsManager } from '../websocket-server.js';

export const getPaymentSettingsController = async (req: Request, res: Response) => {
    try {
        const settings = await getPaymentSettings();
        console.log('🔍 payment-settings:get', {
            userId: req.user?.userId,
            role: req.user?.role,
            isEnabled: settings?.is_enabled
        });

        res.json({
            success: true,
            data: {
                isEnabled: settings.is_enabled,
                updatedAt: settings.updated_at
            }
        });
    } catch (error) {
        console.error('❌ Ошибка при получении настроек оплаты:', error);
        res.status(500).json({
            success: false,
            error: 'Не удалось получить настройки оплаты'
        });
    }
};

export const updatePaymentSettingsController = async (req: Request, res: Response) => {
    try {
        const { isEnabled } = req.body ?? {};

        if (typeof isEnabled !== 'boolean') {
            return res.status(400).json({
                success: false,
                error: 'Параметр isEnabled обязателен и должен быть boolean'
            });
        }

        const settings = await updatePaymentSettings(isEnabled);

        if (wsManager) {
            wsManager.notifyPaymentSettingsChanged(settings.is_enabled, settings.updated_at);
            wsManager.notifyMasterClassUpdate('system', 'payment_settings_changed');
        }

        res.json({
            success: true,
            data: {
                isEnabled: settings.is_enabled,
                updatedAt: settings.updated_at
            }
        });
    } catch (error) {
        console.error('❌ Ошибка при обновлении настроек оплаты:', error);
        res.status(500).json({
            success: false,
            error: 'Не удалось обновить настройки оплаты'
        });
    }
};

