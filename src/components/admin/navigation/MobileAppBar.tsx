/**
 * @file: MobileAppBar.tsx
 * @description: Верхняя панель навигации для мобильной админ-панели
 * @dependencies: React, ResponsiveLayoutContext, AdminNavigationContext, button, input
 * @created: 2025-11-10
 */

import React from 'react';
import { Menu, Search, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useResponsiveLayout } from '@/contexts/ResponsiveLayoutContext';
import { useAdminNavigation } from './AdminNavigationContext';

interface AppBarAction {
    key: string;
    icon: React.ReactNode;
    onClick: () => void;
    label?: string;
}

interface MobileAppBarProps {
    title: string;
    subtitle?: string;
    className?: string;
    hideMenuButton?: boolean;
    searchEnabled?: boolean;
    searchPlaceholder?: string;
    onSearch?: (value: string) => void;
    actions?: AppBarAction[];
    notificationsBadge?: number;
}

export const MobileAppBar: React.FC<MobileAppBarProps> = ({
    title,
    subtitle,
    className,
    hideMenuButton = false,
    searchEnabled = false,
    searchPlaceholder = 'Поиск',
    onSearch,
    actions = [],
    notificationsBadge
}) => {
    const { isMobile } = useResponsiveLayout();
    const { toggleDrawer } = useAdminNavigation();
    const [searchValue, setSearchValue] = React.useState('');

    if (!isMobile) {
        return null;
    }

    const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSearch?.(searchValue.trim());
    };

    return (
        <header className={cn(
            'sticky top-0 z-40 bg-gradient-to-r from-orange-50 via-white to-purple-50 border-b border-orange-100 px-4 py-3 shadow-sm',
            className
        )}>
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    {!hideMenuButton && (
                        <Button variant="ghost" size="icon" onClick={toggleDrawer} aria-label="Открыть меню">
                            <Menu className="h-5 w-5 text-orange-500" />
                        </Button>
                    )}
                    <div>
                        <h1 className="text-base font-semibold text-gray-900">{title}</h1>
                        {subtitle && (
                            <p className="text-xs text-gray-500">{subtitle}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {notificationsBadge !== undefined && (
                        <Button variant="ghost" size="icon" className="relative" aria-label="Уведомления">
                            <Bell className="h-5 w-5 text-purple-500" />
                            {notificationsBadge > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                                    {notificationsBadge > 9 ? '9+' : notificationsBadge}
                                </span>
                            )}
                        </Button>
                    )}

                    {actions.map(action => (
                        <Button
                            key={action.key}
                            variant="ghost"
                            size="icon"
                            onClick={action.onClick}
                            aria-label={action.label ?? action.key}
                        >
                            {action.icon}
                        </Button>
                    ))}
                </div>
            </div>

            {searchEnabled && (
                <form onSubmit={handleSearchSubmit} className="mt-3">
                    <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-white/80 px-2 py-1">
                        <Search className="h-4 w-4 text-orange-400" />
                        <Input
                            type="search"
                            value={searchValue}
                            onChange={(event) => setSearchValue(event.target.value)}
                            placeholder={searchPlaceholder}
                            className="border-0 bg-transparent px-0 text-sm focus-visible:ring-0"
                        />
                        <Button type="submit" variant="ghost" size="sm">
                            Поиск
                        </Button>
                    </div>
                </form>
            )}
        </header>
    );
};

export default MobileAppBar;





