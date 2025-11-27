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
  // Event-specific fields
  duration?: number;        // Duration in minutes
  travelTime?: number;      // Travel time in minutes
  endTime?: string;         // Calculated end time
  departureTime?: string;   // Calculated departure time
  location?: string;        // Event location
  isEvent?: boolean;        // Flag to distinguish events from tasks
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

// Rush Mode Types
export type RushTaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface RushWorkflowStep {
  id: string;
  title: string;
  order: number;
  timeLimit?: number; // Time limit in minutes (optional per task)
}

export interface RushProjectTask {
  stepId: string;
  status: RushTaskStatus;
  startedAt?: string;
  completedAt?: string;
  timeSpent: number; // Time spent in seconds
  notes?: string; // Notes for this task
}

export interface RushProjectSession {
  id: string;
  startedAt: string;
  endedAt?: string;
  duration: number; // Duration in seconds
  notes?: string;
}

export interface RushProject {
  id: string;
  name: string;
  repoUrl?: string;
  currentStepIndex: number;
  tasks: RushProjectTask[];
  totalTimeSpent: number; // Total time in seconds (deprecated, use sessions)
  currentSessionStart?: string; // Current session start time
  sessions: RushProjectSession[]; // History of all work sessions
  waitingSince?: string; // When project started waiting
  isBlinking?: boolean; // Should this project tab blink
  blinkingStopped?: boolean; // User manually stopped blinking
  notes?: string; // Notes for this project
  createdAt: string;
}

export type RushColor = 'gray' | 'blue' | 'red' | 'orange' | 'violet' | 'green' | 'cyan' | 'pink' | 'yellow';

export interface Rush {
  id: string;
  name: string;
  color?: RushColor; // Tab color
  clockTheme?: 'dissolve' | 'fluid'; // Clock display theme
  workflow: RushWorkflowStep[];
  projects: RushProject[];
  status: 'active' | 'paused' | 'completed';
  activeProjectId?: string;
  startedAt?: string;
  completedAt?: string;
  totalTimeSpent: number;
  isBlinking?: boolean; // Should this Rush tab blink
  blinkingStopped?: boolean; // User manually stopped blinking
  createdAt: string;
  updatedAt: string;
}

export interface RushStats {
  totalProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  averageTimePerTask: number;
  fastestProject?: { name: string; time: number };
  slowestProject?: { name: string; time: number };
}
