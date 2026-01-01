/**
 * Surface - Primitive Component
 * 
 * Surface de base avec styles standardisés (elevation, rounded, padding).
 * Utilisé pour les cartes, panneaux, et containers.
 */

import { ReactNode } from 'react';
import { cn } from '../../../lib/utils';

type Elevation = 'flat' | 'low' | 'medium' | 'high';
type Rounded = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
type Padding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface SurfaceProps {
    elevation?: Elevation;
    rounded?: Rounded;
    padding?: Padding;
    children: ReactNode;
    className?: string;
}

const elevationStyles: Record<Elevation, string> = {
    flat: '',
    low: 'shadow-sm',
    medium: 'card-shadow',
    high: 'shadow-2xl',
};

const roundedStyles: Record<Rounded, string> = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
};

const paddingStyles: Record<Padding, string> = {
    none: '',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
    xl: 'p-8 sm:p-10 lg:p-12',
};

export function Surface({
    elevation = 'medium',
    rounded = '2xl',
    padding = 'md',
    children,
    className
}: SurfaceProps) {
    return (
        <div
            className={cn(
                'bg-white',
                elevationStyles[elevation],
                roundedStyles[rounded],
                paddingStyles[padding],
                className
            )}
        >
            {children}
        </div>
    );
}
