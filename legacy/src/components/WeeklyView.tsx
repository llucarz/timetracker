import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, TrendingUp, Clock, Calendar, Zap, Pencil, Minimize2, Maximize2, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { motion, AnimatePresence } from "motion/react";
import { EditEntryModal } from "./EditEntryModal";
import { PeriodPicker } from "./PeriodPicker";

interface WeeklyViewProps {
  period: "week" | "month" | "year";
  onPeriodChange: (period: "week" | "month" | "year") => void;
}

const mockEntries = [
  { id: 1, date: "2025-11-20", arrival: "08:45", pauseStart: "12:30", pauseEnd: "13:30", departure: "17:30", duration: "7h45", status: "Work", notes: "Réunion client" },
  { id: 2, date: "2025-11-19", arrival: "09:00", pauseStart: "12:30", pauseEnd: "13:30", departure: "18:00", duration: "8h00", status: "Work", notes: "" },
  { id: 3, date: "2025-11-18", arrival: "09:00", pauseStart: "13:00", pauseEnd: "13:30", departure: "18:00", duration: "8h30", status: "Work", notes: "Sprint review" },
  { id: 4, date: "2025-11-15", arrival: "", pauseStart: "", pauseEnd: "", departure: "", duration: "0h00", status: "Vacation", notes: "Congé annuel" },
  { id: 5, date: "2025-11-14", arrival: "08:30", pauseStart: "12:00", pauseEnd: "13:00", departure: "17:45", duration: "8h15", status: "Work", notes: "Support technique" },
  { id: 6, date: "2025-11-13", arrival: "09:15", pauseStart: "12:30", pauseEnd: "13:30", departure: "18:15", duration: "8h00", status: "Work", notes: "" },
  { id: 7, date: "2025-11-12", arrival: "08:00", pauseStart: "12:00", pauseEnd: "13:00", departure: "17:00", duration: "8h00", status: "Work", notes: "Développement feature" },
  { id: 8, date: "2025-11-11", arrival: "", pauseStart: "", pauseEnd: "", departure: "", duration: "0h00", status: "Holiday", notes: "Jour férié" },
  { id: 9, date: "2025-11-08", arrival: "09:00", pauseStart: "12:30", pauseEnd: "13:30", departure: "18:30", duration: "8h30", status: "Work", notes: "Formation interne" },
  { id: 10, date: "2025-11-07", arrival: "08:45", pauseStart: "12:15", pauseEnd: "13:15", departure: "17:45", duration: "8h00", status: "Work", notes: "" },
  { id: 11, date: "2025-11-06", arrival: "09:00", pauseStart: "12:30", pauseEnd: "13:30", departure: "18:00", duration: "8h00", status: "Work", notes: "Code review" },
  { id: 12, date: "2025-11-05", arrival: "", pauseStart: "", pauseEnd: "", departure: "", duration: "0h00", status: "Sick", notes: "Arrêt maladie" },
  { id: 13, date: "2025-11-04", arrival: "08:30", pauseStart: "12:00", pauseEnd: "13:00", departure: "17:30", duration: "8h00", status: "Work", notes: "" },
  { id: 14, date: "2025-11-01", arrival: "09:00", pauseStart: "12:30", pauseEnd: "13:30", departure: "18:15", duration: "8h15", status: "Work", notes: "Planification sprint" },
  { id: 15, date: "2025-10-31", arrival: "08:45", pauseStart: "12:00", pauseEnd: "13:00", departure: "17:45", duration: "8h00", status: "Work", notes: "" },
  { id: 16, date: "2025-10-30", arrival: "09:00", pauseStart: "12:30", pauseEnd: "13:30", departure: "18:00", duration: "8h00", status: "Work", notes: "Tests QA" },
  { id: 17, date: "2025-10-29", arrival: "08:30", pauseStart: "12:00", pauseEnd: "13:00", departure: "17:30", duration: "8h00", status: "Work", notes: "" },
  { id: 18, date: "2025-10-28", arrival: "09:00", pauseStart: "12:30", pauseEnd: "13:30", departure: "18:30", duration: "8h30", status: "Work", notes: "Déploiement production" },
];

export function WeeklyView({ period, onPeriodChange }: WeeklyViewProps) {
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [openPeriodPicker, setOpenPeriodPicker] = useState<"week" | "month" | "year" | null>(null);
  const [periodButtonRef, setPeriodButtonRef] = useState<HTMLButtonElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
            value="0h00"
            color="purple"
            delay={0}
          />
          <StatCard
            icon={<Calendar className="w-4 h-4" />}
            label="Cette semaine"
            value="32h30"
            subtitle="+2h30 vs objectif"
            color="teal"
            delay={0.1}
          />
          <StatCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="Ce mois"
            value="142h15"
            subtitle="95% de l'objectif"
            color="pink"
            delay={0.2}
          />
          <StatCard
            icon={<Zap className="w-4 h-4" />}
            label="Cette année"
            value="1,465h"
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
              {period === "week" && "Semaine du 10 nov → 16 nov 2025"}
              {period === "month" && "Novembre 2025"}
              {period === "year" && "Année 2025"}
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
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg">
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
                  {mockEntries.map((entry, index) => (
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
                        <span className="font-mono text-sm text-gray-700">{entry.arrival || "—"}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-mono text-sm text-gray-700">{entry.pauseStart || "—"}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-mono text-sm text-gray-700">{entry.pauseEnd || "—"}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-mono text-sm text-gray-700">{entry.departure || "—"}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-semibold text-gray-900">{entry.duration}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge 
                          variant={entry.status === "Work" ? "default" : "secondary"}
                          className="rounded-full text-xs font-medium"
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
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (visible on small screens) */}
            <div className="lg:hidden overflow-y-auto flex-1 p-2">
              <div className="space-y-3">
                {mockEntries.map((entry, index) => (
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
                          variant={entry.status === "Work" ? "default" : "secondary"}
                          className="rounded-full text-xs font-medium mt-1"
                        >
                          {entry.status}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 text-lg">{entry.duration}</p>
                        <button
                          onClick={() => handleEditEntry(entry)}
                          className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-purple-50 transition-colors"
                        >
                          <Pencil className="w-4 h-4 text-purple-600" />
                        </button>
                      </div>
                    </div>
                    
                    {entry.status === "Work" && (
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-gray-500">Arrivée</p>
                          <p className="font-mono text-gray-900 mt-0.5">{entry.arrival}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Départ</p>
                          <p className="font-mono text-gray-900 mt-0.5">{entry.departure}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Pause</p>
                          <p className="font-mono text-gray-900 mt-0.5">{entry.pauseStart}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Reprise</p>
                          <p className="font-mono text-gray-900 mt-0.5">{entry.pauseEnd}</p>
                        </div>
                      </div>
                    )}
                    
                    {entry.notes && (
                      <p className="text-xs text-gray-600 italic border-t border-gray-200 pt-2">
                        {entry.notes}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
            
            {/* Scroll indicator - desktop only */}
            {mockEntries.length > 5 && !isScrolledToBottom && (
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
            <span className="font-semibold text-gray-900">{mockEntries.length}</span> entrées au total
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
          anchorElement={periodButtonRef}
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