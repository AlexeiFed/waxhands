/**
 * @file: use-invoices-websocket.ts
 * @description: WebSocket хук для автоматических обновлений счетов
 * @dependencies: WebSocket, React Query
 * @created: 2024-12-19
 */

import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { WS_BASE_URL } from '@/lib/config';

interface UseInvoicesWebSocketProps {
    userId?: string;
    enabled?: boolean;
    listenAll?: boolean;
    onInvoiceUpdate?: (invoiceId: string, status: string, masterClassId?: string) => void;
}

export const useInvoicesWebSocket = ({
    userId,
    enabled = true,
    listenAll = false,
    onInvoiceUpdate
}: UseInvoicesWebSocketProps) => {
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<number>(0);
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!enabled || !userId) return;

        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('user');

        if (!token || !user) return;

        const userData = JSON.parse(user);
        const wsUrl = `${WS_BASE_URL}/ws?userId=${userData.id}&isAdmin=${userData.role === 'admin'}`;

        let ws: WebSocket;

        try {
            ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                setIsConnected(true);
                console.log('🔌 WebSocket подключен для счетов');

                const channels = new Set<string>();
                channels.add('system:all');
                channels.add(`user:${userData.id}`);

                if (listenAll || userData.role === 'admin') {
                    channels.add('admin:all');
                }

                try {
                    ws.send(JSON.stringify({
                        type: 'subscribe',
                        channels: Array.from(channels),
                        userId: userData.id,
                        userRole: userData.role
                    }));
                } catch (subscriptionError) {
                    console.error('❌ Ошибка подписки на WebSocket каналы для счетов:', subscriptionError);
                }
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);

                    // Обрабатываем события счетов
                    if (message.type === 'invoice_update') {
                        const { invoiceId, userId: targetUserId, status, masterClassId } = message.data;
                        
                        console.log('📡 [WebSocket Frontend] INVOICE_UPDATE получено:', {
                            invoiceId,
                            targetUserId,
                            status,
                            masterClassId,
                            currentUserId: userId,
                            listenAll,
                            userRole: userData.role,
                            timestamp: new Date().toISOString()
                        });
                        
                        // Для админа обрабатываем все события, для родителя — только свои
                        if (listenAll || targetUserId === userId) {
                            console.log('✅ [WebSocket Frontend] INVOICE_UPDATE обрабатывается - инвалидация кеша');
                            
                            // Инвалидируем кэш счетов
                            queryClient.invalidateQueries({ queryKey: ['invoices', 'parent', userId] });
                            queryClient.invalidateQueries({ queryKey: ['invoices', 'parent'] });
                            queryClient.invalidateQueries({ queryKey: ['invoices'] });
                            
                            // Обновляем счет по ID
                            queryClient.invalidateQueries({ queryKey: ['invoices', 'participant', invoiceId] });
                            
                            // Принудительно обновляем мастер-классы если есть masterClassId
                            if (masterClassId) {
                                console.log('🔄 [WebSocket Frontend] Обновляем мастер-класс:', masterClassId);
                                queryClient.invalidateQueries({ queryKey: ['master-classes'] });
                                queryClient.invalidateQueries({ queryKey: ['master-class-event', masterClassId] });
                                // Принудительно вызываем refetch для немедленного обновления
                                queryClient.refetchQueries({ queryKey: ['master-classes'] }).catch(console.error);
                                queryClient.refetchQueries({ queryKey: ['master-class-event', masterClassId] }).catch(console.error);
                            }
                            
                            setLastUpdate(Date.now());
                            
                            // Вызываем callback если передан
                            if (onInvoiceUpdate) {
                                onInvoiceUpdate(invoiceId, status, masterClassId);
                            }
                        } else {
                            console.log('⚠️ [WebSocket Frontend] INVOICE_UPDATE проигнорировано - не для этого пользователя');
                        }
                    }
                } catch (err) {
                    console.error('❌ Ошибка парсинга WebSocket сообщения для счетов:', err);
                }
            };

            ws.onerror = (error) => {
                console.error('❌ WebSocket ошибка для счетов:', error);
                setIsConnected(false);
            };

            ws.onclose = () => {
                setIsConnected(false);
                console.log('🔌 WebSocket отключен для счетов');
            };

            return () => {
                ws.close();
            };
        } catch (err) {
            console.error('❌ Ошибка подключения к WebSocket для счетов:', err);
        }
    }, [enabled, userId, queryClient, onInvoiceUpdate, listenAll]);

    return {
        isConnected,
        lastUpdate
    };
};




