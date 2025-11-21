'use client';

import { useState, useEffect, useCallback } from 'react';
import { Project, Task, WatchItem, Notification } from '@/types';
import * as storage from '@/lib/storage';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setProjects(storage.getProjects());
    setLoading(false);
  }, []);

  const refresh = useCallback(() => {
    setProjects(storage.getProjects());
  }, []);

  const addProject = useCallback((project: Project) => {
    storage.saveProject(project);
    refresh();
  }, [refresh]);

  const updateProject = useCallback((project: Project) => {
    storage.saveProject(project);
    refresh();
  }, [refresh]);

  const removeProject = useCallback((projectId: string) => {
    storage.deleteProject(projectId);
    refresh();
  }, [refresh]);

  return { projects, loading, addProject, updateProject, removeProject, refresh };
}

export function useTasks(projectId?: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      setTasks(storage.getTasksByProject(projectId));
    } else {
      setTasks(storage.getTasks());
    }
    setLoading(false);
  }, [projectId]);

  const refresh = useCallback(() => {
    if (projectId) {
      setTasks(storage.getTasksByProject(projectId));
    } else {
      setTasks(storage.getTasks());
    }
  }, [projectId]);

  const addTask = useCallback((task: Task) => {
    storage.saveTask(task);
    refresh();
  }, [refresh]);

  const updateTask = useCallback((task: Task) => {
    storage.saveTask(task);
    refresh();
  }, [refresh]);

  const removeTask = useCallback((taskId: string) => {
    storage.deleteTask(taskId);
    refresh();
  }, [refresh]);

  return { tasks, loading, addTask, updateTask, removeTask, refresh };
}

export function useWatchItems() {
  const [watchItems, setWatchItems] = useState<WatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setWatchItems(storage.getWatchItems());
    setLoading(false);
  }, []);

  const refresh = useCallback(() => {
    setWatchItems(storage.getWatchItems());
  }, []);

  const addWatchItem = useCallback((item: WatchItem) => {
    storage.saveWatchItem(item);
    refresh();
  }, [refresh]);

  const updateWatchItem = useCallback((item: WatchItem) => {
    storage.saveWatchItem(item);
    refresh();
  }, [refresh]);

  const removeWatchItem = useCallback((itemId: string) => {
    storage.deleteWatchItem(itemId);
    refresh();
  }, [refresh]);

  return { watchItems, loading, addWatchItem, updateWatchItem, removeWatchItem, refresh };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setNotifications(storage.getNotifications());
    setLoading(false);
  }, []);

  const refresh = useCallback(() => {
    setNotifications(storage.getNotifications());
  }, []);

  const addNotification = useCallback((notification: Notification) => {
    storage.saveNotification(notification);
    refresh();
  }, [refresh]);

  const removeNotification = useCallback((notificationId: string) => {
    storage.deleteNotification(notificationId);
    refresh();
  }, [refresh]);

  const markAsRead = useCallback((notificationId: string) => {
    storage.markNotificationAsRead(notificationId);
    refresh();
  }, [refresh]);

  const markAllAsRead = useCallback(() => {
    storage.markAllNotificationsAsRead();
    refresh();
  }, [refresh]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    loading,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    unreadCount,
    refresh,
  };
}
