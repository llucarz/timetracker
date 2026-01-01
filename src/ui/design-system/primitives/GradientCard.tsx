/**
 * GradientCard - Primitive Component
 * 
 * Carte avec gradient background et variants prédéfinis.
 * Utilisé pour les sections hero, highlights, et éléments visuels importants.
 */

import { ReactNode } from 'react';
import { cn } from '../../../lib/utils';

export type GradientVariant = 'primary' | 'accent' | 'teal' | 'emerald' | 'pink' | 'purple' | 'mint';

interface GradientCardProps {
    variant: GradientVariant;
    children: ReactNode;
    className?: string;
    onClick?: () => void;
}

const variantStyles: Record<GradientVariant, string> = {
    // Figma primary gradient: Deep Purple (#8B5CF6) → Bright Pink (#EC4899)
    // Using from-purple-600 to-pink-500 for more violet depth
    primary: 'bg-gradient-to-r from-purple-700 via-purple-600 to-pink-600',
    // Purple variant for Overtime balance card
    purple: 'bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500',
    // Accent: Teal → Cyan
    accent: 'bg-gradient-to-r from-teal-500 to-cyan-400',
    // Teal variant
    teal: 'bg-gradient-to-br from-teal-500 to-emerald-500',
    // Emerald variant
    emerald: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    // Pink variant
    pink: 'bg-gradient-to-br from-pink-500 to-rose-500',
    // Mint variant
    mint: 'bg-gradient-to-br from-emerald-400 to-teal-500',
};

export function GradientCard({ variant, children, className, onClick }: GradientCardProps) {
    // For 'primary' variant, use exact Figma gradient
    const isPrimaryFigma = variant === 'primary';

    return (
        <div
            onClick={onClick}
            className={cn(
                'rounded-2xl sm:rounded-3xl text-white',
                // Use Figma-exact gradient for primary, Tailwind for others
                isPrimaryFigma ? 'hero-gradient-figma hero-shadow-figma' : variantStyles[variant],
                onClick && 'cursor-pointer',
                className
            )}
        >
            {children}
        </div>
    );
}
