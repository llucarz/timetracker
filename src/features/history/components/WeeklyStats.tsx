/**
 * WeeklyStats Component
 * 
 * Affiche les 4 cartes statistiques (Aujourd'hui, Semaine, Mois, Année).
 * Extrait de WeeklyView.tsx (lignes 216-248).
 */

import { Clock, Calendar, TrendingUp, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { GRADIENTS, SHADOWS } from '../../../ui/design-system/tokens';

interface WeeklyStatsProps {
    stats: {
        today: string;
        week: string;
        month: string;
        year: string;
        weeklySubtitle: string;
        monthlySubtitle: string;
    };
    isFullscreen?: boolean;
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
            className="bg-white rounded-2xl p-6 border border-gray-200 card-shadow hover:card-shadow-hover transition-all group"
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

export function WeeklyStats({ stats, isFullscreen = false }: WeeklyStatsProps) {
    if (isFullscreen) return null;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
            <StatCard
                icon={<Clock className="w-5 sm:w-6 h-5 sm:h-6" />}
                label="Aujourd'hui"
                value={stats.today}
                subtitle="Heures travaillées"
                gradient={GRADIENTS.primaryDouble}
                shadowColor="shadow-purple-200"
                delay={0}
            />
            <StatCard
                icon={<Calendar className="w-5 sm:w-6 h-5 sm:h-6" />}
                label="Semaine"
                value={stats.week}
                subtitle={stats.weeklySubtitle || "Total semaine"}
                gradient={GRADIENTS.accent}
                shadowColor={SHADOWS.accent}
                delay={0.1}
            />
            <StatCard
                icon={<TrendingUp className="w-5 sm:w-6 h-5 sm:h-6" />}
                label="Mois"
                value={stats.month}
                subtitle={stats.monthlySubtitle || "Total mois"}
                gradient={GRADIENTS.secondary}
                shadowColor={SHADOWS.secondary}
                delay={0.2}
            />
            <StatCard
                icon={<Zap className="w-5 sm:w-6 h-5 sm:h-6" />}
                label="Année"
                value={stats.year}
                subtitle="Sur la bonne voie"
                gradient={GRADIENTS.success}
                shadowColor={SHADOWS.success}
                delay={0.3}
            />
        </div>
    );
}
