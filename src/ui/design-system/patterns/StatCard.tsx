/**
 * StatCard - Pattern Component (Figma Design)
 * 
 * Carte de statistique with circular colored icon.
 * Utilise les utility classes CSS (.icon-teal, etc.) pour la thématisation.
 */

import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../../lib/utils';

export type StatCardVariant = 'teal' | 'pink' | 'peach' | 'mint' | 'lavender' | 'yellow';

interface StatCardProps {
    icon: ReactNode;
    variant: StatCardVariant;
    label: string;
    value: string;
    subtitle?: string;
    trend?: string;
    delay?: number;
    className?: string;
}

// Map variants to CSS utility classes (defined in theme.css)
const variantClasses: Record<StatCardVariant, string> = {
    teal: 'icon-teal',
    pink: 'icon-pink',
    peach: 'icon-peach',
    mint: 'icon-mint',
    lavender: 'icon-lavender',
    yellow: 'icon-yellow',
};

// Map variants to Figma glow shadow classes
const glowClasses: Record<StatCardVariant, string> = {
    teal: 'icon-glow-blue',
    pink: 'icon-glow-pink',
    peach: '',
    mint: 'icon-glow-green',
    lavender: 'icon-glow-purple',
    yellow: '',
};

export function StatCard({
    icon,
    variant,
    label,
    value,
    subtitle,
    trend,
    delay = 0,
    className
}: StatCardProps) {
    const iconClass = variantClasses[variant];
    const glowClass = glowClasses[variant];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className={cn(
                "bg-white rounded-2xl p-6 card-shadow-figma hover:shadow-2xl transition-all border border-gray-200",
                className
            )}
        >
            {/* Circular icon with theme-compatible colors + Figma glow */}
            <div className={cn(
                "w-12 h-12 rounded-[10px] flex items-center justify-center mb-4",
                iconClass,
                glowClass
            )}>
                {icon}
            </div>

            {/* Content */}
            <div>
                <p className="text-sm text-gray-600 mb-1">{label}</p>
                <p className="text-4xl font-bold text-gray-900 mb-1">{value}</p>
                {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
                {trend && (
                    <span className="inline-flex items-center text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg mt-2">
                        {trend}
                    </span>
                )}
            </div>
        </motion.div>
    );
}
