import { ReactNode, useState } from "react";
import { 
  Clock, 
  LayoutDashboard, 
  CalendarDays, 
  BarChart3, 
  Timer, 
  User, 
  Settings,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./ui/utils";

interface LayoutProps {
  children: ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
  userName?: string;
  company?: string;
}

const navItems = [
  { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { id: "entry", label: "Saisie", icon: Clock },
  { id: "table", label: "Historique", icon: CalendarDays },
  { id: "stats", label: "Statistiques", icon: BarChart3 },
  { id: "overtime", label: "Heures sup", icon: Timer },
  { id: "profile", label: "Profil", icon: User },
  { id: "account", label: "Compte", icon: Settings },
  { id: "legal", label: "Légal", icon: FileText },
];

export function Layout({ children, currentView, onViewChange, userName }: LayoutProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      {/* Expandable Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isExpanded ? 240 : 80 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        className="flex flex-col py-6 border-r border-white/[0.08] relative shrink-0"
      >
        {/* Logo */}
        <div className={cn("mb-8 px-5 flex items-center", isExpanded ? "gap-3" : "justify-center")}>
          <div className="relative group cursor-pointer shrink-0">
            <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-0 group-hover:opacity-60 transition-opacity" />
            <div className="relative size-12 rounded-[16px] bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
              <Clock className="size-6 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="text-[15px] font-semibold tracking-tight whitespace-nowrap">TimeTracker</div>
                <div className="text-[13px] text-white/40 tracking-tight whitespace-nowrap">Gestion du temps</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cn(
                  "relative w-full flex items-center gap-3 px-3 py-2.5 rounded-[14px] transition-all group",
                  isActive 
                    ? "text-white" 
                    : "text-white/40 hover:text-white hover:bg-white/[0.05]"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute inset-0 rounded-[14px] bg-white/10"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                  />
                )}
                
                {/* Active indicator dot */}
                {isActive && (
                  <div className="absolute -left-[2px] top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full" />
                )}
                
                <div className={cn(
                  "flex items-center justify-center shrink-0 relative z-10",
                  isExpanded ? "size-5" : "size-5 mx-auto"
                )}>
                  <Icon className="size-5" strokeWidth={2} />
                </div>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="text-[14px] font-medium tracking-tight whitespace-nowrap relative z-10"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </nav>

        {/* User Avatar */}
        {userName && (
          <div className={cn("mt-6 px-3", !isExpanded && "flex justify-center")}>
            <button 
              onClick={() => onViewChange("account")}
              className={cn(
                "w-full flex items-center gap-3 p-2 rounded-[14px] hover:bg-white/[0.05] transition-all",
                !isExpanded && "justify-center"
              )}
            >
              <div className="size-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ring-2 ring-white/10 hover:ring-white/20 transition-all shrink-0">
                <span className="text-sm font-semibold text-white">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden flex-1 min-w-0 text-left"
                  >
                    <div className="text-[13px] font-medium truncate tracking-tight">{userName}</div>
                    <div className="text-[12px] text-white/40 truncate">Mon compte</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        )}
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="h-full"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
