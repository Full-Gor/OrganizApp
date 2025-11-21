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

export function getDaysUntil(date: string | Date): number {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return differenceInDays(d, new Date());
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export const priorityColors = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200',
};

export const priorityLabels = {
  high: 'Haute',
  medium: 'Moyenne',
  low: 'Basse',
};

export const statusColors = {
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
};

export const statusLabels = {
  pending: 'En attente',
  in_progress: 'En cours',
  completed: 'Terminé',
};

export const projectStatusColors = {
  active: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  on_hold: 'bg-yellow-100 text-yellow-800',
};

export const projectStatusLabels = {
  active: 'Actif',
  completed: 'Terminé',
  on_hold: 'En pause',
};

export const projectColors = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];
