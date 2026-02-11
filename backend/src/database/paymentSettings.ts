/**
 * @file: paymentSettings.ts
 * @description: Работа с таблицей payment_settings
 * @dependencies: pg connection pool
 * @created: 2025-11-09
 */

import pool from './connection.js';

export interface PaymentSettingsRow {
    id: number;
    is_enabled: boolean;
    updated_at: string;
}

export const getPaymentSettings = async (): Promise<PaymentSettingsRow> => {
    const result = await pool.query<PaymentSettingsRow>(
        'SELECT id, is_enabled, updated_at FROM payment_settings ORDER BY id ASC LIMIT 1'
    );

    if (result.rows.length === 0) {
        const insertResult = await pool.query<PaymentSettingsRow>(
            'INSERT INTO payment_settings (is_enabled) VALUES ($1) RETURNING id, is_enabled, updated_at',
            [false]
        );
        return insertResult.rows[0];
    }

    return result.rows[0];
};

export const updatePaymentSettings = async (isEnabled: boolean): Promise<PaymentSettingsRow> => {
    const result = await pool.query<PaymentSettingsRow>(
        'UPDATE payment_settings SET is_enabled = $1, updated_at = CURRENT_TIMESTAMP RETURNING id, is_enabled, updated_at',
        [isEnabled]
    );

    if (result.rows.length === 0) {
        const insertResult = await pool.query<PaymentSettingsRow>(
            'INSERT INTO payment_settings (is_enabled) VALUES ($1) RETURNING id, is_enabled, updated_at',
            [isEnabled]
        );
        return insertResult.rows[0];
    }

    return result.rows[0];
};








