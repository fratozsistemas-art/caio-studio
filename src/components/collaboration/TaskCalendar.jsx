import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlowCard from '@/components/ui/GlowCard';

const priorityColors = {
  low: 'bg-blue-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500'
};

export default function TaskCalendar({ tasks }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getTasksForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks?.filter(task => task.due_date?.startsWith(dateStr)) || [];
  };

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <GlowCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-[#C7A763]" />
          Calendário de Tarefas
        </h3>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={previousMonth}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-white font-semibold min-w-[150px] text-center">
            {monthNames[month]} {year}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={nextMonth}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {dayNames.map(day => (
          <div key={day} className="text-center text-xs font-semibold text-slate-400 py-2">
            {day}
          </div>
        ))}

        {/* Empty cells for days before month starts */}
        {Array.from({ length: startingDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Calendar days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayTasks = getTasksForDay(day);
          const isToday = new Date().getDate() === day && 
                         new Date().getMonth() === month && 
                         new Date().getFullYear() === year;

          return (
            <motion.div
              key={day}
              whileHover={{ scale: 1.05 }}
              className={`aspect-square rounded-lg border p-1 relative group cursor-pointer ${
                isToday 
                  ? 'border-[#C7A763] bg-[#C7A763]/10' 
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="text-xs font-semibold text-white mb-1">{day}</div>
              
              {dayTasks.length > 0 && (
                <div className="space-y-1">
                  {dayTasks.slice(0, 2).map((task, idx) => (
                    <div
                      key={idx}
                      className={`h-1 rounded-full ${priorityColors[task.priority]}`}
                      title={task.title}
                    />
                  ))}
                  {dayTasks.length > 2 && (
                    <div className="text-[10px] text-slate-400 text-center">
                      +{dayTasks.length - 2}
                    </div>
                  )}
                </div>
              )}

              {/* Hover tooltip */}
              {dayTasks.length > 0 && (
                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10 w-48">
                  <div className="bg-[#0a1628] border border-white/20 rounded-lg p-2 shadow-xl">
                    {dayTasks.map((task, idx) => (
                      <div key={idx} className="text-xs text-white mb-1 last:mb-0">
                        • {task.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10">
        <span className="text-xs text-slate-400">Legenda:</span>
        {Object.entries(priorityColors).map(([priority, color]) => (
          <div key={priority} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded ${color}`} />
            <span className="text-xs text-slate-400 capitalize">{priority}</span>
          </div>
        ))}
      </div>
    </GlowCard>
  );
}