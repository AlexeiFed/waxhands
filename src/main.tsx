import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { WebSocketProvider } from './contexts/WebSocketContext'
import { ResponsiveLayoutProvider } from './contexts/ResponsiveLayoutContext'
import ErrorBoundary from './components/ErrorBoundary'

// Регистрация Service Worker
if ('serviceWorker' in navigator) {
    if (import.meta.env.DEV) {
        // В режиме разработки отключаем Service Worker
        navigator.serviceWorker.getRegistrations().then(function (registrations) {
            for (const registration of registrations) {
                registration.unregister();
            }
        });

    } else {
        // В production регистрируем Service Worker асинхронно для быстрой загрузки
        setTimeout(() => {
            navigator.serviceWorker.register('/sw.js?v=3.2.0')
                .then((registration) => {
                    console.log('Service Worker registered successfully');
                    // Принудительно обновляем Service Worker при каждом запуске
                    if (registration.waiting) {
                        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                    }
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    // Принудительно активируем новый Service Worker
                                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                                    window.location.reload();
                                }
                            });
                        }
                    });
                })
                .catch((registrationError) => {
                    console.error('Service Worker registration failed:', registrationError);
                });
        }, 1000); // Задержка для ускорения первоначальной загрузки
    }
}

// Принудительно устанавливаем светлую тему
document.documentElement.classList.remove('dark');
document.documentElement.style.colorScheme = 'light';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <ResponsiveLayoutProvider>
                <WebSocketProvider>
                    <App />
                </WebSocketProvider>
            </ResponsiveLayoutProvider>
        </ErrorBoundary>
    </React.StrictMode>,
)
