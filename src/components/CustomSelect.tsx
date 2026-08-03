import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface OptionItem {
  value: string;
  label: string;
  badgeColor?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: OptionItem[];
  className?: string;
  placeholder?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  className = '',
  placeholder = 'Pilih...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="clay-input w-full flex items-center justify-between gap-2 px-3 py-2 font-mono text-xs font-bold uppercase bg-[var(--color-clay-surface)] text-[var(--color-clay-dark)] cursor-pointer hover:brightness-95 active:scale-[0.98] transition-all select-none shadow-sm"
      >
        <span className="text-left leading-tight py-0.5 break-words">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-max min-w-full max-w-[90vw] md:max-w-lg rounded-2xl bg-[var(--color-clay-surface)] clay-card overflow-hidden p-2 select-none border border-black/5 flex flex-col gap-1 shadow-lg">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs font-mono font-bold uppercase flex items-center justify-between gap-2 rounded-xl transition-all cursor-pointer ${
                  isSelected
                    ? 'clay-btn-dark !bg-amber-500 !text-black font-extrabold scale-[1.02]'
                    : 'hover:bg-black/5 text-zinc-800 active:scale-95'
                }`}
              >
                <span className="whitespace-normal md:whitespace-nowrap text-left leading-tight">{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
