import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Notification, NotificationType, NotificationProps } from "../components/ui/Notification";

interface ShowNotificationOptions {
    type: NotificationType;
    title: string;
    message?: string;
    duration?: number;
}

interface NotificationContextType {
    showNotification: (options: ShowNotificationOptions) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<NotificationProps[]>([]);

    const showNotification = useCallback(({ type, title, message, duration = 5000 }: ShowNotificationOptions) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newNotification: NotificationProps = {
            id,
            type,
            title,
            message,
            isVisible: true,
            duration,
            onClose: () => closeNotification(id),
        };

        setNotifications((prev) => [...prev, newNotification]);
    }, []);

    const closeNotification = useCallback((id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, isVisible: false } : n))
        );

        // Remove from DOM after animation duration (approx 300ms)
        setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 400);
    }, []);

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
                {notifications.map((notification) => (
                    <Notification key={notification.id} {...notification} />
                ))}
            </div>
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotification must be used within a NotificationProvider");
    }
    return context;
}
