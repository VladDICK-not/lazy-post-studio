'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';

interface DateTimePickerProps {
  value: string; // ISO or 'YYYY-MM-DDTHH:mm'
  onChange: (val: string) => void;
  onQuickPreset: (minutes: number, hour?: number) => void;
}

const MONTHS_RU = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

const DAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export function DateTimePicker({ value, onChange, onQuickPreset }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current selected date
  const selectedDate = value ? new Date(value) : new Date();
  const validDate = isNaN(selectedDate.getTime()) ? new Date() : selectedDate;

  // Calendar navigation state
  const [viewYear, setViewYear] = useState(validDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(validDate.getMonth());

  // Local time state
  const [hours, setHours] = useState(
    validDate.getHours().toString().padStart(2, '0')
  );
  const [minutes, setMinutes] = useState(
    validDate.getMinutes().toString().padStart(2, '0')
  );

  useEffect(() => {
    const d = value ? new Date(value) : new Date();
    const vDate = isNaN(d.getTime()) ? new Date() : d;
    setViewYear(vDate.getFullYear());
    setViewMonth(vDate.getMonth());
    setHours(vDate.getHours().toString().padStart(2, '0'));
    setMinutes(vDate.getMinutes().toString().padStart(2, '0'));
  }, [value]);

  // Close popup on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Navigate months
  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfWeek = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Mon=0 ... Sun=6
  };

  const daysInCurrentMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  const handleSelectDay = (day: number) => {
    const newDate = new Date(viewYear, viewMonth, day, parseInt(hours, 10), parseInt(minutes, 10));
    const formatted = new Date(newDate.getTime() - newDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    onChange(formatted);
  };

  const handleTimeChange = (newHours: string, newMins: string) => {
    setHours(newHours);
    setMinutes(newMins);
    const h = parseInt(newHours, 10) || 0;
    const m = parseInt(newMins, 10) || 0;
    const newDate = new Date(validDate);
    newDate.setHours(h);
    newDate.setMinutes(m);
    const formatted = new Date(newDate.getTime() - newDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    onChange(formatted);
  };

  // Friendly human format
  const formatDisplay = () => {
    try {
      const day = validDate.getDate();
      const monthName = MONTHS_RU[validDate.getMonth()].toLowerCase();
      const year = validDate.getFullYear();
      const timeStr = `${hours}:${minutes}`;
      return `${day} ${monthName} ${year}, ${timeStr}`;
    } catch {
      return value;
    }
  };

  const today = new Date();
  const isToday = (day: number) =>
    today.getDate() === day &&
    today.getMonth() === viewMonth &&
    today.getFullYear() === viewYear;

  const isSelected = (day: number) =>
    validDate.getDate() === day &&
    validDate.getMonth() === viewMonth &&
    validDate.getFullYear() === viewYear;

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-zinc-50 hover:bg-zinc-100/90 dark:bg-[#1c1d23] dark:hover:bg-[#25262e] border border-zinc-200 dark:border-[#33353e] text-zinc-800 dark:text-zinc-100 transition-all shadow-2xs group text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500/20"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 flex items-center justify-center shrink-0">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
              Запланировано на
            </p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white font-mono tracking-tight">
              {formatDisplay()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200">
          <span className="text-[11px] font-medium hidden sm:inline">Изменить дату</span>
          <Clock className="w-4 h-4" />
        </div>
      </button>

      {/* Quick Presets */}
      <div className="flex flex-wrap gap-2 mt-2.5">
        <button
          type="button"
          onClick={() => onQuickPreset(30)}
          className="text-xs px-3 py-1.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-[#1c1d23] dark:hover:bg-[#25262e] border border-zinc-200 dark:border-[#33353e] text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-all shadow-2xs font-medium cursor-pointer"
        >
          +30 мин
        </button>
        <button
          type="button"
          onClick={() => onQuickPreset(60)}
          className="text-xs px-3 py-1.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-[#1c1d23] dark:hover:bg-[#25262e] border border-zinc-200 dark:border-[#33353e] text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-all shadow-2xs font-medium cursor-pointer"
        >
          +1 час
        </button>
        <button
          type="button"
          onClick={() => onQuickPreset(180)}
          className="text-xs px-3 py-1.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-[#1c1d23] dark:hover:bg-[#25262e] border border-zinc-200 dark:border-[#33353e] text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-all shadow-2xs font-medium cursor-pointer"
        >
          +3 часа
        </button>
        <button
          type="button"
          onClick={() => onQuickPreset(0, 10)}
          className="text-xs px-3 py-1.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-[#1c1d23] dark:hover:bg-[#25262e] border border-zinc-200 dark:border-[#33353e] text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-all shadow-2xs font-medium cursor-pointer"
        >
          Завтра в 10:00
        </button>
      </div>

      {/* Floating Interactive Popover (Opens UPWARDS above the field to stay inside page bounds) */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-3 z-50 w-full sm:w-80 rounded-3xl border border-zinc-200 dark:border-[#33353e] bg-white dark:bg-[#22232a] p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-150">
          {/* Month Header Navigation */}
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-sm font-bold text-zinc-900 dark:text-white">
              {MONTHS_RU[viewMonth]} {viewYear}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-[#2c2d36] text-zinc-500 dark:text-zinc-400 transition-colors cursor-pointer"
                title="Предыдущий месяц"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-[#2c2d36] text-zinc-500 dark:text-zinc-400 transition-colors cursor-pointer"
                title="Следующий месяц"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAYS_RU.map((day) => (
              <span
                key={day}
                className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 py-1"
              >
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center mb-4">
            {/* Blank offset days */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`blank-${i}`} className="h-8" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
              const day = i + 1;
              const selected = isSelected(day);
              const isCurrentDay = isToday(day);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 rounded-xl text-xs font-medium transition-all relative flex items-center justify-center cursor-pointer ${
                    selected
                      ? 'bg-sky-500 text-white font-bold shadow-md shadow-sky-500/30'
                      : isCurrentDay
                      ? 'bg-sky-500/10 text-sky-600 font-bold dark:bg-sky-500/20 dark:text-sky-400'
                      : 'hover:bg-zinc-100 dark:hover:bg-[#2c2d36] text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {day}
                  {isCurrentDay && !selected && (
                    <span className="w-1 h-1 rounded-full bg-sky-500 absolute bottom-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Time Picker Controls */}
          <div className="pt-3 border-t border-zinc-100 dark:border-[#33353e]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-500" /> Время публикации
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={hours}
                  onChange={(e) => {
                    const val = e.target.value.padStart(2, '0').slice(-2);
                    handleTimeChange(val, minutes);
                  }}
                  className="w-12 text-center py-1 rounded-lg bg-zinc-100 dark:bg-[#1c1d23] border border-zinc-200 dark:border-[#33353e] font-mono text-xs font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                <span className="font-bold text-zinc-400">:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => {
                    const val = e.target.value.padStart(2, '0').slice(-2);
                    handleTimeChange(hours, val);
                  }}
                  className="w-12 text-center py-1 rounded-lg bg-zinc-100 dark:bg-[#1c1d23] border border-zinc-200 dark:border-[#33353e] font-mono text-xs font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Quick Minute Chips */}
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {['00', '15', '30', '45'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleTimeChange(hours, m)}
                  className={`py-1 text-[11px] rounded-lg border font-mono transition-colors cursor-pointer ${
                    minutes === m
                      ? 'bg-sky-500/10 border-sky-500/40 text-sky-600 font-bold dark:bg-sky-500/20 dark:text-sky-400'
                      : 'border-zinc-200 dark:border-[#33353e] text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#2c2d36]'
                  }`}
                >
                  :{m}
                </button>
              ))}
            </div>

            {/* Done Button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold shadow-md active:scale-[0.99] transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Применить дату</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
