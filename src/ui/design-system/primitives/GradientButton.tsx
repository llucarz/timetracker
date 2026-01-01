/**
 * GradientButton - Primitive Component
 * 
 * Bouton avec gradient background et variants prédéfinis.
 * Utilisé pour les CTA et actions importantes.
 */

import { ReactNode } from 'react';
import { cn } from '../../../lib/utils';

type GradientVariant = 'primary' | 'accent' | 'teal';
type Size = 'sm' | 'md' | 'lg';

interface GradientButtonProps {
    variant: GradientVariant;
    size?: Size;
    children: ReactNode;
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
}

const variantStyles: Record<GradientVariant, string> = {
    primary: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
    accent: 'bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700',
    teal: 'bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700',
};

const sizeStyles: Record<Size, string> = {
    sm: 'h-9 px-4 text-sm',
    md: 'h-11 px-6 text-base',
    lg: 'h-14 px-8 text-lg',
};

export function GradientButton({
    variant,
    size = 'md',
    children,
    onClick,
    className,
    disabled = false
}: GradientButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'inline-flex items-center justify-center gap-2 rounded-xl font-bold text-white',
                'shadow-lg transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'hover:shadow-xl hover:scale-[1.02]',
                variantStyles[variant],
                sizeStyles[size],
                className
            )}
        >
            {children}
        </button>
    );
}
