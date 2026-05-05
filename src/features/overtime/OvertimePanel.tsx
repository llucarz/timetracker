import { useMemo } from "react";
import { useTimeTracker } from "../../context/TimeTrackerContext";
import { computeMinutes, getRecoveryMinutesForDay, hmToMin } from "../../lib/utils";
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

        // 2. Earned / Deficit (Work entries) + Standalone recovery entries
        // Note: recovery entries paired with an OvertimeEvent are skipped here because
        // they are already shown via the events loop above (RecoveryForm creates both).
        entries.forEach(entry => {
            if (entry.status === "recovery") {
                // Only show if there is NO paired OvertimeEvent (standalone, from DailyEntryModal)
                const hasPairedEvent = otState.events.some(ev => ev.date === entry.date && ev.minutes < 0);
                if (hasPairedEvent) return;

                if (entry.start && entry.end) {
                    const rawDuration = Math.max(0, hmToMin(entry.end) - hmToMin(entry.start));
                    const dailyTarget = getDailyTargetMinutes(entry.date, settings, entry);
                    const duration = dailyTarget > 0 ? Math.min(rawDuration, dailyTarget) : rawDuration;
                    if (duration > 0) {
                        items.push({
                            id: entry.id,
                            date: entry.date,
                            type: "recovered",
                            minutes: duration,
                            comment: entry.notes || "Récupération",
                            isManual: true,
                            start: entry.start,
                            end: entry.end,
                            source: "entry"
                        });
                    }
                }
                return;
            }

            // Only process work entries for earned/deficit
            if (!entry.status || entry.status !== "work") return;

            const workMinutes = computeMinutes(entry);
            const recoveryMinutes = getRecoveryMinutesForDay(entry.date, otState.events);
            const totalMinutes = workMinutes + recoveryMinutes;

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
                items.push({
                    id: `deficit-${entry.id}`,
                    date: entry.date,
                    type: "deficit",
                    minutes: Math.abs(delta),
                    comment: "Absence non justifiée",
                    isManual: false,
                    source: "entry"
                });
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
