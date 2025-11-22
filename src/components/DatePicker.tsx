import { useState } from "react";
import { Calendar } from "lucide-react";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function DatePicker({ value, onChange, className = "" }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  
  // Convert string date to Date object
  const dateValue = value ? new Date(value) : undefined;
  
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "Sélectionner une date";
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      // Format date as YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={`h-11 w-full flex items-center justify-start px-3 text-left font-normal rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 bg-white transition-colors ${className}`}
        >
          <Calendar className="mr-2 h-4 w-4 text-gray-500" />
          <span className={value ? "text-gray-900" : "text-gray-500"}>
            {formatDate(value)}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl border-gray-200" align="start">
        <CalendarComponent
          mode="single"
          selected={dateValue}
          onSelect={handleSelect}
          initialFocus
          weekStartsOn={1}
          locale={{
            localize: {
              day: (n: number) => ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][n],
              month: (n: number) => ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'][n],
            },
            formatLong: {
              date: () => 'dd/MM/yyyy',
            }
          } as any}
        />
      </PopoverContent>
    </Popover>
  );
}