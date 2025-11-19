/**
 * @file: DeliveryPaymentSection.tsx
 * @description: Раздел о проведении мастер-классов и оплате через Robokassa
 * @dependencies: React, landing-header.tsx
 * @created: 2025-01-18
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, CreditCard, MapPin, Shield, Clock, Users } from 'lucide-react';

export const DeliveryPaymentSection: React.FC = () => {
    return (
        <section id="payment" className="py-20">
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Заголовок секции */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
                        Условия проведения и оплаты
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        Прозрачные условия сотрудничества и безопасная оплата
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-12">
                    {/* Проведение мастер-классов */}
                    <Card className="border-2 border-orange-200 hover:shadow-lg transition-all duration-300 rounded-lg overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-orange-100 to-yellow-100">
                            <CardTitle className="flex items-center gap-3 text-orange-800">
                                <MapPin className="h-6 w-6" />
                                Организация и проведение
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-semibold text-gray-800">Выездные мастер-классы</h4>
                                        <p className="text-gray-600 text-sm">
                                            Мы приезжаем к вам в учреждение со всем необходимым оборудованием и материалами
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Users className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-semibold text-gray-800">Профессиональные мастера</h4>
                                        <p className="text-gray-600 text-sm">
                                            Опытные преподаватели с педагогическим образованием и сертификатами
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Clock className="h-5 w-5 text-purple-500 mt-1 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-semibold text-gray-800">Гибкое расписание</h4>
                                        <p className="text-gray-600 text-sm">
                                            Подстраиваемся под ваше расписание и возможности группы
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Оплата */}
                    <Card className="border-2 border-purple-200 hover:shadow-lg transition-all duration-300 rounded-lg overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100">
                            <CardTitle className="flex items-center gap-3 text-purple-800">
                                <CreditCard className="h-6 w-6" />
                                Безопасная оплата
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Shield className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-semibold text-gray-800">Сервис приема платежей</h4>
                                        <p className="text-gray-600 text-sm">
                                            Безопасная оплата через проверенную платежную систему с SSL-шифрованием
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <CreditCard className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-semibold text-gray-800">Множество способов оплаты</h4>
                                        <p className="text-gray-600 text-sm">
                                            Банковские карты, электронные кошельки, мобильные платежи
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-semibold text-gray-800">Мгновенное подтверждение</h4>
                                        <p className="text-gray-600 text-sm">
                                            Автоматическое подтверждение оплаты и отправка документов
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <CreditCard className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-semibold text-gray-800">Наличная оплата</h4>
                                        <p className="text-gray-600 text-sm">
                                            Возможность оплаты наличными в день проведения мастер-класса
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* FAQ секция */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <h3 className="text-2xl font-bold text-center text-gray-800 mb-8">
                        Часто задаваемые вопросы
                    </h3>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <h4 className="font-semibold text-gray-800 mb-2">
                                    Как подтверждается факт оказания услуги?
                                </h4>
                                <p className="text-gray-600 text-sm">
                                    После проведения мастер-класса мы предоставляем:
                                </p>
                                <ul className="list-disc list-inside text-gray-600 text-sm mt-2 space-y-1">
                                    <li>Акт выполненных работ с подписями</li>
                                    <li>Фотографии процесса проведения</li>
                                    <li>Отзывы участников (при согласии)</li>
                                    <li>Сертификаты участников</li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-semibold text-gray-800 mb-2">
                                    Что если нужно перенести мастер-класс?
                                </h4>
                                <p className="text-gray-600 text-sm">
                                    Перенос возможен за 48 часов до мероприятия без дополнительной платы.
                                    При переносе менее чем за 48 часов взимается 50% от стоимости.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h4 className="font-semibold text-gray-800 mb-2">
                                    Какие документы вы предоставляете?
                                </h4>
                                <p className="text-gray-600 text-sm">
                                    Мы работаем официально и предоставляем:
                                </p>
                                <ul className="list-disc list-inside text-gray-600 text-sm mt-2 space-y-1">
                                    <li>Договор на оказание услуг</li>
                                    <li>Счет на оплату</li>
                                    <li>Акт выполненных работ</li>
                                    <li>Документы для бухгалтерии</li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-semibold text-gray-800 mb-2">
                                    Возможен ли возврат средств?
                                </h4>
                                <p className="text-gray-600 text-sm">
                                    Возврат возможен в случае отмены мастер-класса по нашей вине
                                    или форс-мажорных обстоятельств. Возврат производится в течение 10 рабочих дней.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center mt-12">
                    <div className="bg-gradient-to-r from-orange-500 to-purple-500 text-white rounded-2xl p-8">
                        <h3 className="text-2xl font-bold mb-4">
                            Готовы заказать мастер-класс?
                        </h3>
                        <p className="text-lg mb-6 opacity-90">
                            Для записи на мастер-класс зарегистрируйтесь на сайте и выберите необходимые варианты ручек и дополнительных услуг
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href="/register"
                                className="bg-white text-orange-600 px-8 py-3 rounded-full font-semibold hover:bg-orange-50 transition-colors"
                            >
                                Зарегистрироваться
                            </a>
                            <a
                                href="tel:+7-914-545-06-06"
                                className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-orange-600 transition-colors"
                            >
                                Позвонить нам
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
