import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { X, Save, Download, Upload, LogIn, Settings, AlertTriangle } from "lucide-react";
import { useNotification } from "../../context/NotificationContext";
import { motion, AnimatePresence } from "motion/react";
import { useTimeTracker } from "../../context/TimeTrackerContext";
import { computeMinutesFromTimes, minToHM } from "../../lib/utils";
import { GRADIENTS } from "../../ui/design-system/tokens";
import { ScheduleConfigForm } from "./components/ScheduleConfigForm";
import { TargetConfigForm } from "./components/TargetConfigForm";

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin?: () => void;
    onExport?: () => void;
    onImport?: () => void;
}

const daysOfWeek = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const dayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export function ProfileModal({ isOpen, onClose, onLogin, onExport, onImport }: ProfileModalProps) {
    const { settings, updateSettings, clearData } = useTimeTracker();
    const { showNotification } = useNotification();
    const [mode, setMode] = useState<"same" | "different">("same");
    const [weeklyTarget, setWeeklyTarget] = useState("35");
    const [workdaysPerWeek, setWorkdaysPerWeek] = useState("5");
    const [selectedDay, setSelectedDay] = useState("Lundi");

    // Same schedule mode
    const [sameSchedule, setSameSchedule] = useState({
        arrival: "",
        pauseStart: "",
        pauseEnd: "",
        departure: ""
    });

    // Different schedule mode
    const [daySchedules, setDaySchedules] = useState(
        daysOfWeek.map((day, index) => ({
            day,
            key: dayKeys[index],
            isWorkday: index < 5,
            arrival: "",
            pauseStart: "",
            pauseEnd: "",
            departure: "",
        }))
    );

    useEffect(() => {
        if (isOpen && settings) {
            setWeeklyTarget(settings.weeklyTarget.toString());
            setWorkdaysPerWeek(settings.workDays.toString());

            if (settings.baseHours) {
                setMode(settings.baseHours.mode === "per-day" ? "different" : "same");

                // Load same schedule
                if (settings.baseHours.same) {
                    setSameSchedule({
                        arrival: settings.baseHours.same.start || "",
                        pauseStart: settings.baseHours.same.lunchStart || "",
                        pauseEnd: settings.baseHours.same.lunchEnd || "",
                        departure: settings.baseHours.same.end || ""
                    });
                }

                // Load different schedule
                if (settings.baseHours.days) {
                    setDaySchedules(daysOfWeek.map((day, index) => {
                        const key = dayKeys[index];
                        const existing = settings.baseHours!.days?.[key as any];
                        return {
                            day,
                            key,
                            isWorkday: existing?.enabled ?? true,
                            arrival: existing?.start || "",
                            pauseStart: existing?.lunchStart || "",
                            pauseEnd: existing?.lunchEnd || "",
                            departure: existing?.end || "",
                        };
                    }));
                }
            }
        }
    }, [isOpen, settings]);

    // Lock scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    const handleSave = () => {
        const targetWeeklyMinutes = parseFloat(weeklyTarget) * 60;
        let totalWeeklyMinutes = 0;

        // Calculate total weekly minutes based on mode
        if (mode === "same") {
            const dailyMinutes = computeMinutesFromTimes({
                start: sameSchedule.arrival,
                lunchStart: sameSchedule.pauseStart,
                lunchEnd: sameSchedule.pauseEnd,
                end: sameSchedule.departure
            });

            // Validate daily hours don't exceed 24h
            if (dailyMinutes > 1440) {
                showNotification({
                    type: "error",
                    title: "Configuration invalide",
                    message: "Les horaires quotidiens dépassent 24 heures. Veuillez vérifier votre saisie."
                });
                return;
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
                        showNotification({
                            type: "error",
                            title: "Configuration invalide",
                            message: `Les horaires du ${schedule.day} dépassent 24 heures. Veuillez vérifier.`
                        });
                        return;
                    }

                    totalWeeklyMinutes += dailyMinutes;
                }
            }
        }

        // Validate total weekly hours must exactly match weekly target
        if (totalWeeklyMinutes !== targetWeeklyMinutes) {
            const totalWeeklyHours = totalWeeklyMinutes / 60;
            const targetHours = parseFloat(weeklyTarget);

            showNotification({
                type: "error",
                title: "Impossible d'enregistrer",
                message: `Les heures hebdomadaires totales (${minToHM(totalWeeklyMinutes)}) ne correspondent pas à l'objectif de ${targetHours}h.`
            });
            return;
        }

        const newBaseHours = {
            mode: (mode === "different" ? "per-day" : "same") as "same" | "per-day",
            same: {
                start: sameSchedule.arrival,
                lunchStart: sameSchedule.pauseStart,
                lunchEnd: sameSchedule.pauseEnd,
                end: sameSchedule.departure
            },
            days: daySchedules.reduce((acc, curr) => ({
                ...acc,
                [curr.key]: {
                    enabled: curr.isWorkday,
                    start: curr.arrival,
                    lunchStart: curr.pauseStart,
                    lunchEnd: curr.pauseEnd,
                    end: curr.departure
                }
            }), {} as any)
        };

        updateSettings({
            weeklyTarget: parseFloat(weeklyTarget),
            workDays: parseInt(workdaysPerWeek),
            baseHours: newBaseHours
        });

        showNotification({
            type: "success",
            title: "Profil enregistré",
            message: "Votre horaire de travail a été mis à jour"
        });
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 w-full h-full bg-black/20 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white rounded-3xl card-shadow max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className={`px-8 py-6 border-b border-gray-100 bg-gradient-to-r ${GRADIENTS.primaryLight} flex-shrink-0`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${GRADIENTS.primaryDouble} flex items-center justify-center shadow-lg shadow-purple-200`}>
                                            <Settings className="w-6 h-6 text-white" strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900">Paramètres de profil</h2>
                                            <p className="text-sm text-gray-600 mt-1">Configurez vos horaires de travail</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="w-10 h-10 rounded-xl hover:bg-white/50 transition-colors flex items-center justify-center flex-shrink-0"
                                    >
                                        <X className="w-5 h-5 text-gray-600" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-8 overflow-y-auto flex-1 min-h-0">
                                <ScheduleConfigForm
                                    mode={mode}
                                    setMode={setMode}
                                    sameSchedule={sameSchedule}
                                    setSameSchedule={setSameSchedule}
                                    daySchedules={daySchedules}
                                    setDaySchedules={setDaySchedules}
                                    selectedDay={selectedDay}
                                    setSelectedDay={setSelectedDay}
                                />

                                <div className="mt-8">
                                    <TargetConfigForm
                                        weeklyTarget={weeklyTarget}
                                        setWeeklyTarget={setWeeklyTarget}
                                        workdaysPerWeek={workdaysPerWeek}
                                        setWorkdaysPerWeek={setWorkdaysPerWeek}
                                    />
                                </div>

                                {/* Danger Zone */}
                                <div className="mt-8 pt-6 border-t border-gray-100">
                                    <h4 className="font-semibold text-rose-600 mb-4 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5" />
                                        Zone de danger
                                    </h4>
                                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 sm:p-5">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                            <div>
                                                <p className="text-rose-900 font-medium text-sm">Réinitialiser l'application</p>
                                                <p className="text-rose-700 text-xs mt-1">
                                                    Efface toutes les données locales. Irréversible.
                                                </p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    if (confirm("Êtes-vous certain de vouloir tout effacer ? Cette action est irréversible.")) {
                                                        clearData();
                                                    }
                                                }}
                                                className="border-rose-200 text-rose-600 hover:bg-rose-100 hover:text-rose-700 hover:border-rose-300 transition-colors h-10 text-sm whitespace-nowrap"
                                            >
                                                Tout effacer
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            {/* Footer */}
                            <div className="px-8 py-6 border-t border-gray-100 bg-gray-50 grid grid-cols-2 gap-3">
                                <Button
                                    onClick={handleSave}
                                    className={`w-full h-12 text-white rounded-xl font-semibold shadow-md bg-gradient-to-r ${GRADIENTS.primaryButton}`}
                                >
                                    <Save className="w-4 h-4" />
                                    Enregistrer
                                </Button>
                                <Button
                                    onClick={onClose}
                                    variant="outline"
                                    className="w-full h-12 rounded-xl border-gray-200 hover:bg-white"
                                >
                                    Annuler
                                </Button>
                            </div>
                        </motion.div >
                    </div >
                </>
            )
            }
        </AnimatePresence >
    );
}
