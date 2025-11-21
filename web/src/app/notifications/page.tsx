'use client';

import { useState, useMemo, useEffect } from 'react';
import { useNotifications, useTasks, useProjects } from '@/hooks/useStore';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Clock,
  AlertTriangle,
  Info,
  Plus,
} from 'lucide-react';
import { cn, formatDateTime, generateId } from '@/lib/utils';
import Modal from '@/components/Modal';
import { Notification } from '@/types';

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead, removeNotification, addNotification, loading } =
    useNotifications();
  const { tasks } = useTasks();
  const { projects } = useProjects();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [showForm, setShowForm] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'reminder' as 'reminder' | 'deadline' | 'info',
    scheduledFor: '',
  });

  // Generate deadline notifications automatically
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    tasks.forEach((task) => {
      if (task.dueDate && task.status !== 'completed') {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Check if notification already exists for this task
        const existingNotification = notifications.find(
          (n) => n.relatedId === task.id && n.type === 'deadline'
        );

        if (!existingNotification && diffDays <= 1 && diffDays >= 0) {
          const project = projects.find((p) => p.id === task.projectId);
          addNotification({
            id: generateId(),
            title: diffDays === 0 ? 'Échéance aujourd\'hui' : 'Échéance demain',
            message: `La tâche "${task.title}" ${project ? `(${project.name})` : ''} ${
              diffDays === 0 ? 'arrive à échéance aujourd\'hui' : 'arrive à échéance demain'
            }.`,
            type: 'deadline',
            read: false,
            relatedId: task.id,
            relatedType: 'task',
            scheduledFor: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          });
        }
      }
    });
  }, [tasks, projects, notifications, addNotification]);

  const filteredNotifications = useMemo(() => {
    return notifications
      .filter((n) => filter === 'all' || !n.read)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notifications, filter]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleCreateNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotification.title.trim()) return;

    addNotification({
      id: generateId(),
      title: newNotification.title.trim(),
      message: newNotification.message.trim(),
      type: newNotification.type,
      read: false,
      relatedId: null,
      relatedType: null,
      scheduledFor: newNotification.scheduledFor || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    setNewNotification({
      title: '',
      message: '',
      type: 'reminder',
      scheduledFor: '',
    });
    setShowForm(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'deadline':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'reminder':
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} non lue(s)` : 'Aucune notification non lue'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <CheckCheck className="w-5 h-5" />
              Tout marquer lu
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-5 h-5" />
            Créer un rappel
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            filter === 'all'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          Toutes ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            filter === 'unread'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          Non lues ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <BellOff className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="text-gray-500 mt-4">
            {filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                'p-4 flex items-start gap-4 transition-colors',
                !notification.read && 'bg-primary-50'
              )}
            >
              <div className="shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3
                      className={cn(
                        'font-medium',
                        notification.read ? 'text-gray-700' : 'text-gray-900'
                      )}
                    >
                      {notification.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDateTime(notification.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                        title="Marquer comme lu"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Notification Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Créer un rappel"
        size="md"
      >
        <form onSubmit={handleCreateNotification} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre *
            </label>
            <input
              type="text"
              value={newNotification.title}
              onChange={(e) =>
                setNewNotification({ ...newNotification, title: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Titre du rappel"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              value={newNotification.message}
              onChange={(e) =>
                setNewNotification({ ...newNotification, message: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Description du rappel..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={newNotification.type}
              onChange={(e) =>
                setNewNotification({
                  ...newNotification,
                  type: e.target.value as 'reminder' | 'deadline' | 'info',
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="reminder">Rappel</option>
              <option value="deadline">Échéance</option>
              <option value="info">Information</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date et heure (optionnel)
            </label>
            <input
              type="datetime-local"
              value={newNotification.scheduledFor}
              onChange={(e) =>
                setNewNotification({ ...newNotification, scheduledFor: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Créer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
