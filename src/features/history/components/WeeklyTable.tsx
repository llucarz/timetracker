import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Pencil } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { minToHM, computeMinutes, hmToMin } from "../../../lib/utils";
import { useRef, useState } from "react";
import { Entry } from "../../../lib/types";

interface WeeklyTableProps {
    entries: Entry[];
    period: "week" | "month" | "year";
    isFullscreen: boolean;
    onEditEntry: (entry: Entry) => void;
}

export function WeeklyTable({ entries, period, isFullscreen, onEditEntry, className }: WeeklyTableProps & { className?: string }) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const scrolledToBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 5;
        setIsScrolledToBottom(scrolledToBottom);
    };

    const statusTranslations: Record<string, string> = {
        work: "Travail",
        school: "École",
        vacation: "Congés",
        sick: "Maladie",
        holiday: "Férié",
        off: "Repos",
        recovery: "Récupération"
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className={`flex-1 flex flex-col overflow-hidden min-h-0 ${isFullscreen ? "fixed inset-4 z-50 max-w-none bg-white rounded-xl shadow-2xl" : ""} ${className}`}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={period}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                        duration: 0.4,
                        ease: [0.4, 0, 0.2, 1]
                    }}
                    className="relative rounded-xl border border-gray-100 overflow-hidden flex-1 flex flex-col min-h-0"
                >
                    {/* Desktop Table View */}
                    <div
                        className="hidden lg:block overflow-x-auto overflow-y-auto flex-1 custom-scrollbar"
                        ref={scrollContainerRef}
                        onScroll={handleScroll}
                    >
                        <table className="w-full">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Arrivée</th>
                                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Pause</th>
                                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Reprise</th>
                                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Départ</th>
                                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
                                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Notes</th>
                                    <th className="text-center px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {entries.map((entry, index) => {
                                    const isRecovery = entry.status === "recovery";
                                    let duration = minToHM(computeMinutes(entry));

                                    if (isRecovery && entry.start && entry.end) {
                                        // Manual calculation for recovery since computeMinutes returns 0
                                        const start = hmToMin(entry.start);
                                        const end = hmToMin(entry.end);
                                        duration = "-" + minToHM(end - start);
                                    }

                                    return (
                                        <motion.tr
                                            key={entry.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: Math.min(index * 0.05, 0.5) }}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-3 py-2.5">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900 text-sm">
                                                        {new Date(entry.date).toLocaleDateString('fr-FR', {
                                                            day: 'numeric',
                                                            month: 'short'
                                                        })}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(entry.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <span className="font-mono text-sm text-gray-700">{entry.start || "—"}</span>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <span className="font-mono text-sm text-gray-700">{entry.lunchStart || "—"}</span>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <span className="font-mono text-sm text-gray-700">{entry.lunchEnd || "—"}</span>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <span className="font-mono text-sm text-gray-700">{entry.end || "—"}</span>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <span className={`font-semibold ${isRecovery ? "text-red-600" : "text-gray-900"}`}>{duration}</span>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <Badge
                                                    variant={entry.status === "work" ? "default" : "secondary"}
                                                    className={`rounded-full text-xs font-medium capitalize ${isRecovery ? "bg-red-100 text-red-700 hover:bg-red-200" : ""
                                                        }`}
                                                >
                                                    {statusTranslations[entry.status || "work"] || entry.status}
                                                </Badge>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <span className="text-sm text-gray-500">{entry.notes || "—"}</span>
                                            </td>
                                            <td className="px-3 py-2.5 text-center">
                                                <button
                                                    onClick={() => onEditEntry(entry)}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-purple-50 transition-colors"
                                                >
                                                    <Pencil className="w-4 h-4 text-purple-600" />
                                                </button>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden overflow-y-auto flex-1 p-2">
                        <div className="space-y-3">
                            {entries.map((entry, index) => {
                                const isRecovery = entry.status === "recovery";
                                let duration = minToHM(computeMinutes(entry));

                                if (isRecovery && entry.start && entry.end) {
                                    const start = hmToMin(entry.start);
                                    const end = hmToMin(entry.end);
                                    duration = "-" + minToHM(end - start);
                                }

                                return (
                                    <motion.div
                                        key={entry.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: Math.min(index * 0.05, 0.5) }}
                                        className="bg-gray-50 rounded-lg p-4 space-y-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">
                                                    {new Date(entry.date).toLocaleDateString('fr-FR', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        weekday: 'short'
                                                    })}
                                                </p>
                                                <Badge
                                                    variant={entry.status === "work" ? "default" : "secondary"}
                                                    className={`rounded-full text-xs font-medium mt-1 capitalize ${isRecovery ? "bg-red-100 text-red-700 hover:bg-red-200" : ""
                                                        }`}
                                                >
                                                    {statusTranslations[entry.status || "work"] || entry.status}
                                                </Badge>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-bold text-lg ${isRecovery ? "text-red-600" : "text-gray-900"}`}>{duration}</p>
                                                <button
                                                    onClick={() => onEditEntry(entry)}
                                                    className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-purple-50 transition-colors"
                                                >
                                                    <Pencil className="w-4 h-4 text-purple-600" />
                                                </button>
                                            </div>
                                        </div>

                                        {entry.status === "work" && (
                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                <div>
                                                    <p className="text-gray-500">Arrivée</p>
                                                    <p className="font-mono text-gray-900 mt-0.5">{entry.start || "—"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Départ</p>
                                                    <p className="font-mono text-gray-900 mt-0.5">{entry.end || "—"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Pause</p>
                                                    <p className="font-mono text-gray-900 mt-0.5">{entry.lunchStart || "—"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Reprise</p>
                                                    <p className="font-mono text-gray-900 mt-0.5">{entry.lunchEnd || "—"}</p>
                                                </div>
                                            </div>
                                        )}

                                        {isRecovery && (
                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                <div>
                                                    <p className="text-gray-500">Début</p>
                                                    <p className="font-mono text-gray-900 mt-0.5">{entry.start || "—"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Fin</p>
                                                    <p className="font-mono text-gray-900 mt-0.5">{entry.end || "—"}</p>
                                                </div>
                                            </div>
                                        )}

                                        {entry.notes && (
                                            <p className="text-xs text-gray-600 italic border-t border-gray-200 pt-2">
                                                {entry.notes}
                                            </p>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Scroll indicator - desktop only */}
                    {entries.length > 5 && !isScrolledToBottom && (
                        <div className="hidden lg:block absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none">
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-gray-400 flex items-center gap-1">
                                <ChevronLeft className="w-3 h-3 -rotate-90" />
                                <span>Faites défiler pour voir plus</span>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Footer with total count */}
            <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                    <span className="font-semibold text-gray-900">{entries.length}</span> entrées au total
                </p>
            </div>
        </motion.div>
    );
}
