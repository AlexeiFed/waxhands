/**
 * @file: backend/src/controllers/workshopRequests.ts
 * @description: Контроллер для управления заявками на проведение мастер-классов
 * @dependencies: connection.ts, types/workshop-requests.ts
 * @created: 2024-12-19
 */

import { db } from '../database/connection.js';
import {
    WorkshopRequest,
    CreateWorkshopRequestData,
    UpdateWorkshopRequestData,
    WorkshopRequestWithParent,
    ApiResponse
} from '../types/index.js';
import { wsManager } from '../websocket-server.js';

export class WorkshopRequestsController {

    // Получение ID админа
    private static async getAdminId(): Promise<string | null> {
        try {
            const query = `
                SELECT id FROM users 
                WHERE role = 'admin' 
                ORDER BY created_at ASC 
                LIMIT 1
            `;

            const result = await db.query(query);
            return result.rows.length > 0 ? result.rows[0].id : null;
        } catch (error) {
            console.error('Ошибка при получении ID админа:', error);
            return null;
        }
    }

    // Создание новой заявки
    static async createRequest(data: CreateWorkshopRequestData): Promise<ApiResponse<WorkshopRequestWithParent>> {
        try {
            // Получаем ID админа для автоматического назначения
            const adminId = await this.getAdminId();

            if (!adminId) {
                return {
                    success: false,
                    error: 'Не найден администратор в системе'
                };
            }

            const query = `
                INSERT INTO workshop_requests (parent_id, school_name, class_group, desired_date, notes, admin_id)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id
            `;

            const result = await db.query(query, [
                data.parent_id,
                data.school_name,
                data.class_group,
                data.desired_date,
                data.notes || null,
                adminId
            ]);

            const requestId = result.rows[0].id;

            // Получаем созданную заявку с информацией о родителе
            const createdRequest = await this.getRequestById(requestId);

            if (!createdRequest) {
                return {
                    success: false,
                    error: 'Не удалось получить созданную заявку'
                };
            }

            // Отправляем WebSocket уведомление о создании заявки
            try {
                if (wsManager) {
                    wsManager.notifyWorkshopRequestCreated(requestId, {
                        parentId: data.parent_id,
                        schoolName: data.school_name,
                        classGroup: data.class_group,
                        desiredDate: data.desired_date,
                        notes: data.notes
                    });
                    console.log('📋 WebSocket: Отправлено уведомление о создании заявки:', requestId);
                }
            } catch (wsError) {
                console.warn('⚠️ WebSocket: Не удалось отправить уведомление о создании заявки:', wsError);
                // Не прерываем выполнение, если WebSocket недоступен
            }

            return {
                success: true,
                data: createdRequest,
                message: 'Заявка успешно создана'
            };
        } catch (error) {
            console.error('Ошибка при создании заявки:', error);
            return {
                success: false,
                error: 'Не удалось создать заявку'
            };
        }
    }

    // Получение заявки по ID
    static async getRequestById(id: string): Promise<WorkshopRequestWithParent | null> {
        try {
            const query = `
                SELECT 
                    wr.*,
                    u.name as parent_name,
                    u.surname as parent_surname,
                    u.phone as parent_phone,
                    u.email as parent_email,
                    a.name as admin_name
                FROM workshop_requests wr
                LEFT JOIN users u ON wr.parent_id = u.id
                LEFT JOIN users a ON wr.admin_id = a.id
                WHERE wr.id = $1
            `;

            const result = await db.query(query, [id]);

            if (result.rows.length === 0) {
                return null;
            }

            return result.rows[0] as WorkshopRequestWithParent;
        } catch (error) {
            console.error('Ошибка при получении заявки:', error);
            return null;
        }
    }

