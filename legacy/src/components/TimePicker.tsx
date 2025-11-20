import { useState, useRef, useEffect } from "react";
import { Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Input } from "./ui/input";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function TimePicker({ value, onChange, className = "" }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");
  
  const hoursRef = useRef<HTMLDivElement>(null);
  const minutesRef = useRef<HTMLDivElement>(null);
  const hourScrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const minuteScrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const isHourProgrammaticScroll = useRef(false);
  const isMinuteProgrammaticScroll = useRef(false);

  // Generate hours (00-23) - multiplied by 5 for smooth infinite scroll
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const hoursInfinite = [...hours, ...hours, ...hours, ...hours, ...hours];
  
  // Generate minutes (only 00, 15, 30, 45) - multiplied by 5 for smooth infinite scroll
  const minutes = ['00', '15', '30', '45'];
  const minutesInfinite = [...minutes, ...minutes, ...minutes, ...minutes, ...minutes];
  
  const [selectedHour, selectedMinute] = value ? value.split(':') : ['09', '00'];

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  // Scroll to selected time when opening (middle set) - FIXED positioning
  useEffect(() => {
    if (open && hoursRef.current && minutesRef.current) {
      const hourIndex = hours.indexOf(selectedHour) + (hours.length * 2); // Middle set (3rd copy)
      const minuteIndex = minutes.indexOf(selectedMinute) + (minutes.length * 2); // Middle set (3rd copy)
      
      // Wait for render then position WITHOUT smooth (instant)
      requestAnimationFrame(() => {
        if (hoursRef.current && minutesRef.current) {
          isHourProgrammaticScroll.current = true;
          isMinuteProgrammaticScroll.current = true;
          
          // Position so the selected item is centered in the visible area
          // The selection bar is at 100px from top (center of 200px container)
          // We want item center (80px padding + index*40 + 20px) to be at scrollTop + 100px
          // So: scrollTop = 80 + index*40 + 20 - 100 = index*40
          hoursRef.current.scrollTop = hourIndex * 40;
          minutesRef.current.scrollTop = minuteIndex * 40;
          
          setTimeout(() => {
            isHourProgrammaticScroll.current = false;
            isMinuteProgrammaticScroll.current = false;
          }, 100);
        }
      });
    }
  }, [open, selectedHour, selectedMinute]);

  // Handle infinite scroll for hours
  const handleHourScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!hoursRef.current) return;

    const scrollTop = hoursRef.current.scrollTop;
    const itemHeight = 40;
    const totalItems = hours.length;
    const setHeight = totalItems * itemHeight;

    // Check if we need to loop (with better boundaries)
    if (!isHourProgrammaticScroll.current) {
      // If in first set, jump to equivalent position in middle
      if (scrollTop < setHeight) {
        isHourProgrammaticScroll.current = true;
        hoursRef.current.scrollTop = scrollTop + (setHeight * 2);
        setTimeout(() => { isHourProgrammaticScroll.current = false; }, 50);
        return;
      }
      // If in last set, jump to equivalent position in middle
      else if (scrollTop >= setHeight * 4) {
        isHourProgrammaticScroll.current = true;
        hoursRef.current.scrollTop = scrollTop - (setHeight * 2);
        setTimeout(() => { isHourProgrammaticScroll.current = false; }, 50);
        return;
      }
    }

    // Handle snap on scroll end
    if (hourScrollTimeout.current) {
      clearTimeout(hourScrollTimeout.current);
    }

    hourScrollTimeout.current = setTimeout(() => {
      if (hoursRef.current && !isHourProgrammaticScroll.current) {
        const currentScrollTop = hoursRef.current.scrollTop;
        const index = Math.round(currentScrollTop / itemHeight);
        const targetScroll = index * itemHeight;
        
        isHourProgrammaticScroll.current = true;
        hoursRef.current.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        });
        
        setTimeout(() => { isHourProgrammaticScroll.current = false; }, 300);
        
        // Get actual hour value (modulo to get original index)
        const actualIndex = index % totalItems;
        const newHour = hours[actualIndex];
        if (newHour && newHour !== selectedHour) {
          onChange(`${newHour}:${selectedMinute}`);
        }
      }
    }, 150);
  };

  // Handle infinite scroll for minutes
  const handleMinuteScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!minutesRef.current) return;

    const scrollTop = minutesRef.current.scrollTop;
    const itemHeight = 40;
    const totalItems = minutes.length;
    const setHeight = totalItems * itemHeight;

    // Check if we need to loop (with better boundaries)
    if (!isMinuteProgrammaticScroll.current) {
      // If in first set, jump to equivalent position in middle
      if (scrollTop < setHeight) {
        isMinuteProgrammaticScroll.current = true;
        minutesRef.current.scrollTop = scrollTop + (setHeight * 2);
        setTimeout(() => { isMinuteProgrammaticScroll.current = false; }, 50);
        return;
      }
      // If in last set, jump to equivalent position in middle
      else if (scrollTop >= setHeight * 4) {
        isMinuteProgrammaticScroll.current = true;
        minutesRef.current.scrollTop = scrollTop - (setHeight * 2);
        setTimeout(() => { isMinuteProgrammaticScroll.current = false; }, 50);
        return;
      }
    }

    // Handle snap on scroll end
    if (minuteScrollTimeout.current) {
      clearTimeout(minuteScrollTimeout.current);
    }

    minuteScrollTimeout.current = setTimeout(() => {
      if (minutesRef.current && !isMinuteProgrammaticScroll.current) {
        const currentScrollTop = minutesRef.current.scrollTop;
        const index = Math.round(currentScrollTop / itemHeight);
        const targetScroll = index * itemHeight;
        
        isMinuteProgrammaticScroll.current = true;
        minutesRef.current.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        });
        
        setTimeout(() => { isMinuteProgrammaticScroll.current = false; }, 300);
        
        // Get actual minute value (modulo to get original index)
        const actualIndex = index % totalItems;
        const newMinute = minutes[actualIndex];
        if (newMinute && newMinute !== selectedMinute) {
          onChange(`${selectedHour}:${newMinute}`);
        }
      }
    }, 150);
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
    // Round to nearest 15
    const roundedMinute = Math.round(rawMinute / 15) * 15;
    const minute = String(roundedMinute >= 60 ? 0 : roundedMinute).padStart(2, '0');
    const time = `${hour}:${minute}`;
    onChange(time);
    setInputValue(time);
    setOpen(false);
  };

  return (
    <div className="relative">
      {/* Input for keyboard entry */}
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        placeholder="09:00"
        className={`h-11 rounded-xl border-gray-200 font-mono text-sm pr-10 ${className}`}
      />
      
      {/* Clock icon trigger for picker */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button 
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-gray-100 rounded p-1 transition-colors"
          >
            <Clock className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0 rounded-2xl shadow-xl border-gray-200" align="start">
          {/* iOS-Style Picker */}
          <div className="relative bg-white rounded-t-2xl overflow-hidden">
            {/* Selection Highlight */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[40px] bg-purple-100/30 border-y-2 border-purple-300/40 pointer-events-none z-10 rounded-md mx-2" />
            
            {/* Columns Container */}
            <div className="flex items-stretch divide-x divide-gray-200">
              {/* Hours Column - INFINITE with CONTROLLED SCROLL SPEED */}
              <div className="flex-1 relative">
                <div 
                  ref={hoursRef}
                  onScroll={handleHourScroll}
                  onWheel={(e) => {
                    // Control scroll speed: each wheel tick = 1 item (40px)
                    e.preventDefault();
                    if (hoursRef.current && !isHourProgrammaticScroll.current) {
                      const delta = e.deltaY > 0 ? 40 : -40;
                      hoursRef.current.scrollTop += delta;
                    }
                  }}
                  className="h-[200px] overflow-y-scroll scrollbar-hide"
                  style={{ scrollPaddingTop: '80px' }}
                >
                  {/* Top padding */}
                  <div className="h-[80px]" />
                  
                  {hoursInfinite.map((hour, index) => {
                    return (
                      <div
                        key={`hour-${index}`}
                        className="w-full h-[40px] flex items-center justify-center font-mono transition-all duration-200"
                      >
                        <span className={hour === selectedHour ? "text-purple-600" : "text-gray-400"} 
                              style={{
                                fontWeight: hour === selectedHour ? 600 : 400,
                                fontSize: hour === selectedHour ? '20px' : '16px',
                              }}>
                          {hour}
                        </span>
                      </div>
                    );
                  })}
                  
                  {/* Bottom padding */}
                  <div className="h-[80px]" />
                </div>
                
                {/* Gradient overlays */}
                <div className="absolute top-0 left-0 right-0 h-[80px] pointer-events-none z-20" 
                     style={{ background: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0) 100%)' }} />
                <div className="absolute bottom-0 left-0 right-0 h-[80px] pointer-events-none z-20" 
                     style={{ background: 'linear-gradient(0deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0) 100%)' }} />
              </div>

              {/* Minutes Column - INFINITE with CONTROLLED SCROLL SPEED */}
              <div className="flex-1 relative">
                <div 
                  ref={minutesRef}
                  onScroll={handleMinuteScroll}
                  onWheel={(e) => {
                    // Control scroll speed: each wheel tick = 1 item (40px)
                    e.preventDefault();
                    if (minutesRef.current && !isMinuteProgrammaticScroll.current) {
                      const delta = e.deltaY > 0 ? 40 : -40;
                      minutesRef.current.scrollTop += delta;
                    }
                  }}
                  className="h-[200px] overflow-y-scroll scrollbar-hide"
                  style={{ scrollPaddingTop: '80px' }}
                >
                  {/* Top padding */}
                  <div className="h-[80px]" />
                  
                  {minutesInfinite.map((minute, index) => {
                    return (
                      <div
                        key={`minute-${index}`}
                        className="w-full h-[40px] flex items-center justify-center font-mono transition-all duration-200"
                      >
                        <span className={minute === selectedMinute ? "text-purple-600" : "text-gray-400"}
                              style={{
                                fontWeight: minute === selectedMinute ? 600 : 400,
                                fontSize: minute === selectedMinute ? '20px' : '16px',
                              }}>
                          {minute}
                        </span>
                      </div>
                    );
                  })}
                  
                  {/* Bottom padding */}
                  <div className="h-[80px]" />
                </div>
                
                {/* Gradient overlays */}
                <div className="absolute top-0 left-0 right-0 h-[80px] pointer-events-none z-20" 
                     style={{ background: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0) 100%)' }} />
                <div className="absolute bottom-0 left-0 right-0 h-[80px] pointer-events-none z-20" 
                     style={{ background: 'linear-gradient(0deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0) 100%)' }} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-2.5 bg-white border-t border-gray-100 flex gap-2 rounded-b-2xl">
            <button
              onClick={handleNowClick}
              className="flex-1 px-2.5 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <Clock className="inline-block w-3 h-3 mr-1" />
              Maintenant
            </button>
            <button
              onClick={() => setOpen(false)}
              className="flex-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              OK
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
