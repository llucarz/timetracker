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

    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollHeight, scrollTop, clientHeight } = scrollContainerRef.current;
            const isBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 5;
            setIsScrolledToBottom(isBottom);
        }
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

    // Calculate approximate height: Header (40px) + 6 rows (~53px each) ≈ 360px
    // Using max-h-96 (384px) offers a good buffer for 6 rows.
    const showScrollIndicator = entries.length > 6 && !isScrolledToBottom;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className={`flex-1 flex flex-col min-h-0 ${isFullscreen ? "fixed inset-4 z-50 max-w-none bg-white rounded-xl shadow-2xl overflow-hidden" : ""} ${className}`}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={period}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="relative flex-1 flex flex-col min-h-0 bg-white rounded-xl border border-gray-100 shadow-sm"
                >
                    {/* Desktop Table View - SCROLLABLE CONTAINER */}
                    <div className="hidden lg:flex flex-col relative rounded-xl overflow-hidden">
                        <div
                            ref={scrollContainerRef}
                            onScroll={handleScroll}
                            className={`overflow-y-auto custom-scrollbar ${entries.length > 6 ? 'max-h-96' : 'h-auto'}`}
                        >
                            <table className="w-full">
                                <thead className="bg-gray-50/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                                        <th className="text-left px-3 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Arrivée</th>
                                        <th className="text-left px-3 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Pause</th>
                                        <th className="text-left px-3 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Reprise</th>
                                        <th className="text-left px-3 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Départ</th>
                                        <th className="text-left px-3 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                                        <th className="text-left px-3 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
                                        <th className="text-left px-3 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Notes</th>
                                        <th className="text-center px-3 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {entries.map((entry, index) => {
                                        const isRecovery = entry.status === "recovery";
                                        let duration = minToHM(computeMinutes(entry));

                                        if (isRecovery && entry.start && entry.end) {
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
                                                className="hover:bg-gray-50/80 transition-colors group"
                                            >
                                                <td className="px-4 py-3">
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
                                                <td className="px-3 py-3">
                                                    <span className="font-mono text-sm text-gray-700">{entry.start || "—"}</span>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span className="font-mono text-sm text-gray-700">{entry.lunchStart || "—"}</span>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span className="font-mono text-sm text-gray-700">{entry.lunchEnd || "—"}</span>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span className="font-mono text-sm text-gray-700">{entry.end || "—"}</span>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span className={`font-semibold ${isRecovery ? "text-red-600" : "text-gray-900"}`}>{duration}</span>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <Badge
                                                        variant={entry.status === "work" ? "default" : "secondary"}
                                                        className={`rounded-full text-xs font-medium capitalize shadow-sm ${isRecovery ? "bg-red-100 text-red-700 hover:bg-red-200" : ""}`}
                                                    >
                                                        {statusTranslations[entry.status || "work"] || entry.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-3 py-3 max-w-[150px]">
                                                    <span className="text-sm text-gray-500 truncate block font-medium group-hover:text-gray-700 transition-colors">
                                                        {entry.notes || "—"}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <button
                                                        onClick={() => onEditEntry(entry)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Scrolling Indicator (Overlay) */}
                        <AnimatePresence>
                            {showScrollIndicator && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none flex items-end justify-center pb-3"
                                >
                                    <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-gray-100 text-xs font-medium text-gray-500 flex items-center gap-1.5 animate-bounce-slight">
                                        <ChevronLeft className="w-3.5 h-3.5 -rotate-90 text-purple-500" />
                                        <span>Faites défiler pour voir plus</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden overflow-y-auto flex-1 p-2">
                        {/* Mobile view implementation stays same but cleaner wrapper if needed */}
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
                                        className="bg-gray-50/50 border border-gray-100 rounded-xl p-4 space-y-3 shadow-sm"
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
                                                    className={`rounded-full text-xs font-medium mt-1 capitalize ${isRecovery ? "bg-red-100 text-red-700 hover:bg-red-200" : ""}`}
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

                                        {/* Keep mobile detail grids ... */}
                                        {entry.status === "work" && (
                                            <div className="grid grid-cols-2 gap-3 text-xs bg-white p-2 rounded-lg border border-gray-100">
                                                <div>
                                                    <p className="text-gray-400 font-medium">Arrivée</p>
                                                    <p className="font-mono text-gray-900 mt-0.5">{entry.start || "—"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-400 font-medium">Départ</p>
                                                    <p className="font-mono text-gray-900 mt-0.5">{entry.end || "—"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-400 font-medium">Pause</p>
                                                    <p className="font-mono text-gray-900 mt-0.5">{entry.lunchStart || "—"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-400 font-medium">Reprise</p>
                                                    <p className="font-mono text-gray-900 mt-0.5">{entry.lunchEnd || "—"}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Keep other mobile parts similar */}
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
                                            <p className="text-xs text-gray-600 italic border-t border-gray-200 pt-2 px-1">
                                                {entry.notes}
                                            </p>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Footer with total count */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-500 font-medium">
                    <span className="font-bold text-gray-900">{entries.length}</span> entrées affichées
                </p>
            </div>
        </motion.div>
    );
}
