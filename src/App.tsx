import { useState, useEffect, useRef } from "react";
import { useTimeTracker, TimeTrackerProvider } from "./context/TimeTrackerContext";
import { NotificationProvider } from "./context/NotificationContext";
import { Dashboard } from "./components/Dashboard";
import { DailyEntryModal } from "./components/DailyEntryModal";
import { WeeklyView } from "./features/history/WeeklyView";
import { OvertimePanel } from "./features/overtime/OvertimePanel";
import { ProfileModal } from "./features/profile/ProfileModal";
import { LoginModal } from "./components/LoginModal";
import { UserMenu } from "./components/UserMenu";
import { MobileUserMenu } from "./components/MobileUserMenu";
import { motion, AnimatePresence } from "motion/react";
import { LayoutDashboard, Clock, TrendingUp, Menu, X } from "lucide-react";
import { GRADIENTS } from "./ui/design-system/tokens";

function AppContent() {
  const { settings, updateSettings } = useTimeTracker();
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<"dashboard" | "history" | "overtime">("dashboard");
  const [isScrolled, setIsScrolled] = useState(false);
  const [period, setPeriod] = useState<"week" | "month" | "year">("week");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (currentView === "dashboard" && mainRef.current) {
        setIsScrolled(mainRef.current.scrollTop > 20);
      }
    };

    const mainElement = mainRef.current;
    if (mainElement) {
      mainElement.addEventListener("scroll", handleScroll);
      return () => mainElement.removeEventListener("scroll", handleScroll);
    }
  }, [currentView]);

  // Reset scroll state when changing views
  useEffect(() => {
    if (currentView !== "dashboard") {
      setIsScrolled(false);
    }
    setIsMobileMenuOpen(false);
  }, [currentView]);

  const defaultSchedule = {
    arrival: settings.baseHours?.same?.start || "09:00",
    pauseStart: settings.baseHours?.same?.lunchStart || "12:30",
    pauseEnd: settings.baseHours?.same?.lunchEnd || "13:30",
    departure: settings.baseHours?.same?.end || "18:00",
  };

  const navigationItems = [
    { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { id: "history", label: "Historique", icon: Clock },
    { id: "overtime", label: "Heures sup.", icon: TrendingUp },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header - Simplifié sur mobile */}
      {/* Header - Simplifié sur mobile */}
      <header className="sticky top-0 z-40 border-b border-[oklch(0.922_0_0)] bg-white shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo minimaliste */}
            <div
              onClick={() => setCurrentView("dashboard")}
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br ${GRADIENTS.primary} flex items-center justify-center`}>
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="font-semibold text-gray-900 text-base sm:text-lg">TimeFlow</span>
            </div>

            {/* Navigation desktop */}
            <nav className="hidden md:flex items-center gap-4 lg:gap-8">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as any)}
                  className="relative group py-4"
                >
                  <div className="flex items-center gap-2">
                    <item.icon className={`w-4 h-4 transition-all duration-200 group-hover:scale-110 ${currentView === item.id ? "text-purple-600" : "text-[oklch(0.145_0_0)] group-hover:text-gray-900"
                      }`} />
                    <span className={`text-sm font-medium transition-colors ${currentView === item.id ? "text-gray-900" : "text-[oklch(0.145_0_0)] group-hover:text-gray-900"
                      }`}>
                      {item.label}
                    </span>
                  </div>
                  {currentView === item.id && (
                    <motion.div
                      layoutId="navIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                </button>
              ))}
            </nav>

            {/* Right side - User menu (desktop seulement) */}
            <div className="hidden md:flex items-center">
              <UserMenu
                userName={settings.account?.name || "Utilisateur"}
                company={settings.account?.company || "Entreprise"}
                onOpenProfile={() => setIsProfileOpen(true)}
                onLogin={() => setIsLoginModalOpen(true)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Padding bottom pour bottom nav sur mobile */}
      <main
        ref={mainRef}
        className="flex-1 w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 lg:py-8 pb-20 md:pb-6 overflow-auto"
      >
        <AnimatePresence mode="wait">
          {currentView === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Dashboard onStartEntry={() => setIsEntryModalOpen(true)} />
            </motion.div>
          )}

          {currentView === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <WeeklyView period={period} onPeriodChange={setPeriod} />
            </motion.div>
          )}

          {currentView === "overtime" && (
            <motion.div
              key="overtime"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <OvertimePanel />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg safe-area-inset-bottom">
        <div className="grid grid-cols-4 h-16">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as any)}
              className={`flex flex-col items-center justify-center gap-1 transition-all ${currentView === item.id
                ? "text-purple-600"
                : "text-gray-500 active:bg-gray-100"
                }`}
            >
              <item.icon className={`w-6 h-6 transition-transform ${currentView === item.id ? "scale-110" : ""
                }`} />
              <span className="text-xs font-medium">{item.id === "dashboard" ? "Accueil" : item.id === "history" ? "Historique" : "Heures"}</span>
            </button>
          ))}
          {/* Menu utilisateur sur mobile */}
          <button
            onClick={() => setIsUserMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-gray-700 active:bg-gray-100 transition-colors rounded-lg p-2 -m-2"
          >
            <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${GRADIENTS.primaryDouble} flex items-center justify-center`}>
              <span className="text-white text-xs font-semibold">
                {(settings.account?.name || "U").charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-xs font-medium">Profil</span>
          </button>
        </div>
      </nav>

      {/* Mobile User Menu */}
      <MobileUserMenu
        isOpen={isUserMenuOpen}
        onClose={() => setIsUserMenuOpen(false)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onLogin={() => setIsLoginModalOpen(true)}
      />

      {/* Daily Entry Modal */}
      <DailyEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        defaultSchedule={defaultSchedule}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />


    </div>
  );
}

function App() {
  return (
    <TimeTrackerProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </TimeTrackerProvider>
  );
}

export default App;