    // Получение всех заявок с информацией о родителях
    static async getAllRequests(): Promise<ApiResponse<WorkshopRequestWithParent[]>> {
        try {
            console.log('🔍 WorkshopRequestsController.getAllRequests: Запрос всех заявок...');

            const query = `
                SELECT 
                    wr.*,
                    u.name as parent_name,
                    u.surname as parent_surname,
                    u.phone as parent_phone,
                    u.email as parent_email,
                    a.name as admin_name
                FROM workshop_requests wr
                LEFT JOIN users u ON wr.parent_id = u.id
                LEFT JOIN users a ON wr.admin_id = a.id
                ORDER BY wr.created_at DESC
            `;

            const result = await db.query(query);
            console.log('✅ WorkshopRequestsController.getAllRequests: Найдено заявок:', result.rows.length);
            console.log('📋 WorkshopRequestsController.getAllRequests: Данные заявок:', result.rows);

            return {
                success: true,
                data: result.rows as WorkshopRequestWithParent[]
            };
        } catch (error) {
            console.error('Ошибка при получении заявок:', error);
            return {
                success: false,
                error: 'Не удалось получить заявки'
            };
        }
    }

    // Получение заявок родителя
    static async getRequestsByParentId(parentId: string): Promise<ApiResponse<WorkshopRequestWithParent[]>> {
        try {
            const query = `
                SELECT 
                    wr.*,
                    u.name as parent_name,
                    u.surname as parent_surname,
                    u.phone as parent_phone,
                    u.email as parent_email,
                    a.name as admin_name
                FROM workshop_requests wr
                LEFT JOIN users u ON wr.parent_id = u.id
                LEFT JOIN users a ON wr.admin_id = a.id
                WHERE wr.parent_id = $1 
                ORDER BY wr.created_at DESC
            `;

            const result = await db.query(query, [parentId]);

            return {
                success: true,
                data: result.rows as WorkshopRequestWithParent[]
            };
        } catch (error) {
            console.error('Ошибка при получении заявок родителя:', error);
            return {
                success: false,
                error: 'Не удалось получить заявки'
            };
        }
    }

    // Обновление статуса заявки (для админа)
    static async updateRequestStatus(
        id: string,
        data: UpdateWorkshopRequestData
    ): Promise<ApiResponse<WorkshopRequestWithParent>> {
        try {
            const updateFields = [];
            const updateValues = [];

            let paramIndex = 1;
            if (data.status !== undefined) {
                updateFields.push(`status = $${paramIndex++}`);
                updateValues.push(data.status);
            }

            if (data.admin_notes !== undefined) {
                updateFields.push(`admin_notes = $${paramIndex++}`);
                updateValues.push(data.admin_notes || null);
            }

            if (updateFields.length === 0) {
                return {
                    success: false,
                    error: 'Нет полей для обновления'
                };
            }

            updateFields.push('updated_at = CURRENT_TIMESTAMP');

            const query = `
                UPDATE workshop_requests 
                SET ${updateFields.join(', ')}
                WHERE id = $${paramIndex}
            `;

            updateValues.push(id);

            await db.query(query, updateValues);

            // Получаем обновленную заявку
            const updatedRequest = await this.getRequestById(id);

            if (!updatedRequest) {
                return {
                    success: false,
                    error: 'Не удалось найти обновленную заявку'
                };
            }

            // Отправляем WebSocket уведомление об обновлении статуса
            try {
                if (wsManager && data.status) {
                    wsManager.notifyWorkshopRequestStatusChange(
                        id,
                        data.status,
                        data.admin_notes || undefined
                    );
                    console.log('📋 WebSocket: Отправлено уведомление об изменении статуса заявки:', id);
                }
            } catch (wsError) {
                console.warn('⚠️ WebSocket: Не удалось отправить уведомление:', wsError);
                // Не прерываем выполнение, если WebSocket недоступен
            }

            return {
                success: true,
                data: updatedRequest,
                message: 'Заявка успешно обновлена'
            };
        } catch (error) {
            console.error('Ошибка при обновлении заявки:', error);
            return {
                success: false,
                error: 'Не удалось обновить заявку'
            };
        }
    }

