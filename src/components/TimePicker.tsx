import { Input } from "./ui/input";
import { Clock } from "lucide-react";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function TimePicker({ value, onChange, className = "", disabled = false, placeholder }: TimePickerProps) {
  return (
    <div className="relative">
      <Input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`h-11 rounded-xl border-gray-200 font-mono text-sm ${className}`}
        inputMode="decimal"
        style={{
          colorScheme: 'light',
          appearance: 'none'
        }}
      />
      {/* Absolute positioning to ensure icon alignment if native icon is hidden or for decoration */}
      <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
    </div>
  );
}
