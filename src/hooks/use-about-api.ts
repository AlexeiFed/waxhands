/**
 * @file: use-about-api.ts
 * @description: Хуки для работы с API контента "О нас"
 * @dependencies: api.ts, WebSocket
 * @created: 2024-12-19
 */

import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';

export interface AboutContent {
    id: number;
    title: string;
    subtitle: string;
    description: string;
    studio_title: string;
    studio_description: string;
    advantages_title: string;
    advantages_list: string[];
    process_title: string;
    process_steps: Array<{ title: string, description: string }>;
    safety_title: string;
    safety_description: string;
    contact_info: string;
    created_at: string;
    updated_at: string;
}

export interface AboutMedia {
    id: number;
    filename: string;
    original_name: string;
    type: 'image' | 'video';
    title: string;
    description?: string;
    order_index: number;
    file_path: string;
    created_at: string;
    updated_at: string;
}

export interface CreateAboutMediaRequest {
    filename: string;
    original_name: string;
    type: 'image' | 'video';
    title: string;
    description?: string;
    file_path: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Хук для загрузки контента "О нас"
export function useAboutContent() {
    const [content, setContent] = useState<AboutContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const loadContent = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${API_BASE}/about/content`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            setContent(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки контента';
            setError(errorMessage);
            console.error('Ошибка загрузки контента about:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateContent = useCallback(async (id: number, updates: Partial<AboutContent>) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Токен авторизации не найден');
            }

            // Обрабатываем специальные поля
            let processedUpdates = { ...updates };

            if ('advantages_list' in updates && typeof updates.advantages_list === 'string') {
                // Разбиваем строку на массив по переносам строк
                processedUpdates.advantages_list = updates.advantages_list.split('\n').filter(item => item.trim());
            }

            if ('process_steps' in updates && typeof updates.process_steps === 'string') {
                try {
                    // Парсим JSON строку
                    processedUpdates.process_steps = JSON.parse(updates.process_steps);
                } catch (e) {
                    throw new Error('Неверный формат JSON для шагов процесса');
                }
            }

            const response = await fetch(`${API_BASE}/about/content/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(processedUpdates)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            await loadContent(); // Перезагружаем данные
            toast({
                title: "Контент обновлен",
                description: "Контент страницы 'О нас' успешно обновлен",
            });

            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ошибка обновления контента';
            setError(errorMessage);
            toast({
                title: "Ошибка",
                description: errorMessage,
                variant: "destructive",
            });
            console.error('Ошибка обновления контента about:', err);
            return false;
        }
    }, [loadContent, toast]);

    useEffect(() => {
        loadContent();
    }, [loadContent]);

    return {
        content,
        loading,
        error,
        loadContent,
        updateContent
    };
}

// Хук для загрузки медиа-файлов "О нас"
export function useAboutMedia() {
    const [media, setMedia] = useState<AboutMedia[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const loadMedia = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${API_BASE}/about/media`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            setMedia(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки медиа';
            setError(errorMessage);
            console.error('Ошибка загрузки медиа about:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const addMedia = useCallback(async (mediaData: CreateAboutMediaRequest) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Токен авторизации не найден');
            }

            const response = await fetch(`${API_BASE}/about/media`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(mediaData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            await loadMedia(); // Перезагружаем данные
            toast({
                title: "Медиа добавлено",
                description: "Медиа-файл успешно добавлен",
            });

            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ошибка добавления медиа';
            setError(errorMessage);
            toast({
                title: "Ошибка",
                description: errorMessage,
                variant: "destructive",
            });
            console.error('Ошибка добавления медиа about:', err);
            return false;
        }
    }, [loadMedia, toast]);

    const updateMedia = useCallback(async (id: number, updates: Partial<AboutMedia>) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Токен авторизации не найден');
            }

            const response = await fetch(`${API_BASE}/about/media/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            await loadMedia(); // Перезагружаем данные
            toast({
                title: "Медиа обновлено",
                description: "Медиа-файл успешно обновлен",
            });

            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ошибка обновления медиа';
            setError(errorMessage);
            toast({
                title: "Ошибка",
                description: errorMessage,
                variant: "destructive",
            });
            console.error('Ошибка обновления медиа about:', err);
            return false;
        }
    }, [loadMedia, toast]);

    const deleteMedia = useCallback(async (id: number) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Токен авторизации не найден');
            }

            const response = await fetch(`${API_BASE}/about/media/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            await loadMedia(); // Перезагружаем данные
            toast({
                title: "Медиа удалено",
                description: "Медиа-файл успешно удален",
            });

            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ошибка удаления медиа';
            setError(errorMessage);
            toast({
                title: "Ошибка",
                description: errorMessage,
                variant: "destructive",
            });
            console.error('Ошибка удаления медиа about:', err);
            return false;
        }
    }, [loadMedia, toast]);

    const reorderMedia = useCallback(async (mediaIds: number[]) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Токен авторизации не найден');
            }

            const response = await fetch(`${API_BASE}/about/media/reorder`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ mediaIds })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            await loadMedia(); // Перезагружаем данные
            toast({
                title: "Порядок обновлен",
                description: "Порядок медиа-файлов успешно изменен",
            });

            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ошибка изменения порядка';
            setError(errorMessage);
            toast({
                title: "Ошибка",
                description: errorMessage,
                variant: "destructive",
            });
            console.error('Ошибка изменения порядка медиа about:', err);
            return false;
        }
    }, [loadMedia, toast]);

    useEffect(() => {
        loadMedia();
    }, [loadMedia]);

    return {
        media,
        loading,
        error,
        loadMedia,
        addMedia,
        updateMedia,
        deleteMedia,
        reorderMedia
    };
}

// Хук для WebSocket уведомлений об изменениях about
export function useAboutWebSocket() {
    const [lastUpdate, setLastUpdate] = useState<number>(0);

    useEffect(() => {
        // Подключаемся к WebSocket для получения уведомлений
        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('user');

        if (!token || !user) return;

        const userData = JSON.parse(user);
        const wsUrl = `${WS_BASE_URL}/chat/ws?userId=${userData.id}&isAdmin=${userData.role === 'admin'}`;

        try {
            const ws = new WebSocket(wsUrl);

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);

                    // Обрабатываем события about
                    if (message.type === 'about_content_update' ||
                        message.type === 'about_media_update' ||
                        message.type === 'about_media_added' ||
                        message.type === 'about_media_deleted') {

                        console.log('📡 Получено обновление about:', message.type);
                        setLastUpdate(Date.now());
                    }
                } catch (err) {
                    console.error('Ошибка парсинга WebSocket сообщения:', err);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket ошибка:', error);
            };

            return () => {
                ws.close();
            };
        } catch (err) {
            console.error('Ошибка подключения к WebSocket:', err);
        }
    }, []);

    return { lastUpdate };
}
