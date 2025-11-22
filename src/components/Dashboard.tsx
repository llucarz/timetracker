import { Clock, TrendingUp, Calendar, Zap, Play, ArrowRight, Sparkles, Pencil } from "lucide-react";
import { Button } from "./ui/button";
import { motion } from "motion/react";
import { useState, useMemo } from "react";
import { EditEntryModal } from "./EditEntryModal";
import { AllEntriesModal } from "./AllEntriesModal";
import { useTimeTracker } from "../context/TimeTrackerContext";
import { computeMinutes, minToHM, toDateKey, weekRangeOf } from "../lib/utils";
import { Entry } from "../lib/types";

interface DashboardProps {
  onStartEntry: () => void;
}

export function Dashboard({ onStartEntry }: DashboardProps) {
  const { entries, otState, settings } = useTimeTracker();
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAllEntriesModalOpen, setIsAllEntriesModalOpen] = useState(false);

  const stats = useMemo(() => {
    const today = toDateKey(new Date());
    const { start: weekStart, end: weekEnd } = weekRangeOf(today);
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    let todayMins = 0;
    let weekMins = 0;
    let monthMins = 0;

    entries.forEach(e => {
      const m = computeMinutes(e);
      if (e.date === today) todayMins += m;
      if (e.date >= weekStart && e.date <= weekEnd) weekMins += m;
      if (e.date.startsWith(currentMonth)) monthMins += m;
    });

    return {
      today: minToHM(todayMins),
      week: minToHM(weekMins),
      month: minToHM(monthMins),
      overtime: minToHM(otState.balanceMinutes),
      overtimeSign: otState.balanceMinutes >= 0 ? "+" : "-"
    };
  }, [entries, otState.balanceMinutes]);

  const recentEntries = useMemo(() => {
    return [...entries]
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .slice(0, 5)
      .map(e => {
        const mins = computeMinutes(e);
        const dateObj = new Date(e.date);
        const dayName = dateObj.toLocaleDateString('fr-FR', { weekday: 'long' });
        const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
        
        // Simple overtime calc for display (vs daily target)
        const dailyTarget = (settings.weeklyTarget || 35) / (settings.workDays || 5) * 60;
        const otMins = mins - dailyTarget;
        const otStr = e.status === 'work' ? (otMins > 0 ? `+${minToHM(otMins)}` : minToHM(otMins)) : null;

        return {
          ...e,
          day: capitalizedDay,
          hours: e.status === 'work' ? minToHM(mins) : (e.status === 'off' ? 'Repos' : e.status),
          overtime: otStr,
          displayStatus: e.status === 'work' ? 'Work' : 'Other'
        };
      });
  }, [entries, settings]);

  const handleEditEntry = (entry: any) => {
    setSelectedEntry(entry);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 text-white card-shadow-hover"
      >
        {/* Decorative background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-purple-900 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/20 backdrop-blur-sm mb-4 sm:mb-6">
            <Sparkles className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium">Bon retour !</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
            Prêt à suivre votre temps ?
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-white/90 mb-6 sm:mb-8 leading-relaxed">
            Commencez votre journée en enregistrant vos heures de travail. Suivez vos progrès et gérez vos heures supplémentaires efficacement.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <Button
              onClick={onStartEntry}
              size="lg"
              className="h-12 sm:h-14 px-6 sm:px-8 bg-white text-purple-600 hover:bg-gray-50 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg shadow-2xl shadow-black/20 group"
            >
              <Play className="w-4 sm:w-5 h-4 sm:h-5 group-hover:scale-110 transition-transform" />
              Saisir mes heures
              <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>

        {/* Decorative element - only on larger screens */}
        <div className="absolute bottom-0 right-8 hidden xl:block">
          <div className="w-48 h-48 2xl:w-64 2xl:h-64 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center">
            <Clock className="w-24 h-24 2xl:w-32 2xl:h-32 text-white/30" strokeWidth={1.5} />
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div>
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Vos statistiques</h2>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Vue d'ensemble de votre suivi du temps</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            icon={<Clock className="w-5 sm:w-6 h-5 sm:h-6" />}
            label="Aujourd'hui"
            value={stats.today}
            subtitle="Heures travaillées"
            gradient="from-purple-500 to-pink-500"
            shadowColor="shadow-purple-200"
            delay={0}
          />
          <StatCard
            icon={<Calendar className="w-5 sm:w-6 h-5 sm:h-6" />}
            label="Cette semaine"
            value={stats.week}
            subtitle="Total semaine"
            gradient="from-teal-500 to-cyan-500"
            shadowColor="shadow-teal-200"
            delay={0.1}
          />
          <StatCard
            icon={<TrendingUp className="w-5 sm:w-6 h-5 sm:h-6" />}
            label="Ce mois"
            value={stats.month}
            subtitle="Total mois"
            gradient="from-pink-500 to-rose-500"
            shadowColor="shadow-pink-200"
            delay={0.2}
          />
          <StatCard
            icon={<Zap className="w-5 sm:w-6 h-5 sm:h-6" />}
            label="Solde heures sup."
            value={`${stats.overtimeSign}${stats.overtime.replace('-', '')}`}
            subtitle="Prêtes à récupérer"
            gradient="from-emerald-500 to-teal-500"
            shadowColor="shadow-emerald-200"
            delay={0.3}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 card-shadow"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Entrées récentes</h3>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">Vos 5 derniers jours travaillés</p>
          </div>
          <Button 
            variant="ghost" 
            onClick={() => setIsAllEntriesModalOpen(true)}
            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl w-full sm:w-auto"
          >
            Tout voir
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {recentEntries.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucune entrée récente</p>
          ) : (
            recentEntries.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                className="flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className={`w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${
                    entry.displayStatus === "Work" 
                      ? "bg-gradient-to-br from-purple-100 to-pink-100" 
                      : "bg-gray-100"
                  }`}>
                    <Calendar className={`w-4 sm:w-5 h-4 sm:h-5 ${
                      entry.displayStatus === "Work" ? "text-purple-600" : "text-gray-400"
                    }`} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                      {new Date(entry.date).toLocaleDateString('fr-FR', { 
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">{entry.day}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-base sm:text-lg">{entry.hours}</p>
                    {entry.overtime && (
                      <p className={`text-xs font-medium ${
                        entry.overtime.startsWith('+') 
                          ? 'text-emerald-600' 
                          : entry.overtime.startsWith('-') 
                          ? 'text-orange-600' 
                          : 'text-gray-500'
                      }`}>
                        {entry.overtime}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleEditEntry(entry)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 sm:h-9 sm:w-9 rounded-lg hover:bg-purple-50 flex items-center justify-center"
                  >
                    <Pencil className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-purple-600" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Edit Entry Modal */}
      {isEditModalOpen && (
        <EditEntryModal
          entry={selectedEntry}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}

      {/* All Entries Modal */}
      <AllEntriesModal
        isOpen={isAllEntriesModalOpen}
        onClose={() => setIsAllEntriesModalOpen(false)}
      />
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle: string;
  trend?: string;
  gradient: string;
  shadowColor: string;
  delay?: number;
}

function StatCard({ icon, label, value, subtitle, trend, gradient, shadowColor, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white rounded-2xl p-6 card-shadow hover:card-shadow-hover transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg ${shadowColor} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        {trend && (
          <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </motion.div>
  );
}