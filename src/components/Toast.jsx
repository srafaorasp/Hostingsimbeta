import React, { useEffect } from 'react';

const Toast = ({ toast, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss(toast.id);
        }, 5000); // Auto-dismiss after 5 seconds

        return () => clearTimeout(timer);
    }, [toast, onDismiss]);

    return (
        <div className="bg-bg-dark border border-border-color text-text-color p-3 rounded-lg shadow-lg animate-pulse">
            <div className="flex justify-between items-center mb-1">
                <h3 className="font-bold">{toast.title}</h3>
                <button onClick={() => onDismiss(toast.id)} className="text-xs text-text-muted">&times;</button>
            </div>
            <p className="text-sm">{toast.message}</p>
        </div>
    );
};

const ToastContainer = ({ toasts, onDismiss }) => {
    return (
        <div className="absolute top-4 right-4 z-[2000] space-y-2">
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
            ))}
        </div>
    );
};

export default ToastContainer;
