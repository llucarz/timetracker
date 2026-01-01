import { motion } from "motion/react";
import { Clock, ArrowUpRight, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNotification } from "../../../context/NotificationContext";
import { useTimeTracker } from "../../../context/TimeTrackerContext";
import { formatDuration } from "../../../lib/utils";
import { HistoryItem } from "../types";

interface AdjustmentsHistoryProps {
    historyItems: HistoryItem[];
}

export function AdjustmentsHistory({ historyItems }: AdjustmentsHistoryProps) {
    const { deleteOvertimeEvent } = useTimeTracker();
    const { showNotification } = useNotification();
    const [historyFilter, setHistoryFilter] = useState("all");

    const filteredItems = historyItems.filter(item => {
        if (historyFilter === "all") return true;
        if (historyFilter === "earned") return item.type === "earned";
        if (historyFilter === "recovered") return item.type === "recovered";
        return item.type === historyFilter;
    });

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-white rounded-2xl p-5 border border-gray-200 shadow-lg"
        >
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-base font-semibold text-gray-900">Historique des ajustements</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {filteredItems.length} événement{filteredItems.length > 1 ? "s" : ""} enregistré{filteredItems.length > 1 ? "s" : ""}
                    </p>
                </div>

                {/* Filter Buttons */}
                <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg relative">
                    <button
                        onClick={() => setHistoryFilter("all")}
                        className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors relative z-10"
                    >
                        {historyFilter === "all" && (
                            <motion.div
                                layoutId="filterIndicator"
                                className="absolute inset-0 bg-white shadow-sm rounded-md"
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 30
                                }}
                            />
                        )}
                        <span className={`relative z-10 ${historyFilter === "all"
                            ? "text-gray-900"
                            : "text-gray-600"
                            }`}>
                            Tout
                        </span>
                    </button>
                    <button
                        onClick={() => setHistoryFilter("earned")}
                        className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors relative z-10"
                    >
                        {historyFilter === "earned" && (
                            <motion.div
                                layoutId="filterIndicator"
                                className="absolute inset-0 bg-white shadow-sm rounded-md"
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 30
                                }}
                            />
                        )}
                        <span className={`relative z-10 ${historyFilter === "earned"
                            ? "text-gray-900"
                            : "text-gray-600"
                            }`}>
                            Gagnées
                        </span>
                    </button>
                    <button
                        onClick={() => setHistoryFilter("recovered")}
                        className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors relative z-10"
                    >
                        {historyFilter === "recovered" && (
                            <motion.div
                                layoutId="filterIndicator"
                                className="absolute inset-0 bg-white shadow-sm rounded-md"
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 30
                                }}
                            />
                        )}
                        <span className={`relative z-10 ${historyFilter === "recovered"
                            ? "text-gray-900"
                            : "text-gray-600"
                            }`}>
                            Récupérées
                        </span>
                    </button>
                </div>
            </div>

            <div className={filteredItems.length > 5 ? "max-h-[420px] overflow-y-auto" : ""}>
                {filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <Clock className="w-7 h-7 text-gray-400" />
                        </div>
                        <p className="text-gray-900 font-medium text-sm">Aucun événement.</p>
                        <p className="text-xs text-gray-500 mt-1 px-4">Vos ajustements et heures supplémentaires apparaîtront ici</p>
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        {filteredItems.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200 group"
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${item.type === "earned" ? "bg-emerald-100" : "bg-red-100"
                                        }`}>
                                        {item.type === "earned" ? (
                                            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                                        ) : (
                                            <Clock className="w-4 h-4 text-red-600" />
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-gray-900 text-sm truncate">
                                            {item.comment || (item.type === "earned" ? "Heures supplémentaires" : "Récupération")}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {new Date(item.date).toLocaleDateString("fr-FR", {
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric"
                                            })}
                                            {item.start && item.end && (
                                                <span className="ml-1.5 text-gray-400">
                                                    ({item.start} - {item.end})
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <p className={`text-base font-semibold ${item.type === "earned" ? "text-emerald-600" : "text-red-600"
                                        }`}>
                                        {item.type === "earned" ? "+" : "-"}{formatDuration(item.minutes)}
                                    </p>
                                    {item.isManual && (
                                        <button
                                            onClick={() => {
                                                deleteOvertimeEvent(item.id);
                                                showNotification({ type: "success", title: "Succès", message: "Ajustement supprimé" });
                                            }}
                                            className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
