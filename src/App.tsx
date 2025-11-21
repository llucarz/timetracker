import { useState, useEffect, useRef } from "react";
import { useTimeTracker } from "./context/TimeTrackerContext";
import { Dashboard } from "./components/Dashboard";
import { DailyEntryModal } from "./components/DailyEntryModal";
import { WeeklyView } from "./components/WeeklyView";
import { OvertimePanel } from "./components/OvertimePanel";
import { ProfileModal } from "./components/ProfileModal";
import { LoginModal } from "./components/LoginModal";
import { UserMenu } from "./components/UserMenu";
import { Onboarding } from "./components/Onboarding";
import { Toaster } from "./components/ui/sonner";
import { motion, AnimatePresence } from "motion/react";
import { LayoutDashboard, Clock, TrendingUp, Menu, X } from "lucide-react";

function App() {
  const { settings, updateSettings } = useTimeTracker();
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
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
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header - Ultra moderne et responsive */}
      <header className="sticky top-0 z-50 border-b border-gray-200/50 bg-white/80 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo minimaliste */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 flex items-center justify-center">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900 text-sm sm:text-base">TimeFlow</span>
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
                    <item.icon className={`w-4 h-4 transition-colors ${
                      currentView === item.id ? "text-purple-600" : "text-gray-500 group-hover:text-gray-900"
                    }`} />
                    <span className={`text-sm font-medium transition-colors ${
                      currentView === item.id ? "text-gray-900" : "text-gray-600 group-hover:text-gray-900"
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

            {/* Right side - User menu et mobile menu button */}
            <div className="flex items-center gap-2">
              <UserMenu 
                userName={settings.account?.name || "Utilisateur"} 
                company={settings.account?.company || "Entreprise"}
                onOpenProfile={() => setIsProfileOpen(true)}
                onLogin={() => setIsLoginModalOpen(true)}
              />
              
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-gray-600" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden overflow-hidden border-t border-gray-200"
              >
                <nav className="py-2 space-y-1">
                  {navigationItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setCurrentView(item.id as any)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        currentView === item.id 
                          ? "bg-purple-50 text-purple-600" 
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  ))}
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Main Content */}
      <main 
        ref={mainRef}
        className={`flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 ${
          currentView === "dashboard" ? "overflow-y-auto py-4 sm:py-6 lg:py-8" : "overflow-hidden py-4 sm:py-6 lg:py-8 pb-6 sm:pb-8"
        }`}
      >
        <AnimatePresence mode="wait">
          {currentView === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Dashboard onStartEntry={() => setIsEntryModalOpen(true)} />
            </motion.div>
          )}
          
          {currentView === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <WeeklyView period={period} onPeriodChange={setPeriod} />
            </motion.div>
          )}

          {currentView === "overtime" && (
            <motion.div
              key="overtime"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="h-full overflow-hidden"
            >
              <OvertimePanel />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

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

      <Toaster />
    </div>
  );
}

export default App;