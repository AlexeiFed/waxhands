import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { User } from '../types';

interface UseUsersReturn {
    users: User[];
    loading: boolean;
    error: string | null;
    total: number;
    lastFetch: Date | null;
    fetchUsers: (params?: {
        page?: number;
        limit?: number;
        role?: string;
    }) => Promise<void>;
    refreshUsers: () => Promise<void>;
    createUser: (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateUser: (id: string, userData: Partial<User>) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;
    getUserById: (id: string) => Promise<User>;
    getChildrenByParentId: (parentId: string) => Promise<User[]>;
}

export const useUsers = (): UseUsersReturn => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [total, setTotal] = useState(0);
    const [lastFetch, setLastFetch] = useState<Date | null>(null);

    const fetchUsers = useCallback(async (params?: { page?: number; limit?: number; role?: string }) => {
        try {
            setLoading(true);
            setError(null);
            console.log('🔍 fetchUsers called with params:', params);

            const response = await api.users.getUsers(params);
            console.log('📡 API response:', response);

            setUsers(response.users);
            setTotal(response.total);
            setLastFetch(new Date());
            console.log('✅ Users set to state:', response.users.length);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch users');
            console.error('❌ Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // НЕ загружаем всех пользователей автоматически - это вызывает 403 ошибку для родителей
    // useEffect(() => {
    //     console.log('🚀 useUsers hook mounted, fetching users...');
    //     fetchUsers();
    // }, [fetchUsers]);

    // Функция для принудительного обновления данных
    const refreshUsers = useCallback(async () => {
        console.log('🔄 Force refreshing users...');
        await fetchUsers();
    }, [fetchUsers]);

    const createUser = useCallback(async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            setLoading(true);
            setError(null);
            await api.users.createUser(userData);
            // Обновляем список пользователей после создания
            await fetchUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create user');
            console.error('Error creating user:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchUsers]);

    const updateUser = useCallback(async (id: string, userData: Partial<User>) => {
        try {
            setLoading(true);
            setError(null);
            await api.users.updateUser(id, userData);
            // Обновляем список пользователей после обновления
            await fetchUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update user');
            console.error('Error updating user:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchUsers]);

    const deleteUser = useCallback(async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            await api.users.deleteUser(id);
            // Обновляем список пользователей после удаления
            await fetchUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete user');
            console.error('Error deleting user:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchUsers]);

    const getChildrenByParentId = useCallback(async (parentId: string): Promise<User[]> => {
        try {
            const response = await api.users.getChildrenByParentId(parentId);
            return response;
        } catch (err) {
            console.error('Error fetching children:', err);
            return [];
        }
    }, []);

    const getUserById = useCallback(async (id: string): Promise<User> => {
        try {
            setError(null);
            return await api.users.getUserById(id);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to get user';
            setError(errorMessage);
            console.error('Error getting user:', err);
            throw err;
        }
    }, []);


    return {
        users,
        loading,
        error,
        total,
        lastFetch,
        fetchUsers,
        refreshUsers,
        createUser,
        updateUser,
        deleteUser,
        getUserById,
        getChildrenByParentId,
    };
}; 