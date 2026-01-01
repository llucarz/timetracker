/**
 * Hero - Pattern Component (Figma Design)
 * 
 * Section hero réutilisable  avec gradient et action.
 * Simplifié pour correspondre au design Figma.
 */

import { ReactNode } from 'react';
import { GradientCard, GradientVariant } from '../primitives/GradientCard';
import { cn } from '../../../lib/utils';

interface HeroProps {
    title: string;
    subtitle?: string;
    badge?: string;
    action?: ReactNode;
    variant?: GradientVariant;
    className?: string;
}

export function Hero({
    title,
    subtitle,
    badge,
    action,
    variant = 'primary',
    className
}: HeroProps) {
    return (
        <GradientCard
            variant={variant}
            className={cn('relative p-8 sm:p-12 shadow-lg hover:shadow-xl transition-shadow overflow-hidden', className)}
        >
            {/* Decorative Clock Icon - Figma Design */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-10 hidden lg:block pointer-events-none">
                <svg width="300" height="300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-white">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                </svg>
            </div>

            {/* Content - Vertical Layout like Figma */}
            <div className="relative z-10 max-w-3xl">
                {badge && (
                    <span className="inline-block px-4 py-2 mb-6 text-base font-normal bg-white/20 backdrop-blur-sm text-white rounded-full">
                        {badge}
                    </span>
                )}
                <h1 className="text-3xl sm:text-5xl font-bold mb-4 text-white leading-tight">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-lg sm:text-xl text-white/90 mb-8 leading-relaxed">
                        {subtitle}
                    </p>
                )}

                {/* Action - Below subtitle, not on the right */}
                {action && (
                    <div className="mt-2">
                        {action}
                    </div>
                )}
            </div>
        </GradientCard>
    );
}
