/**
 * @file: GuaranteesSection.tsx
 * @description: Раздел гарантий качества и профессионального подхода
 * @dependencies: React, landing-header.tsx
 * @created: 2025-01-18
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    CheckCircle,
    Clock,
    Users,
    Shield,
    Mail,
    FileText,
    RefreshCw,
    Star,
    Phone,
    Heart,
    Award,
    ThumbsUp
} from 'lucide-react';

export const GuaranteesSection: React.FC = () => {
    return (
        <section id="guarantees" className="py-20">
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Заголовок секции */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
                        Наши гарантии
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        Профессиональный подход и качество на каждом этапе
                    </p>
                </div>

                {/* Основные гарантии */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    <Card className="border-2 border-blue-200 hover:shadow-lg transition-all duration-300 rounded-lg overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-blue-100 to-cyan-100">
                            <CardTitle className="flex items-center gap-3 text-blue-800">
                                <Shield className="h-6 w-6" />
                                Качество материалов
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <p className="text-gray-600">
                                Привозим все необходимые материалы и инструменты, реквизит для мастер-класса
                                в надлежащем качестве
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-green-200 hover:shadow-lg transition-all duration-300 rounded-lg overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-green-100 to-emerald-100">
                            <CardTitle className="flex items-center gap-3 text-green-800">
                                <Clock className="h-6 w-6" />
                                Быстрые ответы
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <p className="text-gray-600">
                                Отвечаем на запросы день в день и четко соблюдаем все заявленные сроки
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-purple-200 hover:shadow-lg transition-all duration-300 rounded-lg overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100">
                            <CardTitle className="flex items-center gap-3 text-purple-800">
                                <Users className="h-6 w-6" />
                                Профессиональные мастера
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <p className="text-gray-600">
                                Профессиональные мастера и проверенные подрядчики с многолетним опытом
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-orange-200 hover:shadow-lg transition-all duration-300 rounded-lg overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-orange-100 to-yellow-100">
                            <CardTitle className="flex items-center gap-3 text-orange-800">
                                <Phone className="h-6 w-6" />
                                Поддержка на связи
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <p className="text-gray-600">
                                Менеджер на связи на протяжении всей подготовки к мастер-классу
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-red-200 hover:shadow-lg transition-all duration-300 rounded-lg overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-red-100 to-rose-100">
                            <CardTitle className="flex items-center gap-3 text-red-800">
                                <FileText className="h-6 w-6" />
                                Официальные документы
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <p className="text-gray-600">
                                Заключение договора о предоставлении услуг со всеми гарантиями
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-indigo-200 hover:shadow-lg transition-all duration-300 rounded-lg overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-indigo-100 to-blue-100">
                            <CardTitle className="flex items-center gap-3 text-indigo-800">
                                <RefreshCw className="h-6 w-6" />
                                100% возврат средств
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <p className="text-gray-600">
                                Если мероприятие сорвется по нашей вине, мы гарантируем возврат 100% денежных средств
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Принципы работы */}
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
                    <h3 className="text-2xl font-bold text-center text-gray-800 mb-8">
                        Наши принципы работы
                    </h3>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-3">
                                <Heart className="h-6 w-6 text-red-500" />
                                Честный подход
                            </h4>
                            <p className="text-gray-600 mb-4">
                                Если у Вас возникла сложная ситуация относительно качества выполняемой работы
                                нашими специалистами, то Вы всегда можете написать нашему руководителю
                                <strong> Павлу Тырину</strong> на e-mail:
                                <a href="mailto:pavelt80@mail.ru" className="text-blue-600 hover:underline ml-1">
                                    pavelt80@mail.ru
                                </a>.
                                Ваш вопрос обязательно будет решен.
                            </p>
                            <p className="text-gray-600">
                                Мы мобильны и всегда идем навстречу клиенту в пожеланиях, даже если возникла
                                необходимость что-то оперативно поменять в процессе самого мастер-класса.
                            </p>
                        </div>

                        <div>
                            <h4 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-3">
                                <Award className="h-6 w-6 text-yellow-500" />
                                Профессиональные стандарты
                            </h4>
                            <p className="text-gray-600 mb-4">
                                Наши мастера всегда поддерживают порядок и чистоту – мы придерживаемся принципа
                                <strong> «После нас чище, чем до нас»</strong>.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Стандарты мастеров */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-8">
                    <h3 className="text-xl font-bold text-center text-gray-800 mb-6">
                        Стандарты наших мастеров
                    </h3>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                            <ThumbsUp className="h-5 w-5 text-green-500 flex-shrink-0" />
                            <span className="text-sm text-gray-700">Не разговаривают по телефону</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                            <ThumbsUp className="h-5 w-5 text-green-500 flex-shrink-0" />
                            <span className="text-sm text-gray-700">Не курят</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                            <ThumbsUp className="h-5 w-5 text-green-500 flex-shrink-0" />
                            <span className="text-sm text-gray-700">Не отвлекаются на личные вопросы</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                            <ThumbsUp className="h-5 w-5 text-green-500 flex-shrink-0" />
                            <span className="text-sm text-gray-700">Поддерживают чистоту и порядок</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                            <Star className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                            <span className="text-sm text-gray-700">Профессионалы с многолетним стажем</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                            <Heart className="h-5 w-5 text-red-500 flex-shrink-0" />
                            <span className="text-sm text-gray-700">Всегда позитивны и оптимистичны</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                            <Clock className="h-5 w-5 text-blue-500 flex-shrink-0" />
                            <span className="text-sm text-gray-700">Не опаздывают</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                            <Award className="h-5 w-5 text-purple-500 flex-shrink-0" />
                            <span className="text-sm text-gray-700">Вежливы и тактичны</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
