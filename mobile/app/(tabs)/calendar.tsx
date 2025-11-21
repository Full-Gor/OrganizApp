import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProjects, useTasks } from '@/hooks/useStore';
import {
  colors,
  priorityColors,
  formatDate,
} from '@/lib/utils';
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
import { Task } from '@/types';

export default function CalendarScreen() {
  const router = useRouter();
  const { projects } = useProjects();
  const { tasks, loading } = useTasks();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Calendrier</Text>
      </View>

      {/* Calendar Navigation */}
      <View style={styles.calendarHeader}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <Ionicons name="chevron-back" size={24} color={colors.gray[600]} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {format(currentMonth, 'MMMM yyyy', { locale: fr })}
        </Text>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <Ionicons name="chevron-forward" size={24} color={colors.gray[600]} />
        </TouchableOpacity>
      </View>

      {/* Weekday Headers */}
      <View style={styles.weekdayRow}>
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
          <Text key={day} style={styles.weekdayText}>{day}</Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {calendarDays.map((day, index) => {
          const dayTasks = getTasksForDate(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, today);
          const isSelected = selectedDate && isSameDay(day, selectedDate);

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                isSelected && styles.dayCellSelected,
                isToday && styles.dayCellToday,
              ]}
              onPress={() => setSelectedDate(day)}
            >
              <Text
                style={[
                  styles.dayText,
                  !isCurrentMonth && styles.dayTextOther,
                  isToday && styles.dayTextToday,
                  isSelected && styles.dayTextSelected,
                ]}
              >
                {format(day, 'd')}
              </Text>
              {dayTasks.length > 0 && (
                <View style={styles.dotContainer}>
                  {dayTasks.slice(0, 3).map((task, i) => {
                    const project = projects.find((p) => p.id === task.projectId);
                    return (
                      <View
                        key={i}
                        style={[styles.dot, { backgroundColor: project?.color || colors.primary }]}
                      />
                    );
                  })}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected Date Tasks */}
      <View style={styles.tasksSection}>
        <Text style={styles.tasksTitle}>
          {selectedDate
            ? format(selectedDate, 'EEEE d MMMM', { locale: fr })
            : 'Sélectionnez une date'}
        </Text>

        <ScrollView style={styles.tasksList} showsVerticalScrollIndicator={false}>
          {!selectedDate ? (
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={36} color={colors.gray[300]} />
              <Text style={styles.emptyText}>Sélectionnez une date</Text>
            </View>
          ) : selectedDateTasks.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Aucune tâche pour cette date</Text>
            </View>
          ) : (
            selectedDateTasks.map((task) => {
              const project = projects.find((p) => p.id === task.projectId);
              return (
                <TouchableOpacity
                  key={task.id}
                  style={styles.taskCard}
                  onPress={() => router.push(`/project/${task.projectId}`)}
                >
                  <View
                    style={[styles.taskDot, { backgroundColor: project?.color || colors.primary }]}
                  />
                  <View style={styles.taskContent}>
                    <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
                    <Text style={styles.taskProject} numberOfLines={1}>
                      {project?.name || 'Projet inconnu'}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: priorityColors[task.priority].bg }]}>
                    <Text style={[styles.badgeText, { color: priorityColors[task.priority].text }]}>
                      {task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.white,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  navButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
    textTransform: 'capitalize',
  },
  weekdayRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: colors.gray[500],
    paddingVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  dayCellToday: {
    backgroundColor: colors.blue[50],
    borderRadius: 8,
  },
  dayText: {
    fontSize: 14,
    color: colors.gray[900],
    fontWeight: '500',
  },
  dayTextOther: {
    color: colors.gray[300],
  },
  dayTextToday: {
    color: colors.primary,
    fontWeight: '700',
  },
  dayTextSelected: {
    color: colors.white,
    fontWeight: '700',
  },
  dotContainer: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  tasksSection: {
    flex: 1,
    padding: 16,
  },
  tasksTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  tasksList: {
    flex: 1,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  emptyText: {
    color: colors.gray[500],
    marginTop: 8,
  },
  taskCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  taskDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[900],
  },
  taskProject: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
});
