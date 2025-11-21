import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Calendar, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";
import { useTimeTracker } from "../context/TimeTrackerContext";
import { Entry } from "../lib/types";
import { computeMinutesFromTimes, minToHM, checkOverlap, getRecoveryMinutesForDay, formatDuration, cn } from "../lib/utils";

interface EditEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: Entry | null;
}

export function EditEntryModal({ isOpen, onClose, entry }: EditEntryModalProps) {
  const { updateEntry, deleteEntry, otState } = useTimeTracker();
  const [date, setDate] = useState("");
  const [arrival, setArrival] = useState("");
  const [pauseStart, setPauseStart] = useState("");
  const [pauseEnd, setPauseEnd] = useState("");
  const [departure, setDeparture] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("work");

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

  const handleSave = () => {
    if (!date) {
      toast.error("Veuillez sélectionner une date");
      return;
    }

    if (status === "work" && (!arrival || !departure)) {
      toast.error("Veuillez entrer au moins l'arrivée et le départ");
      return;
    }

    if (status === "work") {
      // Check morning session
      if (arrival && (pauseStart || departure)) {
        const end = pauseStart || departure;
        const overlap = checkOverlap(date, arrival, end, otState.events);
        if (overlap.blocked) {
          toast.error(overlap.reason);
          return;
        }
      }
      // Check afternoon session
      if (pauseEnd && departure) {
        const overlap = checkOverlap(date, pauseEnd, departure, otState.events);
        if (overlap.blocked) {
          toast.error(overlap.reason);
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

      toast.success("Entrée mise à jour avec succès", {
        description: `${date} - ${formatDuration(totalMins)} credited`,
      });
    }
    
    onClose();
  };

  const handleDelete = () => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette entrée ?")) {
      if (entry) {
        deleteEntry(entry.id);
        toast.success("Entrée supprimée");
      }
      onClose();
    }
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
                      className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 items-start"
                    >
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-amber-900">Recovery Scheduled</h4>
                        <p className="text-sm text-amber-700 mt-1">
                          You have {formatDuration(recoveryMinutes)} of recovery scheduled for this day.
                          Make sure your worked hours are consistent with this recovery.
                        </p>
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
                          className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-6 border border-teal-100"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Credited (Work + Recov.)</p>
                              <p className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                {formatDuration(creditedMinutes)}
                              </p>
                              <div className="flex gap-3 mt-1 text-sm text-gray-500">
                                <span>Work: {formatDuration(workMinutes)}</span>
                                <span>•</span>
                                <span>Recov: {formatDuration(recoveryMinutes)}</span>
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
              <div className="px-8 py-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                <Button 
                  onClick={handleSave}
                  className="flex-1 h-12 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-xl font-semibold shadow-lg shadow-teal-200"
                >
                  <Save className="w-4 h-4" />
                  Enregistrer
                </Button>
                <Button 
                  onClick={handleDelete}
                  variant="outline"
                  className="h-12 px-6 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}