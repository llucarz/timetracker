import { useMemo } from "react";
import { useTimeTracker } from "../../context/TimeTrackerContext";
import { computeMinutes, getRecoveryMinutesForDay } from "../../lib/utils";
import { BalanceCard } from "./components/BalanceCard";
import { RecentRecoveries } from "./components/RecentRecoveries";
import { RecoveryForm } from "./components/RecoveryForm";
import { AdjustmentsHistory } from "./components/AdjustmentsHistory";
import { HistoryItem } from "./types";

export function OvertimePanel() {
    const { otState, entries, settings } = useTimeTracker();

    // Calculate stats from context
    const overtimeBalance = otState.balanceMinutes;

    // Calculate daily target
    const dailyTargetMinutes = useMemo(() => {
        if (!settings.workDays) return 0;
        return (settings.weeklyTarget / settings.workDays) * 60;
    }, [settings.weeklyTarget, settings.workDays]);

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
                end: event.end
            });
        });

        // 2. Earned (Daily positive delta from actual work)
        entries.forEach(entry => {
            if (entry.status && entry.status !== "work") return; // Only work days

            const workMinutes = computeMinutes(entry);
            const recoveryMinutes = getRecoveryMinutesForDay(entry.date, otState.events);
            const totalMinutes = workMinutes + recoveryMinutes;
            const delta = totalMinutes - dailyTargetMinutes;

            if (delta > 0) {
                items.push({
                    id: `earned-${entry.id}`,
                    date: entry.date,
                    type: "earned",
                    minutes: delta,
                    comment: "Heures supplémentaires",
                    isManual: false
                });
            }
        });

        return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [otState.events, entries, dailyTargetMinutes]);

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
