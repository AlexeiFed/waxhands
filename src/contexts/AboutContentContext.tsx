/**
 * @file: src/contexts/AboutContentContext.tsx
 * @description: Контекст для управления контентом страницы "О нас"
 * @dependencies: React Context, useAboutContent
 * @created: 2024-12-19
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useAboutContent, type AboutContent, type MediaItem } from '@/hooks/use-about-content';

interface AboutContentContextType {
    content: AboutContent;
    isLoading: boolean;
    error: string | null;
    updateField: (field: keyof AboutContent, value: any) => Promise<boolean>;
    addMedia: (mediaItem: Omit<MediaItem, 'id' | 'order'>) => Promise<boolean>;
    removeMedia: (id: string) => Promise<boolean>;
    reorderMedia: (mediaIds: string[]) => Promise<boolean>;
    saveContent: (newContent: AboutContent) => Promise<boolean>;
    resetToDefault: () => Promise<boolean>;
}

const AboutContentContext = createContext<AboutContentContextType | undefined>(undefined);

export const useAboutContentContext = () => {
    const context = useContext(AboutContentContext);
    if (context === undefined) {
        throw new Error('useAboutContentContext must be used within an AboutContentProvider');
    }
    return context;
};

interface AboutContentProviderProps {
    children: ReactNode;
}

export const AboutContentProvider: React.FC<AboutContentProviderProps> = ({ children }) => {
    const aboutContent = useAboutContent();

    return (
        <AboutContentContext.Provider value={aboutContent}>
            {children}
        </AboutContentContext.Provider>
    );
};
