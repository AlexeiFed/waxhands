const crypto = require('crypto');

// Пароли из .env
const ROBOKASSA_PASSWORD_1 = 'yXox7Ev0P3XPK3Xj4vnD';

// Данные из логов
const merchantLogin = 'waxhands.ru';
const outSum = '2.00';
const invId = '770734606739';
const invoiceId = 'b37358a5-6cc5-4e0b-ab3c-a3e5eb6e4b70';
const participantName = 'Владимир Сафонов (1 детей)';

console.log('🧪 Тестируем исправленную подпись Robokassa');
console.log('=' .repeat(50));

// СТАРАЯ подпись (БЕЗ shp-параметров) - вызывает ошибку 29
const oldSignatureString = `${merchantLogin}:${outSum}:${invId}:${ROBOKASSA_PASSWORD_1}`;
const oldSignature = crypto.createHash('md5').update(oldSignatureString).digest('hex');

console.log('❌ СТАРАЯ подпись (БЕЗ shp-параметров):');
console.log(`   Строка: ${oldSignatureString}`);
console.log(`   Подпись: ${oldSignature}`);
console.log('');

// НОВАЯ подпись (С shp-параметрами) - должна работать
const shpParams = [
    `Shp_invoice_id=${invoiceId}`,
    `Shp_participant=${participantName}`
];
const newSignatureString = `${merchantLogin}:${outSum}:${invId}:${ROBOKASSA_PASSWORD_1}:${shpParams.join(':')}`;
const newSignature = crypto.createHash('md5').update(newSignatureString).digest('hex');

console.log('✅ НОВАЯ подпись (С shp-параметрами):');
console.log(`   Строка: ${newSignatureString}`);
console.log(`   Подпись: ${newSignature}`);
console.log('');

// Генерируем правильный URL
const description = encodeURIComponent('Мастер-класс "Восковая ручка"');
const shpInvoiceId = encodeURIComponent(invoiceId);
const shpParticipant = encodeURIComponent(participantName);

const correctUrl = `https://auth.robokassa.ru/Merchant/Index.aspx?MerchantLogin=${merchantLogin}&OutSum=${outSum}&InvId=${invId}&Description=${description}&SignatureValue=${newSignature}&Culture=ru&Encoding=utf-8&shp_invoice_id=${shpInvoiceId}&shp_participant=${shpParticipant}`;

console.log('🔗 Правильный URL для тестирования:');
console.log(correctUrl);
console.log('');

console.log('📋 Сравнение:');
console.log(`   Старая подпись: ${oldSignature}`);
console.log(`   Новая подпись:  ${newSignature}`);
console.log(`   Разные: ${oldSignature !== newSignature ? 'ДА' : 'НЕТ'}`);

