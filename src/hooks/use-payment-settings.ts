/**
 * @file: use-payment-settings.ts
 * @description: Хук для управления глобальными настройками оплаты Robokassa
 * @dependencies: React Query, api.ts
 * @created: 2025-11-09
 */

import { useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useWebSocketContext } from '@/contexts/WebSocketContext';

export const PAYMENT_SETTINGS_QUERY_KEY = ['payment-settings'] as const;

interface PaymentSettingsData {
    isEnabled: boolean;
    updatedAt: string | null;
}

let activeSubscriptionCleanup: (() => void) | null = null;
let activeSubscribers = 0;

export const usePaymentSettings = () => {
    const queryClient = useQueryClient();
    const { subscribe } = useWebSocketContext();

    const { data, isLoading, isFetching, error, refetch } = useQuery<PaymentSettingsData>({
        queryKey: PAYMENT_SETTINGS_QUERY_KEY,
        queryFn: api.paymentSettings.get,
        staleTime: 0,
        gcTime: 5 * 60 * 1000,
        refetchOnMount: 'always',
        refetchOnReconnect: 'always',
        refetchOnWindowFocus: true
    });

    const { mutateAsync, isPending } = useMutation<PaymentSettingsData, Error, boolean>({
        mutationKey: ['payment-settings', 'update'],
        mutationFn: async (isEnabled: boolean) => api.paymentSettings.update({ isEnabled }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PAYMENT_SETTINGS_QUERY_KEY });
        }
    });

    const togglePayment = useCallback(
        async (isEnabled: boolean) => {
            const result = await mutateAsync(isEnabled);
            return result;
        },
        [mutateAsync]
    );

    useEffect(() => {
        activeSubscribers += 1;

        if (!activeSubscriptionCleanup) {
            const handlers = [
                subscribe('payment-settings-sync', (message) => {
                    try {
                        if (
                            (message?.type === 'master_class_update' && message?.data?.action === 'payment_settings_changed') ||
                            message?.type === 'payment_settings_changed'
                        ) {
                            queryClient.invalidateQueries({ queryKey: PAYMENT_SETTINGS_QUERY_KEY });
                        }
                    } catch (subscriptionError) {
                        console.error('❌ Payment settings subscription error:', subscriptionError);
                    }
                }),
                subscribe('payment_settings_changed', () => {
                    queryClient.invalidateQueries({ queryKey: PAYMENT_SETTINGS_QUERY_KEY });
                    void refetch();
                }),
                subscribe('master_class_update', (message) => {
                try {
                        if (message?.type === 'master_class_update' && message?.data?.action === 'payment_settings_changed') {
                        queryClient.invalidateQueries({ queryKey: PAYMENT_SETTINGS_QUERY_KEY });
                            void refetch();
                    }
                } catch (subscriptionError) {
                    console.error('❌ Payment settings subscription error:', subscriptionError);
                }
                })
            ];

            activeSubscriptionCleanup = () => {
                handlers.forEach((unsubscribeHandler) => {
                    try {
                        unsubscribeHandler();
                    } catch (cleanupError) {
                        console.error('❌ Payment settings unsubscribe error:', cleanupError);
                    }
                });
            };
        }

        return () => {
            activeSubscribers = Math.max(0, activeSubscribers - 1);
            if (activeSubscribers === 0 && activeSubscriptionCleanup) {
                activeSubscriptionCleanup();
                activeSubscriptionCleanup = null;
            }
        };
    }, [queryClient, subscribe, refetch]);

    const settings: PaymentSettingsData = {
        isEnabled: data?.isEnabled ?? false,
        updatedAt: data?.updatedAt ?? null
    };

    return {
        ...settings,
        isLoading: isLoading || isFetching,
        isUpdating: isPending,
        error,
        togglePayment
    };
};

