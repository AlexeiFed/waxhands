require('dotenv').config();

const yumoneyOAuthService = require('./services/yumoneyOAuthService.js');

async function checkPayment() {
    try {
        console.log('🔍 Проверяем платеж через OAuth2...');
        
        const label = 'INV-87af4bc1-d87e-4508-b874-64b3303592c7-1756277500';
        const result = await yumoneyOAuthService.checkPaymentByLabel(label);
        
        console.log('Результат проверки:', JSON.stringify(result, null, 2));
        
        if (result && result.status === 'success') {
            console.log('✅ Платеж найден и оплачен!');
        } else {
            console.log('❌ Платеж не найден или еще в обработке');
        }
        
    } catch (error) {
        console.error('❌ Ошибка проверки:', error);
    }
}

checkPayment();
