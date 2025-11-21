import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Project, Task, WatchItem, Notification } from '@/types';

const STORAGE_KEY = 'organizapp_data';

const defaultState: AppState = {
  projects: [],
  tasks: [],
  watchItems: [],
  notifications: [],
};

export async function getStorageData(): Promise<AppState> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading from AsyncStorage:', error);
  }
  return defaultState;
}

export async function setStorageData(data: AppState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error writing to AsyncStorage:', error);
  }
}

// Project operations
export async function saveProject(project: Project): Promise<void> {
  const data = await getStorageData();
  const existingIndex = data.projects.findIndex(p => p.id === project.id);

  if (existingIndex >= 0) {
    data.projects[existingIndex] = project;
  } else {
    data.projects.push(project);
  }

  await setStorageData(data);
}

export async function deleteProject(projectId: string): Promise<void> {
  const data = await getStorageData();
  data.projects = data.projects.filter(p => p.id !== projectId);
  data.tasks = data.tasks.filter(t => t.projectId !== projectId);
  await setStorageData(data);
}

export async function getProjects(): Promise<Project[]> {
  const data = await getStorageData();
  return data.projects;
}

export async function getProject(id: string): Promise<Project | undefined> {
  const data = await getStorageData();
  return data.projects.find(p => p.id === id);
}

// Task operations
export async function saveTask(task: Task): Promise<void> {
  const data = await getStorageData();
  const existingIndex = data.tasks.findIndex(t => t.id === task.id);

  if (existingIndex >= 0) {
    data.tasks[existingIndex] = task;
  } else {
    data.tasks.push(task);
  }

  await setStorageData(data);
}

export async function deleteTask(taskId: string): Promise<void> {
  const data = await getStorageData();
  data.tasks = data.tasks.filter(t => t.id !== taskId);
  await setStorageData(data);
}

export async function getTasks(): Promise<Task[]> {
  const data = await getStorageData();
  return data.tasks;
}

export async function getTasksByProject(projectId: string): Promise<Task[]> {
  const data = await getStorageData();
  return data.tasks.filter(t => t.projectId === projectId);
}

// Watch item operations
export async function saveWatchItem(item: WatchItem): Promise<void> {
  const data = await getStorageData();
  const existingIndex = data.watchItems.findIndex(w => w.id === item.id);

  if (existingIndex >= 0) {
    data.watchItems[existingIndex] = item;
  } else {
    data.watchItems.push(item);
  }

  await setStorageData(data);
}

export async function deleteWatchItem(itemId: string): Promise<void> {
  const data = await getStorageData();
  data.watchItems = data.watchItems.filter(w => w.id !== itemId);
  await setStorageData(data);
}

export async function getWatchItems(): Promise<WatchItem[]> {
  const data = await getStorageData();
  return data.watchItems;
}

// Notification operations
export async function saveNotification(notification: Notification): Promise<void> {
  const data = await getStorageData();
  const existingIndex = data.notifications.findIndex(n => n.id === notification.id);

  if (existingIndex >= 0) {
    data.notifications[existingIndex] = notification;
  } else {
    data.notifications.push(notification);
  }

  await setStorageData(data);
}

export async function deleteNotification(notificationId: string): Promise<void> {
  const data = await getStorageData();
  data.notifications = data.notifications.filter(n => n.id !== notificationId);
  await setStorageData(data);
}

export async function getNotifications(): Promise<Notification[]> {
  const data = await getStorageData();
  return data.notifications;
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const data = await getStorageData();
  const notification = data.notifications.find(n => n.id === notificationId);
  if (notification) {
    notification.read = true;
    await setStorageData(data);
  }
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const data = await getStorageData();
  data.notifications.forEach(n => n.read = true);
  await setStorageData(data);
}
