import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Checkbox } from "../../../components/ui/checkbox";
import { Label } from "../../../components/ui/label";
import { DatePicker } from "../../../components/DatePicker";
import { useNotification } from "../../../context/NotificationContext";
import { useTimeTracker } from "../../../context/TimeTrackerContext";
import { computeMinutesFromTimes, formatDuration, hmToMin, checkOverlap } from "../../../lib/utils";

export function RecoveryForm() {
    const { otState, addOvertimeEvent, addEntry, settings } = useTimeTracker();
    const { showNotification } = useNotification();
    const [recoveryDate, setRecoveryDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [comment, setComment] = useState("");
    const [isFullDayRecovery, setIsFullDayRecovery] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Calculate daily target for accurate full-day deduction
    const dailyTargetMinutes = settings.workDays > 0
        ? (settings.weeklyTarget / settings.workDays) * 60
        : 0;

    const handleAddAdjustment = async () => {
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
            const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
            const dayKey = dayKeys[dayOfWeek] as string;

            let schedule = null;

            if (settings.baseHours?.mode === "same") {
                schedule = settings.baseHours.same;
            } else if (settings.baseHours?.mode === "per-day" && settings.baseHours?.days?.[dayKey]) {
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

            // Calculate full day minutes based on Daily Target (User Expectation)
            // Instead of calculating from schedule times (which might vary), we use the theoretical daily value
            minutes = dailyTargetMinutes;

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
        const overlap = checkOverlap(recoveryDate, finalStartTime, finalEndTime, otState.events);
        if (overlap.blocked) {
            showNotification({ type: "error", title: "Erreur", message: overlap.reason });
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Add consumption event (NEGATIVE minutes)
            addOvertimeEvent({
                date: recoveryDate,
                minutes: -minutes, // Negative to signify consumption
                note: comment || (isFullDayRecovery ? "Récupération journée complète" : ""),
                start: finalStartTime,
                end: finalEndTime
            });

            // 2. Create a visual entry in the schedule
            addEntry({
                date: recoveryDate,
                start: finalStartTime,
                end: finalEndTime,
                lunchStart: "", // Recovery usually continuous or blocked time
                lunchEnd: "",
                status: "recovery",
                notes: comment || "Récupération"
            });

            showNotification({
                type: "success",
                title: "Récupération enregistrée",
                message: `${formatDuration(minutes)} déduites de votre solde.`
            });

            setStartTime("");
            setEndTime("");
            setRecoveryDate("");
            setComment("");
            setIsFullDayRecovery(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200 shadow-lg"
        >
            <h3 className="text-base font-semibold text-gray-900 mb-4">Ajouter une récupération</h3>

            <div className="space-y-4">
                <div>
                    <Label className="text-sm font-medium text-gray-900 mb-1.5 block">Date de récupération</Label>
                    <DatePicker
                        value={recoveryDate}
                        onChange={setRecoveryDate}
                        className="h-10 rounded-lg border-gray-300 bg-white text-sm"
                    />
                </div>

                <div className="flex items-center space-x-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <Checkbox
                        id="fullDayRecovery"
                        checked={isFullDayRecovery}
                        onCheckedChange={(checked) => {
                            setIsFullDayRecovery(checked as boolean);
                            if (checked) {
                                setStartTime("");
                                setEndTime("");
                            }
                        }}
                    />
                    <Label
                        htmlFor="fullDayRecovery"
                        className="text-sm font-medium text-purple-900 cursor-pointer flex-1"
                    >
                        Récupération journée complète
                    </Label>
                </div>

                {!isFullDayRecovery && (
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-sm font-medium text-gray-900 mb-1.5 block">Début</Label>
                            <Input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="h-10 rounded-lg border-gray-300 bg-white text-sm font-mono"
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-900 mb-1.5 block">Fin</Label>
                            <Input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="h-10 rounded-lg border-gray-300 bg-white text-sm font-mono"
                            />
                        </div>
                    </div>
                )}

                <div>
                    <Label className="text-sm font-medium text-gray-900 mb-1.5 block">Commentaire (optionnel)</Label>
                    <Textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Ex: Rendez-vous médical, départ anticipé..."
                        className="min-h-[80px] rounded-lg border-gray-300 resize-none text-sm"
                    />
                </div>

                <Button
                    onClick={handleAddAdjustment}
                    disabled={isSubmitting}
                    className={`w-full h-10 text-white rounded-lg font-semibold shadow-md disabled:opacity-50 text-sm`}
                    style={{
                        backgroundImage: "linear-gradient(to right, oklch(0.558 0.288 302.321) 0%, oklch(0.592 0.249 0.584) 100%)",
                    }}
                >
                    {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                </Button>
            </div>
        </motion.div>
    );
}
