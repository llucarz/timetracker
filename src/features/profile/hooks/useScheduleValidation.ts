/**
 * useScheduleValidation Hook
 * 
 * Valide les horaires et calcule les totaux.
 * Extrait de ProfileModal.tsx (lignes 83-172).
 */

import { useMemo } from 'react';
import { computeMinutesFromTimes, minToHM } from '../../../lib/utils';


interface DaySchedule {
    day: string;
    key: string;
    isWorkday: boolean;
    arrival: string;
    pauseStart: string;
    pauseEnd: string;
    departure: string;
}

interface ValidationResult {
    isValid: boolean;
    error?: {
        title: string;
        description: string;
    };
}

export function useScheduleValidation(
    mode: 'same' | 'per-day',
    weeklyTarget: string,
    workdaysPerWeek: string,
    arrival: string,
    pauseStart: string,
    pauseEnd: string,
    departure: string,
    daySchedules: DaySchedule[]
): ValidationResult {
    return useMemo(() => {
        const targetWeeklyMinutes = parseFloat(weeklyTarget) * 60;
        let totalWeeklyMinutes = 0;

        // Calculate total weekly minutes based on mode
        if (mode === 'same') {
            const dailyMinutes = computeMinutesFromTimes({
                start: arrival,
                lunchStart: pauseStart,
                lunchEnd: pauseEnd,
                end: departure
            });

            // Validate daily hours don't exceed 24h
            if (dailyMinutes > 1440) {
                return {
                    isValid: false,
                    error: {
                        title: 'Configuration invalide',
                        description: 'Les horaires quotidiens dépassent 24 heures. Veuillez vérifier votre saisie.'
                    }
                };
            }

            const workDays = parseInt(workdaysPerWeek);
            totalWeeklyMinutes = dailyMinutes * workDays;
        } else {
            // Different mode - sum all enabled days
            for (const schedule of daySchedules) {
                if (schedule.isWorkday) {
                    const dailyMinutes = computeMinutesFromTimes({
                        start: schedule.arrival,
                        lunchStart: schedule.pauseStart,
                        lunchEnd: schedule.pauseEnd,
                        end: schedule.departure
                    });

                    // Validate each day doesn't exceed 24h
                    if (dailyMinutes > 1440) {
                        return {
                            isValid: false,
                            error: {
                                title: 'Configuration invalide',
                                description: `Les horaires du ${schedule.day} dépassent 24 heures. Veuillez vérifier.`
                            }
                        };
                    }

                    totalWeeklyMinutes += dailyMinutes;
                }
            }
        }

        // Validate total weekly hours must exactly match weekly target
        if (totalWeeklyMinutes !== targetWeeklyMinutes) {
            const targetHours = parseFloat(weeklyTarget);

            return {
                isValid: false,
                error: {
                    title: "Impossible d'enregistrer",
                    description: `Les heures hebdomadaires totales de vos horaires habituels (${minToHM(totalWeeklyMinutes)}) ne correspondent pas exactement à votre objectif de ${targetHours}h/semaine.`
                }
            };
        }

        return { isValid: true };
    }, [mode, weeklyTarget, workdaysPerWeek, arrival, pauseStart, pauseEnd, departure, daySchedules]);
}
