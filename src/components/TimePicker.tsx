import { useState, useRef, useEffect } from "react";
import { Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Input } from "./ui/input";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function TimePicker({ value, onChange, className = "", disabled = false, placeholder = "09:00" }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");

  const hoursRef = useRef<HTMLDivElement>(null);
  const minutesRef = useRef<HTMLDivElement>(null);
  const hourScrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const minuteScrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const isScrollingHours = useRef(false);
  const isScrollingMinutes = useRef(false);
  const isDraggingHours = useRef(false);
  const isDraggingMinutes = useRef(false);
  const dragStartY = useRef(0);
  const dragStartScrollHours = useRef(0);
  const dragStartScrollMinutes = useRef(0);

  const [selectedHour, selectedMinute] = value ? value.split(':') : ['09', '00'];

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  // Generate hours and minutes (tripled for infinite scroll)
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  // Triple the arrays for infinite scroll effect
  const infiniteHours = [...hours, ...hours, ...hours];
  const infiniteMinutes = [...minutes, ...minutes, ...minutes];

  // Scroll to selected value when opening
  useEffect(() => {
    if (open && hoursRef.current && minutesRef.current) {
      const hourIndex = hours.indexOf(selectedHour);
      const minuteIndex = minutes.indexOf(selectedMinute);

      setTimeout(() => {
        if (hoursRef.current && minutesRef.current) {
          // Start in the middle set
          hoursRef.current.scrollTo({
            top: (hourIndex + 24) * 48,
            behavior: 'instant' as any
          });
          minutesRef.current.scrollTo({
            top: (minuteIndex + 4) * 48,
            behavior: 'instant' as any
          });
        }
      }, 50);
    }
  }, [open, selectedHour, selectedMinute]);

  const handleHourScroll = () => {
    if (!hoursRef.current || isScrollingHours.current || isDraggingHours.current) return;

    if (hourScrollTimeout.current) clearTimeout(hourScrollTimeout.current);

    hourScrollTimeout.current = setTimeout(() => {
      if (!hoursRef.current || isDraggingHours.current) return;

      const scrollTop = hoursRef.current.scrollTop;
      const itemHeight = 48;
      const index = Math.round(scrollTop / itemHeight);
      const actualIndex = index % 24;
      const newHour = hours[actualIndex];

      if (newHour && newHour !== selectedHour) {
        onChange(`${newHour}:${selectedMinute}`);
      }

      // Reset to middle section if near edges
      const totalHeight = 24 * 3 * itemHeight;
      if (scrollTop < itemHeight * 12 || scrollTop > totalHeight - itemHeight * 12) {
        isScrollingHours.current = true;
        hoursRef.current.scrollTo({
          top: (actualIndex + 24) * itemHeight,
          behavior: 'instant' as any
        });
        setTimeout(() => {
          isScrollingHours.current = false;
        }, 100);
      }
    }, 150);
  };

  const handleMinuteScroll = () => {
    if (!minutesRef.current || isScrollingMinutes.current || isDraggingMinutes.current) return;

    if (minuteScrollTimeout.current) clearTimeout(minuteScrollTimeout.current);

    minuteScrollTimeout.current = setTimeout(() => {
      if (!minutesRef.current || isDraggingMinutes.current) return;

      const scrollTop = minutesRef.current.scrollTop;
      const itemHeight = 48;
      const index = Math.round(scrollTop / itemHeight);
      const actualIndex = index % 4;
      const newMinute = minutes[actualIndex];

      if (newMinute && newMinute !== selectedMinute) {
        onChange(`${selectedHour}:${newMinute}`);
      }

      // Reset to middle section if near edges
      const totalHeight = 4 * 3 * itemHeight;
      if (scrollTop < itemHeight * 2 || scrollTop > totalHeight - itemHeight * 2) {
        isScrollingMinutes.current = true;
        minutesRef.current.scrollTo({
          top: (actualIndex + 4) * itemHeight,
          behavior: 'instant' as any
        });
        setTimeout(() => {
          isScrollingMinutes.current = false;
        }, 100);
      }
    }, 150);
  };

  const handleHourClick = (hour: string) => {
    onChange(`${hour}:${selectedMinute}`);
  };

  const handleMinuteClick = (minute: string) => {
    onChange(`${selectedHour}:${minute}`);
  };

  // Drag to scroll handlers for hours
  const handleHourMouseDown = (e: React.MouseEvent) => {
    if (!hoursRef.current) return;
    isDraggingHours.current = true;
    dragStartY.current = e.clientY;
    dragStartScrollHours.current = hoursRef.current.scrollTop;
    e.preventDefault();
  };

  const handleHourMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingHours.current || !hoursRef.current) return;
    const deltaY = dragStartY.current - e.clientY;
    hoursRef.current.scrollTop = dragStartScrollHours.current + deltaY;
  };

  const handleHourMouseUp = () => {
    if (isDraggingHours.current && hoursRef.current) {
      isDraggingHours.current = false;
      // Force snap after drag
      const scrollTop = hoursRef.current.scrollTop;
      const itemHeight = 48;
      const targetIndex = Math.round(scrollTop / itemHeight);
      hoursRef.current.scrollTo({
        top: targetIndex * itemHeight,
        behavior: 'smooth'
      });
    }
  };

  // Drag to scroll handlers for minutes
  const handleMinuteMouseDown = (e: React.MouseEvent) => {
    if (!minutesRef.current) return;
    isDraggingMinutes.current = true;
    dragStartY.current = e.clientY;
    dragStartScrollMinutes.current = minutesRef.current.scrollTop;
    e.preventDefault();
  };

  const handleMinuteMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingMinutes.current || !minutesRef.current) return;
    const deltaY = dragStartY.current - e.clientY;
    minutesRef.current.scrollTop = dragStartScrollMinutes.current + deltaY;
  };

  const handleMinuteMouseUp = () => {
    if (isDraggingMinutes.current && minutesRef.current) {
      isDraggingMinutes.current = false;
      // Force snap after drag
      const scrollTop = minutesRef.current.scrollTop;
      const itemHeight = 48;
      const targetIndex = Math.round(scrollTop / itemHeight);
      minutesRef.current.scrollTo({
        top: targetIndex * itemHeight,
        behavior: 'smooth'
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9:]/g, '');

    if (val.length === 2 && !val.includes(':')) {
      val = val + ':';
    }

    if (val.length > 5) {
      val = val.slice(0, 5);
    }

    setInputValue(val);

    const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
    if (timeRegex.test(val)) {
      onChange(val);
    }
  };

  const handleInputBlur = () => {
    const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegex.test(inputValue) && value) {
      setInputValue(value);
    }
  };

  const handleNowClick = () => {
    const now = new Date();
    const hour = String(now.getHours()).padStart(2, '0');
    const rawMinute = now.getMinutes();
    const roundedMinute = Math.round(rawMinute / 15) * 15;
    const minute = String(roundedMinute >= 60 ? 0 : roundedMinute).padStart(2, '0');
    const time = `${hour}:${minute}`;
    onChange(time);
    setInputValue(time);
    setOpen(false);
  };

  return (
    <div className="relative">
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={`h-11 rounded-xl border-gray-200 font-mono text-sm pr-10 ${className}`}
      />

      <Popover open={open && !disabled} onOpenChange={(val) => !disabled && setOpen(val)}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-gray-100 rounded p-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Clock className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0 rounded-2xl shadow-xl border-gray-200" align="start">
          {/* Apple-style wheel picker */}
          <div className="relative bg-gradient-to-b from-gray-50 to-white">
            {/* Center selection bar */}
            <div className="absolute inset-x-0 top-[96px] h-12 bg-gray-100/60 backdrop-blur-sm border-y border-gray-200/50 pointer-events-none z-10" />

            <div className="flex" style={{ height: '240px' }}>
              {/* Hours wheel */}
              <div className="flex-1 relative overflow-hidden">
                <div
                  ref={hoursRef}
                  onScroll={handleHourScroll}
                  onMouseDown={handleHourMouseDown}
                  onMouseMove={handleHourMouseMove}
                  onMouseUp={handleHourMouseUp}
                  onMouseLeave={handleHourMouseUp}
                  className="h-full overflow-y-auto scrollbar-hide cursor-grab active:cursor-grabbing select-none"
                  style={{
                    scrollSnapType: isDraggingHours.current ? 'none' : 'y proximity',
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}
                >
                  <div style={{ height: '96px' }} />
                  {infiniteHours.map((hour, idx) => (
                    <button
                      key={`hour-${idx}`}
                      type="button"
                      onClick={() => handleHourClick(hour)}
                      className="w-full flex items-center justify-center font-mono transition-all"
                      style={{
                        height: '48px',
                        scrollSnapAlign: 'center',
                        color: hour === selectedHour ? '#8b5cf6' : '#9ca3af',
                        fontWeight: hour === selectedHour ? 600 : 400,
                        fontSize: hour === selectedHour ? '20px' : '16px',
                      }}
                    >
                      {hour}
                    </button>
                  ))}
                  <div style={{ height: '96px' }} />
                </div>

                {/* Gradient overlays */}
                <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-gray-50 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
              </div>

              {/* Separator */}
              <div className="w-px bg-gray-200" />

              {/* Minutes wheel */}
              <div className="flex-1 relative overflow-hidden">
                <div
                  ref={minutesRef}
                  onScroll={handleMinuteScroll}
                  onMouseDown={handleMinuteMouseDown}
                  onMouseMove={handleMinuteMouseMove}
                  onMouseUp={handleMinuteMouseUp}
                  onMouseLeave={handleMinuteMouseUp}
                  className="h-full overflow-y-auto scrollbar-hide cursor-grab active:cursor-grabbing select-none"
                  style={{
                    scrollSnapType: isDraggingMinutes.current ? 'none' : 'y proximity',
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}
                >
                  <div style={{ height: '96px' }} />
                  {infiniteMinutes.map((minute, idx) => (
                    <button
                      key={`minute-${idx}`}
                      type="button"
                      onClick={() => handleMinuteClick(minute)}
                      className="w-full flex items-center justify-center font-mono transition-all"
                      style={{
                        height: '48px',
                        scrollSnapAlign: 'center',
                        color: minute === selectedMinute ? '#ec4899' : '#9ca3af',
                        fontWeight: minute === selectedMinute ? 600 : 400,
                        fontSize: minute === selectedMinute ? '20px' : '16px',
                      }}
                    >
                      {minute}
                    </button>
                  ))}
                  <div style={{ height: '96px' }} />
                </div>

                {/* Gradient overlays */}
                <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-gray-50 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <button
              onClick={handleNowClick}
              className="flex-1 px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <Clock className="inline-block w-4 h-4 mr-1" />
              Maintenant
            </button>
            <button
              onClick={() => setOpen(false)}
              className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              OK
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
