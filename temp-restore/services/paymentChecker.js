/**
 * @file: paymentChecker.ts
 * @description: Сервис для автоматической проверки платежей через OAuth2 API ЮMoney
 * @dependencies: yumoneyOAuthService, paymentService
 * @created: 2025-01-27
 */
import yumoneyOAuthService from './yumoneyOAuthService.js';
import { updateInvoicePaymentStatus } from './paymentService.js';
import pool from '../database/connection.js';
export class PaymentChecker {
    isRunning = false;
    checkInterval = 30; // секунды
    /**
     * Запускает автоматическую проверку платежей
     */
    async startPeriodicCheck() {
        if (this.isRunning) {
            console.log('⚠️ Проверка платежей уже запущена');
            return;
        }
        this.isRunning = true;
        console.log('🚀 Запускаем автоматическую проверку платежей каждые', this.checkInterval, 'секунд');
        const runCheck = async () => {
            if (!this.isRunning)
                return;
            try {
                await this.checkAllPendingPayments();
            }
            catch (error) {
                console.error('❌ Ошибка при автоматической проверке платежей:', error);
            }
            // Планируем следующую проверку
            setTimeout(runCheck, this.checkInterval * 1000);
        };
        // Запускаем первую проверку
        runCheck();
    }
    /**
     * Останавливает автоматическую проверку
     */
    stopPeriodicCheck() {
        this.isRunning = false;
        console.log('⏹️ Останавливаем автоматическую проверку платежей');
    }
    /**
     * Проверяет все pending счета
     */
    async checkAllPendingPayments() {
        try {
            console.log('🔍 Проверяем все pending счета...');
            // Получаем все pending счета
            const result = await pool.query('SELECT id, payment_label, amount FROM invoices WHERE status = $1 ORDER BY created_at DESC', ['pending']);
            const pendingInvoices = result.rows;
            console.log(`📊 Найдено ${pendingInvoices.length} pending счетов`);
            let updatedCount = 0;
            for (const invoice of pendingInvoices) {
                try {
                    const paymentInfo = await yumoneyOAuthService.checkPaymentByLabel(invoice.payment_label);
                    if (paymentInfo && paymentInfo.status === 'success') {
                        console.log(`✅ Найден оплаченный платеж для счета ${invoice.id}:`, paymentInfo);
                        // Обновляем статус счета
                        const updateResult = await updateInvoicePaymentStatus({
                            invoiceId: invoice.id,
                            paymentId: paymentInfo.operation_id,
                            amount: paymentInfo.amount,
                            currency: paymentInfo.currency,
                            paymentMethod: 'OAuth2 API',
                            paymentDate: paymentInfo.datetime,
                            sender: paymentInfo.sender || 'Unknown',
                            operationId: paymentInfo.operation_id,
                            label: invoice.payment_label
                        });
                        if (updateResult.success) {
                            updatedCount++;
                            console.log(`✅ Счет ${invoice.id} обновлен: pending → paid`);
                        }
                        else {
                            console.error(`❌ Ошибка обновления счета ${invoice.id}:`, updateResult.error);
                        }
                    }
                }
                catch (invoiceError) {
                    console.error(`❌ Ошибка проверки счета ${invoice.id}:`, invoiceError);
                }
            }
            return {
                success: true,
                message: `Проверено ${pendingInvoices.length} счетов, обновлено ${updatedCount}`,
                checkedInvoices: pendingInvoices.length,
                updatedInvoices: updatedCount
            };
        }
        catch (error) {
            console.error('❌ Ошибка проверки платежей:', error);
            return {
                success: false,
                message: `Ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`,
                checkedInvoices: 0,
                updatedInvoices: 0
            };
        }
    }
    /**
     * Проверяет конкретный счет по ID
     */
    async checkInvoicePayment(invoiceId) {
        try {
            console.log(`🔍 Проверяем счет ${invoiceId}...`);
            // Получаем информацию о счете
            const result = await pool.query('SELECT id, payment_label, amount, status FROM invoices WHERE id = $1', [invoiceId]);
            if (result.rows.length === 0) {
                return {
                    success: false,
                    message: `Счет ${invoiceId} не найден`,
                    checkedInvoices: 0,
                    updatedInvoices: 0
                };
            }
            const invoice = result.rows[0];
            if (invoice.status === 'paid') {
                return {
                    success: true,
                    message: `Счет ${invoiceId} уже оплачен`,
                    checkedInvoices: 1,
                    updatedInvoices: 0
                };
            }
            const paymentInfo = await yumoneyOAuthService.checkPaymentByLabel(invoice.payment_label);
            if (paymentInfo && paymentInfo.status === 'success') {
                console.log(`✅ Найден оплаченный платеж для счета ${invoice.id}:`, paymentInfo);
                const updateResult = await updateInvoicePaymentStatus({
                    invoiceId: invoice.id,
                    paymentId: paymentInfo.operation_id,
                    amount: paymentInfo.amount,
                    currency: paymentInfo.currency,
                    paymentMethod: 'OAuth2 API',
                    paymentDate: paymentInfo.datetime,
                    sender: paymentInfo.sender || 'Unknown',
                    operationId: paymentInfo.operation_id,
                    label: invoice.payment_label
                });
                if (updateResult.success) {
                    return {
                        success: true,
                        message: `Счет ${invoiceId} обновлен: pending → paid`,
                        checkedInvoices: 1,
                        updatedInvoices: 1
                    };
                }
                else {
                    return {
                        success: false,
                        message: `Ошибка обновления: ${updateResult.error}`,
                        checkedInvoices: 1,
                        updatedInvoices: 0
                    };
                }
            }
            else {
                return {
                    success: true,
                    message: `Платеж для счета ${invoiceId} не найден или в обработке`,
                    checkedInvoices: 1,
                    updatedInvoices: 0
                };
            }
        }
        catch (error) {
            console.error(`❌ Ошибка проверки счета ${invoiceId}:`, error);
            return {
                success: false,
                message: `Ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`,
                checkedInvoices: 0,
                updatedInvoices: 0
            };
        }
    }
}
export default new PaymentChecker();
//# sourceMappingURL=paymentChecker.js.map