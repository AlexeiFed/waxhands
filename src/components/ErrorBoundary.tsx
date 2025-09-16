/**
 * @file: ErrorBoundary.tsx
 * @description: Error Boundary для обработки ошибок React компонентов
 * @dependencies: React, AlertCircle, RefreshCw
 * @created: 2024-12-19
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error);
        console.error('Error stack:', error.stack);
        console.error('Component stack:', errorInfo.componentStack);

        // Логируем дополнительную информацию для диагностики
        if (error.message) {
            console.error('Error message:', error.message);
        }
        if (error.name) {
            console.error('Error name:', error.name);
        }

        this.setState({
            error,
            errorInfo,
        });
    }

    handleReload = () => {
        window.location.reload();
    };

    handleReset = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md bg-white shadow-lg">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-8 h-8 text-red-600" />
                            </div>
                            <CardTitle className="text-xl font-bold text-gray-800">
                                Что-то пошло не так
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-gray-600 text-center">
                                Произошла неожиданная ошибка в приложении. Мы уже работаем над её исправлением.
                            </p>

                            {this.state.error && (
                                <details className="bg-gray-50 p-3 rounded text-sm">
                                    <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                                        Детали ошибки
                                    </summary>
                                    <div className="space-y-2">
                                        <div>
                                            <strong>Сообщение:</strong>
                                            <pre className="text-xs text-red-600 overflow-auto mt-1">
                                                {this.state.error.message || 'Нет сообщения об ошибке'}
                                            </pre>
                                        </div>
                                        {this.state.error.stack && (
                                            <div>
                                                <strong>Стек вызовов:</strong>
                                                <pre className="text-xs text-red-600 overflow-auto mt-1 max-h-32">
                                                    {this.state.error.stack}
                                                </pre>
                                            </div>
                                        )}
                                        {this.state.errorInfo?.componentStack && (
                                            <div>
                                                <strong>Стек компонентов:</strong>
                                                <pre className="text-xs text-red-600 overflow-auto mt-1 max-h-32">
                                                    {this.state.errorInfo.componentStack}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                </details>
                            )}

                            <div className="flex flex-col sm:flex-row gap-2">
                                <Button
                                    onClick={this.handleReset}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Попробовать снова
                                </Button>
                                <Button
                                    onClick={this.handleReload}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Перезагрузить
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
