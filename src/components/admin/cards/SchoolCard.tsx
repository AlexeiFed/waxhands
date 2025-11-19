/**
 * @file: SchoolCard.tsx
 * @description: Карточка школы для мобильной админ-панели
 * @dependencies: AdminCardBase, shadcn/ui components, types/School
 * @created: 2025-11-10
 */

import React from 'react';
import { School } from '@/types';
import { AdminCardBase } from './AdminCardBase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Building2, MapPin, Phone, Users, NotebookPen, Trash2 } from 'lucide-react';

interface SchoolCardProps {
    school: School;
    className?: string;
    onEdit?: (school: School) => void;
    onDelete?: (school: School) => void;
}

export const SchoolCard: React.FC<SchoolCardProps> = ({
    school,
    className,
    onEdit,
    onDelete
}) => {
    const classList = school.classes || [];
    const classesPreview = classList.slice(0, 3);
    const hasMoreClasses = classList.length > classesPreview.length;

    return (
        <AdminCardBase
            title={school.name}
            subtitle={school.address}
            leading={(
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                    <Building2 className="h-5 w-5" />
                </span>
            )}
            meta={(
                <Badge variant="secondary" className="bg-orange-50 text-orange-600 border-orange-200">
                    {classList.length > 0 ? (
                        <>
                            <Users className="mr-1 h-3 w-3" />
                            {classList.length} классов
                        </>
                    ) : (
                        'Нет классов'
                    )}
                </Badge>
            )}
            actions={(
                <div className="flex items-center gap-1">
                    {onEdit && (
                        <Button variant="ghost" size="icon" onClick={() => onEdit(school)} aria-label="Редактировать школу">
                            <NotebookPen className="h-4 w-4" />
                        </Button>
                    )}
                    {onDelete && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" aria-label="Удалить школу">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Удалить школу?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Это действие нельзя отменить. Школа будет удалена навсегда.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDelete(school)} className="bg-red-600 hover:bg-red-700">
                                        Удалить
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            )}
            className={className}
        >
            <div className="space-y-3 text-sm text-gray-700">
                {school.teacher && (
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-orange-500" />
                        <span className="font-medium">{school.teacher}</span>
                    </div>
                )}

                {school.teacherPhone && (
                    <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-blue-500" />
                        <span>{school.teacherPhone}</span>
                    </div>
                )}

                {school.address && (
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-purple-500" />
                        <span>{school.address}</span>
                    </div>
                )}

                {school.notes && (
                    <div className="rounded-lg bg-orange-50/80 p-3 text-xs text-gray-600">
                        <span className="font-semibold text-orange-700">Заметки:</span> {school.notes}
                    </div>
                )}

                {classList.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                        {classesPreview.map((className) => (
                            <Badge
                                key={className}
                                variant="outline"
                                className="border-orange-200 bg-white text-orange-600"
                            >
                                {className}
                            </Badge>
                        ))}
                        {hasMoreClasses && (
                            <span className="text-xs text-muted-foreground">
                                + ещё {classList.length - classesPreview.length}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </AdminCardBase>
    );
};

export default SchoolCard;

