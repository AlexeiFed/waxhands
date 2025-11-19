/**
 * @file: ResponsiveLayoutContext.tsx
 * @description: Провайдер и хуки для определения текущего брейкпоинта интерфейса
 * @dependencies: React, responsive.ts
 * @created: 2025-11-10
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { BREAKPOINT_LIMITS, DEFAULT_BREAKPOINT, MEDIA_QUERIES, type Breakpoint, getBreakpointForWidth } from '@/lib/responsive';

interface ResponsiveLayoutState {
    breakpoint: Breakpoint;
    width: number | null;
    height: number | null;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
}

const defaultState: ResponsiveLayoutState = {
    breakpoint: DEFAULT_BREAKPOINT,
    width: null,
    height: null,
    isMobile: false,
    isTablet: false,
    isDesktop: true
};

const ResponsiveLayoutContext = createContext<ResponsiveLayoutState>(defaultState);

interface ResponsiveLayoutProviderProps {
    children: React.ReactNode;
    ssrBreakpoint?: Breakpoint;
}

const getInitialState = (ssrBreakpoint?: Breakpoint): ResponsiveLayoutState => {
    const breakpoint = ssrBreakpoint ?? DEFAULT_BREAKPOINT;
    return {
        breakpoint,
        width: null,
        height: null,
        isMobile: breakpoint === 'mobile',
        isTablet: breakpoint === 'tablet',
        isDesktop: breakpoint === 'desktop'
    };
};

const addMediaListener = (mediaQueryList: MediaQueryList, listener: (event: MediaQueryListEvent) => void) => {
    if (typeof mediaQueryList.addEventListener === 'function') {
        mediaQueryList.addEventListener('change', listener);
    } else if (typeof mediaQueryList.addListener === 'function') {
        mediaQueryList.addListener(listener);
    }
};

const removeMediaListener = (mediaQueryList: MediaQueryList, listener: (event: MediaQueryListEvent) => void) => {
    if (typeof mediaQueryList.removeEventListener === 'function') {
        mediaQueryList.removeEventListener('change', listener);
    } else if (typeof mediaQueryList.removeListener === 'function') {
        mediaQueryList.removeListener(listener);
    }
};

export const ResponsiveLayoutProvider: React.FC<ResponsiveLayoutProviderProps> = ({
    children,
    ssrBreakpoint
}) => {
    const [state, setState] = useState<ResponsiveLayoutState>(() => getInitialState(ssrBreakpoint));

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const updateState = (width: number, height: number) => {
            const breakpoint = getBreakpointForWidth(width);
            setState({
                breakpoint,
                width,
                height,
                isMobile: breakpoint === 'mobile',
                isTablet: breakpoint === 'tablet',
                isDesktop: breakpoint === 'desktop'
            });
        };

        const handleResize = () => {
            updateState(window.innerWidth, window.innerHeight);
        };

        // Первоначальное вычисление
        updateState(window.innerWidth, window.innerHeight);

        const mobileMql = window.matchMedia(MEDIA_QUERIES.mobile);
        const tabletMql = window.matchMedia(MEDIA_QUERIES.tablet);
        const desktopMql = window.matchMedia(MEDIA_QUERIES.desktop);

        const listener = () => {
            updateState(window.innerWidth, window.innerHeight);
        };

        [mobileMql, tabletMql, desktopMql].forEach((mql) => addMediaListener(mql, listener));
        window.addEventListener('resize', handleResize);

        return () => {
            [mobileMql, tabletMql, desktopMql].forEach((mql) => removeMediaListener(mql, listener));
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const value = useMemo(() => state, [state]);

    return (
        <ResponsiveLayoutContext.Provider value={value}>
            {children}
        </ResponsiveLayoutContext.Provider>
    );
};

export const useResponsiveLayout = (): ResponsiveLayoutState => {
    return useContext(ResponsiveLayoutContext);
};

export const useBreakpoint = (): Breakpoint => {
    return useResponsiveLayout().breakpoint;
};

export const useResponsiveValue = <T,>(values: Partial<Record<Breakpoint, T>> & { desktop: T }): T => {
    const { breakpoint } = useResponsiveLayout();
    return values[breakpoint] ?? values.desktop;
};

export const BREAKPOINTS = {
    mobile: { max: BREAKPOINT_LIMITS.mobileMax },
    tablet: { min: BREAKPOINT_LIMITS.tabletMin, max: BREAKPOINT_LIMITS.tabletMax },
    desktop: { min: BREAKPOINT_LIMITS.desktopMin }
} as const;

