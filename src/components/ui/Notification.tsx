import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useEffect } from "react";

export type NotificationType = "success" | "error" | "warning" | "info";

export interface NotificationProps {
    id: string;
    type: NotificationType;
    title: string;
    message?: string;
    isVisible: boolean;
    onClose: () => void;
    duration?: number;
}

const notificationStyles = {
    success: {
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        icon: CheckCircle2,
        iconColor: "text-emerald-600",
        iconBg: "bg-emerald-100",
        titleColor: "text-emerald-900",
        messageColor: "text-emerald-700",
        progressBar: "bg-emerald-600",
    },
    error: {
        bg: "bg-rose-50",
        border: "border-rose-200",
        icon: AlertCircle,
        iconColor: "text-rose-600",
        iconBg: "bg-rose-100",
        titleColor: "text-rose-900",
        messageColor: "text-rose-700",
        progressBar: "bg-rose-600",
    },
    warning: {
        bg: "bg-amber-50",
        border: "border-amber-200",
        icon: AlertTriangle,
        iconColor: "text-amber-600",
        iconBg: "bg-amber-100",
        titleColor: "text-amber-900",
        messageColor: "text-amber-700",
        progressBar: "bg-amber-600",
    },
    info: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        icon: Info,
        iconColor: "text-blue-600",
        iconBg: "bg-blue-100",
        titleColor: "text-blue-900",
        messageColor: "text-blue-700",
        progressBar: "bg-blue-600",
    },
};

export function Notification({
    id,
    type,
    title,
    message,
    isVisible,
    onClose,
    duration = 5000,
}: NotificationProps) {
    const style = notificationStyles[type];
    const Icon = style.icon;

    useEffect(() => {
        if (isVisible && duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    layout
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={`${style.bg} ${style.border} border-2 rounded-2xl shadow-lg max-w-sm w-full overflow-hidden backdrop-blur-sm pointer-events-auto`}
                >
                    <div className="p-4 flex items-start gap-3">
                        {/* Icon */}
                        <div className={`${style.iconBg} rounded-xl p-2 flex-shrink-0`}>
                            <Icon className={`w-5 h-5 ${style.iconColor}`} strokeWidth={2.5} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pt-1">
                            <h4 className={`font-semibold text-sm ${style.titleColor} mb-0.5`}>
                                {title}
                            </h4>
                            {message && (
                                <p className={`text-xs ${style.messageColor} leading-relaxed`}>
                                    {message}
                                </p>
                            )}
                        </div>

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center transition-colors group"
                            aria-label="Fermer la notification"
                        >
                            <X className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                        </button>
                    </div>

                    {/* Progress bar (auto-close indicator) */}
                    {duration > 0 && (
                        <motion.div
                            initial={{ scaleX: 1 }}
                            animate={{ scaleX: 0 }}
                            transition={{ duration: duration / 1000, ease: "linear" }}
                            className={`h-1 ${style.progressBar} origin-left`}
                        />
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
