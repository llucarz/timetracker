import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface PeriodPickerProps {
  isOpen: boolean;
  period: "week" | "month" | "year";
  onClose: () => void;
  onSelect: (date: Date) => void;
  anchorElement: HTMLElement;
}

export function PeriodPicker({ isOpen, period, onClose, onSelect, anchorElement }: PeriodPickerProps) {
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedMonth, setSelectedMonth] = useState(10); // Novembre (0-indexed)
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const popoverRef = useRef<HTMLDivElement>(null);
  
  const months = [
    "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
    "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"
  ];

  const monthsFull = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  const daysOfWeek = ["L", "M", "M", "J", "V", "S", "D"];

  // Calculer la position du popover
  useEffect(() => {
    if (anchorElement && popoverRef.current) {
      const rect = anchorElement.getBoundingClientRect();
      const popoverWidth = 320; // w-80 = 320px
      setPosition({
        top: rect.bottom + 8,
        left: rect.left + (rect.width / 2) - (popoverWidth / 2)
      });
    }
  }, [anchorElement, isOpen]);

  // Générer le calendrier du mois avec les semaines
  const getCalendarDays = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Trouver le lundi de la première semaine
    const startDay = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDay.setDate(firstDay.getDate() + diff);
    
    const weeks = [];
    let currentDay = new Date(startDay);
    
    // Générer 6 semaines maximum
    for (let week = 0; week < 6; week++) {
      const days = [];
      for (let day = 0; day < 7; day++) {
        days.push({
          date: new Date(currentDay),
          isCurrentMonth: currentDay.getMonth() === month,
          isToday: currentDay.toDateString() === new Date().toDateString()
        });
        currentDay.setDate(currentDay.getDate() + 1);
      }
      weeks.push(days);
      
      // Arrêter si on a dépassé le dernier jour du mois de plus d'une semaine
      if (weeks.length > 1 && currentDay.getMonth() !== month && currentDay.getDate() > 7) {
        break;
      }
    }
    
    return weeks;
  };

  const years = Array.from({ length: 11 }, (_, i) => 2020 + i);
  const calendarWeeks = getCalendarDays(selectedYear, selectedMonth);

  const getWeekLabel = (days: any[]) => {
    const firstDay = days[0].date;
    const lastDay = days[6].date;
    return `${firstDay.getDate()} ${months[firstDay.getMonth()]} - ${lastDay.getDate()} ${months[lastDay.getMonth()]}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop transparent pour fermer au clic */}
          <div
            className="fixed inset-0 z-40"
            onClick={onClose}
          />
          
          {/* Popover */}
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", stiffness: 400, damping: 28, duration: 0.2 }}
            style={{ 
              position: 'fixed',
              top: position.top,
              left: position.left,
            }}
            className="z-50 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden"
          >
            {/* Content */}
            <div className="p-4">
              {period === "week" && (
                <div className="space-y-3">
                  {/* Sélecteur mois/année */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        if (selectedMonth === 0) {
                          setSelectedMonth(11);
                          setSelectedYear(selectedYear - 1);
                        } else {
                          setSelectedMonth(selectedMonth - 1);
                        }
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-600" />
                    </button>
                    
                    <p className="font-semibold text-gray-900 text-sm">
                      {monthsFull[selectedMonth]} {selectedYear}
                    </p>
                    
                    <button
                      onClick={() => {
                        if (selectedMonth === 11) {
                          setSelectedMonth(0);
                          setSelectedYear(selectedYear + 1);
                        } else {
                          setSelectedMonth(selectedMonth + 1);
                        }
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  {/* Calendrier avec semaines cliquables - Style Airbnb */}
                  <div className="space-y-1">
                    {/* En-têtes des jours */}
                    <div className="grid grid-cols-7 gap-1">
                      {daysOfWeek.map((day, i) => (
                        <div key={i} className="text-center text-xs font-semibold text-gray-500 py-1">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Semaines avec points */}
                    <div className="space-y-0.5">
                      {calendarWeeks.map((week, weekIndex) => (
                        <button
                          key={weekIndex}
                          onClick={() => {
                            onSelect(week[0].date);
                            onClose();
                          }}
                          onMouseEnter={() => setHoveredWeek(weekIndex)}
                          onMouseLeave={() => setHoveredWeek(null)}
                          className="grid grid-cols-7 gap-1 w-full py-0.5 rounded-lg transition-colors hover:bg-purple-50"
                        >
                          {week.map((day, dayIndex) => {
                            const isWeekHovered = hoveredWeek === weekIndex;
                            const isStartOfWeek = dayIndex === 0;
                            const isEndOfWeek = dayIndex === 6;
                            
                            return (
                              <div
                                key={dayIndex}
                                className={`
                                  relative text-center py-1.5 text-xs transition-all
                                  ${day.isCurrentMonth ? "text-gray-900" : "text-gray-300"}
                                  ${isWeekHovered && day.isCurrentMonth ? "font-semibold" : "font-normal"}
                                  ${isWeekHovered && isStartOfWeek ? "rounded-l-full" : ""}
                                  ${isWeekHovered && isEndOfWeek ? "rounded-r-full" : ""}
                                  ${isWeekHovered ? "bg-purple-100" : ""}
                                `}
                              >
                                {day.date.getDate()}
                                
                                {/* Point indicateur pour aujourd'hui */}
                                {day.isToday && (
                                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-600 rounded-full" />
                                )}
                              </div>
                            );
                          })}
                        </button>
                      ))}
                    </div>

                    {/* Info bulle de la semaine survolée */}
                    {hoveredWeek !== null && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center text-xs text-gray-600 py-2"
                      >
                        {getWeekLabel(calendarWeeks[hoveredWeek])}
                      </motion.div>
                    )}
                  </div>
                </div>
              )}

              {period === "month" && (
                <div className="space-y-3">
                  {/* Sélecteur année */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setSelectedYear(selectedYear - 1)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-600" />
                    </button>
                    
                    <p className="font-semibold text-gray-900 text-sm">{selectedYear}</p>
                    
                    <button
                      onClick={() => setSelectedYear(selectedYear + 1)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  {/* Grille des mois */}
                  <div className="grid grid-cols-3 gap-2">
                    {monthsFull.map((month, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          const newDate = new Date(selectedYear, index, 1);
                          onSelect(newDate);
                          onClose();
                        }}
                        className={`px-3 py-2 rounded-lg transition-all text-xs font-medium ${
                          index === selectedMonth
                            ? "bg-purple-100 text-purple-900 ring-2 ring-purple-200"
                            : "bg-gray-50 text-gray-700 hover:bg-purple-50"
                        }`}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {period === "year" && (
                <div className="space-y-3">
                  {/* Sélecteur de type roue iOS */}
                  <div className="relative h-64 overflow-hidden">
                    {/* Indicateur de sélection (barre centrale) */}
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-12 bg-purple-50 border-y border-purple-200 pointer-events-none z-10" />
                    
                    {/* Liste des années avec scroll */}
                    <div 
                      className="h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory"
                      style={{ 
                        scrollPaddingTop: 'calc(50% - 24px)',
                        scrollPaddingBottom: 'calc(50% - 24px)'
                      }}
                    >
                      {/* Padding top pour centrer */}
                      <div style={{ height: 'calc(50% - 24px)' }} />
                      
                      {years.map((year) => {
                        const isSelected = year === selectedYear;
                        const isCurrent = year === new Date().getFullYear();
                        
                        return (
                          <button
                            key={year}
                            onClick={() => {
                              setSelectedYear(year);
                              const newDate = new Date(year, 0, 1);
                              onSelect(newDate);
                              onClose();
                            }}
                            className="w-full h-12 flex items-center justify-center snap-center transition-all duration-150"
                          >
                            <span className={`
                              transition-all duration-150
                              ${isSelected 
                                ? "text-purple-900 font-bold text-xl" 
                                : "text-gray-400 font-medium text-base"
                              }
                            `}>
                              {year}
                              {isCurrent && !isSelected && (
                                <span className="ml-2 text-xs text-purple-600">•</span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                      
                      {/* Padding bottom pour centrer */}
                      <div style={{ height: 'calc(50% - 24px)' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}