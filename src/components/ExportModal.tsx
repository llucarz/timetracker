import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Download, X, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useTimeTracker } from "../context/TimeTrackerContext";
import { computeMinutes, minToHM, weekRangeOf } from "../lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

type PeriodType = "week" | "month" | "year" | "all";
type ExportType = "work-only" | "work-with-overtime";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Week Picker Component
function WeekPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const currentDate = new Date(value);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);

  const monthsFull = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];
  const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];
  const daysOfWeek = ["L", "M", "M", "J", "V", "S", "D"];

  const getCalendarDays = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const startDay = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDay.setDate(firstDay.getDate() + diff);
    
    const weeks = [];
    let currentDay = new Date(startDay);
    
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
      
      if (weeks.length > 1 && currentDay.getMonth() !== month && currentDay.getDate() > 7) {
        break;
      }
    }
    
    return weeks;
  };

  const calendarWeeks = getCalendarDays(selectedYear, selectedMonth);
  const { start, end } = weekRangeOf(value);

  const getWeekLabel = (days: any[]) => {
    const firstDay = days[0].date;
    const lastDay = days[6].date;
    return `${firstDay.getDate()} ${months[firstDay.getMonth()]} - ${lastDay.getDate()} ${months[lastDay.getMonth()]}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="h-11 w-full flex items-center justify-start px-3 text-left font-normal rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 bg-white transition-colors">
          <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
          <span className="text-gray-900 text-sm">Semaine du {start} au {end}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 rounded-2xl shadow-xl border-gray-200" align="start">
        <div className="space-y-3">
          {/* Navigation mois/année */}
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

          {/* Calendrier avec semaines cliquables */}
          <div className="space-y-1">
            {/* En-têtes des jours */}
            <div className="grid grid-cols-7 gap-1">
              {daysOfWeek.map((day, i) => (
                <div key={i} className="text-center text-xs font-semibold text-gray-500 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Semaines */}
            <div className="space-y-0.5">
              {calendarWeeks.map((week, weekIndex) => (
                <div
                  key={weekIndex}
                  onClick={() => {
                    const monday = week[0].date;
                    const year = monday.getFullYear();
                    const month = String(monday.getMonth() + 1).padStart(2, '0');
                    const day = String(monday.getDate()).padStart(2, '0');
                    onChange(`${year}-${month}-${day}`);
                    setOpen(false);
                  }}
                  onMouseEnter={() => setHoveredWeek(weekIndex)}
                  onMouseLeave={() => setHoveredWeek(null)}
                  className="grid grid-cols-7 gap-1 w-full py-0.5 rounded-lg transition-colors hover:bg-purple-50 cursor-pointer"
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
                        
                        {day.isToday && (
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-600 rounded-full" />
                        )}
                      </div>
                    );
                  })}
                </div>
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
      </PopoverContent>
    </Popover>
  );
}

// Month Picker Component
function MonthPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [year, month] = value.split('-').map(Number);
  
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  
  const formatMonth = (monthStr: string) => {
    const [y, m] = monthStr.split('-');
    return `${monthNames[parseInt(m) - 1]} ${y}`;
  };

  const changeYear = (delta: number) => {
    const newYear = year + delta;
    onChange(`${newYear}-${String(month).padStart(2, '0')}`);
  };

  const selectMonth = (m: number) => {
    onChange(`${year}-${String(m).padStart(2, '0')}`);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="h-11 w-full flex items-center justify-start px-3 text-left font-normal rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 bg-white transition-colors">
          <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
          <span className="text-gray-900">{formatMonth(value)}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 rounded-2xl shadow-xl border-gray-200" align="start">
        <div className="space-y-4">
          {/* Year selector */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => changeYear(-1)}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold text-gray-900">{year}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => changeYear(1)}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {/* Month grid */}
          <div className="grid grid-cols-3 gap-2">
            {monthNames.map((name, index) => (
              <button
                key={index}
                onClick={() => selectMonth(index + 1)}
                className={`p-2 rounded-lg text-sm transition-colors ${
                  month === index + 1
                    ? 'bg-purple-500 text-white font-semibold'
                    : 'hover:bg-purple-50 text-gray-700'
                }`}
              >
                {name.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Year Picker Component
function YearPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const currentYear = parseInt(value);
  const startYear = 2020;
  const endYear = new Date().getFullYear() + 5;
  
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="h-11 w-full flex items-center justify-start px-3 text-left font-normal rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 bg-white transition-colors">
          <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
          <span className="text-gray-900">Année {value}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4 rounded-2xl shadow-xl border-gray-200" align="start">
        <div className="max-h-64 overflow-y-auto">
          <div className="grid grid-cols-3 gap-2">
            {years.map((year) => (
              <button
                key={year}
                onClick={() => {
                  onChange(year.toString());
                  setOpen(false);
                }}
                className={`p-2 rounded-lg text-sm transition-colors ${
                  currentYear === year
                    ? 'bg-purple-500 text-white font-semibold'
                    : 'hover:bg-purple-50 text-gray-700'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const { entries, settings } = useTimeTracker();
  const [period, setPeriod] = useState<PeriodType>("week");
  const [exportType, setExportType] = useState<ExportType>("work-only");
  
  // Date selectors for each period type
  const [selectedWeekDate, setSelectedWeekDate] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });
  const [selectedYear, setSelectedYear] = useState<string>(() => {
    return new Date().getFullYear().toString();
  });

  const handleExport = () => {
    let filtered = entries.filter((e) => e.status === "work");
    let periodLabel = "";

    if (period === "week") {
      const { start, end } = weekRangeOf(selectedWeekDate);
      filtered = filtered.filter((e) => e.date >= start && e.date <= end);
      periodLabel = `semaine du ${start}`;
    } else if (period === "month") {
      filtered = filtered.filter((e) => e.date.startsWith(selectedMonth));
      const [year, month] = selectedMonth.split('-');
      const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
      periodLabel = `${monthNames[parseInt(month) - 1]} ${year}`;
    } else if (period === "year") {
      filtered = filtered.filter((e) => e.date.startsWith(selectedYear));
      periodLabel = `année ${selectedYear}`;
    } else {
      periodLabel = "toutes_periodes";
    }

    if (filtered.length === 0) {
      toast.error("Aucune entrée à exporter");
      return;
    }

    filtered.sort((a, b) => a.date.localeCompare(b.date));

    let csv = "";
    if (exportType === "work-only") {
      csv = "Date,Arrivée,Début pause,Fin pause,Départ,Heures\n";
      filtered.forEach((e) => {
        const mins = computeMinutes(e);
        const hm = minToHM(mins);
        csv += `${e.date},${e.start},${e.lunchStart},${e.lunchEnd},${e.end},${hm}\n`;
      });
    } else {
      csv = "Date,Arrivée,Début pause,Fin pause,Départ,Heures,Objectif,Écart,Cumul\n";
      let cumul = 0;
      const target = settings.weeklyTarget / settings.workDays;
      filtered.forEach((e) => {
        const mins = computeMinutes(e);
        const hm = minToHM(mins);
        const delta = mins - target * 60;
        cumul += delta;
        csv += `${e.date},${e.start},${e.lunchStart},${e.lunchEnd},${e.end},${hm},${target}h,${minToHM(Math.abs(delta))}${delta >= 0 ? "+" : "-"},${minToHM(Math.abs(cumul))}${cumul >= 0 ? "+" : "-"}\n`;
      });
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `export_heures_${periodLabel.replace(/\s+/g, '_')}_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success("Export réussi", {
      description: `${filtered.length} entrée(s) exportée(s) - ${periodLabel}`,
    });
    onClose();
  };

  const getEntriesCount = (p: PeriodType): number => {
    let filtered = entries.filter((e) => e.status === "work");

    if (p === "week") {
      const { start, end } = weekRangeOf(selectedWeekDate);
      filtered = filtered.filter((e) => e.date >= start && e.date <= end);
    } else if (p === "month") {
      filtered = filtered.filter((e) => e.date.startsWith(selectedMonth));
    } else if (p === "year") {
      filtered = filtered.filter((e) => e.date.startsWith(selectedYear));
    }

    return filtered.length;
  };

  // Get period description for display
  const getPeriodDescription = (): string => {
    if (period === "week") {
      const { start, end } = weekRangeOf(selectedWeekDate);
      return `Semaine du ${start} au ${end}`;
    } else if (period === "month") {
      const [year, month] = selectedMonth.split('-');
      const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
      return `${monthNames[parseInt(month) - 1]} ${year}`;
    } else if (period === "year") {
      return `Année ${selectedYear}`;
    }
    return "Toutes les périodes";
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl card-shadow max-w-2xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Exporter les heures</h2>
                    <p className="text-sm text-gray-600 mt-1">Choisissez la période et le format d'export</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-xl hover:bg-white/50 transition-colors flex items-center justify-center"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="space-y-6">
                  {/* Period Selection */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">
                      Période à exporter
                    </Label>
                    <RadioGroup value={period} onValueChange={(value) => setPeriod(value as PeriodType)}>
                      <div className="space-y-2">
                        {[
                          { value: "week", label: "Semaine" },
                          { value: "month", label: "Mois" },
                          { value: "year", label: "Année" },
                          { value: "all", label: "Toutes les entrées" },
                        ].map((option) => (
                          <div
                            key={option.value}
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                              period === option.value
                                ? "border-purple-500 bg-purple-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <RadioGroupItem value={option.value} id={`period-${option.value}`} className="cursor-pointer" />
                            <label htmlFor={`period-${option.value}`} className="flex-1 cursor-pointer">
                              <p className="font-semibold text-gray-900">{option.label}</p>
                            </label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>

                    {/* Period-specific selectors */}
                    {period !== "all" && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                        {period === "week" && (
                          <div className="space-y-2">
                            <Label htmlFor="week-picker" className="text-sm font-medium text-gray-700">
                              Choisir une semaine
                            </Label>
                            <WeekPicker
                              value={selectedWeekDate}
                              onChange={setSelectedWeekDate}
                            />
                            <p className="text-xs text-gray-500">{getPeriodDescription()}</p>
                            <p className="text-xs font-medium text-purple-600">{getEntriesCount("week")} entrée(s)</p>
                          </div>
                        )}
                        {period === "month" && (
                          <div className="space-y-2">
                            <Label htmlFor="month-picker" className="text-sm font-medium text-gray-700">
                              Choisir un mois
                            </Label>
                            <MonthPicker
                              value={selectedMonth}
                              onChange={setSelectedMonth}
                            />
                            <p className="text-xs text-gray-500">{getPeriodDescription()}</p>
                            <p className="text-xs font-medium text-purple-600">{getEntriesCount("month")} entrée(s)</p>
                          </div>
                        )}
                        {period === "year" && (
                          <div className="space-y-2">
                            <Label htmlFor="year-picker" className="text-sm font-medium text-gray-700">
                              Choisir une année
                            </Label>
                            <YearPicker
                              value={selectedYear}
                              onChange={setSelectedYear}
                            />
                            <p className="text-xs text-gray-500">{getPeriodDescription()}</p>
                            <p className="text-xs font-medium text-purple-600">{getEntriesCount("year")} entrée(s)</p>
                          </div>
                        )}
                      </div>
                    )}
                    {period === "all" && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-500">Toutes les périodes disponibles</p>
                        <p className="text-xs font-medium text-purple-600">{entries.filter(e => e.status === "work").length} entrée(s)</p>
                      </div>
                    )}
                  </div>

                  {/* Export Type Selection */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">
                      Type d'export
                    </Label>
                    <RadioGroup value={exportType} onValueChange={(value) => setExportType(value as ExportType)}>
                      <div className="space-y-2">
                        <div
                          className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                            exportType === "work-only"
                              ? "border-purple-500 bg-purple-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <RadioGroupItem value="work-only" id="work-only" className="cursor-pointer" />
                          <label htmlFor="work-only" className="flex-1 cursor-pointer">
                            <p className="font-semibold text-gray-900">Heures de travail uniquement</p>
                            <p className="text-sm text-gray-500">Date, horaires et durée</p>
                          </label>
                        </div>
                        <div
                          className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                            exportType === "work-with-overtime"
                              ? "border-purple-500 bg-purple-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <RadioGroupItem value="work-with-overtime" id="work-with-overtime" className="cursor-pointer" />
                          <label htmlFor="work-with-overtime" className="flex-1 cursor-pointer">
                            <p className="font-semibold text-gray-900">Avec heures supplémentaires</p>
                            <p className="text-sm text-gray-500">Inclut objectif, écart et cumul</p>
                          </label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                <Button
                  onClick={handleExport}
                  className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg shadow-purple-200"
                >
                  <Download className="w-4 h-4" />
                  Exporter CSV
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="h-12 px-8 rounded-xl border-gray-200 hover:bg-white"
                >
                  Annuler
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );


  return createPortal(modalContent, document.body);
}
