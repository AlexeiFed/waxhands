/**
 * @file: expandable-text.tsx
 * @description: Компонент для отображения текста с возможностью раскрытия/скрытия
 * @dependencies: @/components/ui/button, lucide-react
 * @created: 2024-12-19
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ExpandableTextProps {
    text: string;
    maxLines?: number;
    className?: string;
}

export const ExpandableText = ({ text, maxLines = 5, className = "" }: ExpandableTextProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Защитные проверки для null/undefined значений
    if (!text || typeof text !== 'string') {
        return <div className={className}></div>;
    }

    // Простая проверка по количеству символов (150 символов = примерно 3 строки)
    const maxChars = 150; // Фиксированный лимит в 150 символов
    const shouldShowExpand = text.length > maxChars;

    if (!shouldShowExpand) {
        return <div className={className}>{text}</div>;
    }

    const displayText = isExpanded ? text : text.substring(0, maxChars) + '...';

    return (
        <div className={className}>
            <div className="whitespace-pre-line">
                {displayText}
            </div>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 p-1 h-auto text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50"
            >
                {isExpanded ? (
                    <>
                        <ChevronUp className="w-4 h-4 mr-1" />
                        Скрыть
                    </>
                ) : (
                    <>
                        <ChevronDown className="w-4 h-4 mr-1" />
                        Раскрыть
                    </>
                )}
            </Button>
        </div>
    );
};
