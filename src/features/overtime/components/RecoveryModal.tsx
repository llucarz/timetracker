/**
 * RecoveryModal Component
 * 
 * Formulaire de saisie de récupération d'heures supplémentaires.
 * Extrait de OvertimePanel.tsx (lignes 309-412).
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Checkbox } from '../../../components/ui/checkbox';
import { DatePicker } from '../../../components/DatePicker';
import { motion } from 'motion/react';
import { useNotification } from '../../../context/NotificationContext';
import { Settings, OvertimeEvent } from '../../../lib/types';
import { hmToMin, checkOverlap, computeMinutesFromTimes, formatDuration } from '../../../lib/utils';

interface RecoveryModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: Settings;
    overtimeEvents: OvertimeEvent[];
    onSave: (event: Omit<OvertimeEvent, 'id'>) => void;
}

export function RecoveryModal({
    isOpen,
    onClose,
    settings,
    overtimeEvents,
    onSave
}: RecoveryModalProps) {
    const { showNotification } = useNotification();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [recoveryDate, setRecoveryDate] = useState('');
    const [comment, setComment] = useState('');
    const [isFullDayRecovery, setIsFullDayRecovery] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (isSubmitting) return;

        if (!recoveryDate) {
            showNotification({ type: "error", title: "Erreur", message: "Veuillez sélectionner une date" });
            return;
        }

        let finalStartTime = startTime;
        let finalEndTime = endTime;
        let minutes = 0;

        if (isFullDayRecovery) {
            // Calculate full day hours based on user's usual schedule
            const selectedDate = new Date(recoveryDate + 'T00:00:00');
            const dayOfWeek = selectedDate.getDay();
            const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
            const dayKey = (settings.baseHours?.days ? dayKeys[dayOfWeek] as keyof typeof settings.baseHours.days : null);

            let schedule = null;

            if (settings.baseHours?.mode === 'same' && settings.baseHours.same) {
                schedule = settings.baseHours.same;
            } else if (settings.baseHours?.mode === 'per-day' && settings.baseHours?.days?.[dayKey]) {
                const daySchedule = settings.baseHours.days[dayKey];
                if (!daySchedule.enabled) {
                    showNotification({
                        type: "error",
                        title: "Jour non travaillé",
                        message: "Ce jour n'est pas configuré comme jour travaillé dans votre profil"
                    });
                    return;
                }
                schedule = {
                    start: daySchedule.start,
                    lunchStart: daySchedule.lunchStart,
                    lunchEnd: daySchedule.lunchEnd,
                    end: daySchedule.end
                };
            }

            if (!schedule || !schedule.start || !schedule.end) {
                showNotification({
                    type: "error",
                    title: "Horaires non configurés",
                    message: "Veuillez d'abord configurer vos horaires habituels dans votre profil"
                });
                return;
            }

            // Calculate full day minutes
            minutes = computeMinutesFromTimes({
                start: schedule.start,
                lunchStart: schedule.lunchStart || '',
                lunchEnd: schedule.lunchEnd || '',
                end: schedule.end
            });

            finalStartTime = schedule.start;
            finalEndTime = schedule.end;
        } else {
            // Manual time entry
            if (!startTime || !endTime) {
                showNotification({ type: "error", title: "Erreur", message: "Veuillez remplir les heures de début/fin" });
                return;
            }

            const startMin = hmToMin(startTime);
            const endMin = hmToMin(endTime);

            if (endMin <= startMin) {
                showNotification({ type: "error", title: "Erreur", message: "L'heure de fin doit être après l'heure de début" });
                return;
            }

            minutes = endMin - startMin;
            finalStartTime = startTime;
            finalEndTime = endTime;
        }

        // Check for overlap with existing recoveries
        const overlap = checkOverlap(recoveryDate, finalStartTime, finalEndTime, overtimeEvents);
        if (overlap.blocked) {
            showNotification({ type: "error", title: "Erreur", message: overlap.reason });
            return;
        }

        setIsSubmitting(true);
        try {
            onSave({
                date: recoveryDate,
                minutes: minutes,
                note: comment || (isFullDayRecovery ? 'Récupération journée complète' : ''),
                start: finalStartTime,
                end: finalEndTime
            });

            showNotification({
                type: "success",
                title: "Récupération enregistrée",
                message: `${formatDuration(minutes)} ajoutées à vos récupérations.`
            });

            setStartTime('');
            setEndTime('');
            setRecoveryDate('');
            setComment('');
            setIsFullDayRecovery(false);
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200"
        >
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Enregistrer une récupération</h3>
                <Button
                    onClick={onClose}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Date de récupération</Label>
                    <DatePicker
                        value={recoveryDate}
                        onChange={setRecoveryDate}
                        className="h-10 rounded-lg border-gray-200"
                    />
                </div>

                <div className="flex items-center space-x-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <Checkbox
                        id="fullDayRecovery"
                        checked={isFullDayRecovery}
                        onCheckedChange={(checked) => {
                            setIsFullDayRecovery(checked as boolean);
                            if (checked) {
                                setStartTime('');
                                setEndTime('');
                            }
                        }}
                    />
                    <Label
                        htmlFor="fullDayRecovery"
                        className="text-sm font-medium text-gray-900 cursor-pointer"
                    >
                        Récupération journée complète
                    </Label>
                </div>

                {!isFullDayRecovery && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Heure de début</Label>
                            <Input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="h-10 rounded-lg border-gray-200"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Heure de fin</Label>
                            <Input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="h-10 rounded-lg border-gray-200"
                            />
                        </div>
                    </div>
                )}

                {isFullDayRecovery && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-900">
                            ℹ️ Les horaires de cette journée seront automatiquement remplis selon votre configuration habituelle.
                        </p>
                    </div>
                )}

                <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Commentaire (optionnel)</Label>
                    <Textarea
                        placeholder="Ex: Rendez-vous médical, départ anticipé..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="min-h-[60px] rounded-lg border-gray-200 resize-none text-sm"
                    />
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
                <Button
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className="flex-1 h-10 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg shadow-lg shadow-purple-200 text-sm disabled:opacity-50"
                >
                    {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
            </div>
        </motion.div>
    );
}
