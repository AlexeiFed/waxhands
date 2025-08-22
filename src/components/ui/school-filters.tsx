/**
 * @file: school-filters.tsx
 * @description: Компонент фильтрации школ с выпадающими списками
 * @dependencies: @/components/ui/select, @/components/ui/card
 * @created: 2024-12-19
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface School {
    id: string;
    name: string;
    address: string;
    classes: string[];
    teacher?: string;
    teacherPhone?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

interface SchoolFiltersProps {
    schools: School[];
    onFiltersChange: (filters: {
        city: string;
        school: string;
        class: string;
    }) => void;
}

export const SchoolFilters: React.FC<SchoolFiltersProps> = ({ schools, onFiltersChange }) => {
    const [selectedCity, setSelectedCity] = useState<string>("");
    const [selectedSchool, setSelectedSchool] = useState<string>("");
    const [selectedClass, setSelectedClass] = useState<string>("");



    // Извлекаем уникальные города из адресов школ
    const cities = Array.from(new Set(
        schools.map(school => {
            const city = school.address.split(',')[0].trim();
            return city;
        })
    )).sort();



    // Получаем школы для выбранного города
    const schoolsInCity = schools.filter(school => {
        const city = school.address.split(',')[0].trim();
        return selectedCity === "" || city === selectedCity;
    });

    // Получаем уникальные названия школ для выбранного города
    const schoolNames = Array.from(new Set(
        schoolsInCity.map(school => school.name)
    )).sort();

    // Получаем классы для выбранной школы
    const selectedSchoolData = schools.find(school => school.name === selectedSchool);
    const classes = selectedSchoolData?.classes || [];

    // Обработчики изменений фильтров
    const handleCityChange = (city: string) => {
        const actualCity = city === "all" ? "" : city;
        setSelectedCity(actualCity);
        setSelectedSchool("");
        setSelectedClass("");
        onFiltersChange({ city: actualCity, school: "", class: "" });
    };

    const handleSchoolChange = (school: string) => {
        const actualSchool = school === "all" ? "" : school;
        setSelectedSchool(actualSchool);
        setSelectedClass("");
        onFiltersChange({ city: selectedCity, school: actualSchool, class: "" });
    };

    const handleClassChange = (classValue: string) => {
        const actualClass = classValue === "all" ? "" : classValue;
        setSelectedClass(actualClass);
        onFiltersChange({ city: selectedCity, school: selectedSchool, class: actualClass });
    };

    const handleClearFilters = () => {
        setSelectedCity("");
        setSelectedSchool("");
        setSelectedClass("");
        onFiltersChange({ city: "", school: "", class: "" });
    };

    // Если нет школ, показываем сообщение
    if (schools.length === 0) {
        return (
            <Card className="mb-4">
                <CardHeader>
                    <CardTitle>Фильтры школ</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Нет данных школ для фильтрации</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="mb-4">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    Фильтры школ ({schools.length} школ)
                    {(selectedCity || selectedSchool || selectedClass) && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleClearFilters}
                            className="h-8 px-2"
                        >
                            <X className="w-4 h-4 mr-1" />
                            Очистить
                        </Button>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="city-filter">Город ({cities.length} городов)</Label>
                        <Select value={selectedCity || "all"} onValueChange={handleCityChange}>
                            <SelectTrigger id="city-filter">
                                <SelectValue placeholder="Выберите город" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Все города</SelectItem>
                                {cities.map((city) => (
                                    <SelectItem key={city} value={city}>
                                        {city}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="school-filter">Школа/Детский сад ({schoolNames.length} школ)</Label>
                        <Select
                            value={selectedSchool || "all"}
                            onValueChange={handleSchoolChange}
                            disabled={!selectedCity}
                        >
                            <SelectTrigger id="school-filter">
                                <SelectValue placeholder="Выберите школу" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Все школы</SelectItem>
                                {schoolNames.map((schoolName) => (
                                    <SelectItem key={schoolName} value={schoolName}>
                                        {schoolName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="class-filter">Класс/Группа ({classes.length} классов/групп)</Label>
                        <Select
                            value={selectedClass || "all"}
                            onValueChange={handleClassChange}
                            disabled={!selectedSchool}
                        >
                            <SelectTrigger id="class-filter">
                                <SelectValue placeholder="Выберите класс/группу" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Все классы/группы</SelectItem>
                                {classes.map((classItem) => (
                                    <SelectItem key={classItem} value={classItem}>
                                        {classItem}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}; 