    // Удаление заявки
    static async deleteRequest(id: string): Promise<ApiResponse<boolean>> {
        try {
            const query = `DELETE FROM workshop_requests WHERE id = $1`;
            await db.query(query, [id]);

            return {
                success: true,
                data: true,
                message: 'Заявка успешно удалена'
            };
        } catch (error) {
            console.error('Ошибка при удалении заявки:', error);
            return {
                success: false,
                error: 'Не удалось удалить заявку'
            };
        }
    }

    // Получение статистики заявок
    static async getRequestsStats(): Promise<ApiResponse<{
        total: number;
        pending: number;
        approved: number;
        rejected: number;
    }>> {
        try {
            console.log('📊 WorkshopRequestsController.getRequestsStats: Начинаем получение статистики...');

            // Сначала проверим, есть ли вообще заявки в таблице
            const checkQuery = `SELECT COUNT(*) as count FROM workshop_requests`;
            const checkResult = await db.query(checkQuery);
            console.log('📊 WorkshopRequestsController.getRequestsStats: Всего записей в таблице:', checkResult.rows[0].count);

            const query = `
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
                FROM workshop_requests
            `;

            console.log('📊 WorkshopRequestsController.getRequestsStats: Выполняем запрос:', query);
            const result = await db.query(query);
            const stats = result.rows[0];

            console.log('📊 WorkshopRequestsController.getRequestsStats: Сырые данные статистики:', stats);
            console.log('📊 WorkshopRequestsController.getRequestsStats: Типы данных:', {
                total: typeof stats.total,
                pending: typeof stats.pending,
                approved: typeof stats.approved,
                rejected: typeof stats.rejected
            });

            const processedStats = {
                total: Number(stats.total) || 0,
                pending: Number(stats.pending) || 0,
                approved: Number(stats.approved) || 0,
                rejected: Number(stats.rejected) || 0
            };

            console.log('📊 WorkshopRequestsController.getRequestsStats: Обработанная статистика:', processedStats);

            return {
                success: true,
                data: processedStats
            };
        } catch (error) {
            console.error('❌ WorkshopRequestsController.getRequestsStats: Ошибка при получении статистики заявок:', error);
            return {
                success: false,
                error: 'Не удалось получить статистику'
            };
        }
    }

    // Получение статистики заявок родителя
    static async getRequestsStatsByParentId(parentId: string): Promise<ApiResponse<{
        total: number;
        pending: number;
        approved: number;
        rejected: number;
    }>> {
        try {
            console.log('📊 WorkshopRequestsController.getRequestsStatsByParentId: Начинаем получение статистики для родителя:', parentId);

            // Сначала проверим, есть ли заявки у этого родителя
            const checkQuery = `SELECT COUNT(*) as count FROM workshop_requests WHERE parent_id = $1`;
            const checkResult = await db.query(checkQuery, [parentId]);
            console.log('📊 WorkshopRequestsController.getRequestsStatsByParentId: Заявок у родителя:', checkResult.rows[0].count);

            const query = `
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
                FROM workshop_requests
                WHERE parent_id = $1
            `;

            console.log('📊 WorkshopRequestsController.getRequestsStatsByParentId: Выполняем запрос:', query);
            const result = await db.query(query, [parentId]);
            const stats = result.rows[0];

            console.log('📊 WorkshopRequestsController.getRequestsStatsByParentId: Сырые данные статистики:', stats);

            const processedStats = {
                total: Number(stats.total) || 0,
                pending: Number(stats.pending) || 0,
                approved: Number(stats.approved) || 0,
                rejected: Number(stats.rejected) || 0
            };

            console.log('📊 WorkshopRequestsController.getRequestsStatsByParentId: Обработанная статистика:', processedStats);

            return {
                success: true,
                data: processedStats
            };
        } catch (error) {
            console.error('❌ WorkshopRequestsController.getRequestsStatsByParentId: Ошибка при получении статистики родителя:', error);
            return {
                success: false,
                error: 'Не удалось получить статистику родителя'
            };
        }
    }
}
