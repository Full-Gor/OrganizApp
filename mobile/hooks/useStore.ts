import { useState, useEffect, useCallback } from 'react';
import { Project, Task, WatchItem, Notification } from '@/types';
import * as storage from '@/lib/storage';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    const data = await storage.getProjects();
    setProjects(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const addProject = useCallback(async (project: Project) => {
    await storage.saveProject(project);
    await loadProjects();
  }, [loadProjects]);

  const updateProject = useCallback(async (project: Project) => {
    await storage.saveProject(project);
    await loadProjects();
  }, [loadProjects]);

  const removeProject = useCallback(async (projectId: string) => {
    await storage.deleteProject(projectId);
    await loadProjects();
  }, [loadProjects]);

  return { projects, loading, addProject, updateProject, removeProject, refresh: loadProjects };
}

export function useTasks(projectId?: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    let data: Task[];
    if (projectId) {
      data = await storage.getTasksByProject(projectId);
    } else {
      data = await storage.getTasks();
    }
    setTasks(data);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const addTask = useCallback(async (task: Task) => {
    await storage.saveTask(task);
    await loadTasks();
  }, [loadTasks]);

  const updateTask = useCallback(async (task: Task) => {
    await storage.saveTask(task);
    await loadTasks();
  }, [loadTasks]);

  const removeTask = useCallback(async (taskId: string) => {
    await storage.deleteTask(taskId);
    await loadTasks();
  }, [loadTasks]);

  return { tasks, loading, addTask, updateTask, removeTask, refresh: loadTasks };
}

export function useWatchItems() {
  const [watchItems, setWatchItems] = useState<WatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWatchItems = useCallback(async () => {
    setLoading(true);
    const data = await storage.getWatchItems();
    setWatchItems(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadWatchItems();
  }, [loadWatchItems]);

  const addWatchItem = useCallback(async (item: WatchItem) => {
    await storage.saveWatchItem(item);
    await loadWatchItems();
  }, [loadWatchItems]);

  const updateWatchItem = useCallback(async (item: WatchItem) => {
    await storage.saveWatchItem(item);
    await loadWatchItems();
  }, [loadWatchItems]);

  const removeWatchItem = useCallback(async (itemId: string) => {
    await storage.deleteWatchItem(itemId);
    await loadWatchItems();
  }, [loadWatchItems]);

  return { watchItems, loading, addWatchItem, updateWatchItem, removeWatchItem, refresh: loadWatchItems };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    const data = await storage.getNotifications();
    setNotifications(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const addNotification = useCallback(async (notification: Notification) => {
    await storage.saveNotification(notification);
    await loadNotifications();
  }, [loadNotifications]);

  const removeNotification = useCallback(async (notificationId: string) => {
    await storage.deleteNotification(notificationId);
    await loadNotifications();
  }, [loadNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    await storage.markNotificationAsRead(notificationId);
    await loadNotifications();
  }, [loadNotifications]);

  const markAllAsRead = useCallback(async () => {
    await storage.markAllNotificationsAsRead();
    await loadNotifications();
  }, [loadNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    loading,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    unreadCount,
    refresh: loadNotifications,
  };
}
