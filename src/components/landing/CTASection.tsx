/**
 * @file: CTASection.tsx
 * @description: Секция призыва к действию для лендинга
 * @dependencies: Button, useNavigate
 * @created: 2024-12-25
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Hand, Star, Users, Phone, Mail, MapPin, Instagram, Car } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useContacts } from '@/hooks/use-contacts';

export const CTASection: React.FC = () => {
    const navigate = useNavigate();
    const { data: contacts, loading: contactsLoading } = useContacts();

    return (
        <section className="py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Основной CTA */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
                        Готовы создать что-то особенное?
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
                        Присоединяйтесь к нашему удивительному миру творчества и создайте
                        уникальный сувенир, который будет радовать вас долгие годы!
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button
                            onClick={() => navigate('/register')}
                            size="lg"
                            className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                        >
                            <Hand className="w-6 h-6 mr-2" />
                            Записаться на мастер-класс
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>

                        <Button
                            variant="outline"
                            size="lg"
                            onClick={() => document.getElementById('contacts')?.scrollIntoView({ behavior: 'smooth' })}
                            className="border-2 border-orange-300 text-orange-600 hover:bg-orange-50 px-8 py-4 text-lg font-semibold rounded-xl"
                        >
                            <Phone className="w-5 h-5 mr-2" />
                            Связаться с нами
                        </Button>
                    </div>
                </div>

                {/* Преимущества */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    <Card className="text-center bg-white/80 backdrop-blur-sm border-2 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                        <CardContent className="p-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Star className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-yellow-600 mb-3">Уникальный опыт</h3>
                            <p className="text-blue-700">
                                Создайте неповторимый сувенир, который будет радовать вас и ваших близких
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="text-center bg-white/80 backdrop-blur-sm border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                        <CardContent className="p-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-purple-600 mb-3">Для всей семьи</h3>
                            <p className="text-green-700">
                                Подходит для детей и взрослых любого возраста. Отличный способ провести время вместе
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="text-center bg-white/80 backdrop-blur-sm border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                        <CardContent className="p-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Hand className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-blue-600 mb-3">Быстро и просто</h3>
                            <p className="text-orange-700">
                                Всего за 45 минут вы получите готовый сувенир. Никаких сложных навыков не требуется
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Контактная информация */}
                <div id="contacts" className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border-2 border-orange-200 shadow-xl">
                    <h3 className="text-3xl font-bold text-center text-gray-900 mb-8">
                        Свяжитесь с нами
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Телефон */}
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4" style={{ animation: 'float 3s ease-in-out infinite' }}>
                                <Phone className="w-8 h-8 text-white" />
                            </div>
                            <h4 className="text-xl font-semibold text-gray-900 mb-2">Телефон</h4>
                            <p className="text-gray-600 mb-4">
                                {contactsLoading ? 'Загрузка...' : contacts?.phone || '8-914-545-06-06'}
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-green-300 text-green-600 hover:bg-green-50"
                                onClick={() => window.open(`tel:${contacts?.phone || '89145450606'}`)}
                            >
                                Позвонить
                            </Button>
                        </div>

                        {/* Email */}
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4" style={{ animation: 'float 4.2s ease-in-out infinite 0.8s' }}>
                                <Mail className="w-8 h-8 text-white" />
                            </div>
                            <h4 className="text-xl font-semibold text-gray-900 mb-2">Email</h4>
                            <p className="text-gray-600 mb-4">
                                {contactsLoading ? 'Загрузка...' : contacts?.email || 'pavelt80@mail.ru'}
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-blue-300 text-blue-600 hover:bg-blue-50"
                                onClick={() => window.open(`mailto:${contacts?.email || 'pavelt80@mail.ru'}`)}
                            >
                                Написать
                            </Button>
                        </div>

                        {/* Социальные сети */}
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4" style={{ animation: 'float 2.8s ease-in-out infinite 1.5s' }}>
                                <Instagram className="w-8 h-8 text-white" />
                            </div>
                            <h4 className="text-xl font-semibold text-gray-900 mb-2">Социальные сети</h4>
                            <p className="text-gray-600 mb-4">@voskovye.ruchki</p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-pink-300 text-pink-600 hover:bg-pink-50"
                                onClick={() => window.open('https://instagram.com/voskovye.ruchki', '_blank')}
                            >
                                Подписаться
                            </Button>
                        </div>
                    </div>

                    {/* Дополнительная информация */}
                    <div className="mt-8 pt-8 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="text-center">
                                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4" style={{ animation: 'float 3.5s ease-in-out infinite 0.3s' }}>
                                    <Car className="w-6 h-6 text-white" />
                                </div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-3">Выездные мастер-классы</h4>
                                <p className="text-gray-600">
                                    ВЫЕЗЖАЕМ НА ЛЮБОЕ МЕРОПРИЯТИЕ<br />
                                    В школу, детский сад, на праздник
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4" style={{ animation: 'float 4.8s ease-in-out infinite 2.1s' }}>
                                    <Star className="w-6 h-6 text-white" />
                                </div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-3">Запись на мастер-класс</h4>
                                <p className="text-gray-600">
                                    Рекомендуем записываться заранее.<br />
                                    Возможна запись на удобное для вас время.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
