/**
 * Design System Constants
 * 
 * Centralized constants for gradients, colors, and other design tokens.
 * This replaces hard-coded values scattered across components.
 */

/**
 * Gradient class combinations for Tailwind
 * Used throughout the app for consistent visual identity
 */
export const GRADIENTS = {
    /** Primary gradient: Purple → Pink → Rose */
    primary: 'from-purple-500 via-pink-500 to-rose-500',

    /** Accent gradient: Teal → Cyan */
    accent: 'from-teal-500 to-cyan-500',

    /** Emerald gradient: Emerald → Teal */
    emerald: 'from-emerald-400 to-teal-500',

    /** Teal gradient variant */
    teal: 'from-teal-400 to-cyan-500',
} as const;

/**
 * Common shadow classes
 */
export const SHADOWS = {
    card: 'shadow-2xl shadow-purple-200/50 dark:shadow-purple-900/50',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
} as const;

/**
 * Border radius values
 */
export const RADIUS = {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    full: 'rounded-full',
} as const;

/**
 * Helper to build gradient background classes
 */
export function gradientBg(gradient: keyof typeof GRADIENTS, direction: 'to-r' | 'to-br' | 'to-b' = 'to-br') {
    return `bg-gradient-${direction} ${GRADIENTS[gradient]}`;
}
