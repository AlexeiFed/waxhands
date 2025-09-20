Холдирование и предавторизация
Холдирование или предавторизация это отложенная оплата товара или услуги. Так же ее называют двухстадийной оплатой. Средства на карте покупателя сначала холдируются (резервируются), а списываются по запросу продавца.

Внимание!
Данная услуга доступна только по предварительному согласованию.
Функционал доступен только при использовании банковских карт.

Холдирование средств
В случае, если магазину необходимо иметь возможность холдирования денежных средств — проведение операции делится на два этапа.

На первом этапе пользователь производит обычный платеж по выставленному счету, но в отличие от обычного платежа в запросе на холдирование передается дополнительный параметр StepByStep со значением true. Параметр включается в строку для расчета сигнатуры MerchantLogin:OutSum:InvoiceId:Receipt:true:Пароль#1

Максимальный срок на который могут быть захолдированы средства составляет 7 дней, после чего операция будет отменена .

Пример запроса на холдирование средств
html

  
1
2
3
4
5
6
7
8
9
  
            <form method = "POST"  action = "https://auth.robokassa.ru/Merchant/Index.aspx?">
              <input type = "hidden" name = "MerchantLogin" value = "robo-demo-test">
              <input type = "hidden" name = "InvoiceID" value = "1570">
	      <input type = "hidden" name = "OutSum" value = "1">
              <input type = "hidden" name = "Receipt" value = "%7B%22items%22%3A%5B%7B%22name%22%3A%22%D0%A2%D0%B5%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B9+%D1%82%D0%BE%D0%B2%D0%B0%D1%80%22%2C%22quantity%22%3A1%2C%22sum%22%3A1%2C%22payment_method%22%3A%22full_payment%22%2C%22payment_object%22%3A%22payment%22%2C%22tax%22%3A%22none%22%7D%5D%7D">
              <input type = "hidden" name = "StepByStep" value = "true">
              <input type = "hidden" name = "SignatureValue" value = "1ec0b427f1b9e27a9204c9140f2d4925">
              <input type = "submit" value = "Оплатить">
            </form>
            
Уведомление об успешной предавторизации можно получить только используя запрос ResultURL2

Подтверждение списания
На втором этапе магазин производит подтверждение списания либо отмену холдирования.

Для подтверждения списания отправляется запрос на адрес:
https://auth.robokassa.ru/Merchant/Payment/Confirm

В запросе на подтвреждение списания передаются стандартные параметры как при запросе на оплату. В рассчет сигнатуры включаются параметры MerchantLogin:OutSum:InvoiceId:Пароль#1. Запрос на списание может быть выполнен только один раз.

Пример запроса на списание средств
html

  
1
2
3
4
5
6
7

            <form method = "POST"  action = "https://auth.robokassa.ru/Merchant/Payment/Confirm">
              <input type = "hidden" name = "MerchantLogin" value = "robo-demo-test">
              <input type = "hidden" name = "InvoiceID" value = "1570">
              <input type = "hidden" name = "SignatureValue" value = "ad89c98c9f3fe67d05710a3c24c7f985">
              <input type = "hidden" name = "OutSum" value = "1">
              <input type = "submit" value = "Подтвердить списание">
            </form>
            
Вы можете изменить состав корзины в запросе на списание. Для этого просто включите измененный список товаров в параметр Receipt при отправке запроса на списание

Внимание!
В данном случае параметр Receipt учитывается при расчете контрольной суммы. База для расчета контрольной суммы выглядит следующим образом MerchantLogin:OutSum:InvoiceId:Receipt:Пароль#1

Пример запроса на списание средств с передачей параметра Receipt
html

  
1
2
3
4
5
6
7
8

            <form method = "POST"  action = "https://auth.robokassa.ru/Merchant/Payment/Confirm">
              <input type = "hidden" name = "MerchantLogin" value = "robo-demo-test">
              <input type = "hidden" name = "InvoiceID" value = "1570">
	      <input type = "hidden" name = "Receipt" value = "%7B%22items%22%3A%5B%7B%22name%22%3A%22%D0%98%D0%B7%D0%BC%D0%B5%D0%BD%D0%B5%D0%BD%D0%BD%D1%8B%D0%B9+%D1%82%D0%B5%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B9+%D1%82%D0%BE%D0%B2%D0%B0%D1%80%22%2C%22quantity%22%3A1%2C%22sum%22%3A1%2C%22payment_method%22%3A%22full_payment%22%2C%22payment_object%22%3A%22payment%22%2C%22tax%22%3A%22none%22%7D%5D%7D">
              <input type = "hidden" name = "SignatureValue" value = "5a31f19aea789e99fe74b5f7f34e70c9">
              <input type = "hidden" name = "OutSum" value = "1">
              <input type = "submit" value = "Подтвердить списание">
            </form>
            
После успешной оплаты произойдет оповещение об оплате на ResultURL. Так же, если необходимо, Вы можете использовать дополнительное оповещение об оплате на ResultURL2.

Отмена холдирования
В случае, если требуется отмена холдирования средств магазин отправляет запрос на адрес:

https://auth.robokassa.ru/Merchant/Payment/Cancel

Пример запроса на отмену холдирования
html

  
1
2
3
4
5
6
7

            <form method = "POST"  action = "https://auth.robokassa.ru/Merchant/Payment/Cancel">
              <input type = "hidden" name = "MerchantLogin" value = "robo-demo-test">
              <input type = "hidden" name = "InvoiceID" value = "1570">
              <input type = "hidden" name = "SignatureValue" value = "79e96aa6769842e47832f0fcb9332f46">
              <input type = "hidden" name = "OutSum" value = "1">
              <input type = "submit" value = "Отменить списание">
            </form>
           
При расчете сигнатуры в этом случае не учитывается значение параметра OutSum. Строка выглядит следующим образом MerchantLogin::InvoiceId:Пароль#1