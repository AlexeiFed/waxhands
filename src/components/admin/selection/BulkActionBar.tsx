/**
 * @file: BulkActionBar.tsx
 * @description: Панель массовых действий для мобильной админ-панели
 * @dependencies: React, Button, Badge, SelectionManagerContext
 * @created: 2025-11-10
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface BulkAction {
    id: string;
    label: string;
    onClick: () => void;
    icon?: React.ElementType;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost';
}

interface BulkActionBarProps {
    count: number;
    onClear: () => void;
    actions: BulkAction[];
    className?: string;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
    count,
    onClear,
    actions,
    className,
}) => {
    if (count === 0) {
        return null;
    }

    return (
        <div
            className={cn(
                'fixed inset-x-0 bottom-0 z-50 bg-white/95 backdrop-blur border-t border-orange-100 px-4 py-3 shadow-lg',
                className
            )}
        >
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
                        Выбрано: {count}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={onClear}>
                        Очистить
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    {actions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <Button
                                key={action.id}
                                size="sm"
                                variant={action.variant ?? 'default'}
                                onClick={action.onClick}
                                className="flex items-center gap-1"
                            >
                                {Icon && <Icon className="h-4 w-4" />}
                                {action.label}
                            </Button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default BulkActionBar;








