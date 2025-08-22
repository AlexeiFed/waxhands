/**
 * @file: About.tsx
 * @description: Страница «О студии» для ребёнка: афиши и видеогалерея с автоподхватом mp4 из assets
 * @dependencies: ChildHeader, shadcn/ui
 * @created: 2025-08-09
 */
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PlayCircle } from 'lucide-react';
import { ChildHeader } from '@/components/ui/child-header';
import { useServices } from '@/hooks/use-services';

const AboutChild = () => {
    const [videoDialogSrc, setVideoDialogSrc] = useState<string | null>(null);
    const { services } = useServices();
    const videos = useMemo(() => {
        const mods = import.meta.glob('@/assets/video/*.mp4', { eager: true }) as Record<string, { default: string }>;
        return Object.values(mods).map(m => m.default);
    }, []);

    const posters = useMemo(() => {
        const mods = import.meta.glob('@/assets/posters/*.{png,jpg,jpeg,webp}', { eager: true }) as Record<string, { default: string }>;
        return Object.values(mods).map(m => m.default);
    }, []);

    const waxService = useMemo(() => services.find(s => s.name?.toLowerCase().includes('восков') || s.name?.toLowerCase().includes('ручк')), [services]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-blue-100">
            <ChildHeader />
            <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
                <Card className="bg-white/90 border-orange-200">
                    <CardHeader>
                        <CardTitle>О студии «МК Восковые ручки»</CardTitle>
                        <CardDescription>Творческие мастер‑классы для детей</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-gray-700">Мы работаем с 2015 года в Хабаровске и далеко за его пределами. Выезжаем в сады/школы/лагеря . А так же можем приехать к вам на праздник. За все время  мы создали  более 120000 тысяч ручек. Более 120000 улыбок.
                            Восковые ручки – это интерактивный захватывающий процесс создания 3d копии руки за 5-7 минут, которую как сувенир вы забираете с собой   на долгую память. Каждый участник может выбрать свою форму и цвет ручки, создавая уникальную композицию. Вы  полностью задействованы в процессе. Весь интерактив сопровождается бурей эмоций и улыбками!
                            Абсолютно безопасное и полезное развлечение для любого возраста (+3).
                            Парафин  смягчает кожу рук. Педиатры даже рекомендуют его для профилактики .
                            Приятные ощущения для кожи рук, в сочетании со СПА-эффектом.</p>
                        {posters.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {posters.map((src) => (
                                    <img key={src} src={src} className="w-full rounded-md border object-cover" />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-white/90 border-purple-200">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Видео</CardTitle>
                            <Badge variant="secondary">{videos.length}</Badge>
                        </div>
                        <CardDescription>Как проходит мастер-класс</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {videos.map((src) => (
                                <div key={src} className="relative group rounded-lg overflow-hidden border">
                                    <video src={src} className="w-full h-48 object-cover" muted preload="metadata" />
                                    <button className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition" onClick={() => setVideoDialogSrc(src)} aria-label="Смотреть видео">
                                        <PlayCircle className="w-12 h-12 text-white" />
                                    </button>
                                </div>
                            ))}
                            {videos.length === 0 && (
                                <div className="text-sm text-gray-600">Добавьте .mp4 в папку `src/assets/video`</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {waxService && (
                    <Card className="bg-white/90 border-orange-200">
                        <CardHeader>
                            <CardTitle>Наши стили и опции</CardTitle>
                            <CardDescription>Актуальные позиции и цены</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-semibold mb-2">Стили</h3>
                                <ul className="space-y-2 text-sm">
                                    {waxService.styles.map(s => (
                                        <li key={s.id} className="flex justify-between border-b py-1">
                                            <span>{s.name}</span>
                                            <span className="font-medium">{s.price} ₽</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">Опции</h3>
                                <ul className="space-y-2 text-sm">
                                    {waxService.options.map(o => (
                                        <li key={o.id} className="flex justify-between border-b py-1">
                                            <span>{o.name}</span>
                                            <span className="font-medium">{o.price} ₽</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <Dialog open={!!videoDialogSrc} onOpenChange={(o) => !o && setVideoDialogSrc(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Видео о мастер‑классе</DialogTitle>
                        <DialogDescription className="sr-only">
                            Модальное окно для просмотра видео о мастер-классе
                        </DialogDescription>
                    </DialogHeader>
                    {videoDialogSrc && <video src={videoDialogSrc} className="w-full" controls autoPlay />}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AboutChild;


