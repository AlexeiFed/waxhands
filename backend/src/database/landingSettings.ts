/**
 * @file: landingSettings.ts
 * @description: Работа с таблицей landing_settings
 * @dependencies: pg connection pool
 * @created: 2026-01-19
 */

import pool from './connection.js';

export interface LandingSettingsRow {
    id: number;
    registration_enabled: boolean;
    updated_at: string;
}

export const getLandingSettings = async (): Promise<LandingSettingsRow> => {
    const result = await pool.query<LandingSettingsRow>(
        'SELECT id, registration_enabled, updated_at FROM landing_settings ORDER BY id ASC LIMIT 1'
    );

    if (result.rows.length === 0) {
        const insertResult = await pool.query<LandingSettingsRow>(
            'INSERT INTO landing_settings (registration_enabled) VALUES ($1) RETURNING id, registration_enabled, updated_at',
            [false]
        );
        return insertResult.rows[0];
    }

    return result.rows[0];
};

export const updateLandingSettings = async (registrationEnabled: boolean): Promise<LandingSettingsRow> => {
    const result = await pool.query<LandingSettingsRow>(
        'UPDATE landing_settings SET registration_enabled = $1, updated_at = CURRENT_TIMESTAMP RETURNING id, registration_enabled, updated_at',
        [registrationEnabled]
    );

    if (result.rows.length === 0) {
        const insertResult = await pool.query<LandingSettingsRow>(
            'INSERT INTO landing_settings (registration_enabled) VALUES ($1) RETURNING id, registration_enabled, updated_at',
            [registrationEnabled]
        );
        return insertResult.rows[0];
    }

    return result.rows[0];
};

