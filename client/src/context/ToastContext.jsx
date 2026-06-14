import React, { createContext, useContext, useState, useCallback } from 'react';
import '../styles/components/Toast.css';

const ToastContext = createContext(null);

let idCounter = 0;

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const remove = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const show = useCallback((message, type = 'info', duration = 4000) => {
        const id = ++idCounter;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => remove(id), duration);
    }, [remove]);

    const showSuccess = useCallback((msg) => show(msg, 'success'), [show]);
    const showError   = useCallback((msg) => show(msg, 'error', 5000), [show]);
    const showWarning = useCallback((msg) => show(msg, 'warning'), [show]);
    const showInfo    = useCallback((msg) => show(msg, 'info'), [show]);

    return (
        <ToastContext.Provider value={{ showSuccess, showError, showWarning, showInfo }}>
            {children}
            <div className="toast-container">
                {toasts.map(t => (
                    <div key={t.id} className={`toast toast-${t.type}`}>
                        <span className="toast-icon">{icons[t.type]}</span>
                        <span className="toast-message">{t.message}</span>
                        <button className="toast-close" onClick={() => remove(t.id)}>×</button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

const icons = {
    success: '✅',
    error:   '❌',
    warning: '⚠️',
    info:    'ℹ️',
};

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside ToastProvider');
    return ctx;
};
