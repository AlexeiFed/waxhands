/**
 * @file: use-contacts.ts
 * @description: Хук для работы с контактными данными
 * @dependencies: api.contacts
 * @created: 2024-12-25
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const useContacts = () => {
    return useQuery({
        queryKey: ['contacts'],
        queryFn: () => api.contacts.getContacts(),
        staleTime: 5 * 60 * 1000, // 5 минут
        retry: 3,
    });
};
