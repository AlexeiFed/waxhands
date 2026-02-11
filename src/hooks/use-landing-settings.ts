/**
 * @file: use-landing-settings.ts
 * @description: Хук для управления настройками лендинга (включение/отключение регистрации и входа)
 * @dependencies: React Query, api.ts
 * @created: 2026-01-19
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const LANDING_SETTINGS_QUERY_KEY = ['landing-settings'] as const;

interface LandingSettingsData {
    registrationEnabled: boolean;
    updatedAt: string | null;
}

export const useLandingSettings = () => {
    const queryClient = useQueryClient();

    const { data, isLoading, isFetching, error, refetch } = useQuery<LandingSettingsData>({
        queryKey: LANDING_SETTINGS_QUERY_KEY,
        queryFn: api.landingSettings.get,
        staleTime: 0,
        gcTime: 5 * 60 * 1000,
        refetchOnMount: 'always',
        refetchOnReconnect: 'always',
        refetchOnWindowFocus: true
    });

    const { mutateAsync, isPending } = useMutation<LandingSettingsData, Error, boolean>({
        mutationKey: ['landing-settings', 'update'],
        mutationFn: async (registrationEnabled: boolean) => api.landingSettings.update({ registrationEnabled }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: LANDING_SETTINGS_QUERY_KEY });
        }
    });

    const toggleRegistration = async (registrationEnabled: boolean) => {
        const result = await mutateAsync(registrationEnabled);
        return result;
    };

    const settings: LandingSettingsData = {
        registrationEnabled: data?.registrationEnabled ?? false,
        updatedAt: data?.updatedAt ?? null
    };

    return {
        ...settings,
        isLoading: isLoading || isFetching,
        isUpdating: isPending,
        error,
        toggleRegistration
    };
};

// Хук для админ-панели (использует защищенный endpoint)
export const useLandingSettingsAdmin = () => {
    const queryClient = useQueryClient();

    const { data, isLoading, isFetching, error, refetch } = useQuery<LandingSettingsData>({
        queryKey: [...LANDING_SETTINGS_QUERY_KEY, 'admin'],
        queryFn: api.landingSettings.getAdmin,
        staleTime: 0,
        gcTime: 5 * 60 * 1000,
        refetchOnMount: 'always',
        refetchOnReconnect: 'always',
        refetchOnWindowFocus: true
    });

    const { mutateAsync, isPending } = useMutation<LandingSettingsData, Error, boolean>({
        mutationKey: ['landing-settings', 'update'],
        mutationFn: async (registrationEnabled: boolean) => api.landingSettings.update({ registrationEnabled }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: LANDING_SETTINGS_QUERY_KEY });
        }
    });

    const toggleRegistration = async (registrationEnabled: boolean) => {
        const result = await mutateAsync(registrationEnabled);
        return result;
    };

    const settings: LandingSettingsData = {
        registrationEnabled: data?.registrationEnabled ?? false,
        updatedAt: data?.updatedAt ?? null
    };

    return {
        ...settings,
        isLoading: isLoading || isFetching,
        isUpdating: isPending,
        error,
        toggleRegistration
    };
};

