export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type ProjectStatus = 'active' | 'completed' | 'on_hold';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string | null;
  subtasks: SubTask[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: Priority;
  dueDate: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface WatchItem {
  id: string;
  title: string;
  description: string;
  url: string | null;
  category: string;
  tags: string[];
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'reminder' | 'deadline' | 'info';
  read: boolean;
  relatedId: string | null;
  relatedType: 'task' | 'project' | null;
  scheduledFor: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'task' | 'project' | 'event';
  relatedId: string | null;
  color: string;
}

export interface AppState {
  projects: Project[];
  tasks: Task[];
  watchItems: WatchItem[];
  notifications: Notification[];
}
