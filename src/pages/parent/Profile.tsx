/**
 * @file: Profile.tsx
 * @description: Профиль родителя: отображение персональных данных и управление детьми
 * @dependencies: AuthContext, Navigation, shadcn/ui, ParentProfileEditModal
 * @created: 2024-12-19
 */

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/hooks/use-users';
import { useSchools } from '@/hooks/use-schools';
import { useToast } from '@/hooks/use-toast';
import {
    Phone,
    Mail,
    Baby,
    School as SchoolIcon,
    Users,
    Edit,
    Plus
} from 'lucide-react';
import { ParentProfileEditModal } from '@/components/ui/parent-profile-edit-modal';
import { ParentHeader } from '@/components/ui/parent-header';
import { User as UserType } from '@/types';

const ParentProfile = () => {
    const { user, logout } = useAuth();
    const { getChildrenByParentId } = useUsers();
    const { schools } = useSchools();
    const { toast } = useToast();

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [children, setChildren] = useState<UserType[]>([]);
    const [isLoadingChildren, setIsLoadingChildren] = useState(false);

    // Загружаем детей родителя
    const loadChildren = async () => {
        if (!user?.id) return;

        try {
            setIsLoadingChildren(true);
            const childrenData = await getChildrenByParentId(user.id);
            setChildren(childrenData);
        } catch (error) {
            console.error('Error loading children:', error);
            toast({
                title: "Ошибка",
                description: "Не удалось загрузить данные о детях",
                variant: "destructive",
            });
        } finally {
            setIsLoadingChildren(false);
        }
    };

    // Загружаем детей при монтировании компонента
    useMemo(() => {
        loadChildren();
    }, [user?.id]);

    // Функция для получения названия школы
    const getSchoolName = (schoolId?: string) => {
        if (!schoolId) return '—';
        const school = schools.find(s => s.id === schoolId);
        return school?.name || '—';
    };

    // Функция для получения правильного склонения возраста
    const getAgeText = (age: number) => {
        if (age === 1) return 'год';
        if (age >= 2 && age <= 4) return 'года';
        return 'лет';
    };

    return (
        <div className="min-h-screen bg-gradient-wax-hands">
            <ParentHeader />

            <div className="max-w-4xl mx-auto px-3 sm:px-4 pt-20 sm:pt-24 pb-6 space-y-4 sm:space-y-6">
                {/* Профиль родителя */}
                <Card className="bg-white/95 backdrop-blur-sm border-2 border-orange-300 shadow-lg">
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0">
                            <div>
                                <CardTitle className="text-xl sm:text-2xl lg:text-3xl text-gray-800 break-words">
                                    {user?.name} {user?.surname}
                                </CardTitle>
                                <CardDescription className="text-gray-600 text-sm sm:text-base">
                                    Профиль родителя
                                </CardDescription>
                            </div>
                        </div>
                        <Button
                            onClick={() => setIsEditModalOpen(true)}
                            variant="outline"
                            size="sm"
                            className="border-orange-300 hover:bg-orange-50 w-full sm:w-auto"
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            Редактировать
                        </Button>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {user?.email && (
                            <div className="flex items-center gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                                <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <div className="text-xs sm:text-sm text-gray-500">Email</div>
                                    <div className="font-medium text-sm sm:text-base truncate">{user.email}</div>
                                </div>
                            </div>
                        )}
                        {user?.phone && (
                            <div className="flex items-center gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                                <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <div className="text-xs sm:text-sm text-gray-500">Телефон</div>
                                    <div className="font-medium text-sm sm:text-base">{user.phone}</div>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                            <Baby className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                                <div className="text-xs sm:text-sm text-gray-500">Количество детей</div>
                                <div className="font-medium text-sm sm:text-base">{children.length}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Список детей */}
                <Card className="bg-white/95 backdrop-blur-sm border-2 border-purple-300 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-800 text-lg sm:text-xl">
                            <Baby className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" />
                            Мои дети
                        </CardTitle>
                        <CardDescription className="text-gray-600 text-sm">
                            Управление профилями детей
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingChildren ? (
                            <div className="text-center py-8 text-gray-500">
                                Загрузка данных о детях...
                            </div>
                        ) : children.length === 0 ? (
                            <div className="text-center py-6 sm:py-8 text-gray-500">
                                <Baby className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
                                <p className="text-sm sm:text-base mb-3 sm:mb-4">У вас пока нет добавленных детей</p>
                                <Button
                                    onClick={() => window.location.href = '/parent'}
                                    className="bg-gradient-to-r from-orange-500 to-purple-500 text-sm sm:text-base"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Добавить ребенка
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3 sm:space-y-4">
                                {children.map((child) => (
                                    <div
                                        key={child.id}
                                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 space-y-2 sm:space-y-0"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0 flex-1">
                                            <div className="min-w-0 flex-1">
                                                <div className="font-medium text-sm sm:text-base break-words">
                                                    {child.name} {child.surname}
                                                </div>
                                                <div className="text-xs sm:text-sm text-gray-500 flex flex-wrap items-center gap-2 sm:gap-4 mt-1">
                                                    {child.age && (
                                                        <span className="flex items-center gap-1">
                                                            <Baby className="w-3 h-3" />
                                                            {child.age} {getAgeText(child.age)}
                                                        </span>
                                                    )}
                                                    {child.class && (
                                                        <span className="flex items-center gap-1">
                                                            <Users className="w-3 h-3" />
                                                            {child.class}
                                                        </span>
                                                    )}
                                                    {child.schoolId && (
                                                        <span className="flex items-center gap-1">
                                                            <SchoolIcon className="w-3 h-3" />
                                                            <span className="truncate max-w-32 sm:max-w-48">
                                                                {getSchoolName(child.schoolId)}
                                                            </span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className="capitalize text-xs sm:text-sm w-fit">
                                            {child.role}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <ParentProfileEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
            />
        </div>
    );
};

export default ParentProfile;
