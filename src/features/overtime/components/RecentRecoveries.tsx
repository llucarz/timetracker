import { motion } from "motion/react";
import { Clock } from "lucide-react";
import { formatDuration } from "../../../lib/utils";
import { HistoryItem } from "../types";

interface RecentRecoveriesProps {
    totalRecoveries: number;
    recentRecoveries: HistoryItem[];
}

export function RecentRecoveries({ totalRecoveries, recentRecoveries }: RecentRecoveriesProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white rounded-2xl p-4 border border-gray-200 shadow-lg flex-1 flex flex-col"
        >
            <div className="flex items-center justify-between mb-3">
                <div>
                    <p className="text-xs text-gray-500 mb-0.5">Récupérations prises</p>
                    <p className="text-2xl font-bold text-blue-600">
                        {totalRecoveries}
                    </p>
                </div>
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-blue-600" />
                </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex-1 flex flex-col">
                {recentRecoveries.length > 0 ? (
                    <div className="space-y-2 flex-1">
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Dernières récupérations</p>
                        <div className="space-y-2">
                            {recentRecoveries.map((recovery) => (
                                <div key={recovery.id} className="flex items-start justify-between gap-2 p-2 rounded-lg bg-blue-50/50">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium text-gray-900 truncate">
                                            {recovery.comment || "Récupération"}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {new Date(recovery.date).toLocaleDateString("fr-FR", {
                                                day: "numeric",
                                                month: "short"
                                            })}
                                            {recovery.start && recovery.end && (
                                                <span className="ml-1 text-gray-400">
                                                    • {recovery.start}-{recovery.end}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <p className="text-xs font-semibold text-blue-600 flex-shrink-0">
                                        -{formatDuration(recovery.minutes)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-xs text-gray-400 text-center">Aucune récupération prise</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
