import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { WebSocketProvider } from './contexts/WebSocketContext'

// Упрощенная логика Service Worker для стабильного запуска
if ('serviceWorker' in navigator) {
    if (import.meta.env.DEV) {
        // В режиме разработки просто отключаем Service Worker без агрессивной очистки
        navigator.serviceWorker.getRegistrations().then(function (registrations) {
            for (let registration of registrations) {
                registration.unregister();
            }
        });
        console.log('Service Worker отключен для разработки');
    } else {
        // В production регистрируем Service Worker
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    console.log('SW registered: ', registration);
                })
                .catch((registrationError) => {
                    console.log('SW registration failed: ', registrationError);
                });
        });
    }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <WebSocketProvider>
            <App />
        </WebSocketProvider>
    </React.StrictMode>,
)
