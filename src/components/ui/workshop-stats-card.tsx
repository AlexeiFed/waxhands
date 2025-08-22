/**
 * @file: workshop-stats-card.tsx
 * @description: Компонент для отображения статистики мастер-класса
 * @dependencies: ui components, use-workshop-registrations hook
 * @created: 2024-12-19
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWorkshopRegistrations } from "@/hooks/use-workshop-registrations";
import { Users, DollarSign, TrendingUp } from "lucide-react";

interface WorkshopStatsCardProps {
    workshopId: string;
    workshopName: string;
}

interface WorkshopStats {
    totalRegistrations: number;
    confirmedRegistrations: number;
    totalRevenue: number;
}

export const WorkshopStatsCard = ({ workshopId, workshopName }: WorkshopStatsCardProps) => {
    const [stats, setStats] = useState<WorkshopStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { getWorkshopStats } = useWorkshopRegistrations();

    useEffect(() => {
        const fetchStats = async () => {
            setIsLoading(true);
            try {
                const workshopStats = await getWorkshopStats(workshopId);
                setStats(workshopStats);
            } catch (error) {
                console.error('Error fetching workshop stats:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();

        // Обновляем статистику каждые 30 секунд
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, [workshopId, getWorkshopStats]);

    if (isLoading) {
        return (
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader className="p-4">
                    <CardTitle className="text-lg text-blue-600">Статистика мастер-класса</CardTitle>
                    <CardDescription className="text-sm">Загрузка...</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (!stats) {
        return (
            <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
                <CardHeader className="p-4">
                    <CardTitle className="text-lg text-red-600">Ошибка загрузки</CardTitle>
                    <CardDescription className="text-sm">Не удалось загрузить статистику</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="p-4">
                <CardTitle className="text-lg text-green-600 flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Статистика: {workshopName}</span>
                </CardTitle>
                <CardDescription className="text-sm">
                    Актуальная информация о записях и доходах
                </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            <span className="text-2xl font-bold text-blue-600">
                                {stats.totalRegistrations}
                            </span>
                        </div>
                        <p className="text-sm text-gray-600">Всего записей</p>
                    </div>

                    <div className="text-center">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                            <Badge variant="secondary" className="text-lg px-3 py-1">
                                {stats.confirmedRegistrations}
                            </Badge>
                        </div>
                        <p className="text-sm text-gray-600">Подтверждено</p>
                    </div>

                    <div className="text-center">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                            <DollarSign className="w-5 h-5 text-green-600" />
                            <span className="text-2xl font-bold text-green-600">
                                {stats.totalRevenue.toLocaleString()} ₽
                            </span>
                        </div>
                        <p className="text-sm text-gray-600">Общий доход</p>
                    </div>
                </div>

                {stats.totalRegistrations > 0 && (
                    <div className="mt-4 p-3 bg-white/50 rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Процент подтверждений:</span>
                            <span className="font-semibold text-blue-600">
                                {Math.round((stats.confirmedRegistrations / stats.totalRegistrations) * 100)}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(stats.confirmedRegistrations / stats.totalRegistrations) * 100}%` }}
                            />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
