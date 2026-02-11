/**
 * @file: mobile-bottom-sheet.tsx
 * @description: Обёртка для bottom sheet на мобильных устройствах с шапкой и жестом закрытия
 * @dependencies: shadcn Sheet, ResponsiveLayoutContext
 * @created: 2025-11-10
 */

import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useResponsiveLayout } from '@/contexts/ResponsiveLayoutContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface MobileBottomSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
    dialogClassName?: string;
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
    open,
    onOpenChange,
    title,
    description,
    children,
    className,
    dialogClassName,
}) => {
    const { isSmallScreen } = useResponsiveLayout();

    if (!isSmallScreen) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className={cn('max-w-3xl max-h-[90vh] overflow-y-auto', dialogClassName)}>
                    {(title || description) && (
                        <DialogHeader>
                            {title && <DialogTitle>{title}</DialogTitle>}
                            {description && <DialogDescription>{description}</DialogDescription>}
                        </DialogHeader>
                    )}
                    <div>{children}</div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                className={cn(
                    'h-[92vh] max-h-[92vh] rounded-t-3xl border-none bg-white px-4 pt-3 pb-6 shadow-lg',
                    className
                )}
            >
                <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-gray-300" />
                {(title || description) && (
                    <SheetHeader className="text-left">
                        {title && <SheetTitle className="text-xl font-semibold">{title}</SheetTitle>}
                        {description && <SheetDescription className="text-sm text-gray-500">{description}</SheetDescription>}
                    </SheetHeader>
                )}
                <div className="mt-4 h-full overflow-y-auto">{children}</div>
            </SheetContent>
        </Sheet>
    );
};

export default MobileBottomSheet;








