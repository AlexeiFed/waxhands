Формирование второго чека
В связи с переходом на новый формат передачи фискальных данных в ФНС (формат 1.1), магазины осуществляющие расчеты с признаками способа расчета «аванс», «предоплата», «предоплата 100%» обязаны после доставки товаров (оказания услуг) выдавать покупателю итоговый кассовый чек на общую сумму всех внесенных покупателем авансовых платежей (предоплат).

Для этого мы реализовали возможность сформировать итоговый кассовый чек, с признаком способа расчёта «полный расчёт».

Внимание!
Сервис актуален только для магазинов/партнеров, принимающих платежи и осуществляющих фискализацию через Robokassa.

Сервис бесплатный (но можно выбить максимум 2 чека по одной операции).

Для второго (итогового) чека параметр payment_method может принимать только значение full_payment.

В параметре operation передается значение sell, другие варианты игнорируются.

Пример запроса
Основные параметры запроса соответствуют параметрам первого фискального чека. Помимо этого необходимо добавить дополнительные обязательные параметры.

Json


1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
26
27
28
29
30
31
32
33
34
35
36
37

              
              {
                "merchantId": "robokassa_sell",
                "id": "14",
                "originId": "13",
                "operation": "sell",
                "sno": "osn",
                "url": "https://www.robokassa.ru/",
                "total": 100,
                "items": [
                  {
                    "name": "Товар",
                    "quantity": 1,
                    "sum": 100,
                    "tax": "none",
                    "payment_method": "full_payment",
                    "payment_object": "commodity",
                    "nomenclature_code": "04620034587217"
                  }
                ],
                "client": {
                  "email": "test@test.ru",
                  "phone": "71234567890"
                },
                "payments": [
                  {
                    "type": 2,
                    "sum": 100
                  }
                ],
                "vats": [
                  {
                    "type": "none",
                    "sum": 0
                  }
                ]
              }
              
            

развернуть
Описание параметров

Параметр

Значение

MerchantID
Идентификатор магазина в Robokassa, который Вы придумали при создании магазина.

ID
Номер заказа магазина (не должен совпадать с OriginId). Значение только целое число.

OriginId
Номер заказа магазина (InvId), по которому уже есть чек и для которого выбивается второй чек. Значение только целое число.

Operation
Тип чека. Может принимать только одно значение Sell.

URL
Адрес сайта, на котором осуществлена продажа.

Total
Итоговая сумма чека в рублях. Десятичное положительное число: целая часть не более 8 знаков, дробная часть не более 2 знаков.

Client
Данные о покупателе. Содержит любое из полей или все поля одновременно.

Включает строки:

email
Эл. почта покупателя.

phone
Телефон покупателя.

Payments
Тип и сумма платежа или чека.

Включает строки:

Type
Тип платежа. Должен принимать значение: «2» – предварительная оплата (зачет аванса и (или) предыдущих платежей).

Sum
Сумма платежа. Десятичное положительное число: целая часть не более 8 знаков, дробная часть не более 2 знаков.

Vats
Тип и сумма налога.

Применяется со значениями Type и Sum:

Type
Налоговая ставка в ККТ. Определяется для каждого вида товара по отдельности, но за все единицы конкретного товара вместе.

Допустимые значение параметра Type:

none
Без НДС

vat0
НДС по ставке 0%

vat10
НДС чека по ставке 10%

vat110
НДС чека по расчетной ставке 10/110

vat20
НДС чека по ставке 20%

vat120
НДС чека по расчетной ставке 20/120

vat5
НДС чека по ставке 5%

vat7
НДС чека по ставке 7%

vat105
НДС чека по расчетной ставке 5/105

vat107
НДС чека по расчетной ставке 7/107

Sum
Сумма налога, посчитанная исходя из налоговой ставки. Определяется для каждого вида товара по отдельности, но за все единицы конкретного товара вместе. Десятичное положительное число: целая часть не более 8 знаков, дробная часть не более 2 знаков.

Формирование запроса в BASE64URL для второго чека
1
Взять весь запрос и при помощи кодировщика закодировать в base64.

eyJtZXJjaGFudElkIjogInJvYm9rYXNzYV9zZWxsIiwiaWQiOiAiMTQiLCJvcmlnaW5JZCI6ICIxMyIsIm9wZXJhdGlvbiI6ICJzZWxsIiwKInNubyI6ICJvc24iLCJ1cmwiOiAiaHR0cHM6Ly93d3cucm9ib2thc3NhLnJ1LyIsInRvdGFsIjogMTAwLCJpdGVtcyI6IFt7Im5hbWUiOiAi0KLQvtCy0LDRgCIsInF1YW50aXR5IjogMSwic3VtIjogMTAwLCJ0YXgiOiAibm9uZSIsInBheW1lbnRfbWV0aG9kIjogImZ1bGxfcGF5bWVudCIsInBheW1lbnRfb2JqZWN0IjogImNvbW1vZGl0eSJ9XSwiY2xpZW50IjogeyJlbWFpbCI6ICJ0ZXN0QHRlc3QucnUiLCJwaG9uZSI6ICI3MTIzNDU2Nzg5MCJ9LCJwYXltZW50cyI6IFt7InR5cGUiOiAyLCJzdW0iOiAxMDB9XSwidmF0cyI6IFt7InR5cGUiOiAibm9uZSIsInN1bSI6IDB9XX0
После перекодирования нужно стереть все знаки =, если имеются.

2
Создаем Signature : для этого берем созданный запрос в base64 и приписываем к нему Пароль#1 магазина. Например, robokassatest

