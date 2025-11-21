import { AppState, Project, Task, WatchItem, Notification } from '@/types';

const STORAGE_KEY = 'organizapp_data';

const defaultState: AppState = {
  projects: [],
  tasks: [],
  watchItems: [],
  notifications: [],
};

export function getStorageData(): AppState {
  if (typeof window === 'undefined') return defaultState;

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading from localStorage:', error);
  }
  return defaultState;
}

export function setStorageData(data: AppState): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
}

// Project operations
export function saveProject(project: Project): void {
  const data = getStorageData();
  const existingIndex = data.projects.findIndex(p => p.id === project.id);

  if (existingIndex >= 0) {
    data.projects[existingIndex] = project;
  } else {
    data.projects.push(project);
  }

  setStorageData(data);
}

export function deleteProject(projectId: string): void {
  const data = getStorageData();
  data.projects = data.projects.filter(p => p.id !== projectId);
  data.tasks = data.tasks.filter(t => t.projectId !== projectId);
  setStorageData(data);
}

export function getProjects(): Project[] {
  return getStorageData().projects;
}

export function getProject(id: string): Project | undefined {
  return getStorageData().projects.find(p => p.id === id);
}

// Task operations
export function saveTask(task: Task): void {
  const data = getStorageData();
  const existingIndex = data.tasks.findIndex(t => t.id === task.id);

  if (existingIndex >= 0) {
    data.tasks[existingIndex] = task;
  } else {
    data.tasks.push(task);
  }

  setStorageData(data);
}

export function deleteTask(taskId: string): void {
  const data = getStorageData();
  data.tasks = data.tasks.filter(t => t.id !== taskId);
  setStorageData(data);
}

export function getTasks(): Task[] {
  return getStorageData().tasks;
}

export function getTasksByProject(projectId: string): Task[] {
  return getStorageData().tasks.filter(t => t.projectId === projectId);
}

export function getTask(id: string): Task | undefined {
  return getStorageData().tasks.find(t => t.id === id);
}

// Watch item operations
export function saveWatchItem(item: WatchItem): void {
  const data = getStorageData();
  const existingIndex = data.watchItems.findIndex(w => w.id === item.id);

  if (existingIndex >= 0) {
    data.watchItems[existingIndex] = item;
  } else {
    data.watchItems.push(item);
  }

  setStorageData(data);
}

export function deleteWatchItem(itemId: string): void {
  const data = getStorageData();
  data.watchItems = data.watchItems.filter(w => w.id !== itemId);
  setStorageData(data);
}

export function getWatchItems(): WatchItem[] {
  return getStorageData().watchItems;
}

// Notification operations
export function saveNotification(notification: Notification): void {
  const data = getStorageData();
  const existingIndex = data.notifications.findIndex(n => n.id === notification.id);

  if (existingIndex >= 0) {
    data.notifications[existingIndex] = notification;
  } else {
    data.notifications.push(notification);
  }

  setStorageData(data);
}

export function deleteNotification(notificationId: string): void {
  const data = getStorageData();
  data.notifications = data.notifications.filter(n => n.id !== notificationId);
  setStorageData(data);
}

export function getNotifications(): Notification[] {
  return getStorageData().notifications;
}

export function markNotificationAsRead(notificationId: string): void {
  const data = getStorageData();
  const notification = data.notifications.find(n => n.id === notificationId);
  if (notification) {
    notification.read = true;
    setStorageData(data);
  }
}

export function markAllNotificationsAsRead(): void {
  const data = getStorageData();
  data.notifications.forEach(n => n.read = true);
  setStorageData(data);
}

export function getUnreadNotificationsCount(): number {
  return getStorageData().notifications.filter(n => !n.read).length;
}
