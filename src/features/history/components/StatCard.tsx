
import { motion } from 'motion/react';

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    subtitle?: string;
    trend?: string;
    color: "purple" | "teal" | "pink" | "yellow";
    delay?: number;
}

const colorStyles = {
    purple: {
        gradient: "from-purple-500 to-indigo-600",
        shadow: "shadow-purple-200",
        lightQuery: "purple"
    },
    teal: {
        gradient: "from-teal-400 to-emerald-500",
        shadow: "shadow-teal-200",
        lightQuery: "teal"
    },
    pink: {
        gradient: "from-pink-500 to-rose-500",
        shadow: "shadow-pink-200",
        lightQuery: "pink"
    },
    yellow: {
        gradient: "from-amber-400 to-orange-500",
        shadow: "shadow-orange-200",
        lightQuery: "orange"
    }
};

export function StatCard({ icon, label, value, subtitle, trend, color, delay = 0 }: StatCardProps) {
    const styles = colorStyles[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 card-shadow hover:card-shadow-hover transition-all group"
        >
            <div className="flex items-start justify-between mb-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${styles.gradient} flex items-center justify-center text-white shadow-lg ${styles.shadow} group-hover:scale-110 transition-transform`}>
                    {icon}
                </div>
                {trend && (
                    <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-xs sm:text-sm text-gray-500 mb-0.5 sm:mb-1">{label}</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-0.5 sm:mb-1">{value}</p>
                {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
        </motion.div>
    );
}
