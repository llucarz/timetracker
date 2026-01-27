import { useMemo } from "react";
import { useTimeTracker } from "../../context/TimeTrackerContext";
import { computeMinutes, getRecoveryMinutesForDay } from "../../lib/utils";
import { getDailyTargetMinutes } from "../../lib/logic";
import { BalanceCard } from "./components/BalanceCard";
import { RecentRecoveries } from "./components/RecentRecoveries";
import { RecoveryForm } from "./components/RecoveryForm";
import { AdjustmentsHistory } from "./components/AdjustmentsHistory";
import { HistoryItem } from "./types";

export function OvertimePanel() {
    const { otState, entries, settings } = useTimeTracker();

    // Calculate stats from context
    const overtimeBalance = otState.balanceMinutes;

    // Combine events and earned overtime
    const historyItems = useMemo(() => {
        const items: HistoryItem[] = [];

        // 1. Manual adjustments (from events)
        otState.events.forEach(event => {
            items.push({
                id: event.id,
                date: event.date,
                type: event.minutes > 0 ? "earned" : "recovered",
                minutes: Math.abs(event.minutes),
                comment: event.note,
                isManual: true,
                start: event.start,
                end: event.end,
                source: "event"
            });
        });

        // 2. Earned (Daily delta from Work OR Recovery entries)
        entries.forEach(entry => {
            // Include Work AND Recovery entries
            if (!entry.status || (entry.status !== "work" && entry.status !== "recovery")) return;

            // Robustness: Force 0 worked minutes for recovery days, ignoring any potential start/end times
            const workMinutes = entry.status === "recovery" ? 0 : computeMinutes(entry);

            const recoveryMinutes = getRecoveryMinutesForDay(entry.date, otState.events);
            const totalMinutes = workMinutes + recoveryMinutes;

            // Use schedule-based daily target
            const dailyTarget = getDailyTargetMinutes(entry.date, settings, entry);
            const delta = totalMinutes - dailyTarget;

            if (delta > 0) {
                items.push({
                    id: `earned-${entry.id}`,
                    date: entry.date,
                    type: "earned",
                    minutes: delta,
                    comment: "Heures supplémentaires",
                    isManual: false,
                    source: "entry"
                });
            } else if (delta < 0) {
                // Handle deficits (Consumption)
                if (entry.status === "recovery") {
                    // Explicit Recovery Entry
                    items.push({
                        id: entry.id,
                        date: entry.date,
                        type: "recovered",
                        minutes: Math.abs(delta),
                        comment: "Récupération (Journée)",
                        isManual: true, // Deletable
                        source: "entry"
                    });
                } else if (entry.status === "work") {
                    // Implicit Work Deficit (Absence non justifiée)
                    items.push({
                        id: `deficit-${entry.id}`,
                        date: entry.date,
                        type: "deficit",
                        minutes: Math.abs(delta),
                        comment: "Absence non justifiée",
                        isManual: false, // Not directly deletable (must edit entry)
                        source: "entry"
                    });
                }
            }
        });

        return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [otState.events, entries, settings]);

    // Get recent recoveries (last 2)
    const recentRecoveries = useMemo(() => {
        return historyItems
            .filter(item => item.type === "recovered")
            .slice(0, 2);
    }, [historyItems]);

    const totalRecoveries = useMemo(() => {
        return historyItems.filter(item => item.type === "recovered").length;
    }, [historyItems]);

    return (
        <div className="space-y-5">
            {/* Two-column layout: Balance + Stats | Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
                {/* Left Column: Balance Card + Quick Stats */}
                <div className="space-y-4 flex flex-col">
                    <BalanceCard balanceMinutes={overtimeBalance} />
                    <RecentRecoveries
                        totalRecoveries={totalRecoveries}
                        recentRecoveries={recentRecoveries}
                    />
                </div>

                {/* Right Column: Add Recovery Form */}
                <RecoveryForm />
            </div>

            {/* History - Full width */}
            <AdjustmentsHistory historyItems={historyItems} />
        </div>
    );
}
