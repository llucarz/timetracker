import { useState, useMemo } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { DatePicker } from "./DatePicker";
import { TrendingUp, TrendingDown, Plus, Calendar, Clock, Trash2, Minimize2, Maximize2, X, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { useTimeTracker } from "../context/TimeTrackerContext";
import { minToHM, formatDuration, computeMinutes, hmToMin, checkOverlap, getRecoveryMinutesForDay, computeMinutesFromTimes } from "../lib/utils";

interface HistoryItem {
  id: string;
  date: string;
  type: "earned" | "recovered";
  minutes: number;
  comment?: string;
  isManual: boolean;
  start?: string;
  end?: string;
}

// Fonction pour convertir les heures en jours et heures
function convertHoursToDays(hours: number) {
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

export function OvertimePanel() {
  const { otState, addOvertimeEvent, deleteOvertimeEvent, entries, settings, addEntry } = useTimeTracker();
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [recoveryDate, setRecoveryDate] = useState("");
  const [comment, setComment] = useState("");
  const [isFullDayRecovery, setIsFullDayRecovery] = useState(false);
  
  // Calculate stats from context
  const overtimeBalance = otState.balanceMinutes;
  const overtimeEarned = otState.earnedMinutes;
  const overtimeRecovered = otState.usedMinutes;

  // Calculate daily target
  const dailyTargetMinutes = useMemo(() => {
    if (!settings.workDays) return 0;
    return (settings.weeklyTarget / settings.workDays) * 60;
  }, [settings.weeklyTarget, settings.workDays]);

  // Combine events and earned overtime
  const historyItems = useMemo(() => {
    const items: HistoryItem[] = [];

    // 1. Recoveries (Manual events)
    otState.events.forEach(event => {
      items.push({
        id: event.id,
        date: event.date,
        type: "recovered",
        minutes: event.minutes,
        comment: event.note,
        isManual: true,
        start: event.start,
        end: event.end
      });
    });

    // 2. Earned (Daily positive delta)
    entries.forEach(entry => {
      if (entry.status && entry.status !== "work") return; // Only work days
      
      const workMinutes = computeMinutes(entry);
      const recoveryMinutes = getRecoveryMinutesForDay(entry.date, otState.events);
      const totalMinutes = workMinutes + recoveryMinutes;
      const delta = totalMinutes - dailyTargetMinutes;
      
      if (delta > 0) {
        items.push({
          id: `earned-${entry.id}`,
          date: entry.date,
          type: "earned",
          minutes: delta,
          comment: "Heures supplémentaires",
          isManual: false
        });
      }
    });

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [otState.events, entries, dailyTargetMinutes]);

  const handleSaveRecovery = async () => {
    if (isSubmitting) return;
    
    if (!recoveryDate) {
      toast.error("Veuillez sélectionner une date");
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
      const dayKey = dayKeys[dayOfWeek] as keyof typeof settings.baseHours.days;

      let schedule = null;

      if (settings.baseHours?.mode === "same") {
        schedule = settings.baseHours.same;
      } else if (settings.baseHours?.mode === "different" && settings.baseHours?.days?.[dayKey]) {
        const daySchedule = settings.baseHours.days[dayKey];
        if (!daySchedule.enabled) {
          toast.error("Jour non travaillé", {
            description: "Ce jour n'est pas configuré comme jour travaillé dans votre profil"
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
        toast.error("Horaires non configurés", {
          description: "Veuillez d'abord configurer vos horaires habituels dans votre profil"
        });
        return;
      }

      // Calculate full day minutes
      minutes = computeMinutesFromTimes({
        start: schedule.start,
        lunchStart: schedule.lunchStart || "",
        lunchEnd: schedule.lunchEnd || "",
        end: schedule.end
      });

      finalStartTime = schedule.start;
      finalEndTime = schedule.end;
    } else {
      // Manual time entry
      if (!startTime || !endTime) {
        toast.error("Veuillez remplir les heures de début/fin");
        return;
      }

      const startMin = hmToMin(startTime);
      const endMin = hmToMin(endTime);

      if (endMin <= startMin) {
        toast.error("L'heure de fin doit être après l'heure de début");
        return;
      }

      minutes = endMin - startMin;
      finalStartTime = startTime;
      finalEndTime = endTime;
    }

    // Check for overlap with existing recoveries
    const overlap = checkOverlap(recoveryDate, finalStartTime, finalEndTime, otState.events);
    if (overlap.blocked) {
      toast.error(overlap.reason);
      return;
    }

    setIsSubmitting(true);
    try {
      // Add overtime event (deduct from balance)
      addOvertimeEvent({
        date: recoveryDate,
        minutes: minutes,
        note: comment || (isFullDayRecovery ? "Récupération journée complète" : ""),
        start: finalStartTime,
        end: finalEndTime
      });

      toast.success("Récupération enregistrée", {
        description: `${formatDuration(minutes)} ajoutées à vos récupérations.`,
      });

      setStartTime("");
      setEndTime("");
      setRecoveryDate("");
      setComment("");
      setIsFullDayRecovery(false);
      setShowRecoveryModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-2.5 sm:gap-3 overflow-hidden pb-2">
      {/* Header avec stats principales - Caché quand le formulaire est ouvert ou en mode plein écran */}
      {!showRecoveryModal && !isFullscreen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5"
        >
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Heures supplémentaires</h2>
            <p className="text-xs text-gray-500 mt-0.5">Gérez votre solde et vos récupérations</p>
          </div>
          <Button
            onClick={() => setShowRecoveryModal(true)}
            className="h-9 sm:h-10 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg shadow-lg shadow-purple-200 w-full sm:w-auto text-sm"
          >
            <Plus className="w-4 h-4" />
            Nouvelle récupération
          </Button>
        </motion.div>
      )}

      {/* Cards statistiques - Plus compactes - Cachées en mode plein écran */}
      {!isFullscreen && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-3 sm:p-4 text-white shadow-xl"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="text-right">
                <p className="text-xs text-white/80">Solde actuel</p>
                <p className="text-2xl font-bold mt-0.5">{overtimeBalance > 0 ? "+" : ""}{formatDuration(overtimeBalance)}</p>
                <p className="text-xs text-white/70 mt-0.5">{convertHoursToDays(overtimeBalance / 60)}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-white/20">
              <p className="text-xs text-white/70">
                {overtimeBalance > 0 ? "Vous avez accumulé des heures supplémentaires" : "Votre solde est à jour"}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Heures cumulées</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">+{formatDuration(overtimeEarned)}</p>
                <p className="text-xs text-emerald-600 mt-0.5 font-medium">{convertHoursToDays(overtimeEarned / 60)}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500">Total des heures supplémentaires</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Heures récupérées</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">-{formatDuration(overtimeRecovered)}</p>
                <p className="text-xs text-blue-600 mt-0.5 font-medium">{convertHoursToDays(overtimeRecovered / 60)}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500">Temps de repos pris</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Formulaire de récupération (conditionnel) */}
      {showRecoveryModal && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Enregistrer une récupération</h3>
            <Button
              onClick={() => setShowRecoveryModal(false)}
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
                    setStartTime("");
                    setEndTime("");
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
              onClick={handleSaveRecovery}
              disabled={isSubmitting}
              className="flex-1 h-10 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg shadow-lg shadow-purple-200 text-sm disabled:opacity-50"
            >
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Backdrop avec flou pour le mode plein écran */}
      {isFullscreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-md z-40"
          onClick={() => setIsFullscreen(false)}
        />
      )}

      {/* Table des récupérations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className={`bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 card-shadow flex flex-col flex-1 overflow-hidden relative ${
          isFullscreen ? "fixed inset-4 z-50 max-w-none" : ""
        }`}
      >
        <div className="flex items-center justify-between mb-3 sm:mb-4 flex-shrink-0">
          <div>
            <h3 className="font-semibold text-gray-900 text-base">Historique</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {historyItems.length} mouvement{historyItems.length > 1 ? "s" : ""} enregistré{historyItems.length > 1 ? "s" : ""}
            </p>
          </div>
          
          {/* Bouton Plein écran */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`rounded-lg ${
              isFullscreen 
                ? "absolute top-4 right-4 h-9 w-9 p-0 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg z-10" 
                : "h-8 w-8 p-0"
            }`}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {historyItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
              <div className="w-14 sm:w-16 h-14 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-7 sm:w-8 h-7 sm:h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium text-sm sm:text-base">Aucun historique</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Vos heures supplémentaires et récupérations apparaîtront ici</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {historyItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="p-3 sm:p-4 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        item.type === "earned" ? "bg-emerald-100" : "bg-red-100"
                      }`}>
                        {item.type === "earned" ? (
                          <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-red-600" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 text-sm">
                          {item.type === "earned" ? "Heures supplémentaires" : "Récupération"}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <p className="text-xs text-gray-500 truncate">
                            {new Date(item.date).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric"
                            })}
                            {item.start && item.end && (
                              <span className="ml-1 text-gray-400">
                                ({item.start} - {item.end})
                              </span>
                            )}
                          </p>
                        </div>
                        {item.comment && (
                          <p className="text-xs text-gray-600 mt-1.5 italic line-clamp-2">"{item.comment}"</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <p className={`text-base sm:text-lg font-semibold ${
                          item.type === "earned" ? "text-emerald-600" : "text-red-600"
                        }`}>
                          {item.type === "earned" ? "+" : "-"}{formatDuration(item.minutes)}
                        </p>
                      </div>
                      {item.isManual ? (
                        <button
                          onClick={() => {
                            deleteOvertimeEvent(item.id);
                            toast.success("Récupération supprimée");
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 rounded-lg hover:bg-red-50 flex items-center justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        </button>
                      ) : (
                        <div className="w-8 h-8" /> // Spacer
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}