/**
 * @file: AdminCardBase.tsx
 * @description: Базовый контейнер карточек для мобильной админ-панели
 * @dependencies: React, Checkbox, utils
 * @created: 2025-11-10
 */

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

type CardTone = 'default' | 'success' | 'warning' | 'danger';

const TONE_CLASSNAMES: Record<CardTone, string> = {
    default: 'border-orange-100 bg-white/80 hover:border-orange-200',
    success: 'border-green-200 bg-green-50/80 hover:border-green-300',
    warning: 'border-yellow-200 bg-yellow-50/80 hover:border-yellow-300',
    danger: 'border-red-200 bg-red-50/80 hover:border-red-300'
};

interface AdminCardBaseProps {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    meta?: React.ReactNode;
    leading?: React.ReactNode;
    actions?: React.ReactNode;
    footer?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
    selectable?: boolean;
    selected?: boolean;
    onSelectToggle?: (selected: boolean) => void;
    onClick?: () => void;
    tone?: CardTone;
}

export const AdminCardBase: React.FC<AdminCardBaseProps> = ({
    title,
    subtitle,
    meta,
    leading,
    actions,
    footer,
    children,
    className,
    selectable = false,
    selected = false,
    onSelectToggle,
    onClick,
    tone = 'default'
}) => {
    const handleSelectChange = (checked: boolean | string) => {
        const value = Boolean(checked);
        onSelectToggle?.(value);
    };

    const Wrapper: React.ElementType = onClick ? 'button' : 'div';

    return (
        <Wrapper
            type={onClick ? 'button' : undefined}
            onClick={onClick}
            className={cn(
                'w-full text-left',
                onClick && 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 rounded-2xl'
            )}
        >
            <article
                className={cn(
                    'relative flex flex-col gap-4 rounded-2xl border px-4 py-4 transition duration-200',
                    'shadow-sm hover:shadow-md',
                    selected && 'ring-2 ring-offset-2 ring-orange-400 border-orange-300',
                    TONE_CLASSNAMES[tone],
                    className
                )}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-1 items-start gap-3">
                        {selectable && (
                            <Checkbox
                                checked={selected}
                                onCheckedChange={handleSelectChange}
                                className="mt-1"
                                onClick={(event) => event.stopPropagation()}
                            />
                        )}

                        {leading && (
                            <div className="mt-1 shrink-0">
                                {leading}
                            </div>
                        )}

                        <div className="flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-base font-semibold text-gray-900">{title}</span>
                                {meta}
                            </div>
                            {subtitle && (
                                <p className="text-sm text-gray-500">{subtitle}</p>
                            )}
                        </div>
                    </div>

                    {actions && (
                        <div
                            className="flex shrink-0 items-center gap-2"
                            onClick={(event) => event.stopPropagation()}
                        >
                            {actions}
                        </div>
                    )}
                </div>

                {children && (
                    <div className="text-sm text-gray-700">
                        {children}
                    </div>
                )}

                {footer && (
                    <div
                        className="border-t border-orange-100 pt-3"
                        onClick={(event) => event.stopPropagation()}
                    >
                        {footer}
                    </div>
                )}
            </article>
        </Wrapper>
    );
};

export default AdminCardBase;





