/**
 * @file: responsive.ts
 * @description: Общие константы и типы для адаптивной разметки
 * @dependencies: none
 * @created: 2025-11-10
 */

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export const BREAKPOINT_LIMITS = {
    mobileMax: 767.98,
    tabletMin: 768,
    tabletMax: 1023.98,
    desktopMin: 1024
} as const;

export const MEDIA_QUERIES: Record<Breakpoint, string> = {
    mobile: `(max-width: ${BREAKPOINT_LIMITS.mobileMax}px)`,
    tablet: `(min-width: ${BREAKPOINT_LIMITS.tabletMin}px) and (max-width: ${BREAKPOINT_LIMITS.tabletMax}px)`,
    desktop: `(min-width: ${BREAKPOINT_LIMITS.desktopMin}px)`
};

export const DEFAULT_BREAKPOINT: Breakpoint = 'desktop';

export const getBreakpointForWidth = (width: number): Breakpoint => {
    if (width < BREAKPOINT_LIMITS.tabletMin) {
        return 'mobile';
    }
    if (width < BREAKPOINT_LIMITS.desktopMin) {
        return 'tablet';
    }
    return 'desktop';
};








