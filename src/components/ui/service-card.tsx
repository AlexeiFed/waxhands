/**
 * @file: service-card.tsx
 * @description: Карточка услуги с отображением стилей и опций
 * @dependencies: Card, Badge, Button
 * @created: 2024-12-19
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Button } from './button';
import { Service, ServiceStyle, ServiceOption } from '../../types';
import { Edit, Plus, Eye, Trash2 } from 'lucide-react';

interface ServiceCardProps {
    service: Service;
    onEdit?: (service: Service) => void;
    onAddStyle?: (serviceId: string) => void;
    onAddOption?: (serviceId: string) => void;
    onViewStyle?: (style: ServiceStyle, serviceId: string) => void;
    onViewOption?: (option: ServiceOption, serviceId: string) => void;
    onDeleteStyle?: (styleId: string, serviceId: string) => void;
    onDeleteOption?: (optionId: string, serviceId: string) => void;
    onReorderStyles?: (serviceId: string, order: string[]) => void;
    onReorderOptions?: (serviceId: string, order: string[]) => void;
    onDelete?: (serviceId: string) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
    service,
    onEdit,
    onAddStyle,
    onAddOption,
    onViewStyle,
    onViewOption,
    onDeleteStyle,
    onDeleteOption,
    onReorderStyles,
    onReorderOptions,
    onDelete
}) => {
    console.log('ServiceCard: отображение услуги:', service);

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                        <CardDescription className="mt-1">
                            {service.shortDescription}
                        </CardDescription>
                    </div>
                    {onEdit && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(service)}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                    )}
                    {onDelete && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                if (window.confirm(`Вы уверены, что хотите удалить услугу "${service.name}"? Это действие нельзя отменить.`)) {
                                    onDelete(service.id);
                                }
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Удалить услугу"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-4">
                {service.fullDescription && (
                    <p className="text-sm text-muted-foreground">
                        {service.fullDescription}
                    </p>
                )}

                {/* Варианты ручек */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Варианты ручек</h4>
                        {onAddStyle && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onAddStyle(service.id)}
                            >
                                <Plus className="h-3 w-3 mr-1" />
                                Добавить
                            </Button>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {service.styles.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                                Варианты ручек не добавлены
                            </p>
                        ) : (
                            service.styles.map((style, index) => (
                                <div key={style.id} className="flex items-center gap-1">
                                    <Badge
                                        variant="secondary"
                                        className="cursor-pointer hover:bg-secondary/80"
                                        onClick={() => onViewStyle?.(style, service.id)}
                                    >
                                        {style.name}
                                        {style.price > 0 && (
                                            <span className="ml-1 text-xs">
                                                +{style.price}₽
                                            </span>
                                        )}
                                    </Badge>
                                    {/* Кнопки перестановки */}
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="p-0 h-5 w-5"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const prevId = service.styles[index - 1]?.id;
                                                if (!prevId) return;

                                                // Создаем новый массив с правильным порядком
                                                const newOrder = [...service.styles];
                                                const tmp = newOrder[index - 1];
                                                newOrder[index - 1] = newOrder[index];
                                                newOrder[index] = tmp;

                                                // Проверяем валидность перед отправкой
                                                const orderIds = newOrder.map(s => s.id).filter(Boolean);

                                                // Дополнительная проверка: все ли ID существуют в исходном массиве
                                                const originalIds = service.styles.map(s => s.id);
                                                const allIdsValid = orderIds.every(id => originalIds.includes(id));

                                                if (orderIds.length > 0 && orderIds.length === service.styles.length && allIdsValid && onReorderStyles) {
                                                    console.log('Reordering styles left:', {
                                                        fromIndex: index,
                                                        toIndex: index - 1,
                                                        orderIds,
                                                        originalStyles: service.styles.map(s => ({ id: s.id, name: s.name })),
                                                        newOrder: newOrder.map(s => ({ id: s.id, name: s.name })),
                                                        allIdsValid
                                                    });
                                                    onReorderStyles(service.id, orderIds);
                                                } else {
                                                    console.error('Некорректные данные для сортировки стилей:', {
                                                        orderIds,
                                                        originalLength: service.styles.length,
                                                        newLength: orderIds.length,
                                                        allIdsValid,
                                                        originalIds
                                                    });
                                                }
                                            }}
                                            aria-label="Переместить влево"
                                            title="Переместить влево"
                                        >
                                            ◀
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="p-0 h-5 w-5"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const nextId = service.styles[index + 1]?.id;
                                                if (!nextId) return;

                                                // Создаем новый массив с правильным порядком
                                                const newOrder = [...service.styles];
                                                const tmp = newOrder[index + 1];
                                                newOrder[index + 1] = newOrder[index];
                                                newOrder[index] = tmp;

                                                // Проверяем валидность перед отправкой
                                                const orderIds = newOrder.map(s => s.id).filter(Boolean);

                                                // Дополнительная проверка: все ли ID существуют в исходном массиве
                                                const originalIds = service.styles.map(s => s.id);
                                                const allIdsValid = orderIds.every(id => originalIds.includes(id));

                                                if (orderIds.length > 0 && orderIds.length === service.styles.length && allIdsValid && onReorderStyles) {
                                                    console.log('Reordering styles right:', {
                                                        fromIndex: index,
                                                        toIndex: index + 1,
                                                        orderIds,
                                                        originalStyles: service.styles.map(s => ({ id: s.id, name: s.name })),
                                                        newOrder: newOrder.map(s => ({ id: s.id, name: s.name })),
                                                        allIdsValid
                                                    });
                                                    onReorderStyles(service.id, orderIds);
                                                } else {
                                                    console.error('Некорректные данные для сортировки стилей:', {
                                                        orderIds,
                                                        originalLength: service.styles.length,
                                                        newLength: orderIds.length,
                                                        allIdsValid,
                                                        originalIds
                                                    });
                                                }
                                            }}
                                            aria-label="Переместить вправо"
                                            title="Переместить вправо"
                                        >
                                            ▶
                                        </Button>
                                    </div>
                                    {onDeleteStyle && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="p-0 h-auto w-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => {
                                                if (window.confirm(`Вы уверены, что хотите удалить стиль "${style.name}"?`)) {
                                                    onDeleteStyle(style.id, service.id);
                                                }
                                            }}
                                            title="Удалить стиль"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Дополнительные услуги */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Дополнительные услуги</h4>
                        {onAddOption && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onAddOption(service.id)}
                            >
                                <Plus className="h-3 w-3 mr-1" />
                                Добавить
                            </Button>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {service.options.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                                Дополнительные услуги не добавлены
                            </p>
                        ) : (
                            service.options.map((option, index) => (
                                <div key={option.id} className="flex items-center gap-1">
                                    <Badge
                                        variant="outline"
                                        className="cursor-pointer hover:bg-accent"
                                        onClick={() => onViewOption?.(option, service.id)}
                                    >
                                        {option.name}
                                        {option.price > 0 && (
                                            <span className="ml-1 text-xs">
                                                +{option.price}₽
                                            </span>
                                        )}
                                    </Badge>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="p-0 h-5 w-5"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const prevId = service.options[index - 1]?.id;
                                                if (!prevId) return;

                                                // Создаем новый массив с правильным порядком
                                                const newOrder = [...service.options];
                                                const tmp = newOrder[index - 1];
                                                newOrder[index - 1] = newOrder[index];
                                                newOrder[index] = tmp;

                                                // Проверяем валидность перед отправкой
                                                const orderIds = newOrder.map(o => o.id).filter(Boolean);

                                                // Дополнительная проверка: все ли ID существуют в исходном массиве
                                                const originalIds = service.options.map(o => o.id);
                                                const allIdsValid = orderIds.every(id => originalIds.includes(id));

                                                if (orderIds.length > 0 && orderIds.length === service.options.length && allIdsValid && onReorderOptions) {
                                                    console.log('Reordering options left:', {
                                                        fromIndex: index,
                                                        toIndex: index - 1,
                                                        orderIds,
                                                        originalOptions: service.options.map(o => ({ id: o.id, name: o.name })),
                                                        newOrder: newOrder.map(o => ({ id: o.id, name: o.name })),
                                                        allIdsValid
                                                    });
                                                    onReorderOptions(service.id, orderIds);
                                                } else {
                                                    console.error('Некорректные данные для сортировки опций:', {
                                                        orderIds,
                                                        originalLength: service.options.length,
                                                        newLength: orderIds.length,
                                                        allIdsValid,
                                                        originalIds
                                                    });
                                                }
                                            }}
                                            aria-label="Переместить влево"
                                            title="Переместить влево"
                                        >
                                            ◀
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="p-0 h-5 w-5"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const nextId = service.options[index + 1]?.id;
                                                if (!nextId) return;

                                                // Создаем новый массив с правильным порядком
                                                const newOrder = [...service.options];
                                                const tmp = newOrder[index + 1];
                                                newOrder[index + 1] = newOrder[index];
                                                newOrder[index] = tmp;

                                                // Проверяем валидность перед отправкой
                                                const orderIds = newOrder.map(o => o.id).filter(Boolean);

                                                // Дополнительная проверка: все ли ID существуют в исходном массиве
                                                const originalIds = service.options.map(o => o.id);
                                                const allIdsValid = orderIds.every(id => originalIds.includes(id));

                                                if (orderIds.length > 0 && orderIds.length === service.options.length && allIdsValid && onReorderOptions) {
                                                    console.log('Reordering options right:', {
                                                        fromIndex: index,
                                                        toIndex: index + 1,
                                                        orderIds,
                                                        originalOptions: service.options.map(o => ({ id: o.id, name: o.name })),
                                                        newOrder: newOrder.map(o => ({ id: o.id, name: o.name })),
                                                        allIdsValid
                                                    });
                                                    onReorderOptions(service.id, orderIds);
                                                } else {
                                                    console.error('Некорректные данные для сортировки опций:', {
                                                        orderIds,
                                                        originalLength: service.options.length,
                                                        newLength: orderIds.length,
                                                        allIdsValid,
                                                        originalIds
                                                    });
                                                }
                                            }}
                                            aria-label="Переместить вправо"
                                            title="Переместить вправо"
                                        >
                                            ▶
                                        </Button>
                                    </div>
                                    {onDeleteOption && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="p-0 h-auto w-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => {
                                                if (window.confirm(`Вы уверены, что хотите удалить опцию "${option.name}"?`)) {
                                                    onDeleteOption(option.id, service.id);
                                                }
                                            }}
                                            title="Удалить опцию"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};