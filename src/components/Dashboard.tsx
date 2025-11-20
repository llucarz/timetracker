import { Clock, TrendingUp, Calendar, Zap, Play, ArrowRight, Sparkles, Pencil } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import { EditEntryModal } from "./EditEntryModal";
import { useTimeTracker } from "../context/TimeTrackerContext";
import { computeMinutes, minToHM, toDateKey, weekRangeOf } from "../lib/utils";

interface DashboardProps {
  onStartEntry: () => void;
}

export function Dashboard({ onStartEntry }: DashboardProps) {
  const { entries, otState, settings } = useTimeTracker();
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const todayKey = toDateKey(new Date());
  const { start: weekStart, end: weekEnd } = weekRangeOf(todayKey);
  const currentMonth = todayKey.slice(0, 7);

  // Calculate stats
  const todayMinutes = entries
    .filter(e => e.date === todayKey)
    .reduce((acc, e) => acc + computeMinutes(e), 0);

  const weekMinutes = entries
    .filter(e => e.date >= weekStart && e.date <= weekEnd)
    .reduce((acc, e) => acc + computeMinutes(e), 0);

  const monthMinutes = entries
    .filter(e => e.date.startsWith(currentMonth))
    .reduce((acc, e) => acc + computeMinutes(e), 0);

  // Calculate targets (simplified for now)
  const dailyTarget = (settings.weeklyTarget / settings.workDays) * 60;
  const weekTarget = settings.weeklyTarget * 60;
  // Month target is complex, let's just show the total for now or approximate

  const recentEntries = [...entries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
    .map(e => {
      const minutes = computeMinutes(e);
      const target = e.status === 'work' ? dailyTarget : 0;
      const diff = minutes - target;
      const overtime = e.status === 'work' ? (diff > 0 ? `+${minToHM(diff)}` : diff < 0 ? minToHM(diff) : "±0h") : null;
      
      return {
        ...e,
        day: new Date(e.date).toLocaleDateString('fr-FR', { weekday: 'long' }),
        hours: minToHM(minutes),
        overtime,
        duration: minToHM(minutes)
      };
    });

  const handleEditEntry = (entry: any) => {
    setSelectedEntry(entry);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Hero */}
      <div
        className="relative overflow-hidden bg-gradient-to-r from-[#a855f7] via-[#ec4899] to-[#f43f5e] rounded-[2rem] p-8 sm:p-12 lg:p-16 text-white shadow-xl"
      >
        {/* Decorative background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-900/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md mb-8 border border-white/10">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Bon retour !</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Prêt à suivre votre temps ?
          </h1>
          <p className="text-lg sm:text-xl text-white/90 mb-10 leading-relaxed max-w-xl">
            Commencez votre journée en enregistrant vos heures de travail. Suivez vos progrès et gérez vos heures supplémentaires efficacement.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Button
              onClick={onStartEntry}
              size="lg"
              className="h-14 px-8 bg-white text-purple-600 hover:bg-gray-50 rounded-2xl font-bold text-lg shadow-lg shadow-black/10 group transition-all hover:scale-105"
            >
              <Play className="w-5 h-5 mr-2 fill-purple-600" />
              Saisir mes heures
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>

        {/* Decorative element - Clock */}
        <div className="absolute top-1/2 -translate-y-1/2 right-12 hidden xl:block">
          <div className="w-80 h-80 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-2xl">
            <Clock className="w-40 h-40 text-white/40" strokeWidth={1} />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Vos statistiques</h2>
          <p className="text-gray-500 mt-1">Vue d'ensemble de votre suivi du temps</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard
            icon={<Clock className="w-6 h-6" />}
            label="Aujourd'hui"
            value={minToHM(todayMinutes)}
            subtitle={todayMinutes > 0 ? "En cours" : "Pas d'entrée"}
            iconBg="bg-purple-100"
            iconColor="text-purple-600"
            delay={0}
          />
          <StatCard
            icon={<Calendar className="w-6 h-6" />}
            label="Cette semaine"
            value={minToHM(weekMinutes)}
            subtitle={`Objectif: ${settings.weeklyTarget}h`}
            trend={weekMinutes > weekTarget ? "+" + minToHM(weekMinutes - weekTarget) : undefined}
            iconBg="bg-cyan-100"
            iconColor="text-cyan-600"
            trendColor="text-cyan-600 bg-cyan-50"
            delay={0.1}
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="Ce mois"
            value={minToHM(monthMinutes)}
            subtitle="Total cumulé"
            iconBg="bg-pink-100"
            iconColor="text-pink-600"
            delay={0.2}
          />
          <StatCard
            icon={<Zap className="w-6 h-6" />}
            label="Solde heures sup."
            value={minToHM(otState.balanceMinutes)}
            subtitle="Prêtes à récupérer"
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
            trend={otState.balanceMinutes > 0 ? "+" + minToHM(otState.balanceMinutes) : undefined}
            trendColor="text-emerald-600 bg-emerald-50"
            delay={0.3}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div
        className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 card-shadow"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Entrées récentes</h3>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">Vos 5 derniers jours travaillés</p>
          </div>
          <Button variant="ghost" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl w-full sm:w-auto">
            Tout voir
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {recentEntries.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Aucune entrée récente.</p>
          ) : recentEntries.map((entry, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                <div className={`w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${
                  entry.status === "work" 
                    ? "bg-gradient-to-br from-purple-100 to-pink-100" 
                    : "bg-gray-100"
                }`}>
                  <Calendar className={`w-4 sm:w-5 h-4 sm:h-5 ${
                    entry.status === "work" ? "text-purple-600" : "text-gray-400"
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
                  <p className="text-xs sm:text-sm text-gray-500 capitalize">{entry.day}</p>
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
            </div>
          ))}
        </div>
      </div>

      {/* Edit Entry Modal */}
      {isEditModalOpen && (
        <EditEntryModal
          entry={selectedEntry}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle: string;
  trend?: string;
  iconBg: string;
  iconColor: string;
  trendColor?: string;
  delay?: number;
}

function StatCard({ icon, label, value, subtitle, trend, iconBg, iconColor, trendColor, delay = 0 }: StatCardProps) {
  return (
    <div
      className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-md transition-all group border border-gray-100"
    >
      <div className="flex items-start justify-between mb-6">
        <div className={`w-14 h-14 rounded-2xl ${iconBg} ${iconColor} flex items-center justify-center transition-transform group-hover:scale-110`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${trendColor || 'text-emerald-600 bg-emerald-50'}`}>
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-base font-medium text-gray-500 mb-2">{label}</p>
        <p className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">{value}</p>
        <p className="text-sm text-gray-400 font-medium">{subtitle}</p>
      </div>
    </div>
  );
}