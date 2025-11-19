/**
 * @file: FloatingActionButton.tsx
 * @description: Плавающая кнопка действий для мобильной админ-панели
 * @dependencies: React, button, ResponsiveLayoutContext
 * @created: 2025-11-10
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useResponsiveLayout } from '@/contexts/ResponsiveLayoutContext';

type FabVariant = 'primary' | 'secondary';

const VARIANT_CLASSNAMES: Record<FabVariant, string> = {
    primary: 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg hover:from-orange-600 hover:to-pink-600',
    secondary: 'bg-white text-orange-600 border border-orange-200 shadow-md hover:bg-orange-50'
};

interface FloatingActionButtonProps {
    label?: string;
    icon?: React.ReactNode;
    onClick: () => void;
    className?: string;
    variant?: FabVariant;
    disabled?: boolean;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
    label,
    icon,
    onClick,
    className,
    variant = 'primary',
    disabled = false
}) => {
    const { isMobile } = useResponsiveLayout();

    if (!isMobile) {
        return null;
    }

    return (
        <Button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'fixed right-5 bottom-5 flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all duration-200',
                VARIANT_CLASSNAMES[variant],
                disabled && 'opacity-70 cursor-not-allowed',
                className
            )}
        >
            {icon && (
                <span className="flex items-center justify-center">
                    {icon}
                </span>
            )}
            {label && <span>{label}</span>}
        </Button>
    );
};

export default FloatingActionButton;





