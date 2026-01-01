/**
 * convertHoursToDays Utility
 * 
 * Convertit les heures en format "X jours et Yh".
 * Extrait de OvertimePanel.tsx (lignes 26-38).
 */

export function convertHoursToDays(hours: number): string {
    const HOURS_PER_DAY = 7.5;
    const days = Math.floor(hours / HOURS_PER_DAY);
    const remainingHours = hours % HOURS_PER_DAY;

    if (days === 0) {
        return `${remainingHours}h`;
    } else if (remainingHours === 0) {
        return `${days} jour${days > 1 ? 's' : ''}`;
    } else {
        return `${days} jour${days > 1 ? 's' : ''} et ${remainingHours}h`;
    }
}
