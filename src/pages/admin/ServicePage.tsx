/**
 * @file: ServicePage.tsx
 * @description: Полностраничная страница услуги с управлением стилями и опциями
 * @dependencies: use-services, ServiceCard
 * @created: 2025-08-09
 */

import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useServices } from '@/hooks/use-services';
import { ServiceCard } from '@/components/ui/service-card';
import { ArrowLeft } from 'lucide-react';

const AdminServicePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const {
        services,
        loading,
        addStyleToService,
        addOptionToService,
        updateServiceStyle,
        updateServiceOption,
        reorderServiceStyles,
        reorderServiceOptions,
        deleteService,
    } = useServices();

    const service = useMemo(() => services.find(s => s.id === id), [services, id]);

    if (!id) return null;

    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Назад
                    </Button>
                    <h1 className="text-2xl font-bold">Услуга</h1>
                </div>
            </div>

            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Детали услуги</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading && <div className="py-6">Загрузка...</div>}
                    {!loading && service && (
                        <ServiceCard
                            service={service}
                            onAddStyle={(serviceId) => {
                                // делегируем в админскую панель (модальные), здесь базово ничего не открываем
                                console.log('Add style requested for', serviceId);
                            }}
                            onAddOption={(serviceId) => {
                                console.log('Add option requested for', serviceId);
                            }}
                            onViewStyle={(style) => {
                                console.log('View style', style.id);
                            }}
                            onViewOption={(option) => {
                                console.log('View option', option.id);
                            }}
                            onReorderStyles={(serviceId, order) => reorderServiceStyles(serviceId, order)}
                            onReorderOptions={(serviceId, order) => reorderServiceOptions(serviceId, order)}
                            onDelete={(serviceId) => {
                                deleteService(serviceId).then(() => {
                                    navigate('/admin/services');
                                }).catch(console.error);
                            }}
                        />
                    )}
                    {!loading && !service && (
                        <div className="py-6 text-muted-foreground">Услуга не найдена</div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminServicePage;


