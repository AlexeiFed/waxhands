/**
 * @file: src/components/ui/admin-chat.tsx
 * @description: Компонент чата для администратора
 * @dependencies: use-chat.ts, types/chat.ts
 * @created: 2024-12-19
 */

import React, { useState, useEffect } from 'react';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Input } from './input';
import { Badge } from './badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { useAdminChat } from '../../hooks/use-chat';
import { useAuth } from '../../contexts/AuthContext';
import { Chat, ChatMessage } from '../../types/chat';
import { MessageCircle, Send, Clock, User, Shield, Filter, MoreHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';
import { MessageReadStatusComponent } from '../shared/MessageReadStatusComponent';

interface AdminChatProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

const AdminChat: React.FC<AdminChatProps> = ({ isOpen, onOpenChange }) => {
    const {
        chats,
        messages,
        selectedChat,
        statusFilter,
        isLoadingChats,
        isLoadingMessages,
        setSelectedChat,
        setStatusFilter,
        sendMessage,
        updateChatStatus,
        getMessageReadStatus,
        isSendingMessage,
        isUpdatingStatus,
        _debug
    } = useAdminChat();

    const { user } = useAuth();

    const [message, setMessage] = useState('');

    // Временные логи для диагностики
    useEffect(() => {
        console.log('🔍 AdminChat: Состояние чатов:', {
            chatsCount: chats?.length,
            chats,
            selectedChat,
            statusFilter,
            isLoadingChats,
            isLoadingMessages,
            _debug
        });
    }, [chats, selectedChat, statusFilter, isLoadingChats, isLoadingMessages, _debug]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!message.trim() || !selectedChat?.id) return;

        console.log('Отправка сообщения:', {
            chatId: selectedChat.id,
            message: message.trim(),
            senderId: user?.id
        });

        try {
            await sendMessage(message.trim());
            setMessage('');
        } catch (error) {
            console.error('Ошибка отправки сообщения:', error);
        }
    };

    const handleStatusUpdate = async (chatId: string, status: 'active' | 'closed' | 'pending') => {
        await updateChatStatus(chatId, status);
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleDateString('ru-RU');
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return '';
        return `${formatDate(dateString)} ${formatTime(dateString)}`;
    };

    const formatDateTimeVladivostok = (dateString: string) => {
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return '';

        // Форматируем время для часового пояса Владивостока
        return date.toLocaleString('ru-RU', {
            timeZone: 'Asia/Vladivostok',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500';
            case 'pending': return 'bg-yellow-500';
            case 'closed': return 'bg-gray-500';
            default: return 'bg-gray-500';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active': return 'Активен';
            case 'pending': return 'Ожидает';
            case 'closed': return 'Закрыт';
            default: return 'Неизвестно';
        }
    };

    const getUnreadCount = (chat: Chat) => {
        return chat.unreadCount || 0;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
                {/* Заголовок */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <MessageCircle className="w-6 h-6 text-blue-600" />
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Управление чатами</h2>
                            <p className="text-sm text-gray-600">Поддержка пользователей</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Фильтр:</span>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Все</SelectItem>
                                    <SelectItem value="pending">Ожидают</SelectItem>
                                    <SelectItem value="active">Активные</SelectItem>
                                    <SelectItem value="closed">Закрытые</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                        >
                            Закрыть
                        </Button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Список чатов */}
                    <div className="w-96 border-r border-gray-200 flex flex-col">
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-gray-900">Чаты</h3>
                                <Badge variant="secondary">
                                    {chats.length} всего
                                </Badge>
                            </div>
                            <div className="text-sm text-gray-600">
                                {chats.filter(c => c.status === 'pending').length} ожидают ответа
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {isLoadingChats ? (
                                <div className="p-4 text-center text-gray-500">
                                    Загрузка чатов...
                                </div>
                            ) : chats.length === 0 ? (
                                <div className="p-4 text-center text-gray-500">
                                    Нет чатов
                                </div>
                            ) : (
                                chats.map((chat) => (
                                    <div
                                        key={chat.id}
                                        onClick={() => setSelectedChat(chat)}
                                        className={cn(
                                            "p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors",
                                            selectedChat?.id === chat.id && "bg-blue-50 border-blue-200"
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-2">
                                                <div className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    getStatusColor(chat.status)
                                                )} />
                                                <span className="text-sm font-medium text-gray-900">
                                                    {getStatusText(chat.status)}
                                                </span>
                                            </div>
                                            {getUnreadCount(chat) > 0 && (
                                                <Badge variant="destructive" className="text-xs">
                                                    {getUnreadCount(chat)}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {chat.user?.name && chat.user?.surname
                                                ? `${chat.user.name} ${chat.user.surname}`.trim()
                                                : chat.user?.name || 'Пользователь'
                                            }
                                        </p>
                                        {chat.lastMessage && (
                                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                {chat.lastMessage}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-end mt-2">
                                            <span className="text-xs text-gray-400">
                                                {formatDateTimeVladivostok(chat.lastMessageAt)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Область сообщений */}
                    <div className="flex-1 flex flex-col">
                        {selectedChat ? (
                            <>
                                {/* Заголовок чата */}
                                <div className="p-4 border-b border-gray-200 bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">
                                                {selectedChat.user?.name && selectedChat.user?.surname
                                                    ? `${selectedChat.user.name} ${selectedChat.user.surname}`.trim()
                                                    : selectedChat.user?.name || 'Пользователь'
                                                }
                                            </h3>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <div className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    getStatusColor(selectedChat.status)
                                                )} />
                                                <span className="text-sm text-gray-600">
                                                    {getStatusText(selectedChat.status)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Select
                                                value={selectedChat.status}
                                                onValueChange={(value: 'active' | 'closed' | 'pending') =>
                                                    handleStatusUpdate(selectedChat.id, value)
                                                }
                                                disabled={isUpdatingStatus}
                                            >
                                                <SelectTrigger className="w-32">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pending">Ожидает</SelectItem>
                                                    <SelectItem value="active">Активен</SelectItem>
                                                    <SelectItem value="closed">Закрыт</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedChat(null)}
                                            >
                                                Закрыть
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Сообщения */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                                    {isLoadingMessages ? (
                                        <div className="text-center text-gray-500">
                                            Загрузка сообщений...
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="text-center text-gray-500">
                                            Нет сообщений
                                        </div>
                                    ) : (
                                        messages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={cn(
                                                    "flex",
                                                    msg.senderType === 'admin' ? "justify-end" : "justify-start"
                                                )}
                                            >
                                                <div
                                                    className={cn(
                                                        "max-w-[70%] sm:max-w-xs lg:max-w-md px-4 py-2 rounded-lg break-words",
                                                        msg.senderType === 'admin'
                                                            ? "bg-blue-600 text-white"
                                                            : "bg-gray-100 text-gray-900"
                                                    )}
                                                >
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        {msg.senderType === 'admin' ? (
                                                            <Shield className="w-3 h-3" />
                                                        ) : (
                                                            <User className="w-3 h-3" />
                                                        )}
                                                        <span className="text-xs opacity-75">
                                                            {msg.senderType === 'admin' ? 'Администратор' :
                                                                `${msg.sender?.name || ''} ${msg.sender?.surname || ''}`.trim() || 'Пользователь'
                                                            }
                                                        </span>
                                                    </div>
                                                    <p className="text-sm break-words whitespace-pre-wrap">{msg.message}</p>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <div className="flex items-center">
                                                            <Clock className="w-3 h-3 opacity-50 mr-1" />
                                                            <span className="text-xs opacity-75">
                                                                {formatDateTime(msg.createdAt)}
                                                            </span>
                                                        </div>
                                                        {msg.senderType === 'admin' && (
                                                            <MessageReadStatusComponent
                                                                status={getMessageReadStatus(msg)}
                                                                isOwnMessage={true}
                                                                readAt={msg.readAt}
                                                                readBy={msg.readBy}
                                                                className="ml-2"
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Поле ввода */}
                                <div className="p-4 border-t border-gray-200">
                                    <form onSubmit={handleSendMessage} className="flex space-x-2">
                                        <Input
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder="Введите сообщение..."
                                            className="flex-1"
                                            disabled={isSendingMessage}
                                        />
                                        <Button
                                            type="submit"
                                            disabled={!message.trim() || isSendingMessage}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            <Send className="w-4 h-4" />
                                        </Button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center text-gray-500">
                                    <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p>Выберите чат для просмотра</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminChat;

