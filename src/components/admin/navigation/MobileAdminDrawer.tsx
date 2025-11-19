/**
 * @file: MobileAdminDrawer.tsx
 * @description: Drawer-меню для мобильной админ-панели
 * @dependencies: React, shadcn Sheet, AdminNavigationContext, ResponsiveLayoutContext
 * @created: 2025-11-10
 */

import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useResponsiveLayout } from '@/contexts/ResponsiveLayoutContext';
import { useAdminNavigation } from './AdminNavigationContext';

export interface DrawerItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    badge?: number | string;
    onSelect?: () => void;
    description?: string;
    disabled?: boolean;
}

interface MobileAdminDrawerProps {
    items: DrawerItem[];
    header?: React.ReactNode;
    footer?: React.ReactNode;
    title?: string;
    description?: string;
    className?: string;
    onClose?: () => void;
}

export const MobileAdminDrawer: React.FC<MobileAdminDrawerProps> = ({
    items,
    header,
    footer,
    title = 'Навигация',
    description,
    className,
    onClose
}) => {
    const { isMobile, isTablet } = useResponsiveLayout();
    const { isDrawerOpen, closeDrawer } = useAdminNavigation();

    const handleClose = () => {
        closeDrawer();
        onClose?.();
    };

    const shouldRender = isMobile || isTablet;

    return (
        <Sheet open={shouldRender && isDrawerOpen} onOpenChange={(open) => !open && handleClose()}>
            <SheetContent side="left" className={cn('px-0 py-0 w-[280px] sm:w-[320px] flex flex-col', className)}>
                <div className="px-4 py-4 border-b border-orange-100 bg-gradient-to-r from-purple-50 to-orange-50">
                    {header ?? (
                        <SheetHeader>
                            <SheetTitle className="text-base font-semibold text-gray-900">{title}</SheetTitle>
                            {description && (
                                <SheetDescription className="text-xs text-gray-500">
                                    {description}
                                </SheetDescription>
                            )}
                        </SheetHeader>
                    )}
                </div>

                <nav className="flex-1 overflow-y-auto">
                    <ul className="py-2">
                        {items.map((item) => (
                            <li key={item.id}>
                                <Button
                                    variant="ghost"
                                    disabled={item.disabled}
                                    className={cn(
                                        'w-full justify-start px-4 py-3 text-sm font-medium text-gray-700 hover:bg-orange-50 rounded-none border-b border-orange-50',
                                        item.disabled && 'opacity-50'
                                    )}
                                    onClick={() => {
                                        if (item.disabled) return;
                                        item.onSelect?.();
                                        closeDrawer();
                                    }}
                                >
                                    <span className="flex items-center gap-3 w-full">
                                        {item.icon && (
                                            <span className="text-orange-500">
                                                {item.icon}
                                            </span>
                                        )}
                                        <span className="flex-1 text-left">
                                            {item.label}
                                            {item.description && (
                                                <span className="block text-xs text-gray-500 font-normal mt-0.5">
                                                    {item.description}
                                                </span>
                                            )}
                                        </span>
                                        {item.badge !== undefined && (
                                            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                                                {item.badge}
                                            </Badge>
                                        )}
                                    </span>
                                </Button>
                            </li>
                        ))}
                    </ul>
                </nav>

                {footer && (
                    <div className="border-t border-orange-100 bg-white px-4 py-3">
                        {footer}
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
};

export default MobileAdminDrawer;





