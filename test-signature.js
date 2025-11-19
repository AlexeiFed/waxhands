const crypto = require('crypto');

const merchantLogin = 'waxhands.ru';
const outSum = '5.00';
const invId = '1758712128678';
const receipt = '{"sno":"osn","items":[{"name":"Мастер-класс \"Восковая ручка\"","quantity":1,"sum":5,"cost":5,"payment_method":"full_prepayment","payment_object":"service","tax":"none"}]}';
const receiptUrlEncoded = encodeURIComponent(receipt);
const password1 = 'yXox7Ev0P3XPK3Xj4vnD';
const shpParams = ['Shp_invoice_id=b0f784fa-a439-49dc-a5ec-8ed1471654e4', 'Shp_participant=Павел  Тырин (1 детей)'];
const shpString = shpParams.join(':');
const signatureString = `${merchantLogin}:${outSum}:${invId}:${receiptUrlEncoded}:${password1}:${shpString}`;
const signature = crypto.createHash('md5').update(signatureString).digest('hex');

console.log('Подпись:', signature);
console.log('Строка:', signatureString);
console.log('Ожидаемая:', '44515b95efd1e5f3eef11fb4ddebe7e4');

