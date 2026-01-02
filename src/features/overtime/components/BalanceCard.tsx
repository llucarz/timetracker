import { motion } from "motion/react";
import { TrendingUp, Clock, Calendar } from "lucide-react";
import { formatDHM, minutesToDHM, minToHM, formatMinutesToDays } from "../../../lib/utils";
import { GradientCard } from "../../../ui/primitives/GradientCard";
import { useTimeTracker } from "../../../context/TimeTrackerContext";

interface BalanceCardProps {
    balanceMinutes: number;
}

export function BalanceCard({ balanceMinutes }: BalanceCardProps) {
    const { settings } = useTimeTracker();
    const daysEquivalent = formatMinutesToDays(balanceMinutes, settings.weeklyTarget, settings.workDays);
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="bg-gradient-to-br from-purple-500 via-purple-600 to-pink-500 rounded-2xl p-4 sm:p-5 text-white shadow-lg"
        >
            <div className="flex items-start justify-between mb-3">
                <div>
                    <p className="text-xs text-white/70 uppercase tracking-wide mb-1">Solde actuel</p>
                    <p className="text-3xl font-bold mt-1">
                        {formatDHM(minutesToDHM(balanceMinutes))}
                    </p>
                    <p className="text-xs text-white/80 mt-1">
                        {minToHM(Math.abs(balanceMinutes))}
                    </p>
                    {daysEquivalent && (
                        <p className="text-xs text-white/90 mt-1 font-medium bg-white/20 px-2 py-0.5 rounded-md inline-block">
                            {daysEquivalent}
                        </p>
                    )}
                </div>
                <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <TrendingUp className="w-4 h-4" />
                </div>
            </div>

            <div className="pt-2.5 border-t border-white/20">
                <p className="text-xs text-white/90">
                    <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        Mis à jour aujourd'hui
                    </span>
                </p>
            </div>
        </motion.div>
    );
}
