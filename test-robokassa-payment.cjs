/**
 * Тестовый скрипт для проверки Robokassa API
 */

const crypto = require('crypto');

// Конфигурация Robokassa
const config = {
    merchantLogin: 'waxhands.ru',
    password1: '05VQ6EQ061SnSBAh8vyg',
    password2: 'jzGU7uFNx4T741Usynxm',
    testMode: false,
    successUrl: 'https://waxhands.ru/payment/robokassa/success',
    failUrl: 'https://waxhands.ru/payment/robokassa/fail',
    resultUrl: 'https://waxhands.ru/api/robokassa/payment-webhook/robokassa',
    algorithm: 'MD5'
};

console.log('🔧 Тестируем Robokassa конфигурацию:');
console.log('MerchantLogin:', config.merchantLogin);
console.log('Password1 length:', config.password1.length);
console.log('Password2 length:', config.password2.length);
console.log('TestMode:', config.testMode);

// Тестовые данные
const testData = {
    amount: 0.01,
    invId: 760123456789, // Тестовый ID счета
    description: 'Тестовый платеж'
};

console.log('\n🔄 Создаем тестовую подпись:');

// Формируем подпись согласно документации
const outSum = testData.amount.toFixed(2);
const signatureString = `${config.merchantLogin}:${outSum}:${testData.invId}:${config.password1}`;

console.log('Строка для подписи:', signatureString);

const signature = crypto.createHash('md5').update(signatureString).digest('hex');
console.log('MD5 подпись:', signature);

// Формируем URL для Robokassa
const robokassaUrl = `https://auth.robokassa.ru/Merchant/Index.aspx?` +
    `MerchantLogin=${config.merchantLogin}&` +
    `OutSum=${outSum}&` +
    `InvId=${testData.invId}&` +
    `Description=${encodeURIComponent(testData.description)}&` +
    `SignatureValue=${signature}&` +
    `Culture=ru&` +
    `Encoding=utf-8`;

console.log('\n🔗 URL для Robokassa:');
console.log(robokassaUrl);

console.log('\n✅ Тест завершен. Проверьте URL в браузере.');
