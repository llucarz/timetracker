/**
 * ThemeToggle Component
 * 
 * A simple toggle button to switch between light and dark modes.
 * Can be added to the header or user menu when dark mode is ready to be activated.
 * 
 * Usage:
 * import { ThemeToggle } from './components/ThemeToggle';
 * 
 * // Add to header or UserMenu:
 * <ThemeToggle />
 */

import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
            aria-label="Toggle theme"
        >
            {theme === 'light' ? (
                <Moon className="w-5 h-5 text-secondary" />
            ) : (
                <Sun className="w-5 h-5 text-secondary" />
            )}
        </button>
    );
}
