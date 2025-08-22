/**
 * @file: backend/src/controllers/chat.ts
 * @description: Контроллер для управления чатом между пользователями и администраторами
 * @dependencies: database/connection.ts, types/chat.ts
 * @created: 2024-12-19
 */
import { db } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';
import { wsManager } from '../websocket-server.js';
export class ChatController {
    // Создать новый чат
    static async createChat(req, res) {
        try {
            const { userId, message } = req.body;
            if (!userId || !message) {
                return res.status(400).json({
                    error: 'Необходимы userId и message'
                });
            }
            // Находим первого доступного админа
            const { rows: admins } = await db.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['admin']);
            if (admins.length === 0) {
                return res.status(500).json({
                    error: 'Нет доступных администраторов'
                });
            }
            const adminId = admins[0].id;
            const chatId = uuidv4();
            const messageId = uuidv4();
            // Создаем чат с назначенным админом
            await db.query('INSERT INTO chats (id, user_id, admin_id, status) VALUES ($1, $2, $3, $4)', [chatId, userId, adminId, 'pending']);
            // Создаем первое сообщение
            await db.query('INSERT INTO chat_messages (id, chat_id, sender_id, sender_type, message) VALUES ($1, $2, $3, $4, $5)', [messageId, chatId, userId, 'user', message]);
            // Обновляем время последнего сообщения
            await db.query('UPDATE chats SET last_message_at = CURRENT_TIMESTAMP WHERE id = $1', [chatId]);
            // Создаем уведомление
            await db.query('INSERT INTO chat_notifications (id, user_id, chat_id, unread_count) VALUES ($1, $2, $3, $4)', [uuidv4(), userId, chatId, 0]);
            // Отправляем WebSocket уведомление о новом чате
            if (wsManager) {
                try {
                    wsManager.notifyNewChat(chatId, userId, adminId, message);
                    console.log('📡 WebSocket уведомление о новом чате отправлено');
                }
                catch (wsError) {
                    console.warn('⚠️ Ошибка отправки WebSocket уведомления о новом чате:', wsError);
                }
            }
            res.status(201).json({
                success: true,
                chatId,
                message: 'Чат создан успешно'
            });
        }
        catch (error) {
            console.error('Ошибка создания чата:', error);
            res.status(500).json({
                error: 'Внутренняя ошибка сервера'
            });
        }
    }
    // Получить список чатов для пользователя
    static async getUserChats(req, res) {
        try {
            const { userId } = req.params;
            // Получаем чаты с информацией о пользователях и количестве непрочитанных сообщений
            const { rows: chats } = await db.query(`
                SELECT 
                    c.id, c.user_id, c.admin_id, c.status, c.created_at, c.updated_at, c.last_message_at,
                    u.name as user_name, u.email as user_email, u.role as user_role,
                    a.name as admin_name, a.email as admin_email, a.role as admin_role,
                    COALESCE(cn.unread_count, 0) as unread_count
                FROM chats c
                LEFT JOIN users u ON c.user_id = u.id
                LEFT JOIN users a ON c.admin_id = a.id
                LEFT JOIN chat_notifications cn ON c.id = cn.chat_id AND cn.user_id = $1
                WHERE c.user_id = $2
                ORDER BY c.last_message_at DESC
            `, [userId, userId]);
            // Получаем общее количество
            const { rows: totalResult } = await db.query('SELECT COUNT(*) as total FROM chats WHERE user_id = $1', [userId]);
            // Получаем общее количество непрочитанных сообщений
            const { rows: unreadResult } = await db.query(`
                SELECT COALESCE(SUM(cn.unread_count), 0) as unread_total
                FROM chat_notifications cn
                WHERE cn.user_id = $1
            `, [userId]);
            const total = parseInt(totalResult[0]?.total || '0', 10);
            const unreadTotal = parseInt(unreadResult[0]?.unread_total || '0', 10);
            // Преобразуем данные в правильный формат для frontend
            const formattedChats = chats.map(chat => ({
                id: chat.id,
                userId: chat.user_id,
                adminId: chat.admin_id,
                status: chat.status,
                createdAt: new Date(chat.created_at),
                updatedAt: new Date(chat.updated_at),
                lastMessageAt: new Date(chat.last_message_at),
                user: {
                    id: chat.user_id,
                    name: chat.user_name,
                    email: chat.user_email,
                    role: chat.user_role
                },
                admin: chat.admin_id ? {
                    id: chat.admin_id,
                    name: chat.admin_name || '',
                    email: chat.admin_email || '',
                    role: chat.admin_role || ''
                } : undefined,
                unreadCount: chat.unread_count
            }));
            const response = {
                chats: formattedChats,
                total,
                unreadTotal
            };
            res.json(response);
        }
        catch (error) {
            console.error('Ошибка получения чатов пользователя:', error);
            res.status(500).json({
                error: 'Внутренняя ошибка сервера'
            });
        }
    }
    // Получить список всех чатов для администратора
    static async getAllChats(req, res) {
        try {
            const status = req.query.status;
            let whereClause = '';
            const params = [];
            if (status && status !== 'all') {
                whereClause = 'WHERE c.status = $1';
                params.push(status);
            }
            // Получаем чаты с информацией о пользователях и последним сообщением
            const { rows: chats } = await db.query(`
                SELECT 
                    c.id, c.user_id, c.admin_id, c.status, c.created_at, c.updated_at, c.last_message_at,
                    u.name as user_name, u.surname as user_surname, u.email as user_email, u.role as user_role,
                    a.name as admin_name, a.surname as admin_surname, a.email as admin_email, a.role as admin_role,
                    COALESCE(cn.unread_count, 0) as unread_count,
                    cm.message as last_message
                FROM chats c
                LEFT JOIN users u ON c.user_id = u.id
                LEFT JOIN users a ON c.admin_id = a.id
                LEFT JOIN chat_notifications cn ON c.id = cn.chat_id
                LEFT JOIN chat_messages cm ON c.id = cm.chat_id AND cm.created_at = c.last_message_at
                ${whereClause}
                ORDER BY c.last_message_at DESC
            `, params);
            // Преобразуем данные в правильный формат для frontend
            const formattedChats = chats.map((chat) => ({
                id: chat.id,
                userId: chat.user_id,
                adminId: chat.admin_id || '',
                status: chat.status,
                createdAt: new Date(chat.created_at),
                updatedAt: new Date(chat.updated_at),
                lastMessageAt: new Date(chat.last_message_at),
                lastMessage: chat.last_message || '',
                user: {
                    id: chat.user_id,
                    name: chat.user_name || '',
                    surname: chat.user_surname || '',
                    email: chat.user_email || '',
                    role: chat.user_role || 'user'
                },
                admin: chat.admin_id ? {
                    id: chat.admin_id,
                    name: chat.admin_name || '',
                    email: chat.admin_email || '',
                    role: chat.admin_role || ''
                } : {
                    id: '',
                    name: '',
                    email: '',
                    role: ''
                },
                unreadCount: chat.unread_count
            }));
            const response = {
                chats: formattedChats,
                total: chats.length, // Все чаты, нет пагинации
                unreadTotal: 0 // Для админа не считаем непрочитанные
            };
            res.json(response);
        }
        catch (error) {
            console.error('Ошибка получения всех чатов:', error);
            res.status(500).json({
                error: 'Внутренняя ошибка сервера'
            });
        }
    }
    // Получить сообщения чата
    static async getChatMessages(req, res) {
        try {
            const { chatId } = req.params;
            // Получаем все сообщения чата
            const { rows: messages } = await db.query(`
                SELECT 
                    cm.id, cm.chat_id, cm.sender_id, cm.sender_type, cm.message, cm.message_type, cm.file_url, cm.is_read, cm.created_at,
                    u.name as sender_name, u.surname as sender_surname, u.email as sender_email, u.role as sender_role
                FROM chat_messages cm
                LEFT JOIN users u ON cm.sender_id = u.id
                WHERE cm.chat_id = $1
                ORDER BY cm.created_at ASC
            `, [chatId]);
            // Преобразуем сообщения в нужный формат для frontend
            const formattedMessages = messages.map((msg) => {
                const message = {
                    id: msg.id,
                    chatId: msg.chat_id,
                    senderId: msg.sender_id,
                    senderType: msg.sender_type || 'user',
                    message: msg.message,
                    messageType: (msg.message_type || 'text'),
                    isRead: msg.is_read || false,
                    createdAt: new Date(msg.created_at),
                    sender: {
                        id: msg.sender_id,
                        name: msg.sender_name || '',
                        role: msg.sender_role || 'user'
                    }
                };
                // Добавляем fileUrl только если он есть
                if (msg.file_url) {
                    message.fileUrl = msg.file_url;
                }
                return message;
            });
            // Получаем общее количество
            const { rows: totalResult } = await db.query('SELECT COUNT(*) as total FROM chat_messages WHERE chat_id = $1', [chatId]);
            const total = parseInt(totalResult[0]?.total || '0', 10);
            const hasMore = total > 0; // Always true if total > 0
            const response = {
                messages: formattedMessages.reverse(), // Возвращаем в хронологическом порядке
                total,
                hasMore
            };
            res.json(response);
        }
        catch (error) {
            console.error('Ошибка получения сообщений чата:', error);
            res.status(500).json({
                error: 'Внутренняя ошибка сервера'
            });
        }
    }
    // Отправить сообщение
    static async sendMessage(req, res) {
        try {
            console.log('🚀 sendMessage вызван с параметрами:', {
                body: req.body,
                user: req.user,
                headers: req.headers['authorization'] ? 'токен присутствует' : 'токен отсутствует'
            });
            const { chatId, message, messageType = 'text', fileUrl } = req.body;
            const senderId = req.user?.userId;
            const senderType = req.user?.role === 'admin' ? 'admin' : 'user';
            if (!chatId || !message) {
                return res.status(400).json({
                    error: 'Необходимы chatId и message'
                });
            }
            if (!senderId) {
                return res.status(401).json({
                    error: 'Пользователь не аутентифицирован'
                });
            }
            const messageId = uuidv4();
            console.log('📝 Подготовка к вставке сообщения:', {
                messageId,
                chatId,
                senderId,
                senderType,
                message: typeof message === 'string' ? message.substring(0, 50) + '...' : String(message),
                messageType: messageType || 'text',
                fileUrl: fileUrl || null
            });
            // Проверяем существование чата
            const { rows: chatExists } = await db.query('SELECT id FROM chats WHERE id = $1', [chatId]);
            if (chatExists.length === 0) {
                console.error('❌ Чат не найден:', chatId);
                return res.status(404).json({
                    error: 'Чат не найден'
                });
            }
            // Проверяем существование пользователя (только для обычных пользователей, не для админов)
            if (senderType === 'user') {
                const { rows: userExists } = await db.query('SELECT id FROM users WHERE id = $1', [senderId]);
                if (userExists.length === 0) {
                    console.error('❌ Пользователь не найден:', senderId);
                    return res.status(404).json({
                        error: 'Пользователь не найден'
                    });
                }
            }
            // Добавляем сообщение
            await db.query('INSERT INTO chat_messages (id, chat_id, sender_id, sender_type, message, message_type, file_url) VALUES ($1, $2, $3, $4, $5, $6, $7)', [messageId, chatId, senderId, senderType, message, messageType || 'text', fileUrl || null]);
            console.log('✅ Сообщение успешно добавлено в БД');
            // Обновляем время последнего сообщения в чате
            await db.query('UPDATE chats SET last_message_at = CURRENT_TIMESTAMP WHERE id = $1', [chatId]);
            // Обновляем счетчик непрочитанных сообщений для получателя
            if (senderType === 'user') {
                // Сообщение от пользователя - увеличиваем счетчик для админа
                await db.query(`
                    UPDATE chat_notifications 
                    SET unread_count = unread_count + 1, updated_at = CURRENT_TIMESTAMP
                    WHERE chat_id = $1 AND user_id != $2
                `, [chatId, senderId]);
            }
            else {
                // Сообщение от админа - увеличиваем счетчик для пользователя
                const { rows: chatResult } = await db.query('SELECT user_id FROM chats WHERE id = $1', [chatId]);
                const userId = chatResult[0]?.user_id;
                if (userId) {
                    await db.query(`
                        UPDATE chat_notifications 
                        SET unread_count = unread_count + 1, updated_at = CURRENT_TIMESTAMP
                        WHERE chat_id = $1 AND user_id = $2
                    `, [chatId, userId]);
                }
            }
            // Отправляем WebSocket уведомление о новом сообщении
            if (wsManager) {
                try {
                    wsManager.notifyChatMessage(chatId, {
                        id: messageId,
                        message,
                        senderType,
                        timestamp: new Date().toISOString()
                    }, senderId, senderType);
                    console.log('📡 WebSocket уведомление отправлено');
                    // Отправляем уведомление об обновлении непрочитанных сообщений
                    wsManager.notifyUnreadCountUpdate(chatId);
                    console.log('📡 WebSocket уведомление о непрочитанных отправлено');
                }
                catch (wsError) {
                    console.warn('⚠️ Ошибка отправки WebSocket уведомления:', wsError);
                }
            }
            res.json({
                success: true,
                messageId,
                message: 'Сообщение отправлено'
            });
        }
        catch (error) {
            console.error('❌ Ошибка отправки сообщения:', error);
            console.error('❌ Детали ошибки:', {
                chatId: req.body.chatId,
                senderId: req.user?.userId,
                senderType: req.user?.role === 'admin' ? 'admin' : 'user',
                messageType: req.body.messageType,
                fileUrl: req.body.fileUrl,
                stack: error instanceof Error ? error.stack : 'No stack trace'
            });
            res.status(500).json({
                error: 'Внутренняя ошибка сервера'
            });
        }
    }
    // Отметить сообщения как прочитанные
    static async markAsRead(req, res) {
        try {
            const { chatId, userId } = req.body;
            if (!chatId || !userId) {
                return res.status(400).json({
                    error: 'Необходимы chatId и userId'
                });
            }
            // Отмечаем все сообщения как прочитанные
            await db.query(`
                UPDATE chat_messages 
                SET is_read = TRUE 
                WHERE chat_id = $1 AND sender_id != $2
            `, [chatId, userId]);
            // Сбрасываем счетчик непрочитанных сообщений
            await db.query(`
                UPDATE chat_notifications 
                SET unread_count = 0, last_read_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                WHERE chat_id = $1 AND user_id = $2
            `, [chatId, userId]);
            // Отправляем WebSocket уведомление об обновлении непрочитанных
            if (wsManager) {
                try {
                    wsManager.notifyChatStatusChange(chatId, 'messages_read', userId);
                    console.log('📡 WebSocket уведомление об обновлении непрочитанных отправлено');
                }
                catch (wsError) {
                    console.warn('⚠️ Ошибка отправки WebSocket уведомления о непрочитанных:', wsError);
                }
            }
            res.json({
                success: true,
                message: 'Сообщения отмечены как прочитанные'
            });
        }
        catch (error) {
            console.error('Ошибка отметки сообщений как прочитанных:', error);
            res.status(500).json({
                error: 'Внутренняя ошибка сервера'
            });
        }
    }
    // Отметить конкретное сообщение как прочитанное
    static async markMessageAsRead(req, res) {
        try {
            const { messageId, chatId, readerId, readerRole } = req.body;
            if (!messageId || !chatId || !readerId || !readerRole) {
                return res.status(400).json({
                    error: 'Необходимы messageId, chatId, readerId и readerRole'
                });
            }
            // Обновляем статус прочтения сообщения
            await db.query(`
                UPDATE chat_messages 
                SET is_read = true, read_at = CURRENT_TIMESTAMP, read_by = array_append(COALESCE(read_by, ARRAY[]::text[]), $1)
                WHERE id = $2 AND chat_id = $3
            `, [readerId, messageId, chatId]);
            // Отправляем WebSocket уведомление о прочтении сообщения
            if (wsManager) {
                try {
                    wsManager.notifyChatStatusChange(chatId, 'message_read', readerId);
                    console.log('📡 WebSocket уведомление о прочтении сообщения отправлено');
                }
                catch (wsError) {
                    console.warn('⚠️ Ошибка отправки WebSocket уведомления о прочтении:', wsError);
                }
            }
            res.json({
                success: true,
                message: 'Сообщение отмечено как прочитанное'
            });
        }
        catch (error) {
            console.error('Ошибка отметки сообщения как прочитанного:', error);
            res.status(500).json({
                error: 'Внутренняя ошибка сервера'
            });
        }
    }
    // Обновить статус чата
    static async updateChatStatus(req, res) {
        try {
            const { chatId, status, adminId } = req.body;
            if (!chatId || !status) {
                return res.status(400).json({
                    error: 'Необходимы chatId и status'
                });
            }
            let updateQuery = 'UPDATE chats SET status = $1';
            const params = [status];
            if (adminId) {
                updateQuery += ', admin_id = $2';
                params.push(adminId);
            }
            updateQuery += ', updated_at = CURRENT_TIMESTAMP WHERE id = $' + (params.length + 1);
            params.push(chatId);
            await db.query(updateQuery, params);
            // Отправляем WebSocket уведомление об изменении статуса чата
            if (wsManager) {
                try {
                    wsManager.notifyChatStatusChange(chatId, status, adminId);
                    console.log('📡 WebSocket уведомление об изменении статуса чата отправлено');
                }
                catch (wsError) {
                    console.warn('⚠️ Ошибка отправки WebSocket уведомления о статусе:', wsError);
                }
            }
            res.json({
                success: true,
                message: 'Статус чата обновлен'
            });
        }
        catch (error) {
            console.error('Ошибка обновления статуса чата:', error);
            res.status(500).json({
                error: 'Внутренняя ошибка сервера'
            });
        }
    }
    // Получить количество непрочитанных сообщений для пользователя
    static async getUnreadCount(req, res) {
        try {
            const { userId } = req.params;
            const { rows: result } = await db.query(`
                SELECT COALESCE(SUM(unread_count), 0) as unread_total
                FROM chat_notifications
                WHERE user_id = $1
            `, [userId]);
            const unreadTotal = parseInt(result[0]?.unread_total || '0', 10);
            res.json({ unreadTotal });
        }
        catch (error) {
            console.error('Ошибка получения количества непрочитанных сообщений:', error);
            res.status(500).json({
                error: 'Внутренняя ошибка сервера'
            });
        }
    }
}
//# sourceMappingURL=chat.js.map