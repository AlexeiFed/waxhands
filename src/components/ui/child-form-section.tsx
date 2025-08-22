/**
 * @file: child-form-section.tsx
 * @description: Компонент для динамического добавления и редактирования данных детей
 * @dependencies: ui components, types
 * @created: 2024-12-19
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus } from "lucide-react";
import type { ChildData, School } from "@/types";

interface ChildFormSectionProps {
    children: ChildData[];
    onChildrenChange: (children: ChildData[]) => void;
    schools: School[];
    selectedSchoolId: string;
    onSchoolChange: (schoolId: string) => void;
    availableClasses: string[];
}

export const ChildFormSection: React.FC<ChildFormSectionProps> = ({
    children,
    onChildrenChange,
    schools,
    selectedSchoolId,
    onSchoolChange,
    availableClasses,
}) => {
    const addChild = () => {
        const newChild: ChildData = {
            name: "",
            surname: "",
            age: undefined, // Добавляем поле возраста
            schoolId: selectedSchoolId,
            class: "",
        };
        onChildrenChange([...children, newChild]);
    };

    const removeChild = (index: number) => {
        const newChildren = children.filter((_, i) => i !== index);
        onChildrenChange(newChildren);
    };

    const updateChild = (index: number, field: keyof ChildData, value: string | number) => {
        const newChildren = [...children];
        newChildren[index] = { ...newChildren[index], [field]: value };
        onChildrenChange(newChildren);
    };

    const handleSchoolChange = (schoolId: string) => {
        onSchoolChange(schoolId);
        // Обновляем школу для всех детей
        const newChildren = children.map(child => ({ ...child, schoolId, class: "" }));
        onChildrenChange(newChildren);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Дети</Label>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addChild}
                    className="flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Добавить ребенка
                </Button>
            </div>

            {children.length === 0 && (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                    <p>Нажмите "Добавить ребенка" чтобы начать</p>
                </div>
            )}

            {children.map((child, index) => (
                <Card key={index} className="border-2 border-orange-100">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Ребенок {index + 1}</CardTitle>
                            {children.length > 1 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeChild(index)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor={`child-${index}-surname`}>Фамилия</Label>
                                <Input
                                    id={`child-${index}-surname`}
                                    value={child.surname}
                                    onChange={(e) => updateChild(index, "surname", e.target.value)}
                                    placeholder="Введите фамилию"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor={`child-${index}-name`}>Имя</Label>
                                <Input
                                    id={`child-${index}-name`}
                                    value={child.name}
                                    onChange={(e) => updateChild(index, "name", e.target.value)}
                                    placeholder="Введите имя"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor={`child-${index}-age`}>Возраст</Label>
                            <Input
                                id={`child-${index}-age`}
                                type="number"
                                min="1"
                                max="18"
                                value={child.age || ""}
                                onChange={(e) => updateChild(index, "age", parseInt(e.target.value) || undefined)}
                                placeholder="Введите возраст"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor={`child-${index}-school`}>Школа/сад</Label>
                            <Select
                                value={child.schoolId}
                                onValueChange={(value) => {
                                    updateChild(index, "schoolId", value);
                                    handleSchoolChange(value);
                                }}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Выберите школу или сад" />
                                </SelectTrigger>
                                <SelectContent>
                                    {schools.map((school) => (
                                        <SelectItem key={school.id} value={school.id}>
                                            <div>
                                                <div className="font-medium">{school.name}</div>
                                                <div className="text-sm text-gray-500">{school.address}</div>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor={`child-${index}-class`}>Класс/группа</Label>
                                <Select
                                    value={child.class}
                                    onValueChange={(value) => updateChild(index, "class", value)}
                                    required
                                    disabled={!child.schoolId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Выберите класс или группу" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableClasses.map((className) => (
                                            <SelectItem key={className} value={className}>
                                                {className}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {!child.schoolId && (
                                    <p className="text-sm text-gray-500">Сначала выберите школу</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};
