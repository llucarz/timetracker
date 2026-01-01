import { useState, useMemo, useEffect } from "react";
import { Button } from "./ui/button";
import { X, Download, Calendar, Clock, TrendingUp, Sparkles, FileDown, ChevronDown } from "lucide-react";
import { useNotification } from "../context/NotificationContext";
import { motion, AnimatePresence } from "motion/react";
import { DatePicker } from "./DatePicker";
import { useTimeTracker } from "../context/TimeTrackerContext";
import { computeMinutes, minToHM, toDateKey, toLocalDateKey, weekRangeOf } from "../lib/utils";
import { GRADIENTS } from "../ui/design-system/tokens";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ExportPeriod = "week" | "month" | "year" | "all" | "custom";

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const { showNotification } = useNotification();
  const { entries } = useTimeTracker();
  const [selectedPeriod, setSelectedPeriod] = useState<ExportPeriod>("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());

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

  // Calculate date ranges based on selected period
  const dateRange = useMemo(() => {
    const anchor = selectedDate;

    switch (selectedPeriod) {
      case "week": {
        const dateStr = toLocalDateKey(anchor);
        const { start, end } = weekRangeOf(dateStr);
        return { start, end };
      }
      case "month": {
        const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
        const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
        return {
          start: toLocalDateKey(start),
          end: toLocalDateKey(end),
        };
      }
      case "year": {
        const start = new Date(anchor.getFullYear(), 0, 1);
        const end = new Date(anchor.getFullYear(), 11, 31);
        return {
          start: toLocalDateKey(start),
          end: toLocalDateKey(end),
        };
      }
      case "custom":
        return { start: startDate, end: endDate };
      case "all":
      default:
        return { start: "", end: "" };
    }
  }, [selectedPeriod, startDate, endDate, selectedDate]);

  // Filter entries based on selected period
  const filteredEntries = useMemo(() => {
    if (selectedPeriod === "all") {
      return entries;
    }

    const { start, end } = dateRange;

    if (!start && !end) return entries;

    return entries.filter((e) => {
      if (start && end) {
        return e.date >= start && e.date <= end;
      } else if (start) {
        return e.date >= start;
      } else if (end) {
        return e.date <= end;
      }
      return true;
    });
  }, [entries, selectedPeriod, dateRange]);

  const handleExport = () => {
    if (filteredEntries.length === 0) {
      showNotification({
        type: "error",
        title: "Erreur",
        message: "Aucune entrée à exporter pour cette période"
      });
      return;
    }

    // Generate CSV
    const headers = [
      "Date",
      "Arrivée",
      "Début pause",
      "Fin pause",
      "Départ",
      "Statut",
      "Notes",
      "Heures totales",
    ];
    const rows = filteredEntries.map((entry) => {
      const minutes = computeMinutes(entry);
      const hours = minToHM(minutes);
      return [
        entry.date,
        entry.start || "",
        entry.lunchStart || "",
        entry.lunchEnd || "",
        entry.end || "",
        entry.status || "work",
        `"${(entry.notes || "").replace(/"/g, '""')}"`,
        hours,
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const periodLabel = {
      week: "semaine",
      month: "mois",
      year: "annee",
      all: "tout",
      custom: "periode",
    }[selectedPeriod] || "export";

    const filename = `timetracker_${periodLabel}_${new Date().toISOString().split("T")[0]}.csv`;

    // Use application/octet-stream to force download on all browsers
    // This prevents the browser from trying to open the file directly
    const blob = new Blob(["\uFEFF" + csv], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);

    showNotification({
      type: "success",
      title: "Succès",
      message: "Export réussi" // Description not supported in same way, simplifying
    });

    onClose();
  };

  const handlePeriodChange = (period: ExportPeriod) => {
    setSelectedPeriod(period);
    // Reset to current date when changing period
    setSelectedDate(new Date());
  };

  const handlePreviousPeriod = () => {
    const newDate = new Date(selectedDate);
    if (selectedPeriod === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else if (selectedPeriod === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (selectedPeriod === "year") {
      newDate.setFullYear(newDate.getFullYear() - 1);
    }
    setSelectedDate(newDate);
  };

  const handleNextPeriod = () => {
    const newDate = new Date(selectedDate);
    if (selectedPeriod === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else if (selectedPeriod === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (selectedPeriod === "year") {
      newDate.setFullYear(newDate.getFullYear() + 1);
    }
    setSelectedDate(newDate);
  };

  const getPeriodLabel = () => {
    if (selectedPeriod === "week") {
      const { start } = weekRangeOf(toDateKey(selectedDate));
      return new Date(start).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } else if (selectedPeriod === "month") {
      return selectedDate.toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      });
    } else if (selectedPeriod === "year") {
      return selectedDate.getFullYear().toString();
    }
    return "";
  };

  const periodOptions = [
    {
      id: "week" as ExportPeriod,
      label: "Semaine",
      icon: Calendar,
      gradient: GRADIENTS.primaryDouble,
    },
    {
      id: "month" as ExportPeriod,
      label: "Mois",
      icon: TrendingUp,
      gradient: GRADIENTS.accent,
    },
    {
      id: "year" as ExportPeriod,
      label: "Année",
      icon: Sparkles,
      gradient: GRADIENTS.secondary,
    },
    {
      id: "all" as ExportPeriod,
      label: "Tout",
      icon: FileDown,
      gradient: GRADIENTS.success,
    },
    {
      id: "custom" as ExportPeriod,
      label: "Personnalisée",
      icon: Clock,
      gradient: GRADIENTS.info,
    },
  ];

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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl border border-gray-200 card-shadow w-full max-w-2xl"
            >
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${GRADIENTS.accent} flex items-center justify-center shadow-lg shadow-teal-200`}>
                      <Download className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Exporter les données
                      </h2>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Télécharger au format CSV
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-8 py-6">
                {/* Period Selection Grid */}
                <div className="grid grid-cols-5 gap-3 mb-6">
                  {periodOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = selectedPeriod === option.id;

                    return (
                      <button
                        key={option.id}
                        onClick={() => handlePeriodChange(option.id)}
                        className={`relative p-2 sm:p-4 rounded-2xl border-2 transition-all ${isSelected
                          ? `bg-gradient-to-br ${option.gradient} border-transparent shadow-lg`
                          : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-md"
                          }`}
                      >
                        <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                          <div
                            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${isSelected
                              ? "bg-white/20 backdrop-blur-sm"
                              : "bg-gray-100"
                              }`}
                          >
                            <Icon
                              className={`w-4 h-4 sm:w-5 sm:h-5 ${isSelected ? "text-white" : "text-gray-600"
                                }`}
                            />
                          </div>
                          <p
                            className={`text-[9px] sm:text-xs font-medium text-center leading-tight px-0.5 ${isSelected ? "text-white" : "text-gray-700"
                              }`}
                          >
                            {option.label}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Period Selector for Week/Month/Year */}
                <AnimatePresence mode="wait">
                  {(selectedPeriod === "week" || selectedPeriod === "month" || selectedPeriod === "year") && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6 overflow-hidden"
                    >
                      <div className={`bg-gradient-to-br ${selectedPeriod === "week" ? `${GRADIENTS.primaryLight} border-purple-200` :
                        selectedPeriod === "month" ? `${GRADIENTS.accentLight} border-teal-200` :
                          `${GRADIENTS.secondaryLight} border-pink-200`
                        } border rounded-2xl p-5`}>
                        <div className="flex items-center justify-between">
                          <button
                            onClick={handlePreviousPeriod}
                            className="w-10 h-10 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center"
                          >
                            <ChevronDown className="w-5 h-5 text-gray-600 rotate-90" />
                          </button>

                          <div className="text-center">
                            <p className={`text-xs font-medium mb-1 ${selectedPeriod === "week" ? "text-purple-700" :
                              selectedPeriod === "month" ? "text-teal-700" :
                                "text-pink-700"
                              }`}>
                              {selectedPeriod === "week" ? "Semaine du" :
                                selectedPeriod === "month" ? "Mois de" :
                                  "Année"}
                            </p>
                            <p className={`font-semibold ${selectedPeriod === "week" ? "text-purple-900" :
                              selectedPeriod === "month" ? "text-teal-900" :
                                "text-pink-900"
                              }`}>
                              {getPeriodLabel()}
                            </p>
                          </div>

                          <button
                            onClick={handleNextPeriod}
                            className="w-10 h-10 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center"
                          >
                            <ChevronDown className="w-5 h-5 text-gray-600 -rotate-90" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Custom Date Range */}
                <AnimatePresence mode="wait">
                  {selectedPeriod === "custom" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6 overflow-hidden"
                    >
                      <div className={`bg-gradient-to-br ${GRADIENTS.infoLight} border border-blue-200 rounded-2xl p-5`}>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-blue-900">
                              Date de début
                            </label>
                            <DatePicker value={startDate} onChange={setStartDate} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-blue-900">
                              Date de fin
                            </label>
                            <DatePicker value={endDate} onChange={setEndDate} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Summary Card */}
                <div className={`bg-gradient-to-br ${GRADIENTS.primaryLight} border border-purple-200 rounded-2xl p-6`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-700 mb-1">
                        Entrées à exporter
                      </p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-purple-900">
                          {filteredEntries.length}
                        </p>
                        <p className="text-sm text-purple-700">
                          entrée{filteredEntries.length > 1 ? "s" : ""}
                        </p>
                      </div>
                      {selectedPeriod !== "all" && (
                        <p className="text-xs text-purple-600 mt-2">
                          {selectedPeriod === "custom" && startDate && endDate ? (
                            <>
                              {new Date(startDate).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "short",
                              })}{" "}
                              →{" "}
                              {new Date(endDate).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </>
                          ) : dateRange.start && dateRange.end ? (
                            <>
                              {new Date(dateRange.start).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "short",
                              })}{" "}
                              →{" "}
                              {new Date(dateRange.end).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </>
                          ) : null}
                        </p>
                      )}
                    </div>
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${GRADIENTS.primaryDouble} flex items-center justify-center shadow-lg shadow-purple-200`}>
                      <FileDown className="w-7 h-7 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 rounded-b-3xl flex gap-3">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="h-11 px-6 rounded-xl border-gray-300"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleExport}
                  disabled={filteredEntries.length === 0}
                  className={`flex-1 h-11 bg-gradient-to-r ${GRADIENTS.accentButton} hover:${GRADIENTS.accentButtonHover} text-white rounded-xl font-semibold shadow-lg shadow-teal-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none`}
                >
                  <Download className="w-4 h-4" />
                  Télécharger CSV
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
