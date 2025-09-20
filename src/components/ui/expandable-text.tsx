/**
 * @file: expandable-text.tsx
 * @description: Компонент для развертывания/сворачивания длинного текста
 * @dependencies: Button, ChevronDown, ChevronUp
 * @created: 2025-01-25
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpandableTextProps {
    text: string;
    maxLength?: number;
    className?: string;
    buttonClassName?: string;
    showButtonText?: boolean;
    expandedButtonText?: string;
    collapsedButtonText?: string;
}

export const ExpandableText: React.FC<ExpandableTextProps> = ({
    text,
    maxLength = 150,
    className = '',
    buttonClassName = '',
    showButtonText = false,
    expandedButtonText = 'Свернуть',
    collapsedButtonText = 'Развернуть'
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [shouldShowButton, setShouldShowButton] = useState(false);
    const textRef = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        if (textRef.current) {
            // Проверяем, нужно ли показывать кнопку
            setShouldShowButton(text.length > maxLength);
        }
    }, [text, maxLength]);

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    const displayText = isExpanded ? text : text.slice(0, maxLength) + (text.length > maxLength ? '...' : '');

    if (!text) return null;

    return (
        <div className={className}>
            <p
                ref={textRef}
                className="text-gray-600 mb-2 leading-relaxed"
            >
                {displayText}
            </p>

            {shouldShowButton && (
                <Button
                    onClick={toggleExpanded}
                    variant="ghost"
                    size="sm"
                    className={`flex items-center gap-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50 p-1 h-auto font-medium transition-all duration-200 ${buttonClassName}`}
                >
                    {isExpanded ? (
                        <>
                            <ChevronUp className="w-4 h-4" />
                            {showButtonText && <span>{expandedButtonText}</span>}
                        </>
                    ) : (
                        <>
                            <ChevronDown className="w-4 h-4" />
                            {showButtonText && <span>{collapsedButtonText}</span>}
                        </>
                    )}
                </Button>
            )}
        </div>
    );
};

export default ExpandableText;