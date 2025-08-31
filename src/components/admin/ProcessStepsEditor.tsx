/**
 * @file: ProcessStepsEditor.tsx
 * @description: Компонент для редактирования шагов процесса мастер-класса
 * @dependencies: React, shadcn/ui, lucide-react
 * @created: 2025-08-27
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus } from 'lucide-react';
import type { AboutContent } from '@/hooks/use-about-api';

interface ProcessStepsEditorProps {
    content: AboutContent;
    onSave: (steps: Array<{ title: string; description: string }>) => Promise<void>;
    onCancel: () => void;
}

const ProcessStepsEditor: React.FC<ProcessStepsEditorProps> = ({ content, onSave, onCancel }) => {
    const [localProcessSteps, setLocalProcessSteps] = useState<Array<{ title: string; description: string }>>(
        content?.process_steps || []
    );

    // Синхронизируем локальное состояние с контентом
    useEffect(() => {
        setLocalProcessSteps(content?.process_steps || []);
    }, [content?.process_steps]);

    return (
        <div className="space-y-4">
            {/* Список шагов для редактирования */}
            {localProcessSteps.map((step, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">Шаг {index + 1}</span>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                const newSteps = localProcessSteps.filter((_, i) => i !== index);
                                setLocalProcessSteps(newSteps);
                            }}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                    <div>
                        <Label className="text-sm">Заголовок шага</Label>
                        <Input
                            value={step.title}
                            onChange={(e) => {
                                const newSteps = [...localProcessSteps];
                                newSteps[index] = { ...newSteps[index], title: e.target.value };
                                setLocalProcessSteps(newSteps);
                            }}
                            placeholder="Например: Подготовка"
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label className="text-sm">Описание шага</Label>
                        <Textarea
                            value={step.description}
                            onChange={(e) => {
                                const newSteps = [...localProcessSteps];
                                newSteps[index] = { ...newSteps[index], description: e.target.value };
                                setLocalProcessSteps(newSteps);
                            }}
                            placeholder="Например: Ребенок выбирает цвет воска"
                            rows={2}
                            className="mt-1"
                        />
                    </div>
                </div>
            ))}

            {/* Кнопка добавления нового шага */}
            <Button
                variant="outline"
                onClick={() => {
                    setLocalProcessSteps([...localProcessSteps, { title: '', description: '' }]);
                }}
                className="w-full"
            >
                <Plus className="w-4 h-4 mr-2" />
                Добавить шаг
            </Button>

            <div className="flex gap-2">
                <Button onClick={async () => {
                    try {
                        await onSave(localProcessSteps);
                    } catch (error) {
                        console.error('Ошибка сохранения шагов:', error);
                    }
                }}>
                    Сохранить
                </Button>
                <Button variant="outline" onClick={onCancel}>
                    Отмена
                </Button>
            </div>
        </div>
    );
};

export default ProcessStepsEditor;