eyJtZXJjaGFudElkIjogInJvYm9rYXNzYV9zZWxsIiwiaWQiOiAiMTQiLCJvcmlnaW5JZCI6ICIxMyIsIm9wZXJhdGlvbiI6ICJzZWxsIiwKInNubyI6ICJvc24iLCJ1cmwiOiAiaHR0cHM6Ly93d3cucm9ib2thc3NhLnJ1LyIsInRvdGFsIjogMTAwLCJpdGVtcyI6IFt7Im5hbWUiOiAi0KLQvtCy0LDRgCIsInF1YW50aXR5IjogMSwic3VtIjogMTAwLCJ0YXgiOiAibm9uZSIsInBheW1lbnRfbWV0aG9kIjogImZ1bGxfcGF5bWVudCIsInBheW1lbnRfb2JqZWN0IjogImNvbW1vZGl0eSJ9XSwiY2xpZW50IjogeyJlbWFpbCI6ICJ0ZXN0QHRlc3QucnUiLCJwaG9uZSI6ICI3MTIzNDU2Nzg5MCJ9LCJwYXltZW50cyI6IFt7InR5cGUiOiAyLCJzdW0iOiAxMDB9XSwidmF0cyI6IFt7InR5cGUiOiAibm9uZSIsInN1bSI6IDB9XX0robokassatest
3
Теперь из полученной конструкции необходимо создать hash в соответствии с тем, что выбрано у магазина в Технических настройках (md5 или другое):

3001586201143da4232896c44244bdbb
4
Чтобы собрать финальный запрос, который отправляется уже на URL для выбивания чека, необходимо полученный md5 снова зашифровать в base64:

MzAwMTU4NjIwMTE0M2RhNDIzMjg5NmM0NDI0NGJkYmI=
После перекодирования нужно стереть все знаки =, если имеются.

5
Для завершения сборки запроса к URL, на котором выбивается чек, берем изначальное тело запроса в base64, ставим точку и приписываем полученный чуть выше signature от md5 в base64:

eyJtZXJjaGFudElkIjogInJvYm9rYXNzYV9zZWxsIiwiaWQiOiAiMTQiLCJvcmlnaW5JZCI6ICIxMyIsIm9wZXJhdGlvbiI6ICJzZWxsIiwKInNubyI6ICJvc24iLCJ1cmwiOiAiaHR0cHM6Ly93d3cucm9ib2thc3NhLnJ1LyIsInRvdGFsIjogMTAwLCJpdGVtcyI6IFt7Im5hbWUiOiAi0KLQvtCy0LDRgCIsInF1YW50aXR5IjogMSwic3VtIjogMTAwLCJ0YXgiOiAibm9uZSIsInBheW1lbnRfbWV0aG9kIjogImZ1bGxfcGF5bWVudCIsInBheW1lbnRfb2JqZWN0IjogImNvbW1vZGl0eSJ9XSwiY2xpZW50IjogeyJlbWFpbCI6ICJ0ZXN0QHRlc3QucnUiLCJwaG9uZSI6ICI3MTIzNDU2Nzg5MCJ9LCJwYXltZW50cyI6IFt7InR5cGUiOiAyLCJzdW0iOiAxMDB9XSwidmF0cyI6IFt7InR5cGUiOiAibm9uZSIsInN1bSI6IDB9XX0.MzAwMTU4NjIwMTE0M2RhNDIzMjg5NmM0NDI0NGJkYmI
После перекодирования нужно стереть все знаки =, если имеются.

6
Отправьте этот запрос. Отправка должна быть методом POST на URL:

https://ws.roboxchange.com/RoboFiscal/Receipt/Attach
Если все правильно сформировали, то должны получить ответ вида:

Json

  
1
2
3
4
  
              
              {
                "ResultCode": "0",
                "ResultDescription": "ok"
              }
              
            
Описание параметров

Параметр

Значение

ResultСode
Статус получения данных от Клиента.

Возможные значения:

1
Ожидание регистрации

2
Чек зарегистрирован

3
Ошибка регистрации чека

1000
Внутренняя ошибка запроса

ResultDescription
Описание результата обработки чека.

OpKey
Идентификатор операции.

Получение статуса чека
Для того чтобы узнать результат формирования фискального чека, необходимо создать запрос в кодировке UTF8:

Json

  
1
2
3
4
  
              
                {
                  "merchantId": "robokassa_state",
                  "id": "34"
                }
              
            
Описание параметров

Параметр

Значение

MerchantId
Идентификатор магазина, который вы придумали при создании магазина

id
Идентификатор операции

Затем аналогичным способом вычислить параметр Signatureи сформировать полноценный запрос на статус чека из первоначального тела запроса в base64.

URL отправки запроса методом POST

https://ws.roboxchange.com/RoboFiscal/Receipt/Status

Если все правильно сформировали, то должны получить ответ вида:

Json

  
1
2
3
4
5
6
7
8
9
  
              
                {
                  "Code": "2",
                  "Description": "Done",
                  "FnNumber": "9289000100348548",
                  "FiscalDocumentNumber": "135771",
                  "FiscalDocumentAttribute": "207899681",
                  "FiscalDate": null,
                  "FiscalType": null
                }
              
            
Описание возвращаемых параметров

Параметр

Значение

Сode
Статус регистрации чека.

Возможные значения:

1
– Ожидание регистрации

2
– Чек зарегистрирован

3
– Ошибка регистрации чека

1000
– Ошибка обработки запроса

Description
Описание результата формирования чека

FnNumber
Номер ФН

FiscalDocumentNumber
Фискальный номер документа

FiscalDocumentAttribute
Фискальный признак документа

FiscalDate
Дата и время формирования фискального чека