import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, RotateCcw, Check } from 'lucide-react';

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAYS_OF_WEEK = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  className = '',
  placeholder = 'PILIH TANGGAL'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const initialDate = value ? new Date(value + 'T00:00:00') : new Date();
  const [currentYear, setCurrentYear] = useState<number>(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(initialDate.getMonth());

  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        setCurrentYear(d.getFullYear());
        setCurrentMonth(d.getMonth());
      }
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper to format display date in Indonesian
  const formatDisplayDate = (val: string) => {
    if (!val) return placeholder;
    const parts = val.split('-');
    if (parts.length !== 3) return val;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return val;
    return `${day} ${INDONESIAN_MONTHS[month]} ${year}`;
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    onChange(`${currentYear}-${formattedMonth}-${formattedDay}`);
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setIsOpen(false);
  };

  const handleReset = () => {
    onChange('');
    setIsOpen(false);
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  // Generate day cells
  const dayCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    dayCells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    dayCells.push(day);
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="clay-input w-full flex items-center justify-between gap-2 px-3 py-2 font-mono text-xs font-bold uppercase bg-[var(--color-clay-surface)] text-[var(--color-clay-dark)] cursor-pointer hover:brightness-95 active:scale-[0.98] transition-all select-none shadow-sm"
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="truncate">{formatDisplayDate(value)}</span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-72 rounded-3xl bg-[var(--color-clay-surface)] clay-card overflow-hidden p-4 select-none border border-black/5">
          {/* Header Month / Year Navigation */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-black/10">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="clay-btn p-1.5 rounded-xl hover:scale-105 active:scale-95 text-zinc-800 transition-all cursor-pointer"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4 stroke-[3]" />
            </button>
            <div className="font-mono font-black text-xs uppercase tracking-wider text-zinc-900">
              {INDONESIAN_MONTHS[currentMonth]} {currentYear}
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="clay-btn p-1.5 rounded-xl hover:scale-105 active:scale-95 text-zinc-800 transition-all cursor-pointer"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAYS_OF_WEEK.map((dayName, idx) => (
              <div
                key={dayName}
                className={`text-[9px] font-black tracking-tighter ${
                  idx === 0 ? 'text-red-600' : 'text-zinc-500'
                }`}
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {dayCells.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-8" />;
              }
              const formattedDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = value === formattedDateStr;
              const isToday = todayStr === formattedDateStr;

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 rounded-xl font-mono text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'clay-btn-dark !bg-amber-500 !text-black font-extrabold scale-105'
                      : isToday
                      ? 'clay-btn-dark font-extrabold'
                      : 'clay-btn hover:scale-105 active:scale-95 text-zinc-800'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Today & Reset buttons footer */}
          <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-black/10">
            <button
              type="button"
              onClick={handleToday}
              className="clay-btn flex-1 py-2 px-3 !bg-amber-400 hover:!bg-amber-500 active:scale-95 text-black font-black text-[10px] uppercase rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              Hari Ini
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
