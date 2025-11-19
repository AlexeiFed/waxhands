/**
 * Тестовый скрипт для проверки исправленной подписи Robokassa
 * Проверяет правильность расчета подписи согласно документации
 */

const crypto = require('crypto');

// Конфигурация из .env
const config = {
    merchantLogin: 'waxhands.ru',
    password1: 'yXox7Ev0P3XPK3Xj4vnD',
    password2: 'P4N8veI4JYRFCdxk7Br5',
    testMode: false
};

// Тестовые данные
const testData = {
    invoiceId: 'test-invoice-123',
    amount: 1000.00,
    masterClassName: 'Тестовый мастер-класс'
};

console.log('🧪 Тестирование исправленной подписи Robokassa');
console.log('📋 Конфигурация:', {
    merchantLogin: config.merchantLogin,
    testMode: config.testMode,
    password1Length: config.password1.length,
    password2Length: config.password2.length
});

console.log('📋 Тестовые данные:', testData);

// Создаем уникальный ID счета
const baseId = parseInt(testData.invoiceId.replace(/-/g, '').substring(0, 10), 16) || 12345;
const invId = baseId + Date.now() % 1000000;
const outSum = testData.amount.toFixed(2);

console.log('🔢 Сгенерированные значения:', {
    invId,
    outSum
});

// ИСПРАВЛЕННАЯ подпись согласно документации Robokassa
// Формат: MerchantLogin:OutSum:InvId:Пароль#1
const signatureString = `${config.merchantLogin}:${outSum}:${invId}:${config.password1}`;
const signature = crypto.createHash('md5').update(signatureString).digest('hex');

console.log('🔍 Подпись для расчета:', signatureString);
console.log('🔐 Полученная подпись:', signature);

// Проверяем подпись для ResultURL
// Формат: OutSum:InvId:Password2
const resultSignatureString = `${outSum}:${invId}:${config.password2}`;
const resultSignature = crypto.createHash('md5').update(resultSignatureString).digest('hex').toUpperCase();

console.log('🔍 Подпись для ResultURL:', resultSignatureString);
console.log('🔐 Подпись ResultURL:', resultSignature);

// Проверяем подпись для SuccessURL
// Формат: OutSum:InvId:Password1
const successSignatureString = `${outSum}:${invId}:${config.password1}`;
const successSignature = crypto.createHash('md5').update(successSignatureString).digest('hex').toUpperCase();

console.log('🔍 Подпись для SuccessURL:', successSignatureString);
console.log('🔐 Подпись SuccessURL:', successSignature);

// Создаем URL для тестирования
const testUrl = `https://auth.robokassa.ru/Merchant/Index.aspx?` +
    `MerchantLogin=${config.merchantLogin}&` +
    `OutSum=${outSum}&` +
    `InvId=${invId}&` +
    `Description=${encodeURIComponent(`Мастер-класс "${testData.masterClassName}"`)}&` +
    `SignatureValue=${signature}&` +
    `Culture=ru&` +
    `Encoding=utf-8` +
    (config.testMode ? '&IsTest=1' : '');

console.log('🔗 Тестовый URL для оплаты:');
console.log(testUrl);

console.log('\n✅ Тест завершен. Проверьте URL в браузере для тестирования оплаты.');
