import { ChevronLeft, ChevronRight, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { motion } from "motion/react";
import { PeriodPicker } from "../../../components/PeriodPicker";
import { useState } from "react";

interface WeeklyHeaderProps {
    period: "week" | "month" | "year";
    currentDate: Date;
    isFullscreen: boolean;
    onPeriodChange: (period: "week" | "month" | "year") => void;
    onNavigate: (direction: "prev" | "next") => void;
    onToggleFullscreen: () => void;
    onDateSelect: (date: Date) => void;
}

export function WeeklyHeader({
    period,
    currentDate,
    isFullscreen,
    onPeriodChange,
    onNavigate,
    onToggleFullscreen,
    onDateSelect,
    className
}: WeeklyHeaderProps & { className?: string }) {
    const [openPeriodPicker, setOpenPeriodPicker] = useState<"week" | "month" | "year" | null>(null);
    const [periodButtonRef, setPeriodButtonRef] = useState<HTMLButtonElement | null>(null);

    const handlePeriodClick = (p: "week" | "month" | "year", event: React.MouseEvent<HTMLButtonElement>) => {
        if (period === p) {
            setOpenPeriodPicker(openPeriodPicker === p ? null : p);
            setPeriodButtonRef(event.currentTarget);
        } else {
            onPeriodChange(p);
            setOpenPeriodPicker(null);
        }
    };

    const getPeriodLabel = () => {
        if (period === "week") {
            const d = new Date(currentDate);
            const day = d.getDay() || 7;
            if (day !== 1) d.setDate(d.getDate() - (day - 1));
            return `Semaine du ${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
        }
        if (period === "month") {
            return currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        }
        return `Année ${currentDate.getFullYear()}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`flex-shrink-0 ${className}`}
        >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h3 className="font-semibold text-gray-900 text-base">Entrées de temps</h3>
                    <p className="text-xs text-gray-500 mt-1">
                        {getPeriodLabel()}
                    </p>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    {!isFullscreen && (
                        <>
                            {/* Period Tabs with animated indicator */}
                            <div className="relative bg-gray-100 p-0.5 sm:p-1 rounded-lg sm:rounded-xl flex gap-0.5 sm:gap-1">
                                {[{ key: "week", label: "Semaine" }, { key: "month", label: "Mois" }, { key: "year", label: "Année" }].map((p) => (
                                    <button
                                        key={p.key}
                                        onClick={(event) => handlePeriodClick(p.key as any, event)}
                                        className={`relative z-10 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-medium rounded-md sm:rounded-lg transition-colors ${period === p.key ? "text-gray-900" : "text-gray-600 hover:text-gray-900"
                                            }`}
                                    >
                                        {p.label}
                                        {period === p.key && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute inset-0 bg-white rounded-md sm:rounded-lg shadow-sm -z-10"
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 380,
                                                    damping: 30
                                                }}
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Navigation buttons */}
                            <div className="flex items-center gap-1 bg-gray-100 p-0.5 sm:p-1 rounded-lg sm:rounded-xl">
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => onNavigate("prev")}>
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => onNavigate("next")}>
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </>
                    )}

                    {/* Toggle Fullscreen */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onToggleFullscreen}
                        className={`rounded-lg ${isFullscreen
                            ? "absolute top-4 right-4 h-9 w-9 p-0 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg z-10"
                            : "h-8 w-8 p-0"
                            }`}
                    >
                        {isFullscreen ? (
                            <Minimize2 className="w-4 h-4" />
                        ) : (
                            <Maximize2 className="w-4 h-4" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Period Picker */}
            {openPeriodPicker && periodButtonRef && (
                <PeriodPicker
                    isOpen={!!openPeriodPicker}
                    period={openPeriodPicker}
                    onClose={() => setOpenPeriodPicker(null)}
                    onSelect={(date) => {
                        onDateSelect(date);
                        setOpenPeriodPicker(null);
                    }}
                    anchorElement={periodButtonRef}
                    initialDate={currentDate}
                />
            )}
        </motion.div>
    );
}
