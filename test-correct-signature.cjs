const crypto = require('crypto');

// Пароли из .env
const ROBOKASSA_PASSWORD_1 = 'yXox7Ev0P3XPK3Xj4vnD';

// Данные из логов
const merchantLogin = 'waxhands.ru';
const outSum = '2.00';
const invId = '770734606739';
const invoiceId = 'b37358a5-6cc5-4e0b-ab3c-a3e5eb6e4b70';
const participantName = 'Владимир Сафонов (1 детей)';

console.log('🧪 Генерируем правильную подпись с shp-параметрами');

// ПРАВИЛЬНАЯ подпись (С shp-параметрами)
const shpParams = [
    `Shp_invoice_id=${invoiceId}`,
    `Shp_participant=${participantName}`
];
const signatureString = `${merchantLogin}:${outSum}:${invId}:${ROBOKASSA_PASSWORD_1}:${shpParams.join(':')}`;
const signature = crypto.createHash('md5').update(signatureString).digest('hex');

console.log('✅ ПРАВИЛЬНАЯ подпись (С shp-параметрами):');
console.log(`   Строка: ${signatureString}`);
console.log(`   Подпись: ${signature}`);
console.log('');

// Генерируем правильный URL
const description = encodeURIComponent('Мастер-класс "Восковая ручка"');
const shpInvoiceId = encodeURIComponent(invoiceId);
const shpParticipant = encodeURIComponent(participantName);

const correctUrl = `https://auth.robokassa.ru/Merchant/Index.aspx?MerchantLogin=${merchantLogin}&OutSum=${outSum}&InvId=${invId}&Description=${description}&SignatureValue=${signature}&Culture=ru&Encoding=utf-8&shp_invoice_id=${shpInvoiceId}&shp_participant=${shpParticipant}`;

console.log('🔗 Правильный URL для тестирования:');
console.log(correctUrl);

