import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Calendar, Save, Trash2, X, AlertTriangle } from "lucide-react";
import { useNotification } from "../context/NotificationContext";
import { motion, AnimatePresence } from "motion/react";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";
import { useTimeTracker } from "../context/TimeTrackerContext";
import { Entry } from "../lib/types";
import { computeMinutesFromTimes, minToHM, checkOverlap, getRecoveryMinutesForDay, formatDuration, cn, hmToMin } from "../lib/utils";

interface EditEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: Entry | null;
}

export function EditEntryModal({ isOpen, onClose, entry }: EditEntryModalProps) {
  const { updateEntry, deleteEntry, otState, deleteOvertimeEvent } = useTimeTracker();
  const { showNotification } = useNotification();
  const [date, setDate] = useState("");
  const [arrival, setArrival] = useState("");
  const [pauseStart, setPauseStart] = useState("");
  const [pauseEnd, setPauseEnd] = useState("");
  const [departure, setDeparture] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("work");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (entry) {
      setDate(entry.date);
      setArrival(entry.start || "");
      setPauseStart(entry.lunchStart || "");
      setPauseEnd(entry.lunchEnd || "");
      setDeparture(entry.end || "");
      setNotes(entry.notes || "");
      setStatus(entry.status || "work");
    }
  }, [entry]);

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

  useEffect(() => {
    if (!isOpen) {
      setShowDeleteConfirm(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!date) {
      showNotification({ type: "error", title: "Erreur", message: "Veuillez sélectionner une date" });
      return;
    }

    if (status === "work" && (!arrival || !departure)) {
      showNotification({ type: "error", title: "Erreur", message: "Veuillez entrer au moins l'arrivée et le départ" });
      return;
    }

    if (status === "work") {
      const startMin = hmToMin(arrival);
      const endMin = hmToMin(departure);
      const pStartMin = pauseStart ? hmToMin(pauseStart) : null;
      const pEndMin = pauseEnd ? hmToMin(pauseEnd) : null;

      if (endMin <= startMin) {
        showNotification({ type: "error", title: "Erreur", message: "L'heure de départ doit être après l'heure d'arrivée" });
        return;
      }

      if (pauseStart || pauseEnd) {
        if (!pauseStart || !pauseEnd) {
          showNotification({ type: "error", title: "Erreur", message: "Veuillez saisir le début et la fin de pause" });
          return;
        }
        if (pEndMin! <= pStartMin!) {
          showNotification({ type: "error", title: "Erreur", message: "La fin de pause doit être postérieure au début de pause" });
          return;
        }
        if (pStartMin! <= startMin) {
          showNotification({ type: "error", title: "Erreur", message: "Le début de pause doit être après l'arrivée" });
          return;
        }
        if (pEndMin! >= endMin) {
          showNotification({ type: "error", title: "Erreur", message: "Le départ doit être après la fin de pause" });
          return;
        }
      }
    }

    if (status === "work") {
      // Check morning session
      if (arrival && (pauseStart || departure)) {
        const end = pauseStart || departure;
        const overlap = checkOverlap(date, arrival, end, otState.events);
        if (overlap.blocked) {
          showNotification({ type: "error", title: "Erreur", message: overlap.reason });
          return;
        }
      }
      // Check afternoon session
      if (pauseEnd && departure) {
        const overlap = checkOverlap(date, pauseEnd, departure, otState.events);
        if (overlap.blocked) {
          showNotification({ type: "error", title: "Erreur", message: overlap.reason });
          return;
        }
      }
    }

    if (entry) {
      updateEntry({
        ...entry,
        date,
        start: arrival,
        lunchStart: pauseStart,
        lunchEnd: pauseEnd,
        end: departure,
        notes: notes,
        status: status as any,
      });

      const workMins = computeMinutesFromTimes({
        start: arrival,
        lunchStart: pauseStart,
        lunchEnd: pauseEnd,
        end: departure
      });
      const recovMins = getRecoveryMinutesForDay(date, otState.events);
      const totalMins = workMins + recovMins;

      showNotification({
        type: "success",
        title: "Entrée mise à jour",
        message: `${date} - ${formatDuration(totalMins)} crédité`
      });
    }

    onClose();
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    if (entry) {
      try {
        // 1. Delete associated overtime events (e.g. recoveries) for this day
        if (otState?.events) {
          const matchingEvents = otState.events.filter(e => e.date === entry.date);
          matchingEvents.forEach(e => {
            deleteOvertimeEvent(e.id);
          });
        }

        // 2. Delete the entry itself
        await deleteEntry(entry.id);
        showNotification({ type: "success", title: "Succès", message: "Entrée supprimée" });
      } catch (error) {
        console.error("Error deleting entry:", error);
        showNotification({ type: "error", title: "Erreur", message: "Erreur lors de la suppression" });
      }
    }
    onClose();
  };

  const calculateMinutes = () => {
    return computeMinutesFromTimes({
      start: arrival,
      lunchStart: pauseStart,
      lunchEnd: pauseEnd,
      end: departure
    });
  };

  const workMinutes = calculateMinutes();
  const recoveryMinutes = getRecoveryMinutesForDay(date, otState.events);
  const recoveryEvents = otState.events.filter(e => e.date === date);
  const creditedMinutes = workMinutes + recoveryMinutes;
  const duration = formatDuration(creditedMinutes);
  const isWorkDay = status === "work";

  if (!entry) return null;

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
            className="fixed inset-0 w-full h-full bg-black/20 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl card-shadow max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-cyan-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-200">
                      <Calendar className="w-6 h-6 text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Modifier l'entrée</h2>
                      <p className="text-sm text-gray-600 mt-1">Éditez vos informations de temps</p>
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
              <div className="p-8 overflow-y-auto flex-1 min-h-0">
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
                      <Label className="text-sm font-medium text-gray-700">Horaires de travail</Label>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-600">Arrivée</Label>
                          <TimePicker
                            value={arrival}
                            onChange={setArrival}
                            placeholder="09:00"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs text-gray-600">Début pause</Label>
                          <TimePicker
                            value={pauseStart}
                            onChange={setPauseStart}
                            placeholder="12:30"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs text-gray-600">Fin pause</Label>
                          <TimePicker
                            value={pauseEnd}
                            onChange={setPauseEnd}
                            placeholder="13:30"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs text-gray-600">Départ</Label>
                          <TimePicker
                            value={departure}
                            onChange={setDeparture}
                            placeholder="17:00"
                          />
                        </div>
                      </div>

                      {/* Duration Display */}
                      {(arrival && departure) || recoveryMinutes > 0 ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-6 border border-teal-100"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Crédité (Travail + Récup.)</p>
                              <p className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                {formatDuration(creditedMinutes)}
                              </p>
                              <div className="flex gap-3 mt-1 text-sm text-gray-500">
                                <span>Travail : {formatDuration(workMinutes)}</span>
                                <span>•</span>
                                <span>Récup. : {formatDuration(recoveryMinutes)}</span>
                              </div>
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
              <div className="px-8 py-6 border-t border-gray-100 bg-gray-50 grid grid-cols-2 gap-3">
                <Button
                  onClick={handleSave}
                  className="w-full h-12 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-xl font-semibold shadow-lg shadow-teal-200"
                >
                  <Save className="w-4 h-4" />
                  Enregistrer
                </Button>
                <Button
                  onClick={handleDelete}
                  variant={showDeleteConfirm ? "destructive" : "outline"}
                  className={cn(
                    "w-full h-12 px-6 rounded-xl transition-all duration-200",
                    showDeleteConfirm
                      ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200"
                      : "border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                  )}
                >
                  <Trash2 className="w-4 h-4" />
                  {showDeleteConfirm ? "Confirmer ?" : "Supprimer"}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}