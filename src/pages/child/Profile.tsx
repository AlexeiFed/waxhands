/**
 * @file: Profile.tsx
 * @description: Профиль ребёнка: отображение персональных данных, школы и класса, быстрые действия
 * @dependencies: AuthContext, ChildHeader, shadcn/ui, ChildProfileEditModal
 * @created: 2025-08-09
 */
import { useMemo, useState } from 'react';
import { ChildHeader } from '@/components/ui/child-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, User, School as SchoolIcon, Users, Calendar, Baby, Edit } from 'lucide-react';
import { useSchools } from '@/hooks/use-schools';
import { ChildProfileEditModal } from '@/components/ui/child-profile-edit-modal';

const ChildProfile = () => {
    const { user, logout } = useAuth();
    const { schools } = useSchools();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const initials = useMemo(() => (user?.name || '?')[0]?.toUpperCase(), [user?.name]);

    const schoolDisplayName = useMemo(() => {
        // Приоритет 1: Поиск по schoolId
        if (user?.schoolId) {
            const school = schools.find(s => s.id === user.schoolId);
            if (school) {
                return school.name;
            }
        }

        // Приоритет 2: Поиск по названию школы
        if (user?.schoolName) {
            return user.schoolName;
        }

        // Приоритет 3: Поиск по классу среди всех школ
        if (user?.class) {
            const schoolWithClass = schools.find(s => s.classes.includes(user.class));
            if (schoolWithClass) {
                return schoolWithClass.name;
            }
        }

        return '—';
    }, [schools, user?.schoolId, user?.schoolName, user?.class]);

    // Функция для получения правильного склонения возраста
    const getAgeText = (age: number) => {
        if (age === 1) return 'год';
        if (age >= 2 && age <= 4) return 'года';
        return 'лет';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-blue-100">
            <ChildHeader />

            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                <Card className="bg-white/90 border-orange-200">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                                {initials}
                            </div>
                            <div>
                                <CardTitle className="text-2xl">{user?.name}</CardTitle>
                                <CardDescription>Мой профиль</CardDescription>
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
                        {user?.age && (
                            <div className="flex items-center gap-3">
                                <Baby className="w-5 h-5 text-pink-600" />
                                <div>
                                    <div className="text-sm text-gray-500">Возраст</div>
                                    <div className="font-medium">{user.age} {getAgeText(user.age)}</div>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <SchoolIcon className="w-5 h-5 text-purple-600" />
                            <div>
                                <div className="text-sm text-gray-500">Школа</div>
                                <div className="font-medium">{schoolDisplayName}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-blue-600" />
                            <div>
                                <div className="text-sm text-gray-500">Класс/группа</div>
                                <div className="font-medium">{user?.class || '—'}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white/90 border-purple-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-orange-600" /> Быстрые действия</CardTitle>
                        <CardDescription>Что хочешь сделать?</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-3">
                        <Button onClick={logout} variant="outline" className="border-orange-300">Выйти</Button>
                        <Button onClick={() => window.location.href = '/child'} className="bg-gradient-to-r from-orange-500 to-purple-500 text-white">На главную</Button>
                    </CardContent>
                </Card>
            </div>

            <ChildProfileEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
            />
        </div>
    );
};

export default ChildProfile;

