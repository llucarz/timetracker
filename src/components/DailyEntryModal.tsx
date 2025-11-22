import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Calendar, Save, RotateCcw, X, Sparkles, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";
import { useTimeTracker } from "../context/TimeTrackerContext";
import { computeMinutesFromTimes, minToHM, getRecoveryMinutesForDay, formatDuration } from "../lib/utils";

interface DailyEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSchedule?: {
    arrival: string;
    pauseStart: string;
    pauseEnd: string;
    departure: string;
  };
}

export function DailyEntryModal({ isOpen, onClose, defaultSchedule }: DailyEntryModalProps) {
  const { addEntry, otState, settings } = useTimeTracker();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [arrival, setArrival] = useState("");
  const [pauseStart, setPauseStart] = useState("");
  const [pauseEnd, setPauseEnd] = useState("");
  const [departure, setDeparture] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("work");

  const handleFillDefault = () => {
    const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const selectedDate = new Date(date + 'T00:00:00');
    const dayOfWeek = selectedDate.getDay();
    const dayKey = dayKeys[dayOfWeek] as keyof typeof settings.baseHours.days;

    let scheduleToUse = defaultSchedule;

    // Si le mode est "different" et qu'on a des horaires pour ce jour
    if (settings.baseHours?.mode === "different" && settings.baseHours?.days?.[dayKey]) {
      const daySchedule = settings.baseHours.days[dayKey];
      scheduleToUse = {
        arrival: daySchedule.start || "09:00",
        pauseStart: daySchedule.lunchStart || "12:30",
        pauseEnd: daySchedule.lunchEnd || "13:30",
        departure: daySchedule.end || "18:00",
      };
    }

    if (scheduleToUse) {
      setArrival(scheduleToUse.arrival);
      setPauseStart(scheduleToUse.pauseStart);
      setPauseEnd(scheduleToUse.pauseEnd);
      setDeparture(scheduleToUse.departure);
      toast.success("Horaires habituels remplis", {
        description: "Vous pouvez maintenant ajuster si nécessaire"
      });
    }
  };

  const handleSave = () => {
    if (!date) {
      toast.error("Veuillez sélectionner une date");
      return;
    }

    if (status === "work" && (!arrival || !departure)) {
      toast.error("Veuillez entrer au moins l'arrivée et le départ");
      return;
    }

    addEntry({
      date,
      start: arrival,
      lunchStart: pauseStart,
      lunchEnd: pauseEnd,
      end: departure,
      note: notes,
      status: status as any,
    });

    const formattedDate = new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    toast.success("Journée enregistrée avec succès", {
      description: `${formattedDate} - ${calculateDuration()} travaillées`,
    });
    
    handleClear();
    onClose();
  };

  const handleClear = () => {
    setArrival("");
    setPauseStart("");
    setPauseEnd("");
    setDeparture("");
    setNotes("");
  };

  const calculateDuration = () => {
    const mins = computeMinutesFromTimes({
      start: arrival,
      lunchStart: pauseStart,
      lunchEnd: pauseEnd,
      end: departure
    });
    return minToHM(mins);
  };

  const duration = calculateDuration();
  const isWorkDay = status === "work";

  const recoveryMinutes = getRecoveryMinutesForDay(date, otState.events);
  const recoveryEvents = otState.events.filter(e => e.date === date);
  const workMinutes = computeMinutesFromTimes({
    start: arrival,
    lunchStart: pauseStart,
    lunchEnd: pauseEnd,
    end: departure
  });
  const creditedMinutes = workMinutes + recoveryMinutes;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl card-shadow max-w-2xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-200">
                      <Calendar className="w-6 h-6 text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Saisir mes heures</h2>
                      <p className="text-sm text-gray-600 mt-1">Enregistrez votre temps de travail quotidien</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-xl hover:bg-white/50 transition-colors flex items-center justify-center"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 overflow-y-auto max-h-[calc(90vh-180px)]">
                <div className="space-y-6">
                  {/* Date & Status */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Date</Label>
                      <DatePicker
                        value={date}
                        onChange={setDate}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Type de journée</Label>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="h-11 rounded-xl border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="work">💼 Travail</SelectItem>
                          <SelectItem value="school">📚 École / Formation</SelectItem>
                          <SelectItem value="vacation">🏖️ Congés</SelectItem>
                          <SelectItem value="sick">🤒 Arrêt maladie</SelectItem>
                          <SelectItem value="holiday">🎉 Jour férié</SelectItem>
                          <SelectItem value="off">🌙 Repos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Warning Banner */}
                  {recoveryMinutes > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-3 items-start"
                    >
                      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                      <div className="text-sm">
                        <p className="font-bold text-red-900 leading-5">
                          Récupération planifiée : {formatDuration(recoveryMinutes)}
                        </p>
                        <div className="mt-0.5 text-red-800">
                          {recoveryEvents.map((event, i) => (
                            <p key={i} className="text-xs leading-tight">
                              • {event.start} - {event.end} ({formatDuration(event.minutes)})
                            </p>
                          ))}
                          <p className="text-xs mt-0.5 opacity-90 italic leading-tight">
                            Vérifiez la cohérence avec vos heures travaillées.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Work Hours */}
                  {isWorkDay && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-gray-700">Horaires de travail</Label>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={handleFillDefault}
                          className="h-8 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Remplir horaires habituels
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-600">Arrivée</Label>
                          <TimePicker
                            value={arrival}
                            onChange={setArrival}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs text-gray-600">Départ</Label>
                          <TimePicker
                            value={departure}
                            onChange={setDeparture}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs text-gray-600">Début pause</Label>
                          <TimePicker
                            value={pauseStart}
                            onChange={setPauseStart}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs text-gray-600">Fin pause</Label>
                          <TimePicker
                            value={pauseEnd}
                            onChange={setPauseEnd}
                          />
                        </div>
                      </div>

                      {/* Duration Display */}
                      {(arrival && departure) || recoveryMinutes > 0 ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">
                                {recoveryMinutes > 0 ? "Credited (Work + Recov.)" : "Durée totale"}
                              </p>
                              <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                {formatDuration(creditedMinutes)}
                              </p>
                              {recoveryMinutes > 0 && (
                                <div className="flex gap-3 mt-1 text-sm text-gray-500">
                                  <span>Work: {formatDuration(workMinutes)}</span>
                                  <span>•</span>
                                  <span>Recov: {formatDuration(recoveryMinutes)}</span>
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600 mb-1">Objectif journalier</p>
                              <p className="text-2xl font-bold text-gray-700">7h00</p>
                            </div>
                          </div>
                        </motion.div>
                      ) : null}
                    </motion.div>
                  )}

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Notes (optionnel)</Label>
                    <Textarea
                      placeholder="Réunion, déplacement, télétravail..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-[100px] rounded-xl border-gray-200 resize-none text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                <Button 
                  onClick={handleSave}
                  className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg shadow-purple-200"
                >
                  <Save className="w-4 h-4" />
                  Enregistrer
                </Button>
                <Button 
                  onClick={handleClear}
                  variant="outline"
                  className="h-12 px-6 rounded-xl border-gray-200 hover:bg-white"
                >
                  <RotateCcw className="w-4 h-4" />
                  Effacer
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}