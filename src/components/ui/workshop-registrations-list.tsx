/**
 * @file: workshop-registrations-list.tsx
 * @description: Компонент для отображения списка записей на мастер-класс
 * @dependencies: ui components, use-workshop-registrations hook
 * @created: 2024-12-19
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWorkshopRegistrations } from "@/hooks/use-workshop-registrations";
import { Users, Calendar, Clock, MapPin, CheckCircle, XCircle, Clock as ClockIcon } from "lucide-react";

interface WorkshopRegistrationsListProps {
    workshopId: string;
    workshopName: string;
}

interface WorkshopRegistration {
    id: string;
    userName: string;
    userClass: string;
    schoolName: string;
    style: string;
    options: string[];
    totalPrice: number;
    status: 'pending' | 'confirmed' | 'cancelled';
    createdAt: string;
}

const statusConfig = {
    pending: { label: 'Ожидает', color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
    confirmed: { label: 'Подтверждено', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    cancelled: { label: 'Отменено', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export const WorkshopRegistrationsList = ({ workshopId, workshopName }: WorkshopRegistrationsListProps) => {
    const [registrations, setRegistrations] = useState<WorkshopRegistration[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { getWorkshopRegistrations, updateRegistrationStatus } = useWorkshopRegistrations();

    useEffect(() => {
        const fetchRegistrations = async () => {
            setIsLoading(true);
            try {
                const workshopRegistrations = await getWorkshopRegistrations(workshopId);
                setRegistrations(workshopRegistrations);
            } catch (error) {
                console.error('Error fetching workshop registrations:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRegistrations();

        // Обновляем список каждые 30 секунд
        const interval = setInterval(fetchRegistrations, 30000);
        return () => clearInterval(interval);
    }, [workshopId, getWorkshopRegistrations]);

    const handleStatusUpdate = async (registrationId: string, newStatus: string) => {
        const success = await updateRegistrationStatus(registrationId, newStatus);
        if (success) {
            // Обновляем локальное состояние
            setRegistrations(prev =>
                prev.map(reg =>
                    reg.id === registrationId
                        ? { ...reg, status: newStatus as 'pending' | 'confirmed' | 'cancelled' }
                        : reg
                )
            );
        }
    };

    if (isLoading) {
        return (
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader className="p-4">
                    <CardTitle className="text-lg text-blue-600">Записи на мастер-класс</CardTitle>
                    <CardDescription className="text-sm">Загрузка...</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (registrations.length === 0) {
        return (
            <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
                <CardHeader className="p-4">
                    <CardTitle className="text-lg text-gray-600">Записи на мастер-класс</CardTitle>
                    <CardDescription className="text-sm">
                        Пока нет записей на мастер-класс "{workshopName}"
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardHeader className="p-4">
                <CardTitle className="text-lg text-purple-600 flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Записи на мастер-класс: {workshopName}</span>
                </CardTitle>
                <CardDescription className="text-sm">
                    Всего записей: {registrations.length}
                </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="space-y-4">
                    {registrations.map((registration) => {
                        const status = statusConfig[registration.status];
                        const StatusIcon = status.icon;

                        return (
                            <Card key={registration.id} className="bg-white/70 border-gray-200">
                                <CardContent className="p-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center space-x-2">
                                                <h4 className="font-semibold text-gray-800">
                                                    {registration.userName}
                                                </h4>
                                                <Badge variant="outline" className="text-xs">
                                                    {registration.userClass}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                <MapPin className="w-4 h-4" />
                                                <span>{registration.schoolName}</span>
                                            </div>

                                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                <div className="flex items-center space-x-1">
                                                    <span>Стиль:</span>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {registration.style}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <span>Цена:</span>
                                                    <span className="font-semibold text-green-600">
                                                        {registration.totalPrice} ₽
                                                    </span>
                                                </div>
                                            </div>

                                            {registration.options.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {registration.options.map((option, idx) => (
                                                        <Badge key={idx} variant="outline" className="text-xs">
                                                            {option}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                <Calendar className="w-3 h-3" />
                                                <span>
                                                    {new Date(registration.createdAt).toLocaleDateString('ru-RU')}
                                                </span>
                                                <Clock className="w-3 h-3" />
                                                <span>
                                                    {new Date(registration.createdAt).toLocaleTimeString('ru-RU', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end space-y-2">
                                            <Badge className={status.color}>
                                                <StatusIcon className="w-3 h-3 mr-1" />
                                                {status.label}
                                            </Badge>

                                            {registration.status === 'pending' && (
                                                <div className="flex space-x-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleStatusUpdate(registration.id, 'confirmed')}
                                                        className="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1"
                                                    >
                                                        Подтвердить
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleStatusUpdate(registration.id, 'cancelled')}
                                                        className="text-red-600 border-red-300 hover:bg-red-50 text-xs px-2 py-1"
                                                    >
                                                        Отменить
                                                    </Button>
                                                </div>
                                            )}

                                            {registration.status === 'confirmed' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleStatusUpdate(registration.id, 'cancelled')}
                                                    className="text-red-600 border-red-300 hover:bg-red-50 text-xs px-2 py-1"
                                                >
                                                    Отменить
                                                </Button>
                                            )}

                                            {registration.status === 'cancelled' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleStatusUpdate(registration.id, 'pending')}
                                                    className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1"
                                                >
                                                    Восстановить
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};
