import { X, Calendar, Clock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTimeTracker } from "../context/TimeTrackerContext";
import { computeMinutes, minToHM } from "../lib/utils";

interface AllEntriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const statusLabels: Record<string, string> = {
  work: "💼 Travail",
  school: "📚 École / Formation",
  vacation: "🏖️ Congés",
  sick: "🤒 Arrêt maladie",
  holiday: "🎉 Jour férié",
  off: "🌙 Repos"
};

export function AllEntriesModal({ isOpen, onClose }: AllEntriesModalProps) {
  const { entries } = useTimeTracker();

  // Trier les entrées par ordre de saisie (updatedAt), du plus récent au plus ancien
  const sortedEntries = [...entries].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

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
              className="bg-white rounded-3xl card-shadow max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Toutes les entrées</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {sortedEntries.length} {sortedEntries.length > 1 ? "entrées" : "entrée"} au total
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-xl hover:bg-white/50 transition-colors flex items-center justify-center"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-8">
                {sortedEntries.length === 0 ? (
                  <div className="text-center py-16">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Aucune entrée enregistrée</p>
                    <p className="text-gray-400 text-sm mt-2">Commencez à suivre votre temps de travail</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sortedEntries.map((entry) => {
                      const minutes = computeMinutes(entry);
                      const duration = minToHM(minutes);
                      const statusLabel = statusLabels[entry.status] || entry.status;
                      const isWork = entry.status === "work";

                      return (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-5 rounded-2xl border-2 transition-all hover:shadow-md ${
                            isWork
                              ? "border-purple-100 bg-gradient-to-r from-purple-50/50 to-pink-50/50"
                              : "border-gray-100 bg-gray-50/50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              {/* Date */}
                              <div className="flex items-center gap-2 mb-2">
                                <Calendar className={`w-4 h-4 ${isWork ? "text-purple-600" : "text-gray-400"}`} />
                                <p className="font-semibold text-gray-900">
                                  {new Date(entry.date).toLocaleDateString("fr-FR", {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  })}
                                </p>
                              </div>

                              {/* Status */}
                              <div className="mb-3">
                                <span
                                  className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium ${
                                    isWork
                                      ? "bg-purple-100 text-purple-700"
                                      : "bg-gray-200 text-gray-700"
                                  }`}
                                >
                                  {statusLabel}
                                </span>
                              </div>

                              {/* Hours for work days */}
                              {isWork && entry.start && entry.end && (
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                      {entry.start} - {entry.end}
                                    </span>
                                  </div>
                                  {entry.lunchStart && entry.lunchEnd && (
                                    <span className="text-gray-400">
                                      (Pause: {entry.lunchStart} - {entry.lunchEnd})
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Notes */}
                              {entry.notes && (
                                <p className="text-sm text-gray-600 mt-2 italic">
                                  {entry.notes}
                                </p>
                              )}
                            </div>

                            {/* Duration badge */}
                            {isWork && minutes > 0 && (
                              <div className="flex-shrink-0">
                                <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white px-4 py-2 rounded-xl text-center">
                                  <p className="text-2xl font-bold">{duration}</p>
                                  <p className="text-xs opacity-80">travaillées</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
