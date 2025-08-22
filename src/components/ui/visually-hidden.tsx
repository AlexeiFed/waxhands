/**
 * @file: src/components/ui/visually-hidden.tsx
 * @description: Компонент для скрытия элементов от пользователей, но доступных для скринридеров
 * @dependencies: React
 * @created: 2024-12-19
 */

import React from 'react';

interface VisuallyHiddenProps {
    children: React.ReactNode;
}

export const VisuallyHidden: React.FC<VisuallyHiddenProps> = ({ children }) => {
    return (
        <span
            className="sr-only"
            style={{
                position: 'absolute',
                width: '1px',
                height: '1px',
                padding: '0',
                margin: '-1px',
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                border: '0',
            }}
        >
            {children}
        </span>
    );
};





