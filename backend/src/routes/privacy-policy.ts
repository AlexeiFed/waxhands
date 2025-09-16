/**
 * @file: privacy-policy.ts
 * @description: API роуты для управления политикой конфиденциальности
 * @dependencies: express, multer, path, fs, puppeteer
 * @created: 2024-12-25
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import puppeteer from 'puppeteer';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../database/connection';
import { PrivacyPolicy, CreatePrivacyPolicyRequest, UpdatePrivacyPolicyRequest } from '../types';

const router = express.Router();

// Настройка multer для загрузки файлов
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
});

// Получить все политики конфиденциальности
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT pp.*, u.name as created_by_name
            FROM privacy_policies pp
            LEFT JOIN users u ON pp.created_by = u.id
            ORDER BY pp.created_at DESC
        `);

        const policies: PrivacyPolicy[] = result.rows.map((row: any) => ({
            id: row.id.toString(),
            title: row.title,
            content: row.content,
            version: row.version,
            is_active: row.is_active,
            created_by: row.created_by.toString(),
            created_at: row.created_at.toISOString(),
            updated_at: row.updated_at.toISOString()
        }));

        res.json(policies);
    } catch (error) {
        console.error('Ошибка при получении политик конфиденциальности:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Получить активную политику конфиденциальности
router.get('/current', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT pp.*, u.name as created_by_name
            FROM privacy_policies pp
            LEFT JOIN users u ON pp.created_by = u.id
            WHERE pp.is_active = true
            ORDER BY pp.created_at DESC
            LIMIT 1
        `);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Активная политика конфиденциальности не найдена' });
        }

        const policy: PrivacyPolicy = {
            id: result.rows[0].id.toString(),
            title: result.rows[0].title,
            content: result.rows[0].content,
            version: result.rows[0].version,
            is_active: result.rows[0].is_active,
            created_by: result.rows[0].created_by.toString(),
            created_at: result.rows[0].created_at.toISOString(),
            updated_at: result.rows[0].updated_at.toISOString()
        };

        return res.json(policy);
    } catch (error) {
        console.error('Ошибка при получении текущей политики конфиденциальности:', error);
        return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Получить политику конфиденциальности по ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT pp.*, u.name as created_by_name
            FROM privacy_policies pp
            LEFT JOIN users u ON pp.created_by = u.id
            WHERE pp.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Политика конфиденциальности не найдена' });
        }

        const policy: PrivacyPolicy = {
            id: result.rows[0].id.toString(),
            title: result.rows[0].title,
            content: result.rows[0].content,
            version: result.rows[0].version,
            is_active: result.rows[0].is_active,
            created_by: result.rows[0].created_by.toString(),
            created_at: result.rows[0].created_at.toISOString(),
            updated_at: result.rows[0].updated_at.toISOString()
        };

        return res.json(policy);
    } catch (error) {
        console.error('Ошибка при получении политики конфиденциальности:', error);
        return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Создать новую политику конфиденциальности
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { title, content, version }: CreatePrivacyPolicyRequest = req.body;
        const userId = (req as any).user.id;

        if (!title || !content || !version) {
            return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
        }

        // Деактивируем все существующие политики
        await pool.query('UPDATE privacy_policies SET is_active = false');

        // Создаем новую политику
        const result = await pool.query(`
            INSERT INTO privacy_policies (title, content, version, is_active, created_by)
            VALUES ($1, $2, $3, true, $4)
            RETURNING *
        `, [title, content, version, userId]);

        const newPolicy: PrivacyPolicy = {
            id: result.rows[0].id.toString(),
            title: result.rows[0].title,
            content: result.rows[0].content,
            version: result.rows[0].version,
            is_active: result.rows[0].is_active,
            created_by: result.rows[0].created_by.toString(),
            created_at: result.rows[0].created_at.toISOString(),
            updated_at: result.rows[0].updated_at.toISOString()
        };

        return res.status(201).json(newPolicy);
    } catch (error) {
        console.error('Ошибка при создании политики конфиденциальности:', error);
        return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Обновить политику конфиденциальности
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, version }: UpdatePrivacyPolicyRequest = req.body;

        const updateFields = [];
        const values = [];
        let paramCount = 1;

        if (title !== undefined) {
            updateFields.push(`title = $${paramCount++}`);
            values.push(title);
        }
        if (content !== undefined) {
            updateFields.push(`content = $${paramCount++}`);
            values.push(content);
        }
        if (version !== undefined) {
            updateFields.push(`version = $${paramCount++}`);
            values.push(version);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'Нет данных для обновления' });
        }

        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const result = await pool.query(`
            UPDATE privacy_policies 
            SET ${updateFields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Политика конфиденциальности не найдена' });
        }

        const updatedPolicy: PrivacyPolicy = {
            id: result.rows[0].id.toString(),
            title: result.rows[0].title,
            content: result.rows[0].content,
            version: result.rows[0].version,
            is_active: result.rows[0].is_active,
            created_by: result.rows[0].created_by.toString(),
            created_at: result.rows[0].created_at.toISOString(),
            updated_at: result.rows[0].updated_at.toISOString()
        };

        return res.json(updatedPolicy);
    } catch (error) {
        console.error('Ошибка при обновлении политики конфиденциальности:', error);
        return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Активировать политику конфиденциальности
router.patch('/:id/activate', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Деактивируем все политики
        await pool.query('UPDATE privacy_policies SET is_active = false');

        // Активируем выбранную
        const result = await pool.query(`
            UPDATE privacy_policies 
            SET is_active = true, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Политика конфиденциальности не найдена' });
        }

        const activatedPolicy: PrivacyPolicy = {
            id: result.rows[0].id.toString(),
            title: result.rows[0].title,
            content: result.rows[0].content,
            version: result.rows[0].version,
            is_active: result.rows[0].is_active,
            created_by: result.rows[0].created_by.toString(),
            created_at: result.rows[0].created_at.toISOString(),
            updated_at: result.rows[0].updated_at.toISOString()
        };

        return res.json(activatedPolicy);
    } catch (error) {
        console.error('Ошибка при активации политики конфиденциальности:', error);
        return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Удалить политику конфиденциальности
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query('DELETE FROM privacy_policies WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Политика конфиденциальности не найдена' });
        }

        return res.json({ message: 'Политика конфиденциальности успешно удалена' });
    } catch (error) {
        console.error('Ошибка при удалении политики конфиденциальности:', error);
        return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Скачать PDF текущей политики конфиденциальности
router.get('/current/pdf', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM privacy_policies 
            WHERE is_active = true 
            ORDER BY created_at DESC 
            LIMIT 1
        `);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Активная политика конфиденциальности не найдена' });
        }

        const policy = result.rows[0];

        // Создаем HTML для PDF
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${policy.title}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        margin: 40px;
                        color: #333;
                    }
                    h1 {
                        color: #2c3e50;
                        border-bottom: 2px solid #3498db;
                        padding-bottom: 10px;
                    }
                    h2 {
                        color: #34495e;
                        margin-top: 30px;
                        margin-bottom: 15px;
                    }
                    h3 {
                        color: #7f8c8d;
                        margin-top: 20px;
                        margin-bottom: 10px;
                    }
                    p {
                        margin-bottom: 15px;
                        text-align: justify;
                    }
                    ul, ol {
                        margin-bottom: 15px;
                        padding-left: 30px;
                    }
                    li {
                        margin-bottom: 5px;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 40px;
                        padding: 20px;
                        background-color: #f8f9fa;
                        border-radius: 8px;
                    }
                    .version {
                        color: #7f8c8d;
                        font-size: 14px;
                        margin-top: 10px;
                    }
                    .footer {
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 1px solid #ddd;
                        font-size: 12px;
                        color: #7f8c8d;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${policy.title}</h1>
                    <div class="version">Версия ${policy.version}</div>
                </div>
                <div class="content">
                    ${policy.content}
                </div>
                <div class="footer">
                    <p>Документ сгенерирован: ${new Date().toLocaleString('ru-RU')}</p>
                </div>
            </body>
            </html>
        `;

        // Создаем PDF с помощью Puppeteer
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                right: '20mm',
                bottom: '20mm',
                left: '20mm'
            }
        });

        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="privacy-policy-${policy.version}-${new Date().toISOString().split('T')[0]}.pdf"`);
        return res.send(pdfBuffer);
    } catch (error) {
        console.error('Ошибка при создании PDF политики конфиденциальности:', error);
        return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Скачать PDF конкретной политики конфиденциальности
router.get('/:id/pdf', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM privacy_policies WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Политика конфиденциальности не найдена' });
        }

        const policy = result.rows[0];

        // Создаем HTML для PDF (аналогично выше)
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${policy.title}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        margin: 40px;
                        color: #333;
                    }
                    h1 {
                        color: #2c3e50;
                        border-bottom: 2px solid #3498db;
                        padding-bottom: 10px;
                    }
                    h2 {
                        color: #34495e;
                        margin-top: 30px;
                        margin-bottom: 15px;
                    }
                    h3 {
                        color: #7f8c8d;
                        margin-top: 20px;
                        margin-bottom: 10px;
                    }
                    p {
                        margin-bottom: 15px;
                        text-align: justify;
                    }
                    ul, ol {
                        margin-bottom: 15px;
                        padding-left: 30px;
                    }
                    li {
                        margin-bottom: 5px;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 40px;
                        padding: 20px;
                        background-color: #f8f9fa;
                        border-radius: 8px;
                    }
                    .version {
                        color: #7f8c8d;
                        font-size: 14px;
                        margin-top: 10px;
                    }
                    .footer {
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 1px solid #ddd;
                        font-size: 12px;
                        color: #7f8c8d;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${policy.title}</h1>
                    <div class="version">Версия ${policy.version}</div>
                </div>
                <div class="content">
                    ${policy.content}
                </div>
                <div class="footer">
                    <p>Документ сгенерирован: ${new Date().toLocaleString('ru-RU')}</p>
                </div>
            </body>
            </html>
        `;

        // Создаем PDF с помощью Puppeteer
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                right: '20mm',
                bottom: '20mm',
                left: '20mm'
            }
        });

        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="privacy-policy-${policy.version}-${new Date().toISOString().split('T')[0]}.pdf"`);
        return res.send(pdfBuffer);
    } catch (error) {
        console.error('Ошибка при создании PDF политики конфиденциальности:', error);
        return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

export default router;
