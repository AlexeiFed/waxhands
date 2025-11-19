/**
 * @file: CTASection.tsx
 * @description: Секция призыва к действию для лендинга
 * @dependencies: Button, useNavigate
 * @created: 2024-12-25
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Hand, Star, Users, Phone, Mail, MapPin, Car } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useContacts } from '@/hooks/use-contacts';
import { ExpandableText } from '@/components/ui/expandable-text';

export const CTASection: React.FC = () => {
    const navigate = useNavigate();
    const { data: contacts, isLoading: contactsLoading } = useContacts();

    return (
        <section className="py-20">
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
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
                            <ExpandableText
                                text="Подходит для детей и взрослых любого возраста. Отличный способ провести время вместе"
                                maxLength={80}
                                className="text-green-700"
                                buttonClassName="text-purple-600 text-sm"
                            />
                        </CardContent>
                    </Card>

                    <Card className="text-center bg-white/80 backdrop-blur-sm border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                        <CardContent className="p-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Hand className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-blue-600 mb-3">Быстро и просто</h3>
                            <ExpandableText
                                text="Всего за 45 минут вы получите готовый сувенир. Никаких сложных навыков не требуется"
                                maxLength={80}
                                className="text-orange-700"
                                buttonClassName="text-blue-600 text-sm"
                            />
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
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4" style={{ animation: 'float 2.8s ease-in-out infinite 1.5s' }}>
                                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1.01-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.271.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.795.780 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z" />
                                </svg>
                            </div>
                            <h4 className="text-xl font-semibold text-gray-900 mb-2">Социальные сети</h4>
                            <p className="text-gray-600 mb-4">@voskovruchkikhab</p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-blue-300 text-blue-600 hover:bg-blue-50"
                                onClick={() => window.open('https://vk.com/voskovruchkikhab', '_blank')}
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
