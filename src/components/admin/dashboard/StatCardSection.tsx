/**
 * @file: StatCardSection.tsx
 * @description: Компонент для отображения секции статистических карточек с возможностью сворачивания
 * @dependencies: React, lucide-react, utils, ui/card
 * @created: 2025-11-10
 */

import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface StatCardDefinition {
    id: string;
    element: React.ReactNode;
}

interface StatCardSectionProps {
    title: string;
    subtitle: string;
    isSmallScreen: boolean;
    cards: StatCardDefinition[];
    statsExpanded: boolean;
    onToggle: () => void;
}

export function StatCardSection({
    title,
    subtitle,
    isSmallScreen,
    cards,
    statsExpanded,
    onToggle,
}: StatCardSectionProps) {
    const visibleCards = isSmallScreen && !statsExpanded ? cards.slice(0, 3) : cards;

    return (
        <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                    <p className="text-sm text-gray-600">{subtitle}</p>
                </div>
                {isSmallScreen && cards.length > 3 && (
                    <button
                        onClick={onToggle}
                        className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                        type="button"
                    >
                        {statsExpanded ? (
                            <>
                                Скрыть <ChevronUp className="h-4 w-4" />
                            </>
                        ) : (
                            <>
                                Все ({cards.length}) <ChevronDown className="h-4 w-4" />
                            </>
                        )}
                    </button>
                )}
            </div>

            <div className={cn(
                "grid gap-4",
                isSmallScreen
                    ? "grid-cols-1"
                    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            )}>
                {visibleCards.map((card) => (
                    <React.Fragment key={card.id}>
                        {card.element}
                    </React.Fragment>
                ))}
            </div>

            {isSmallScreen && !statsExpanded && cards.length > 3 && (
                <p className="text-center text-xs text-gray-500 py-1">
                    Нажмите «Все ({cards.length})» чтобы увидеть остальные карточки
                </p>
            )}
        </section>
    );
}








