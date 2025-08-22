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

    const initials = useMemo(() => {
        const name = user?.name || '';
        const surname = user?.surname || '';
        return (name[0] + surname[0]).toUpperCase();
    }, [user?.name, user?.surname]);

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
        <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-blue-100">
            <ParentHeader showBackButton={true} />

            <div className="max-w-4xl mx-auto px-4 pt-28 pb-6 space-y-6">
                {/* Профиль родителя */}
                <Card className="bg-white/90 border-orange-200">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                                {initials}
                            </div>
                            <div>
                                <CardTitle className="text-3xl">{user?.name} {user?.surname}</CardTitle>
                                <CardDescription>Профиль родителя</CardDescription>
                            </div>
                        </div>
                        <Button
                            onClick={() => setIsEditModalOpen(true)}
                            variant="outline"
                            size="sm"
                            className="border-orange-300 hover:bg-orange-50"
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            Редактировать
                        </Button>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {user?.email && (
                            <div className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-blue-600" />
                                <div>
                                    <div className="text-sm text-gray-500">Email</div>
                                    <div className="font-medium">{user.email}</div>
                                </div>
                            </div>
                        )}
                        {user?.phone && (
                            <div className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-green-600" />
                                <div>
                                    <div className="text-sm text-gray-500">Телефон</div>
                                    <div className="font-medium">{user.phone}</div>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <Baby className="w-5 h-5 text-pink-600" />
                            <div>
                                <div className="text-sm text-gray-500">Количество детей</div>
                                <div className="font-medium">{children.length}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Список детей */}
                <Card className="bg-white/90 border-purple-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Baby className="w-5 h-5 text-pink-600" />
                            Мои дети
                        </CardTitle>
                        <CardDescription>
                            Управление профилями детей
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingChildren ? (
                            <div className="text-center py-8 text-gray-500">
                                Загрузка данных о детях...
                            </div>
                        ) : children.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Baby className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p>У вас пока нет добавленных детей</p>
                                <Button
                                    onClick={() => window.location.href = '/parent'}
                                    className="mt-4 bg-gradient-to-r from-orange-500 to-purple-500"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Добавить ребенка
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {children.map((child) => (
                                    <div
                                        key={child.id}
                                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-blue-500 flex items-center justify-center text-white font-bold">
                                                {child.name?.[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-medium">
                                                    {child.name} {child.surname}
                                                </div>
                                                <div className="text-sm text-gray-500 flex items-center gap-4">
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
                                                            {getSchoolName(child.schoolId)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className="capitalize">
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
