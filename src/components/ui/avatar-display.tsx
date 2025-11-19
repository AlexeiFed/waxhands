/**
 * @file: avatar-display.tsx
 * @description: Универсальный компонент для отображения аватаров стилей и опций
 * @dependencies: React, getAvatarUrl
 * @created: 2024-12-19
 */

import React from 'react';
import { getFirstImageUrl } from '../../lib/config';

interface AvatarDisplayProps {
    images?: string[];
    type: 'style' | 'option';
    alt: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    onClick?: () => void;
}

const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
};

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
    images,
    type,
    alt,
    className = '',
    size = 'md',
    onClick
}) => {
    const imageUrl = getFirstImageUrl(images, type);
    const sizeClass = sizeClasses[size];

    return (
        <div
            className={`${sizeClass} rounded-xl overflow-hidden shadow-md flex-shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
            onClick={onClick}
        >
            <img
                src={imageUrl}
                alt={alt}
                className="w-full h-full object-cover"
                onError={(e) => {
                    // Если основное изображение не загрузилось, показываем fallback
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes('data:image/svg+xml')) {
                        target.src = getFirstImageUrl(undefined, type);
                    }
                }}
            />
        </div>
    );
};
