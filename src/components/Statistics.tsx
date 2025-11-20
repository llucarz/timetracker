import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from "recharts";
import { Calendar, TrendingUp, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { motion } from "motion/react";

const weekData = [
  { day: "Lun", hours: 8.25, target: 7 },
  { day: "Mar", hours: 8.0, target: 7 },
  { day: "Mer", hours: 8.5, target: 7 },
  { day: "Jeu", hours: 8.15, target: 7 },
  { day: "Ven", hours: 7.5, target: 7 },
];

const monthData = [
  { week: "S1", hours: 40.5 },
  { week: "S2", hours: 38.0 },
  { week: "S3", hours: 42.0 },
  { week: "S4", hours: 35.0 },
];

const yearData = [
  { month: "Jan", hours: 160 },
  { month: "Fév", hours: 155 },
  { month: "Mar", hours: 165 },
  { month: "Avr", hours: 158 },
  { month: "Mai", hours: 140 },
  { month: "Juin", hours: 162 },
  { month: "Juil", hours: 120 },
  { month: "Août", hours: 80 },
  { month: "Sep", hours: 165 },
  { month: "Oct", hours: 170 },
  { month: "Nov", hours: 90 },
];

export function Statistics() {
  return (
    <div className="min-h-full relative">
      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-[1400px] px-8 py-16 space-y-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-3"
        >
          <h1>Statistiques</h1>
          <p className="text-white/50 text-xl tracking-tight max-w-2xl">
            Analysez vos performances et suivez votre progression
          </p>
        </motion.div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            icon={<Clock className="size-5" strokeWidth={2} />}
            label="Cette semaine"
            value="40h25"
            subtitle="35h objectif"
            variant="default"
            delay={0.1}
          />
          <StatsCard
            icon={<Calendar className="size-5" strokeWidth={2} />}
            label="Ce mois"
            value="155h30"
            subtitle="140h objectif"
            variant="default"
            delay={0.2}
          />
          <StatsCard
            icon={<TrendingUp className="size-5" strokeWidth={2} />}
            label="Heures sup"
            value="+5h15"
            subtitle="Solde actuel"
            variant="success"
            delay={0.3}
          />
        </div>

        {/* Charts */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="glass-light rounded-[28px] p-8 border border-white/[0.06]"
        >
          <Tabs defaultValue="week" className="w-full">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-white">Évolution du temps</h3>
              <TabsList className="bg-white/[0.03] border border-white/[0.06] p-1 rounded-[12px]">
                <TabsTrigger 
                  value="week" 
                  className="rounded-[10px] text-[13px] data-[state=active]:bg-white/10"
                >
                  Semaine
                </TabsTrigger>
                <TabsTrigger 
                  value="month"
                  className="rounded-[10px] text-[13px] data-[state=active]:bg-white/10"
                >
                  Mois
                </TabsTrigger>
                <TabsTrigger 
                  value="year"
                  className="rounded-[10px] text-[13px] data-[state=active]:bg-white/10"
                >
                  Année
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="week" className="space-y-8 mt-0">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weekData}>
                    <defs>
                      <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="rgb(99 102 241)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="rgb(99 102 241)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="day" 
                      stroke="rgba(255,255,255,0.3)"
                      fontSize={13}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.3)"
                      fontSize={13}
                      tickLine={false}
                      axisLine={false}
                      dx={-10}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(18, 18, 18, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        fontSize: '13px',
                        backdropFilter: 'blur(20px)',
                      }}
                      cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="hours" 
                      stroke="rgb(99 102 241)" 
                      strokeWidth={3}
                      fill="url(#colorHours)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="glass-light rounded-[16px] p-6 border border-white/[0.06]">
                  <div className="text-[13px] text-white/40 mb-2 tracking-tight">Total semaine</div>
                  <div className="text-3xl font-bold tracking-tight">40h25</div>
                </div>
                <div className="glass-light rounded-[16px] p-6 border border-white/[0.06]">
                  <div className="text-[13px] text-white/40 mb-2 tracking-tight">Moyenne/jour</div>
                  <div className="text-3xl font-bold tracking-tight">8h05</div>
                </div>
                <div className="glass-light rounded-[16px] p-6 border border-white/[0.06]">
                  <div className="text-[13px] text-white/40 mb-2 tracking-tight">vs Objectif</div>
                  <div className="text-3xl font-bold text-emerald-400 tracking-tight">+5h25</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="month" className="space-y-8 mt-0">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="week" 
                      stroke="rgba(255,255,255,0.3)"
                      fontSize={13}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.3)"
                      fontSize={13}
                      tickLine={false}
                      axisLine={false}
                      dx={-10}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(18, 18, 18, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        fontSize: '13px',
                        backdropFilter: 'blur(20px)',
                      }}
                      cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }}
                    />
                    <Bar 
                      dataKey="hours" 
                      fill="rgb(99 102 241)"
                      radius={[10, 10, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="glass-light rounded-[16px] p-6 border border-white/[0.06]">
                  <div className="text-[13px] text-white/40 mb-2 tracking-tight">Total mois</div>
                  <div className="text-3xl font-bold tracking-tight">155h30</div>
                </div>
                <div className="glass-light rounded-[16px] p-6 border border-white/[0.06]">
                  <div className="text-[13px] text-white/40 mb-2 tracking-tight">Moyenne/semaine</div>
                  <div className="text-3xl font-bold tracking-tight">38h52</div>
                </div>
                <div className="glass-light rounded-[16px] p-6 border border-white/[0.06]">
                  <div className="text-[13px] text-white/40 mb-2 tracking-tight">vs Objectif</div>
                  <div className="text-3xl font-bold text-emerald-400 tracking-tight">+15h30</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="year" className="space-y-8 mt-0">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yearData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      stroke="rgba(255,255,255,0.3)"
                      fontSize={13}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.3)"
                      fontSize={13}
                      tickLine={false}
                      axisLine={false}
                      dx={-10}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(18, 18, 18, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        fontSize: '13px',
                        backdropFilter: 'blur(20px)',
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="hours" 
                      stroke="rgb(99 102 241)" 
                      strokeWidth={3}
                      dot={{ fill: 'rgb(99 102 241)', r: 5, strokeWidth: 0 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="glass-light rounded-[16px] p-6 border border-white/[0.06]">
                  <div className="text-[13px] text-white/40 mb-2 tracking-tight">Total année</div>
                  <div className="text-3xl font-bold tracking-tight">1,465h</div>
                </div>
                <div className="glass-light rounded-[16px] p-6 border border-white/[0.06]">
                  <div className="text-[13px] text-white/40 mb-2 tracking-tight">Moyenne/mois</div>
                  <div className="text-3xl font-bold tracking-tight">133h</div>
                </div>
                <div className="glass-light rounded-[16px] p-6 border border-white/[0.06]">
                  <div className="text-[13px] text-white/40 mb-2 tracking-tight">vs Objectif</div>
                  <div className="text-3xl font-bold text-emerald-400 tracking-tight">+65h</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle: string;
  variant?: "default" | "success";
  delay?: number;
}

function StatsCard({ icon, label, value, subtitle, variant = "default", delay = 0 }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="group relative"
    >
      {variant === "success" && (
        <div className="absolute inset-0 bg-emerald-500/20 rounded-[20px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
      
      <div className="relative glass-light rounded-[20px] p-6 border border-white/[0.06] hover:border-white/10 transition-all">
        <div className={`
          inline-flex items-center justify-center size-11 rounded-[12px] mb-4
          ${variant === "success" 
            ? "bg-emerald-500/10" 
            : "bg-indigo-500/10"
          }
        `}>
          <div className={variant === "success" ? "text-emerald-400" : "text-indigo-400"}>
            {icon}
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="text-[13px] text-white/40 tracking-tight">{label}</div>
          <div className="text-3xl font-bold tracking-tight">{value}</div>
          <div className="text-[13px] text-white/40 tracking-tight">{subtitle}</div>
        </div>
      </div>
    </motion.div>
  );
}
