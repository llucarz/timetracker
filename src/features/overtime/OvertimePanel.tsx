import { useMemo } from "react";
import { useTimeTracker } from "../../context/TimeTrackerContext";
import { buildOvertimeHistory } from "../../lib/overtimeHistory";
import { BalanceCard } from "./components/BalanceCard";
import { RecentRecoveries } from "./components/RecentRecoveries";
import { RecoveryForm } from "./components/RecoveryForm";
import { AdjustmentsHistory } from "./components/AdjustmentsHistory";

export function OvertimePanel() {
    const { otState, entries, settings } = useTimeTracker();

    // Calculate stats from context
    const overtimeBalance = otState.balanceMinutes;

    // Movements that make up the balance. Built by the shared helper so the
    // overtime panel and the CSV export can never disagree.
    const historyItems = useMemo(
        () => buildOvertimeHistory(entries, settings, otState.events),
        [entries, settings, otState.events]
    );

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
