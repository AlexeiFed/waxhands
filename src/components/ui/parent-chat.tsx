/**
 * @file: src/components/ui/parent-chat.tsx
 * @description: Компонент чата для родителя с поддержкой (упрощенная версия)
 * @dependencies: use-chat.ts, types/chat.ts
 * @created: 2024-12-19
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Badge } from './badge';
import { useChat } from '../../hooks/use-chat';
import { useAuth } from '../../contexts/AuthContext';
import { MessageCircle, Send, X, Clock, User, Shield } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ParentChatProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

const ParentChat: React.FC<ParentChatProps> = ({ isOpen, onOpenChange }) => {
    const { user } = useAuth();
    const {
        chats,
        messages,
        selectedChat,
        unreadCount,
        isLoadingChats,
        isLoadingMessages,
        message,
        setMessage,
        setSelectedChat,
        createChat,
        sendMessage,
        messagesEndRef,
        isCreatingChat,
        isSendingMessage
    } = useChat(user?.id);

    const [isNewChat, setIsNewChat] = useState(false);
    const [newChatMessage, setNewChatMessage] = useState('');
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    // Автоматически выбираем первый чат или создаем новый
    useEffect(() => {
        if (chats && chats.length > 0 && !selectedChat) {
            // Если есть чаты, выбираем первый активный или любой
            const activeChat = chats.find(chat => chat.status === 'active') || chats[0];
            if (activeChat) {
                // Вызываем setSelectedChat для выбора чата
                setSelectedChat(activeChat);
            }
        }
    }, [chats, selectedChat, setSelectedChat]);

    const handleCreateChat = async (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!newChatMessage.trim()) return;

        try {
            await createChat(newChatMessage);
            setIsNewChat(false);
            setNewChatMessage('');
        } catch (error) {
            console.error('Ошибка создания чата:', error);
        }
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!message.trim()) return;

        try {
            await sendMessage(message);
        } catch (error) {
            console.error('Ошибка отправки сообщения:', error);
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return '';

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        // Если сообщение не сегодня, показываем дату и время
        if (messageDate.getTime() !== today.getTime()) {
            return date.toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        // Если сегодня - только время
        return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
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

    // Пролистываем к последнему сообщению при открытии/изменении списка
    useEffect(() => {
        // Безопасно скроллим контейнер, а не всю страницу, чтобы не "дергать" модалку
        if (messagesEndRef.current && messagesContainerRef.current) {
            messagesContainerRef.current.scrollTo({
                top: messagesContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages?.length, isOpen, messagesEndRef, messagesContainerRef]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[85vh] md:h-[80vh] max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom)]">
                {/* Заголовок */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <MessageCircle className="w-6 h-6 text-blue-600" />
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Чат с поддержкой</h2>
                            <p className="text-sm text-gray-600">Получите помощь по любым вопросам</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                                {unreadCount} непрочитанных
                            </Badge>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col flex-1 min-h-0">
                    {isNewChat ? (
                        <div className="flex flex-col p-4 flex-1">
                            <div className="text-center mb-6">
                                <MessageCircle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Создать новый чат
                                </h3>
                                <p className="text-gray-600">
                                    Опишите ваш вопрос, и мы поможем вам решить его
                                </p>
                            </div>

                            <div className="flex-1 flex flex-col">
                                <textarea
                                    value={newChatMessage}
                                    onChange={(e) => setNewChatMessage(e.target.value)}
                                    placeholder="Опишите ваш вопрос или проблему..."
                                    className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={8}
                                />

                                <div className="flex space-x-3 mt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsNewChat(false)}
                                        className="flex-1"
                                    >
                                        Отмена
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleCreateChat}
                                        disabled={!newChatMessage.trim() || isCreatingChat}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                                    >
                                        {isCreatingChat ? 'Создание...' : 'Отправить'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (chats && chats.length > 0) || selectedChat ? (
                        <>
                            {/* Статус чата */}
                            <div className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                                <div className="flex items-center space-x-2">
                                    <div className={cn(
                                        "w-2 h-2 rounded-full",
                                        getStatusColor(selectedChat?.status || (chats && chats.length > 0 ? chats[0].status : 'pending'))
                                    )} />
                                    <span className="text-sm text-gray-600">
                                        {getStatusText(selectedChat?.status || (chats && chats.length > 0 ? chats[0].status : 'pending'))}
                                    </span>
                                </div>
                            </div>

                            {/* Сообщения */}
                            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 overscroll-contain scroll-smooth">
                                {isLoadingMessages ? (
                                    <div className="text-center text-gray-500">
                                        Загрузка сообщений...
                                    </div>
                                ) : messages && messages.length > 0 ? (
                                    messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={cn(
                                                "flex",
                                                msg.senderType === 'user' ? "justify-end" : "justify-start"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "max-w-[70%] px-4 py-2 rounded-2xl break-words overflow-hidden",
                                                    msg.senderType === 'user'
                                                        ? "bg-blue-600 text-white"
                                                        : "bg-gray-100 text-gray-900"
                                                )}
                                            >
                                                <p
                                                    className="text-sm mb-2 break-words whitespace-pre-wrap"
                                                    style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                                                >
                                                    {msg.message}
                                                </p>
                                                <div className="flex items-center justify-end">
                                                    <Clock className="w-3 h-3 opacity-50 mr-1" />
                                                    <span className="text-sm text-gray-500">
                                                        {formatTime(msg.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-gray-500">
                                        Нет сообщений
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Поле ввода */}
                            <div className="p-3 md:p-4 border-t border-gray-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 shadow-inner flex-shrink-0">
                                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                    <Input
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Введите сообщение..."
                                        className="flex-1 h-11 rounded-full px-5"
                                        disabled={isSendingMessage}
                                    />
                                    <Button
                                        type="submit"
                                        disabled={!message.trim() || isSendingMessage}
                                        className="bg-blue-600 hover:bg-blue-700 h-11 w-11 rounded-full p-0 flex items-center justify-center"
                                        aria-label="Отправить сообщение"
                                    >
                                        <Send className="w-5 h-5" />
                                    </Button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center text-gray-500">
                                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p className="mb-4">У вас пока нет активного чата</p>
                                <Button
                                    type="button"
                                    onClick={() => setIsNewChat(true)}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    Написать в поддержку
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ParentChat;

