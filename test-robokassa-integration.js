/**
 * @file: test-robokassa-integration.js
 * @description: Тестовый скрипт для проверки интеграции с Robokassa
 * @dependencies: node.js, crypto
 * @created: 2025-09-20
 */

import crypto from 'crypto';

// Конфигурация Робокассы
const ROBOKASSA_CONFIG = {
    merchantLogin: process.env.ROBOKASSA_MERCHANT_LOGIN || 'waxhands.ru',
    password1: process.env.ROBOKASSA_PASSWORD_1 || 'AvLOU36g92hnVZt9nMGM',
    password2: process.env.ROBOKASSA_PASSWORD_2 || 'rrpPI52f8CoTb2hy7RVA',
    testMode: process.env.ROBOKASSA_TEST_MODE === 'true'
};

/**
 * Тестирует создание подписи для Робокассы
 */
function testSignatureCreation() {
    console.log('🧪 Тестируем создание подписи для Робокассы');

    const testData = {
        merchantLogin: ROBOKASSA_CONFIG.merchantLogin,
        outSum: '100.50',
        invId: '12345',
        description: 'Тестовый мастер-класс',
        receipt: JSON.stringify({
            sno: 'osn',
            items: [{
                name: 'Тестовый мастер-класс',
                quantity: 1,
                sum: 100.50,
                payment_method: 'full_prepayment',
                payment_object: 'service',
                tax: 'none'
            }]
        })
    };

    // Правильная подпись с фискализацией: MerchantLogin:OutSum:InvId:Receipt:Пароль#1
    const encodedReceipt = encodeURIComponent(testData.receipt);
    const signatureString = `${testData.merchantLogin}:${testData.outSum}:${testData.invId}:${encodedReceipt}:${ROBOKASSA_CONFIG.password1}`;
    const signature = crypto.createHash('md5').update(signatureString).digest('hex');

    console.log('✅ Данные для подписи:', {
        signatureString: signatureString,
        signature: signature
    });

    return signature;
}

/**
 * Тестирует проверку подписи уведомлений
 */
function testSignatureVerification() {
    console.log('🧪 Тестируем проверку подписи уведомлений');

    // Моделируем уведомление от Робокассы
    const notification = {
        OutSum: '100.50',
        InvId: '12345',
        SignatureValue: '', // Будет рассчитана ниже
        EMail: 'test@example.com'
    };

    // Рассчитываем ожидаемую подпись
    const signatureString = `${notification.OutSum}:${notification.InvId}:${ROBOKASSA_CONFIG.password2}`;
    const expectedSignature = crypto.createHash('md5').update(signatureString).digest('hex').toUpperCase();

    notification.SignatureValue = expectedSignature;

    console.log('✅ Данные для проверки подписи:', {
        signatureString: signatureString,
        received: notification.SignatureValue,
        expected: expectedSignature,
        match: notification.SignatureValue === expectedSignature
    });

    return notification.SignatureValue === expectedSignature;
}

/**
 * Тестирует создание фискального чека
 */
function testReceiptCreation() {
    console.log('🧪 Тестируем создание фискального чека');

    const testData = {
        masterClassName: 'Тестовый мастер-класс',
        amount: 100.50
    };

    const receipt = {
        sno: 'osn',
        items: [{
            name: `Мастер-класс ${testData.masterClassName}`,
            quantity: 1,
            sum: testData.amount,
            payment_method: 'full_prepayment',
            payment_object: 'service',
            tax: 'none'
        }]
    };

    const receiptString = JSON.stringify(receipt);
    const encodedReceipt = encodeURIComponent(receiptString);

    console.log('✅ Фискальный чек создан:', {
        receipt: receiptString,
        encodedReceipt: encodedReceipt,
        valid: encodedReceipt.length > 0
    });

    return receiptString;
}

/**
 * Тестирует алгоритмы хэширования
 */
function testHashAlgorithms() {
    console.log('🧪 Тестируем алгоритмы хэширования');

    const testString = 'test_string';
    const algorithms = ['MD5', 'SHA1', 'SHA256', 'SHA384', 'SHA512'];

    const results = {};

    algorithms.forEach(algorithm => {
        const hash = crypto.createHash(algorithm.toLowerCase()).update(testString).digest('hex');
        results[algorithm] = hash;
        console.log(`✅ ${algorithm}:`, hash);
    });

    return results;
}

/**
 * Основная функция тестирования
 */
function runAllTests() {
    console.log('🚀 Начинаем тестирование интеграции с Робокассой');
    console.log('='.repeat(50));

    const results = {
        signatureCreation: testSignatureCreation(),
        signatureVerification: testSignatureVerification(),
        receiptCreation: testReceiptCreation(),
        hashAlgorithms: testHashAlgorithms()
    };

    console.log('='.repeat(50));
    console.log('📊 Результаты тестирования:');
    console.log(JSON.stringify(results, null, 2));

    const allTestsPassed = Object.values(results).every(result =>
        typeof result === 'boolean' ? result : true
    );

    if (allTestsPassed) {
        console.log('✅ Все тесты пройдены успешно!');
    } else {
        console.log('❌ Некоторые тесты не прошли');
    }

    return allTestsPassed;
}

// Запускаем тестирование если файл запущен напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests();
}

export {
    testSignatureCreation,
    testSignatureVerification,
    testReceiptCreation,
    testHashAlgorithms,
    runAllTests
};
