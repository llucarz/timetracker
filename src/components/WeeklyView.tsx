import { useState, useRef, useMemo } from "react";
import { ChevronLeft, ChevronRight, TrendingUp, Clock, Calendar, Zap, Pencil, Minimize2, Maximize2, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { motion, AnimatePresence } from "motion/react";
import { EditEntryModal } from "./EditEntryModal";
import { PeriodPicker } from "./PeriodPicker";
import { useTimeTracker } from "../context/TimeTrackerContext";
import { minToHM, computeMinutes, hmToMin, formatDuration } from "../lib/utils";

interface WeeklyViewProps {
  period: "week" | "month" | "year";
  onPeriodChange: (period: "week" | "month" | "year") => void;
}

export function WeeklyView({ period, onPeriodChange }: WeeklyViewProps) {
  const { entries, settings } = useTimeTracker();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [openPeriodPicker, setOpenPeriodPicker] = useState<"week" | "month" | "year" | null>(null);
  const [periodButtonRef, setPeriodButtonRef] = useState<HTMLButtonElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filter and sort entries based on period and currentDate
  const filteredEntries = useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    if (period === "week") {
      const day = start.getDay() || 7;
      if (day !== 1) start.setHours(-24 * (day - 1));
      start.setHours(0, 0, 0, 0);
      end.setTime(start.getTime() + 6 * 24 * 60 * 60 * 1000);
      end.setHours(23, 59, 59, 999);
    } else if (period === "month") {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
    } else if (period === "year") {
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
    }

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    return entries
      .filter(e => e.date >= startStr && e.date <= endStr)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entries, period, currentDate]);

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (period === "week") newDate.setDate(newDate.getDate() - 7);
    else if (period === "month") newDate.setMonth(newDate.getMonth() - 1);
    else if (period === "year") newDate.setFullYear(newDate.getFullYear() - 1);
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (period === "week") newDate.setDate(newDate.getDate() + 7);
    else if (period === "month") newDate.setMonth(newDate.getMonth() + 1);
    else if (period === "year") newDate.setFullYear(newDate.getFullYear() + 1);
    setCurrentDate(newDate);
  };

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const anchor = new Date(currentDate);
    
    // Start of week (Monday) based on currentDate
    const startOfWeek = new Date(anchor);
    const day = startOfWeek.getDay() || 7; // Get current day number, converting Sun (0) to 7
    if (day !== 1) startOfWeek.setHours(-24 * (day - 1));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    // Start of month based on currentDate
    const startOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const endOfMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1);

    // Start of year based on currentDate
    const startOfYear = new Date(anchor.getFullYear(), 0, 1);
    const endOfYear = new Date(anchor.getFullYear() + 1, 0, 1);

    let todayMinutes = 0;
    let weekMinutes = 0;
    let monthMinutes = 0;
    let yearMinutes = 0;
    
    let absenceDaysInWeek = 0;
    let absenceDaysInMonth = 0;
    const workDaysInWeekSet = new Set<string>();
    const workDaysInMonthSet = new Set<string>();

    const dailyTargetMinutes = (settings.weeklyTarget / settings.workDays) * 60;

    entries.forEach(entry => {
      const entryDate = new Date(entry.date);
      const minutes = computeMinutes(entry);
      const dayOfWeek = entryDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isAbsence = ["school", "vacation", "sick", "holiday"].includes(entry.status);
      const isWork = !entry.status || entry.status === "work";

      if (entry.date === today) {
        todayMinutes += minutes;
      }
      
      // Week stats
      if (entryDate >= startOfWeek && entryDate < endOfWeek) {
        weekMinutes += minutes;
        if (isAbsence && !isWeekend) {
          absenceDaysInWeek++;
        }
        if (isWork) {
          workDaysInWeekSet.add(entry.date);
        }
      }
      
      // Month stats
      if (entryDate >= startOfMonth && entryDate < endOfMonth) {
        monthMinutes += minutes;
        if (isAbsence && !isWeekend) {
          absenceDaysInMonth++;
        }
        if (isWork) {
          workDaysInMonthSet.add(entry.date);
        }
      }
      
      // Year stats
      if (entryDate >= startOfYear && entryDate < endOfYear) {
        yearMinutes += minutes;
      }
    });

    // Calculate Weekly Overtime
    // Target is based on logged work days only (no penalty for absences or missing days)
    const adjustedWeeklyTargetMinutes = workDaysInWeekSet.size * dailyTargetMinutes;
    const weeklyOvertime = weekMinutes - adjustedWeeklyTargetMinutes;
    const weeklyOvertimeStr = formatDuration(weeklyOvertime);
    const weeklySubtitle = weeklyOvertime > 0 
      ? `+${weeklyOvertimeStr} vs objectif` 
      : `${weeklyOvertimeStr} vs objectif`;

    // Calculate Monthly Overtime
    // Target is based on logged work days only
    const adjustedMonthlyTargetMinutes = workDaysInMonthSet.size * dailyTargetMinutes;
    const monthlyOvertime = monthMinutes - adjustedMonthlyTargetMinutes;
    const monthlyOvertimeStr = formatDuration(monthlyOvertime);
    const monthlySubtitle = monthlyOvertime > 0 
      ? `+${monthlyOvertimeStr} vs objectif` 
      : `${monthlyOvertimeStr} vs objectif`;

    return {
      today: minToHM(todayMinutes),
      week: minToHM(weekMinutes),
      month: minToHM(monthMinutes),
      year: minToHM(yearMinutes),
      weeklySubtitle,
      monthlySubtitle
    };
  }, [entries, settings, currentDate]);

  const handleEditEntry = (entry: any) => {
    setSelectedEntry(entry);
    setIsEditModalOpen(true);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrolledToBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 5;
    setIsScrolledToBottom(scrolledToBottom);
  };

  const handlePeriodClick = (p: "week" | "month" | "year", event: React.MouseEvent<HTMLButtonElement>) => {
    if (period === p) {
      // Si c'est déjà la période active, on ouvre/ferme le picker
      setOpenPeriodPicker(openPeriodPicker === p ? null : p);
      setPeriodButtonRef(event.currentTarget);
    } else {
      // Sinon on change de période
      onPeriodChange(p);
      setOpenPeriodPicker(null);
    }
  };

  return (
    <div className="space-y-2.5 sm:space-y-3 max-w-[1600px] mx-auto h-full flex flex-col overflow-hidden pb-2">
      {/* Stats Cards - Cachées en mode plein écran */}
      {!isFullscreen && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <StatCard
            icon={<Clock className="w-4 h-4" />}
            label="Aujourd'hui"
            value={stats.today}
            color="purple"
            delay={0}
          />
          <StatCard
            icon={<Calendar className="w-4 h-4" />}
            label="Semaine"
            value={stats.week}
            subtitle={stats.weeklySubtitle}
            color="teal"
            delay={0.1}
          />
          <StatCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="Mois"
            value={stats.month}
            subtitle={stats.monthlySubtitle}
            color="pink"
            delay={0.2}
          />
          <StatCard
            icon={<Zap className="w-4 h-4" />}
            label="Année"
            value={stats.year}
            subtitle="Sur la bonne voie"
            color="yellow"
            delay={0.3}
          />
        </div>
      )}

      {/* Backdrop avec flou pour le mode plein écran */}
      {isFullscreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-md z-40"
          onClick={() => setIsFullscreen(false)}
        />
      )}

      {/* Main Table Card - Prend tout l'espace restant */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className={`bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 card-shadow flex-1 flex flex-col overflow-hidden min-h-0 ${
          isFullscreen ? "fixed inset-4 z-50 max-w-none" : ""
        }`}
      >
        {/* Header - Plus compact */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-3 sm:mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-0.5 text-base">Entrées de temps</h3>
            <p className="text-xs text-gray-500">
              {period === "week" && `Semaine du ${(() => {
                const d = new Date(currentDate);
                const day = d.getDay() || 7;
                if (day !== 1) d.setDate(d.getDate() - (day - 1));
                return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
              })()}`}
              {period === "month" && currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              {period === "year" && `Année ${currentDate.getFullYear()}`}
            </p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {!isFullscreen && (
              <>
                {/* Period Tabs with animated indicator */}
                <div className="relative bg-gray-100 p-0.5 sm:p-1 rounded-lg sm:rounded-xl flex gap-0.5 sm:gap-1">
                  {/* Tabs */}
                  {[{ key: "week", label: "Semaine" }, { key: "month", label: "Mois" }, { key: "year", label: "Année" }].map((p) => (
                    <button
                      key={p.key}
                      onClick={(event) => handlePeriodClick(p.key as any, event)}
                      className={`relative z-10 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-medium rounded-md sm:rounded-lg transition-colors ${
                        period === p.key ? "text-gray-900" : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {p.label}
                      
                      {/* Animated background */}
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
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={handlePrevious}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={handleNext}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}

            {/* Bouton Plein écran */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`rounded-lg ${
                isFullscreen 
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

        {/* Table with Scroll - Prend tout l'espace restant */}
        <AnimatePresence mode="wait">
          <motion.div
            key={period}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ 
              duration: 0.4,
              ease: [0.4, 0, 0.2, 1]
            }}
            className="relative rounded-xl border border-gray-100 overflow-hidden flex-1 flex flex-col min-h-0"
          >
            {/* Desktop Table View (hidden on small screens) */}
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
                  {filteredEntries.map((entry, index) => {
                    const duration = minToHM(computeMinutes(entry));
                    const breakDuration = (entry.lunchStart && entry.lunchEnd) 
                      ? hmToMin(entry.lunchEnd) - hmToMin(entry.lunchStart) 
                      : 0;
                    const breakDisplay = breakDuration > 0 ? `${breakDuration} min` : "—";
                    
                    return (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
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
                        <span className="font-semibold text-gray-900">{duration}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge 
                          variant={entry.status === "work" ? "default" : "secondary"}
                          className="rounded-full text-xs font-medium capitalize"
                        >
                          {entry.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-sm text-gray-500">{entry.notes || "—"}</span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          onClick={() => handleEditEntry(entry)}
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

            {/* Mobile Card View (visible on small screens) */}
            <div className="lg:hidden overflow-y-auto flex-1 p-2">
              <div className="space-y-3">
                {filteredEntries.map((entry, index) => {
                  const duration = minToHM(computeMinutes(entry));
                  const breakDuration = (entry.lunchStart && entry.lunchEnd) 
                    ? hmToMin(entry.lunchEnd) - hmToMin(entry.lunchStart) 
                    : 0;
                  const breakDisplay = breakDuration > 0 ? `${breakDuration} min` : "—";

                  return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
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
                          className="rounded-full text-xs font-medium mt-1 capitalize"
                        >
                          {entry.status}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 text-lg">{duration}</p>
                        <button
                          onClick={() => handleEditEntry(entry)}
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
            {filteredEntries.length > 5 && !isScrolledToBottom && (
              <div className="hidden lg:block absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none">
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-gray-400 flex items-center gap-1">
                  <ChevronLeft className="w-3 h-3 -rotate-90" />
                  <span>Faites défiler pour voir plus</span>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer with total count - Plus compact */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            <span className="font-semibold text-gray-900">{filteredEntries.length}</span> entrées au total
          </p>
        </div>
      </motion.div>

      {/* Edit Entry Modal */}
      <EditEntryModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        entry={selectedEntry}
      />

      {/* Period Picker */}
      {openPeriodPicker && periodButtonRef && (
        <PeriodPicker
          isOpen={!!openPeriodPicker}
          period={openPeriodPicker}
          onClose={() => setOpenPeriodPicker(null)}
          onSelect={(date) => setCurrentDate(date)}
          anchorElement={periodButtonRef}
          initialDate={currentDate}
        />
      )}
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  color: "purple" | "teal" | "pink" | "yellow";
  delay?: number;
}

function StatCard({ icon, label, value, subtitle, color, delay = 0 }: StatCardProps) {
  const colorClasses = {
    purple: "from-purple-500 to-pink-500 shadow-purple-200",
    teal: "from-teal-500 to-cyan-500 shadow-teal-200",
    pink: "from-pink-500 to-rose-500 shadow-pink-200",
    yellow: "from-amber-400 to-orange-400 shadow-amber-200",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-white rounded-xl p-2.5 sm:p-3 card-shadow hover:card-shadow-hover transition-all"
    >
      <div className="flex items-start justify-between mb-1.5">
        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-white shadow-lg`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="text-lg sm:text-xl font-bold text-gray-900">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}