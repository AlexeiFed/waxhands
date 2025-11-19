/**
 * @file: offers-pdf.ts
 * @description: API эндпоинты для генерации PDF оферт
 * @dependencies: puppeteer, express, database/connection
 * @created: 2024-12-19
 */

import express from 'express';
import { db as pool } from '../database/connection.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import puppeteer from 'puppeteer';

const router = express.Router();

// Функция для создания PDF с помощью puppeteer
const createPdfWithPuppeteer = async (htmlContent: string): Promise<Buffer> => {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        const page = await browser.newPage();

        // Устанавливаем размер страницы A4
        await page.setViewport({ width: 794, height: 1123 });

        // Загружаем HTML контент
        await page.setContent(htmlContent, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // Генерируем PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                right: '15mm',
                bottom: '20mm',
                left: '15mm'
            }
        });

        return Buffer.from(pdfBuffer);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};

// Генерация PDF оферты
router.get('/current/pdf', async (req, res) => {
    try {
        // Получаем текущую активную оферту
        const result = await pool.query(
            'SELECT * FROM offers WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 1'
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Активная оферта не найдена'
            });
        }

        const offer = result.rows[0];

        // Создаем HTML для PDF
        const htmlContent = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${offer.title}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
            background: white;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        .header h1 {
            font-size: 24px;
            margin: 0 0 10px 0;
            font-weight: bold;
        }
        .header .version {
            font-size: 14px;
            color: #666;
            margin: 0;
        }
        .content {
            max-width: 800px;
            margin: 0 auto;
        }
        .content h1 {
            font-size: 20px;
            margin: 25px 0 15px 0;
            font-weight: bold;
            color: #333;
        }
        .content h2 {
            font-size: 18px;
            margin: 20px 0 12px 0;
            font-weight: bold;
            color: #444;
        }
        .content h3 {
            font-size: 16px;
            margin: 15px 0 10px 0;
            font-weight: bold;
            color: #555;
        }
        .content p {
            margin: 10px 0;
            text-align: justify;
        }
        .content ul, .content ol {
            margin: 10px 0;
            padding-left: 25px;
        }
        .content li {
            margin: 5px 0;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ccc;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        .page-break {
            page-break-before: always;
        }
        @media print {
            body {
                margin: 0;
                padding: 15px;
            }
            .page-break {
                page-break-before: always;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${offer.title}</h1>
        <p class="version">Версия: ${offer.version} от ${new Date(offer.created_at).toLocaleDateString('ru-RU')}</p>
    </div>
    
    <div class="content">
        ${offer.content}
    </div>
    
    <div class="footer">
        <p>Документ сгенерирован: ${new Date().toLocaleDateString('ru-RU')} в ${new Date().toLocaleTimeString('ru-RU')}</p>
        <p>Сайт: waxhands.ru</p>
    </div>
</body>
</html>`;

        // Генерируем PDF с помощью puppeteer
        const pdf = await createPdfWithPuppeteer(htmlContent);

        // Отправляем PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="offer-${offer.version}-${new Date().toISOString().split('T')[0]}.pdf"`);
        res.setHeader('Content-Length', pdf.length);
        return res.send(pdf);

    } catch (error) {
        console.error('Ошибка генерации PDF оферты:', error);
        return res.status(500).json({
            success: false,
            error: 'Ошибка генерации PDF'
        });
    }
});

// Генерация PDF оферты (только для админов)
router.get('/:id/pdf', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        // Получаем оферту по ID
        const result = await pool.query(
            'SELECT * FROM offers WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Оферта не найдена'
            });
        }

        const offer = result.rows[0];

        // Создаем HTML для PDF (аналогично выше)
        const htmlContent = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${offer.title}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
            background: white;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        .header h1 {
            font-size: 24px;
            margin: 0 0 10px 0;
            font-weight: bold;
        }
        .header .version {
            font-size: 14px;
            color: #666;
            margin: 0;
        }
        .content {
            max-width: 800px;
            margin: 0 auto;
        }
        .content h1 {
            font-size: 20px;
            margin: 25px 0 15px 0;
            font-weight: bold;
            color: #333;
        }
        .content h2 {
            font-size: 18px;
            margin: 20px 0 12px 0;
            font-weight: bold;
            color: #444;
        }
        .content h3 {
            font-size: 16px;
            margin: 15px 0 10px 0;
            font-weight: bold;
            color: #555;
        }
        .content p {
            margin: 10px 0;
            text-align: justify;
        }
        .content ul, .content ol {
            margin: 10px 0;
            padding-left: 25px;
        }
        .content li {
            margin: 5px 0;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ccc;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        .page-break {
            page-break-before: always;
        }
        @media print {
            body {
                margin: 0;
                padding: 15px;
            }
            .page-break {
                page-break-before: always;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${offer.title}</h1>
        <p class="version">Версия: ${offer.version} от ${new Date(offer.created_at).toLocaleDateString('ru-RU')}</p>
    </div>
    
    <div class="content">
        ${offer.content}
    </div>
    
    <div class="footer">
        <p>Документ сгенерирован: ${new Date().toLocaleDateString('ru-RU')} в ${new Date().toLocaleTimeString('ru-RU')}</p>
        <p>Сайт: waxhands.ru</p>
    </div>
</body>
</html>`;

        // Генерируем PDF с помощью puppeteer
        const pdf = await createPdfWithPuppeteer(htmlContent);

        // Отправляем PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="offer-${offer.version}-${new Date().toISOString().split('T')[0]}.pdf"`);
        res.setHeader('Content-Length', pdf.length);
        return res.send(pdf);

    } catch (error) {
        console.error('Ошибка генерации PDF оферты:', error);
        return res.status(500).json({
            success: false,
            error: 'Ошибка генерации PDF'
        });
    }
});

export default router;