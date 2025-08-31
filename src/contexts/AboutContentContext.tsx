/**
 * @file: src/contexts/AboutContentContext.tsx
 * @description: Контекст для управления контентом страницы "О нас"
 * @dependencies: React Context, useAboutContent
 * @created: 2024-12-19
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useAboutContent, type AboutContent, type AboutMedia } from '@/hooks/use-about-api';

interface AboutContentContextType {
    content: AboutContent;
    isLoading: boolean;
    error: string | null;
    updateField: (field: keyof AboutContent, value: string | string[] | Array<{ title: string, description: string }>) => Promise<boolean>;
    addMedia: (mediaItem: Omit<AboutMedia, 'id' | 'order_index' | 'created_at' | 'updated_at'>) => Promise<boolean>;
    removeMedia: (id: number) => Promise<boolean>;
    reorderMedia: (mediaIds: number[]) => Promise<boolean>;
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
    const { content, loading, error, updateContent } = useAboutContent();

    const updateField = async (field: keyof AboutContent, value: string | string[] | Array<{ title: string, description: string }>): Promise<boolean> => {
        if (!content) return false;
        return await updateContent(content.id, { [field]: value });
    };

    const addMedia = async (mediaItem: Omit<AboutMedia, 'id' | 'order_index' | 'created_at' | 'updated_at'>): Promise<boolean> => {
        // TODO: Реализовать добавление медиа через API
        console.log('Добавление медиа:', mediaItem);
        return true;
    };

    const removeMedia = async (id: number): Promise<boolean> => {
        // TODO: Реализовать удаление медиа через API
        console.log('Удаление медиа:', id);
        return true;
    };

    const reorderMedia = async (mediaIds: number[]): Promise<boolean> => {
        // TODO: Реализовать изменение порядка медиа через API
        console.log('Изменение порядка медиа:', mediaIds);
        return true;
    };

    const saveContent = async (newContent: AboutContent): Promise<boolean> => {
        if (!content) return false;
        return await updateContent(content.id, newContent);
    };

    const resetToDefault = async (): Promise<boolean> => {
        // TODO: Реализовать сброс к значениям по умолчанию
        console.log('Сброс к значениям по умолчанию');
        return true;
    };

    const defaultContent: AboutContent = {
        id: 0,
        title: 'О нашей студии',
        subtitle: 'Магия творчества для детей',
        description: 'Студия «МК Восковые ручки» — это место, где рождается магия творчества!',
        studio_title: 'О нашей студии',
        studio_description: 'Мы специализируемся на создании уникальных 3D-копий рук детей.',
        advantages_title: 'Наши преимущества',
        advantages_list: [
            'Быстрое создание — всего 5 минут на одного ребенка',
            'Выездные мастер-классы в любые учреждения',
            'Уникальные 3D-сувениры ручной работы',
            'Безопасные материалы для детей'
        ],
        process_title: 'Как проходит мастер-класс',
        process_steps: [
            {
                title: 'Подготовка',
                description: 'Ребенок выбирает цвет воска и готовится к творческому процессу'
            },
            {
                title: 'Создание',
                description: 'Под руководством мастера ребенок создает 3D-копию своей руки'
            },
            {
                title: 'Готово!',
                description: 'Уникальный сувенир готов и может быть забран домой'
            }
        ],
        safety_title: 'Безопасность и качество',
        safety_description: 'Мы используем только высококачественные, безопасные для детей материалы.',
        contact_info: 'Свяжитесь с нами для организации мастер-класса',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    const contextValue: AboutContentContextType = {
        content: content || defaultContent,
        isLoading: loading,
        error,
        updateField,
        addMedia,
        removeMedia,
        reorderMedia,
        saveContent,
        resetToDefault
    };

    return (
        <AboutContentContext.Provider value={contextValue}>
            {children}
        </AboutContentContext.Provider>
    );
};
