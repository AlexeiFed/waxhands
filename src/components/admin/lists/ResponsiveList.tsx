/**
 * @file: ResponsiveList.tsx
 * @description: Базовый компонент для мобильных списков с поддержкой skeleton/empty состояний
 * @dependencies: React, ResponsiveLayoutContext, shadcn Skeleton
 * @created: 2025-11-10
 */

import React from 'react';
import { useResponsiveLayout } from '@/contexts/ResponsiveLayoutContext';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface ResponsiveListProps<T> {
    items: T[];
    renderItem: (item: T, index: number) => React.ReactNode;
    keyExtractor: (item: T, index: number) => React.Key;
    className?: string;
    isLoading?: boolean;
    loadingCount?: number;
    loadingSkeleton?: React.ReactNode;
    emptyState?: React.ReactNode;
    onRefresh?: () => void;
    header?: React.ReactNode;
    footer?: React.ReactNode;
}

export function ResponsiveList<T>({
    items,
    renderItem,
    keyExtractor,
    className,
    isLoading = false,
    loadingCount = 3,
    loadingSkeleton,
    emptyState,
    header,
    footer
}: ResponsiveListProps<T>) {
    const { isMobile } = useResponsiveLayout();

    const defaultSkeleton = (
        <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-24 w-full" />
        </div>
    );

    return (
        <div className={cn('flex flex-col gap-3', isMobile && 'px-2', className)}>
            {header}

            {isLoading ? (
                Array.from({ length: loadingCount }).map((_, index) => (
                    <div key={`skeleton-${index}`} className="rounded-xl border border-orange-100 bg-white/70 p-4">
                        {loadingSkeleton ?? defaultSkeleton}
                    </div>
                ))
            ) : items.length === 0 ? (
                emptyState ?? (
                    <div className="rounded-xl border border-dashed border-orange-200 bg-white/60 p-6 text-center text-sm text-gray-500">
                        Нет данных для отображения
                    </div>
                )
            ) : (
                items.map((item, index) => (
                    <React.Fragment key={keyExtractor(item, index)}>
                        {renderItem(item, index)}
                    </React.Fragment>
                ))
            )}

            {footer}
        </div>
    );
}

export default ResponsiveList;








