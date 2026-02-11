/**
 * @file: landingSettings.ts
 * @description: Контроллеры для управления настройками лендинга
 * @dependencies: express, landingSettings database module
 * @created: 2026-01-19
 */

import { Request, Response } from 'express';
import { getLandingSettings, updateLandingSettings } from '../database/landingSettings.js';

export const getLandingSettingsController = async (req: Request, res: Response) => {
    try {
        const settings = await getLandingSettings();
        console.log('🔍 landing-settings:get', {
            userId: req.user?.userId,
            role: req.user?.role,
            registrationEnabled: settings?.registration_enabled
        });

        res.json({
            success: true,
            data: {
                registrationEnabled: settings.registration_enabled,
                updatedAt: settings.updated_at
            }
        });
    } catch (error) {
        console.error('❌ Ошибка при получении настроек лендинга:', error);
        res.status(500).json({
            success: false,
            error: 'Не удалось получить настройки лендинга'
        });
    }
};

export const updateLandingSettingsController = async (req: Request, res: Response) => {
    try {
        const { registrationEnabled } = req.body ?? {};

        if (typeof registrationEnabled !== 'boolean') {
            return res.status(400).json({
                success: false,
                error: 'Параметр registrationEnabled обязателен и должен быть boolean'
            });
        }

        const settings = await updateLandingSettings(registrationEnabled);

        res.json({
            success: true,
            data: {
                registrationEnabled: settings.registration_enabled,
                updatedAt: settings.updated_at
            }
        });
    } catch (error) {
        console.error('❌ Ошибка при обновлении настроек лендинга:', error);
        res.status(500).json({
            success: false,
            error: 'Не удалось обновить настройки лендинга'
        });
    }
};

