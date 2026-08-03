import React, { useState, useRef, useEffect } from 'react';
import { Clock, Check, RotateCcw } from 'lucide-react';

interface CustomTimePickerProps {
  value: string; // "HH:MM"
  onChange: (value: string) => void;
  placeholder?: string;
}

export const CustomTimePicker: React.FC<CustomTimePickerProps> = ({
  value,
  onChange,
  placeholder = 'PILIH JAM'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLDivElement>(null);

  // Time States
  const [mode, setMode] = useState<'hours' | 'minutes'>('hours'); // Toggle selecting hour vs minute
  const [selectedHour, setSelectedHour] = useState<number>(8); // 1 to 12
  const [selectedMinute, setSelectedMinute] = useState<number>(0); // 0 to 59
  const [isPm, setIsPm] = useState<boolean>(false); // AM/PM

  // Load initial value
  useEffect(() => {
    if (value && value.includes(':')) {
      const [hStr, mStr] = value.split(':');
      const hour24 = parseInt(hStr, 10);
      const minute = parseInt(mStr, 10);
      
      if (!isNaN(hour24) && !isNaN(minute)) {
        setSelectedMinute(minute);
        if (hour24 === 0) {
          setSelectedHour(12);
          setIsPm(false);
        } else if (hour24 === 12) {
          setSelectedHour(12);
          setIsPm(true);
        } else if (hour24 > 12) {
          setSelectedHour(hour24 - 12);
          setIsPm(true);
        } else {
          setSelectedHour(hour24);
          setIsPm(false);
        }
      }
    }
  }, [value, isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format active time back to 24h string
  const get24HourString = (hour12: number, minute: number, pm: boolean): string => {
    let hour24 = hour12;
    if (pm) {
      if (hour12 !== 12) hour24 += 12;
    } else {
      if (hour12 === 12) hour24 = 0;
    }
    return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  };

  // Convert click coordinates to clock selection
  const handleClockInteraction = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!clockRef.current) return;

    const rect = clockRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const dx = clientX - centerX;
    const dy = clientY - centerY;

    // Angle in degrees from 12 o'clock (top) clockwise
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    if (mode === 'hours') {
      // 12 hours = 30 degrees each
      let hour = Math.round(angle / 30);
      if (hour === 0) hour = 12;
      if (hour > 12) hour = 12;
      setSelectedHour(hour);
      // Update value immediately
      onChange(get24HourString(hour, selectedMinute, isPm));
    } else {
      // 60 minutes = 6 degrees each
      let minute = Math.round(angle / 6);
      if (minute === 60) minute = 0;
      if (minute > 59) minute = 59;
      setSelectedMinute(minute);
      // Update value immediately
      onChange(get24HourString(selectedHour, minute, isPm));
    }
  };

  const handleMouseDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons === 1) { // Left click held down
      handleClockInteraction(e);
    }
  };

  const handleTouchDrag = (e: React.TouchEvent<HTMLDivElement>) => {
    handleClockInteraction(e);
  };

  const toggleAmPm = (pm: boolean) => {
    setIsPm(pm);
    onChange(get24HourString(selectedHour, selectedMinute, pm));
  };

  // Switch mode to minutes automatically after selection
  const handleMouseUp = () => {
    if (mode === 'hours') {
      // Give a tiny delayed feedback then switch to minutes
      setTimeout(() => {
        setMode('minutes');
      }, 300);
    }
  };

  const handleApply = () => {
    setIsOpen(false);
  };

  const handleReset = () => {
    setSelectedHour(8);
    setSelectedMinute(0);
    setIsPm(false);
    onChange('');
    setIsOpen(false);
  };

  // Generate coordinates for outer clock numbers (R = 72px for positioning)
  const getRadialStyle = (index: number) => {
    const angle = (index * 30 - 90) * (Math.PI / 180);
    const radius = 68; // px from center
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return {
      transform: `translate(${x}px, ${y}px)`
    };
  };

  // Clock Hand angle calculation
  const handAngle = mode === 'hours' 
    ? (selectedHour * 30) 
    : (selectedMinute * 6);

  return (
    <div ref={containerRef} className="relative select-none">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setMode('hours'); // Default to choosing hours when opened
        }}
        className="clay-input w-full flex items-center justify-between gap-2 px-4 py-2.5 font-mono text-sm font-black tracking-wider uppercase bg-[var(--color-clay-surface)] text-[var(--color-clay-dark)] cursor-pointer hover:brightness-95 active:scale-[0.98] transition-all select-none shadow-sm"
      >
        <div className="flex items-center gap-2 truncate">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{value ? value : placeholder}</span>
        </div>
      </button>

      {/* Radial Clock Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-72 rounded-[2.5rem] bg-[var(--color-clay-surface)] clay-card overflow-hidden p-5 select-none border border-black/5 shadow-xl left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0">
          
          {/* Active Time Header Indicator */}
          <div className="flex items-center justify-center gap-2 mb-4 bg-black/[0.03] p-3 rounded-2xl shadow-inner border border-black/5">
            <div className="flex items-baseline font-mono text-3xl font-black">
              {/* Hours Touch Selector */}
              <button
                type="button"
                onClick={() => setMode('hours')}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                  mode === 'hours' 
                    ? 'text-amber-600 bg-amber-500/10' 
                    : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                {String(selectedHour).padStart(2, '0')}
              </button>
              <span className="text-zinc-400 animate-pulse mx-0.5">:</span>
              {/* Minutes Touch Selector */}
              <button
                type="button"
                onClick={() => setMode('minutes')}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                  mode === 'minutes' 
                    ? 'text-amber-600 bg-amber-500/10' 
                    : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                {String(selectedMinute).padStart(2, '0')}
              </button>
            </div>

            {/* AM/PM Switcher */}
            <div className="flex flex-col gap-1 shrink-0 ml-3 border-l border-black/10 pl-3">
              <button
                type="button"
                onClick={() => toggleAmPm(false)}
                className={`text-[9px] font-extrabold px-2 py-1 rounded-lg transition-all cursor-pointer uppercase ${
                  !isPm 
                    ? 'clay-btn-dark !bg-amber-500 !text-black' 
                    : 'text-zinc-500 hover:bg-black/5'
                }`}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => toggleAmPm(true)}
                className={`text-[9px] font-extrabold px-2 py-1 rounded-lg transition-all cursor-pointer uppercase ${
                  isPm 
                    ? 'clay-btn-dark !bg-amber-500 !text-black' 
                    : 'text-zinc-500 hover:bg-black/5'
                }`}
              >
                PM
              </button>
            </div>
          </div>

          {/* Clock Dial container */}
          <div className="relative flex flex-col items-center justify-center pb-4">
            <div 
              ref={clockRef}
              onMouseDown={handleClockInteraction}
              onMouseMove={handleMouseDrag}
              onMouseUp={handleMouseUp}
              onTouchStart={handleClockInteraction}
              onTouchMove={handleTouchDrag}
              onTouchEnd={handleMouseUp}
              className="relative w-48 h-48 rounded-full bg-[var(--color-clay-surface)] shadow-[inset_2px_2px_8px_rgba(0,0,0,0.08),inset_-2px_-2px_8px_rgba(255,255,255,0.7),4px_4px_16px_rgba(0,0,0,0.06)] border border-black/5 flex items-center justify-center cursor-pointer select-none touch-none"
            >
              {/* Clock Center Hub */}
              <div className="absolute w-3.5 h-3.5 rounded-full bg-amber-500 border border-black/10 shadow-md z-20" />

              {/* Clock Hand needle */}
              <div 
                className="absolute origin-bottom bottom-1/2 left-1/2 w-[3px] bg-amber-500/80 transition-transform duration-100 ease-out z-10"
                style={{
                  height: '62px',
                  transform: `translateX(-50%) rotate(${handAngle}deg)`
                }}
              >
                {/* Needle Pinhead */}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4.5 h-4.5 rounded-full bg-amber-500 shadow-md border border-black/10 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-black" />
                </div>
              </div>

              {/* Radially Arranged Numbers */}
              {mode === 'hours' ? (
                // Render Hours (1 to 12)
                Array.from({ length: 12 }, (_, i) => {
                  const hour = i === 0 ? 12 : i;
                  const isActive = selectedHour === hour;
                  return (
                    <div
                      key={`hour-num-${hour}`}
                      className={`absolute w-7 h-7 flex items-center justify-center text-xs font-mono font-black rounded-full pointer-events-none transition-all ${
                        isActive 
                          ? 'text-amber-700 font-extrabold scale-125' 
                          : 'text-zinc-500'
                      }`}
                      style={getRadialStyle(i === 0 ? 12 : i)}
                    >
                      {hour}
                    </div>
                  );
                })
              ) : (
                // Render Minutes (00, 05, 10, ..., 55)
                Array.from({ length: 12 }, (_, i) => {
                  const minute = i * 5;
                  const minuteStr = String(minute).padStart(2, '0');
                  const isActive = Math.round(selectedMinute / 5) * 5 === minute;
                  return (
                    <div
                      key={`minute-num-${minute}`}
                      className={`absolute w-7 h-7 flex items-center justify-center text-[10px] font-mono font-black rounded-full pointer-events-none transition-all ${
                        isActive 
                          ? 'text-amber-700 font-extrabold scale-125' 
                          : 'text-zinc-400'
                      }`}
                      style={getRadialStyle(i === 0 ? 12 : i)}
                    >
                      {minuteStr}
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Guidance Badge */}
            <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-3 text-center">
              {mode === 'hours' ? 'Sentuh / Geser JARUM JAM' : 'Sentuh / Geser JARUM MENIT'}
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-black/10">
            <button
              type="button"
              onClick={handleApply}
              className="clay-btn flex-1 py-2 px-3 !bg-amber-400 hover:!bg-amber-500 active:scale-95 text-black font-black text-[10px] uppercase rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              Selesai
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="clay-btn flex-1 py-2 px-3 active:scale-95 text-zinc-800 font-black text-[10px] uppercase rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
