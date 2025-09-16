import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { WebSocketProvider } from './contexts/WebSocketContext'
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
        console.log('Service Worker отключен для разработки');
    } else {
        // В production регистрируем Service Worker асинхронно для быстрой загрузки
        setTimeout(() => {
            navigator.serviceWorker.register('/sw.js?v=2.0.11')
                .then((registration) => {
                    console.log('SW registered: ', registration);
                })
                .catch((registrationError) => {
                    console.log('SW registration failed: ', registrationError);
                });
        }, 1000); // Задержка для ускорения первоначальной загрузки
    }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <WebSocketProvider>
                <App />
            </WebSocketProvider>
        </ErrorBoundary>
    </React.StrictMode>,
)
