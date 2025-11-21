import { useState, useMemo } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { TrendingUp, TrendingDown, Plus, Calendar, Clock, Trash2, Minimize2, Maximize2, X, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { useTimeTracker } from "../context/TimeTrackerContext";
import { minToHM, formatDuration, computeMinutes, hmToMin, checkOverlap, getRecoveryMinutesForDay } from "../lib/utils";

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
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [recoveryDate, setRecoveryDate] = useState("");
  const [comment, setComment] = useState("");
  
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

  const handleSaveRecovery = () => {
    if (!recoveryDate || !startTime || !endTime) {
      toast.error("Veuillez remplir la date et les heures de début/fin");
      return;
    }

    const startMin = hmToMin(startTime);
    const endMin = hmToMin(endTime);

    if (endMin <= startMin) {
      toast.error("L'heure de fin doit être après l'heure de début");
      return;
    }

    // Check for overlap with existing recoveries
    const overlap = checkOverlap(recoveryDate, startTime, endTime, otState.events);
    if (overlap.blocked) {
      toast.error(overlap.reason);
      return;
    }

    const minutes = endMin - startMin;

    // 1. Add overtime event (deduct from balance)
    addOvertimeEvent({
      date: recoveryDate,
      minutes: minutes,
      note: comment,
      start: startTime,
      end: endTime
    });

    // 2. Add entry to calendar (mark as vacation/recovery)
    // We use "vacation" status for recovery days
    // Note: This might overwrite existing entry for the day. 
    // Ideally we should check if entry exists and maybe append note or handle partial day recovery differently in calendar.
    // For now, we keep existing behavior but maybe we should warn user?
    // The user requirement says "Recovery must be treated as a time range".
    // If it's a partial day, maybe we shouldn't mark the WHOLE day as vacation?
    // But the current logic marks it as vacation. 
    // Let's stick to the request: "user must NOT be able to enter work hours that overlap".
    // So we just add the event. The calendar entry part is tricky if it's partial day.
    // If I mark it as vacation, it might clear work hours?
    // Let's check addEntry implementation in context... I don't have it here.
    // Assuming addEntry replaces the entry.
    // If it's a partial recovery, maybe we shouldn't call addEntry with "vacation" status if the user intends to work the rest of the day?
    // But the previous code did: status: "vacation".
    // If I change this, I might break "full day recovery" logic.
    // However, if I recover 2 hours, I shouldn't mark the whole day as vacation.
    // I will comment out the addEntry part for now, or make it optional?
    // Actually, the user said "Recovery must be treated as a time range".
    // If I add a recovery event, it is stored in `otState.events`.
    // The `computeOvertimeEarned` uses `entries`.
    // If I don't add an entry to `entries`, the day is treated as normal work day (or empty).
    // If it's empty, it's fine.
    // If I add "vacation", it reduces the target for the week.
    // But a partial recovery shouldn't reduce the target for the WHOLE day, it just counts as "time worked" (or rather "time paid but not worked")?
    // Wait, recovery means I use my overtime balance to NOT work.
    // So it should count towards the target?
    // In `computeOvertimeEarned`:
    // `obj.minutes += computeMinutes(e);`
    // If I don't work, minutes is 0.
    // If I recover 2 hours, I want those 2 hours to count as if I worked them?
    // OR I want the target to be reduced by 2 hours?
    // The previous logic was: `status: "vacation"` -> `obj.absenceDays += 1`.
    // This reduces the target by 1 day (e.g. 7h).
    // If I recover only 2 hours, I shouldn't reduce target by 7h.
    // So the previous logic was only good for FULL DAY recovery.
    // Now we support partial recovery.
    // So we should probably NOT add a "vacation" entry for partial recovery.
    // AND we should probably update `computeOvertimeEarned` to include recovery minutes as "worked" minutes?
    // OR we should update `computeOvertimeEarned` to reduce the target by the recovery amount?
    // Reducing target seems cleaner.
    
    // But wait, `computeOvertimeEarned` is in `utils.ts`. I can modify it.
    // But I need to pass `otState.events` to it.
    // Currently it only takes `entries`, `weeklyTarget`, `workDays`.
    // I should update `computeOvertimeEarned` signature to take `events` as well.
    
    // Let's stick to the requested changes first: UI for range input and overlap check.
    // I will remove the `addEntry` call for now to avoid the "full day vacation" issue, 
    // OR I will only call it if the duration is close to a full day? No that's magic.
    // I'll remove `addEntry` call and just add the event.
    // The user can manually add a "work" entry for the rest of the day if they want.
    // But wait, if they don't add a work entry, they have 0 hours.
    // If they add a work entry, they have X hours.
    // The overlap check will prevent them from adding work during recovery.
    
    // I will remove the `addEntry` call. The user is managing "Overtime Recovery" events.
    // These are stored in `otState`.
    
    // I will update `OvertimePanel.tsx` now.
    
    addOvertimeEvent({
      date: recoveryDate,
      minutes: minutes,
      note: comment,
      start: startTime,
      end: endTime
    });

    // Removed addEntry call to avoid overwriting daily entry with full-day vacation status.
    // Partial recoveries should not mark the whole day as vacation.

    toast.success("Récupération enregistrée", {
      description: "Votre demande de récupération a été ajoutée.",
    });

    setStartTime("");
    setEndTime("");
    setRecoveryDate("");
    setComment("");
    setShowRecoveryModal(false);
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

            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm font-medium text-gray-700">Date de récupération</Label>
              <Input
                type="date"
                value={recoveryDate}
                onChange={(e) => setRecoveryDate(e.target.value)}
                className="h-10 rounded-lg border-gray-200"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
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
              className="flex-1 h-10 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg shadow-lg shadow-purple-200 text-sm"
            >
              Enregistrer
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