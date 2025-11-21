'use client';

import { useState, useMemo } from 'react';
import { useProjects, useTasks } from '@/hooks/useStore';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  parseISO,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn, priorityColors } from '@/lib/utils';
import Modal from '@/components/Modal';
import TaskForm from '@/components/TaskForm';
import { Task } from '@/types';

export default function CalendarPage() {
  const { projects } = useProjects();
  const { tasks } = useTasks();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let day = startDate;
    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const weekDays = useMemo(() => {
    const startDate = startOfWeek(currentMonth, { weekStartsOn: 1 });
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(startDate, i));
    }
    return days;
  }, [currentMonth]);

  const getTasksForDate = (date: Date): Task[] => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      return isSameDay(parseISO(task.dueDate), date);
    });
  };

  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    return getTasksForDate(selectedDate);
  }, [selectedDate, tasks]);

  const today = new Date();

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAddTask = () => {
    setShowTaskForm(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendrier</h1>
          <p className="text-gray-500 mt-1">Visualisez vos échéances</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('month')}
              className={cn(
                'px-3 py-1.5 text-sm',
                viewMode === 'month' ? 'bg-primary-100 text-primary-600' : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              Mois
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={cn(
                'px-3 py-1.5 text-sm',
                viewMode === 'week' ? 'bg-primary-100 text-primary-600' : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              Semaine
            </button>
          </div>
          <button
            onClick={handleAddTask}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Ajouter une échéance</span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <button
              onClick={handlePrevMonth}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: fr })}
            </h2>
            <button
              onClick={handleNextMonth}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          {viewMode === 'month' ? (
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => {
                const dayTasks = getTasksForDate(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isToday = isSameDay(day, today);
                const isSelected = selectedDate && isSameDay(day, selectedDate);

                return (
                  <button
                    key={index}
                    onClick={() => handleDateClick(day)}
                    className={cn(
                      'calendar-day text-left transition-colors',
                      !isCurrentMonth && 'other-month',
                      isToday && 'today',
                      isSelected && 'ring-2 ring-primary-500 ring-inset'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex items-center justify-center w-7 h-7 rounded-full text-sm',
                        isToday && 'bg-primary-600 text-white',
                        !isToday && !isCurrentMonth && 'text-gray-400',
                        !isToday && isCurrentMonth && 'text-gray-900'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                    <div className="mt-1 space-y-1">
                      {dayTasks.slice(0, 2).map((task) => {
                        const project = projects.find((p) => p.id === task.projectId);
                        return (
                          <div
                            key={task.id}
                            className="calendar-event text-white"
                            style={{ backgroundColor: project?.color || '#3b82f6' }}
                          >
                            {task.title}
                          </div>
                        );
                      })}
                      {dayTasks.length > 2 && (
                        <div className="text-xs text-gray-500 pl-1">
                          +{dayTasks.length - 2} autre(s)
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {weekDays.map((day, index) => {
                const dayTasks = getTasksForDate(day);
                const isToday = isSameDay(day, today);
                const isSelected = selectedDate && isSameDay(day, selectedDate);

                return (
                  <button
                    key={index}
                    onClick={() => handleDateClick(day)}
                    className={cn(
                      'p-2 min-h-[200px] border border-gray-100 text-left transition-colors',
                      isToday && 'bg-primary-50',
                      isSelected && 'ring-2 ring-primary-500 ring-inset'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex items-center justify-center w-7 h-7 rounded-full text-sm',
                        isToday && 'bg-primary-600 text-white'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                    <div className="mt-2 space-y-1">
                      {dayTasks.map((task) => {
                        const project = projects.find((p) => p.id === task.projectId);
                        return (
                          <div
                            key={task.id}
                            className="text-xs p-1.5 rounded text-white"
                            style={{ backgroundColor: project?.color || '#3b82f6' }}
                          >
                            {task.title}
                          </div>
                        );
                      })}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Date Panel */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-gray-900">
                {selectedDate
                  ? format(selectedDate, 'EEEE d MMMM', { locale: fr })
                  : "Sélectionnez une date"}
              </h3>
            </div>
          </div>

          <div className="p-4">
            {!selectedDate ? (
              <p className="text-gray-500 text-center py-8">
                Cliquez sur une date pour voir les tâches
              </p>
            ) : selectedDateTasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Aucune tâche pour cette date</p>
                <button
                  onClick={handleAddTask}
                  className="mt-4 text-primary-600 hover:text-primary-700"
                >
                  Ajouter une tâche
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateTasks.map((task) => {
                  const project = projects.find((p) => p.id === task.projectId);
                  return (
                    <div
                      key={task.id}
                      className="p-3 rounded-lg border border-gray-200 hover:border-gray-300"
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className="w-3 h-3 rounded-full mt-1 shrink-0"
                          style={{ backgroundColor: project?.color || '#3b82f6' }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">
                            {task.title}
                          </h4>
                          <p className="text-sm text-gray-500 truncate">
                            {project?.name || 'Projet inconnu'}
                          </p>
                          <span
                            className={cn(
                              'inline-block mt-1 text-xs px-2 py-0.5 rounded-full border',
                              priorityColors[task.priority]
                            )}
                          >
                            {task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <button
                  onClick={handleAddTask}
                  className="w-full py-2 text-primary-600 hover:bg-primary-50 rounded-lg text-sm"
                >
                  + Ajouter une tâche
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Form Modal */}
      <Modal
        open={showTaskForm}
        onClose={() => setShowTaskForm(false)}
        title="Nouvelle tâche"
        size="lg"
      >
        <TaskForm
          onSuccess={() => setShowTaskForm(false)}
          onCancel={() => setShowTaskForm(false)}
        />
      </Modal>
    </div>
  );
}
