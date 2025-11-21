import { format, isToday, isTomorrow, isPast, differenceInDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMM yyyy', { locale: fr });
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd/MM', { locale: fr });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, "dd MMM yyyy 'à' HH:mm", { locale: fr });
}

export function getRelativeDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;

  if (isToday(d)) return "Aujourd'hui";
  if (isTomorrow(d)) return 'Demain';

  const days = differenceInDays(d, new Date());

  if (days < 0) return `En retard de ${Math.abs(days)} jour${Math.abs(days) > 1 ? 's' : ''}`;
  if (days <= 7) return `Dans ${days} jour${days > 1 ? 's' : ''}`;

  return formatDate(d);
}

export function isOverdue(date: string | Date): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isPast(d) && !isToday(d);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export const priorityColors = {
  high: { bg: '#fee2e2', text: '#dc2626', border: '#fecaca' },
  medium: { bg: '#fef3c7', text: '#d97706', border: '#fde68a' },
  low: { bg: '#dcfce7', text: '#16a34a', border: '#bbf7d0' },
};

export const priorityLabels = {
  high: 'Haute',
  medium: 'Moyenne',
  low: 'Basse',
};

export const statusColors = {
  pending: { bg: '#f3f4f6', text: '#4b5563' },
  in_progress: { bg: '#dbeafe', text: '#2563eb' },
  completed: { bg: '#dcfce7', text: '#16a34a' },
};

export const statusLabels = {
  pending: 'En attente',
  in_progress: 'En cours',
  completed: 'Terminé',
};

export const projectStatusColors = {
  active: { bg: '#dbeafe', text: '#2563eb' },
  completed: { bg: '#dcfce7', text: '#16a34a' },
  on_hold: { bg: '#fef3c7', text: '#d97706' },
};

export const projectStatusLabels = {
  active: 'Actif',
  completed: 'Terminé',
  on_hold: 'En pause',
};

export const projectColors = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];

export const colors = {
  primary: '#3b82f6',
  primaryDark: '#2563eb',
  background: '#f9fafb',
  white: '#ffffff',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  red: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
  },
  green: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
  },
  yellow: {
    50: '#fefce8',
    500: '#eab308',
  },
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
  },
};
