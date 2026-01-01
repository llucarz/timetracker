/**
 * StatusBadge - Primitive Component
 * 
 * Badge de statut avec variants et labels standardisés.
 * Utilisé pour afficher les statuts d'entrées (travail, congés, maladie, etc.).
 */

import { cn } from '../../../lib/utils';

export type Status = 'work' | 'school' | 'vacation' | 'sick' | 'holiday' | 'off';
type Size = 'sm' | 'md' | 'lg';

interface StatusBadgeProps {
    status: Status;
    label?: string;
    size?: Size;
}

const statusConfig: Record<Status, { label: string; colorClass: string }> = {
    work: { label: 'Travail', colorClass: 'bg-teal-100 text-teal-700 border-teal-200' },
    school: { label: 'École', colorClass: 'bg-blue-100 text-blue-700 border-blue-200' }, // No direct replacement in provided snippet, keeping original
    vacation: { label: 'Congés', colorClass: 'bg-yellow-100 text-yellow-700 border-yellow-200' }, // Assuming 'leave' maps to 'vacation'
    sick: { label: 'Maladie', colorClass: 'bg-red-100 text-red-700 border-red-200' },
    holiday: { label: 'Férié', colorClass: 'bg-purple-100 text-purple-700 border-purple-200' },
    off: { label: 'Repos', colorClass: 'bg-gray-100 text-gray-700 border-gray-200' }, // No replacement in provided snippet, keeping original
};

const sizeStyles: Record<Size, string> = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
};

export function StatusBadge({ status, label, size = 'md' }: StatusBadgeProps) {
    const config = statusConfig[status];
    const displayLabel = label || config.label;

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full font-medium border',
                config.colorClass,
                sizeStyles[size]
            )}
        >
            {displayLabel}
        </span>
    );
}
