import { Project, Task, WatchItem, Notification } from '@/types';
import * as storage from './storage';
import { generateId, projectColors } from './utils';

export interface AIAction {
  type: 'create_project' | 'create_task' | 'create_watch_item' | 'create_notification' |
        'create_event' | 'update_event' | 'delete_event' | 'update_project' | 'update_task' |
        'delete_project' | 'delete_task' | 'complete_task' | 'list_projects' | 'list_tasks' |
        'list_events' | 'get_stats' | 'search' | 'message';
  data?: any;
  message?: string;
}

export interface AIContext {
  projects: Project[];
  tasks: Task[];
  watchItems: WatchItem[];
  notifications: Notification[];
}

export async function getAIContext(): Promise<AIContext> {
  const data = await storage.getStorageData();
  return {
    projects: data.projects,
    tasks: data.tasks,
    watchItems: data.watchItems,
    notifications: data.notifications,
  };
}

export async function executeAIAction(action: AIAction): Promise<{ success: boolean; message: string; data?: any }> {
  const now = new Date().toISOString();

  try {
    switch (action.type) {
      case 'create_project': {
        const project: Project = {
          id: generateId(),
          name: action.data.name || 'Nouveau projet',
          description: action.data.description || '',
          status: action.data.status || 'active',
          priority: action.data.priority || 'medium',
          dueDate: action.data.dueDate || null,
          color: action.data.color || projectColors[Math.floor(Math.random() * projectColors.length)],
          createdAt: now,
          updatedAt: now,
        };
        await storage.saveProject(project);

        if (action.data.tasks && Array.isArray(action.data.tasks)) {
          for (const taskData of action.data.tasks) {
            const task: Task = {
              id: generateId(),
              projectId: project.id,
              title: typeof taskData === 'string' ? taskData : taskData.title,
              description: taskData.description || '',
              priority: taskData.priority || 'medium',
              status: 'pending',
              dueDate: taskData.dueDate || null,
              subtasks: taskData.subtasks || [],
              createdAt: now,
              updatedAt: now,
            };
            await storage.saveTask(task);
          }
        }

        return { success: true, message: `Projet "${project.name}" créé avec succès`, data: project };
      }

      case 'create_task': {
        const projects = await storage.getProjects();
        let projectId = action.data.projectId;

        if (!projectId && action.data.projectName) {
          const project = projects.find(p =>
            p.name.toLowerCase().includes(action.data.projectName.toLowerCase())
          );
          if (project) projectId = project.id;
        }

        if (!projectId) {
          const activeProject = projects.find(p => p.status === 'active');
          if (activeProject) projectId = activeProject.id;
        }

        if (!projectId) {
          return { success: false, message: "Aucun projet trouvé. Créez d'abord un projet." };
        }

        const task: Task = {
          id: generateId(),
          projectId,
          title: action.data.title || 'Nouvelle tâche',
          description: action.data.description || '',
          priority: action.data.priority || 'medium',
          status: action.data.status || 'pending',
          dueDate: action.data.dueDate || null,
          subtasks: (action.data.subtasks || []).map((s: any) => ({
            id: generateId(),
            title: typeof s === 'string' ? s : s.title,
            completed: false,
            createdAt: now,
          })),
          createdAt: now,
          updatedAt: now,
        };
        await storage.saveTask(task);
        return { success: true, message: `Tâche "${task.title}" créée avec succès`, data: task };
      }

      case 'create_watch_item': {
        const item: WatchItem = {
          id: generateId(),
          title: action.data.title || 'Nouvelle idée',
          description: action.data.description || '',
          url: action.data.url || null,
          category: action.data.category || 'Idée',
          tags: action.data.tags || [],
          createdAt: now,
        };
        await storage.saveWatchItem(item);
        return { success: true, message: `Élément de veille "${item.title}" ajouté`, data: item };
      }

      case 'create_notification': {
        const notification: Notification = {
          id: generateId(),
          title: action.data.title || 'Rappel',
          message: action.data.message || '',
          type: action.data.type || 'reminder',
          read: false,
          relatedId: action.data.relatedId || null,
          relatedType: action.data.relatedType || null,
          scheduledFor: action.data.scheduledFor || now,
          createdAt: now,
        };
        await storage.saveNotification(notification);
        return { success: true, message: `Rappel "${notification.title}" créé`, data: notification };
      }

      case 'create_event': {
        const projects = await storage.getProjects();
        let projectId = action.data.projectId;

        if (!projectId) {
          const planningProject = projects.find(p =>
            p.name.toLowerCase().includes('planning') ||
            p.name.toLowerCase().includes('agenda')
          );
          if (planningProject) {
            projectId = planningProject.id;
          } else {
            const newProject: Project = {
              id: generateId(),
              name: 'Planning',
              description: 'Événements, RDV et réunions',
              status: 'active',
              priority: 'high',
              dueDate: null,
              color: '#8B5CF6',
              createdAt: now,
              updatedAt: now,
            };
            await storage.saveProject(newProject);
            projectId = newProject.id;
          }
        }

        let eventDate = action.data.date || now.split('T')[0];
        const eventTime = action.data.time || '09:00';
        if (!eventDate.includes('T')) {
          eventDate = `${eventDate}T${eventTime}:00`;
        }

        const startDate = new Date(eventDate);
        const duration = action.data.duration || 60;
        const travelTime = action.data.travelTime || 0;
        const departureDate = new Date(startDate.getTime() - travelTime * 60000);
        const endDate = new Date(startDate.getTime() + duration * 60000);

        const descParts = [];
        if (eventTime) descParts.push(`🕐 ${eventTime}`);
        if (duration) descParts.push(`⏱️ ${duration >= 60 ? `${Math.floor(duration/60)}h${duration%60 || ''}` : `${duration}min`}`);
        if (travelTime > 0) descParts.push(`🚗 ${travelTime}min`);
        if (action.data.location) descParts.push(`📍 ${action.data.location}`);

        const task: Task = {
          id: generateId(),
          projectId,
          title: action.data.title || 'Événement',
          description: descParts.join(' | '),
          priority: 'high',
          status: 'pending',
          dueDate: eventDate,
          subtasks: [],
          duration,
          travelTime: travelTime > 0 ? travelTime : undefined,
          endTime: endDate.toISOString(),
          departureTime: travelTime > 0 ? departureDate.toISOString() : undefined,
          location: action.data.location,
          isEvent: true,
          createdAt: now,
          updatedAt: now,
        };
        await storage.saveTask(task);

        const notification: Notification = {
          id: generateId(),
          title: `Rappel: ${task.title}`,
          message: task.description,
          type: 'reminder',
          read: false,
          relatedId: task.id,
          relatedType: 'task',
          scheduledFor: eventDate,
          createdAt: now,
        };
        await storage.saveNotification(notification);

        const timeInfo = travelTime > 0
          ? `Départ: ${departureDate.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}`
          : eventTime;

        return {
          success: true,
          message: `${task.title} ajouté ! ${timeInfo}`,
          data: { task, notification }
        };
      }

      case 'update_event': {
        const tasks = await storage.getTasks();
        const task = tasks.find(t =>
          (t.isEvent && t.title.toLowerCase().includes(action.data.eventName?.toLowerCase() || '')) ||
          t.id === action.data.eventId
        );
        if (!task) return { success: false, message: "Événement non trouvé" };

        if (action.data.title) task.title = action.data.title;
        if (action.data.time || action.data.date) {
          const newDate = action.data.date || task.dueDate?.split('T')[0];
          const newTime = action.data.time || task.dueDate?.split('T')[1]?.substring(0, 5) || '09:00';
          task.dueDate = `${newDate}T${newTime}:00`;
        }
        if (action.data.duration !== undefined) task.duration = action.data.duration;
        if (action.data.travelTime !== undefined) task.travelTime = action.data.travelTime;

        if (task.dueDate) {
          const startDate = new Date(task.dueDate);
          task.endTime = new Date(startDate.getTime() + (task.duration || 60) * 60000).toISOString();
          task.departureTime = task.travelTime ? new Date(startDate.getTime() - task.travelTime * 60000).toISOString() : undefined;
        }

        task.updatedAt = now;
        await storage.saveTask(task);
        return { success: true, message: `${task.title} mis à jour !`, data: { task } };
      }

      case 'delete_event': {
        const tasks = await storage.getTasks();
        const task = tasks.find(t =>
          (t.isEvent && t.title.toLowerCase().includes(action.data.eventName?.toLowerCase() || '')) ||
          t.id === action.data.eventId
        );
        if (!task) return { success: false, message: "Événement non trouvé" };

        const notifications = await storage.getNotifications();
        for (const n of notifications.filter(n => n.relatedId === task.id)) {
          await storage.deleteNotification(n.id);
        }
        await storage.deleteTask(task.id);
        return { success: true, message: `${task.title} supprimé` };
      }

      case 'list_events': {
        const tasks = (await storage.getTasks()).filter(t => t.isEvent);
        return { success: true, message: `${tasks.length} événement(s)`, data: tasks };
      }

      case 'complete_task': {
        const tasks = await storage.getTasks();
        const task = tasks.find(t =>
          t.title.toLowerCase().includes(action.data.taskName?.toLowerCase() || '') ||
          t.id === action.data.taskId
        );
        if (task) {
          task.status = 'completed';
          task.updatedAt = now;
          await storage.saveTask(task);
          return { success: true, message: `Tâche "${task.title}" marquée comme terminée` };
        }
        return { success: false, message: "Tâche non trouvée" };
      }

      case 'delete_project': {
        const projects = await storage.getProjects();
        const project = projects.find(p =>
          p.name.toLowerCase().includes(action.data.projectName?.toLowerCase() || '') ||
          p.id === action.data.projectId
        );
        if (project) {
          await storage.deleteProject(project.id);
          return { success: true, message: `Projet "${project.name}" supprimé` };
        }
        return { success: false, message: "Projet non trouvé" };
      }

      case 'delete_task': {
        const tasks = await storage.getTasks();
        const task = tasks.find(t =>
          t.title.toLowerCase().includes(action.data.taskName?.toLowerCase() || '') ||
          t.id === action.data.taskId
        );
        if (task) {
          await storage.deleteTask(task.id);
          return { success: true, message: `Tâche "${task.title}" supprimée` };
        }
        return { success: false, message: "Tâche non trouvée" };
      }

      case 'list_projects': {
        const projects = await storage.getProjects();
        return { success: true, message: `${projects.length} projet(s) trouvé(s)`, data: projects };
      }

      case 'list_tasks': {
        const tasks = await storage.getTasks();
        const projects = await storage.getProjects();

        let filteredTasks = tasks;
        if (action.data?.projectName) {
          const project = projects.find(p =>
            p.name.toLowerCase().includes(action.data.projectName.toLowerCase())
          );
          if (project) {
            filteredTasks = tasks.filter(t => t.projectId === project.id);
          }
        }
        if (action.data?.status) {
          filteredTasks = filteredTasks.filter(t => t.status === action.data.status);
        }

        return { success: true, message: `${filteredTasks.length} tâche(s) trouvée(s)`, data: filteredTasks };
      }

      case 'get_stats': {
        const projects = await storage.getProjects();
        const tasks = await storage.getTasks();
        const stats = {
          totalProjects: projects.length,
          activeProjects: projects.filter(p => p.status === 'active').length,
          totalTasks: tasks.length,
          completedTasks: tasks.filter(t => t.status === 'completed').length,
          inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
          pendingTasks: tasks.filter(t => t.status === 'pending').length,
          completionRate: tasks.length > 0
            ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)
            : 0,
        };
        return { success: true, message: 'Statistiques récupérées', data: stats };
      }

      case 'search': {
        const query = action.data.query?.toLowerCase() || '';
        const allData = await storage.getStorageData();
        const projects = allData.projects.filter(p =>
          p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)
        );
        const tasks = allData.tasks.filter(t =>
          t.title.toLowerCase().includes(query) || t.description.toLowerCase().includes(query)
        );
        const watchItems = allData.watchItems.filter(w =>
          w.title.toLowerCase().includes(query) || w.description.toLowerCase().includes(query)
        );
        return {
          success: true,
          message: `Résultats pour "${action.data.query}"`,
          data: { projects, tasks, watchItems }
        };
      }

      case 'message':
        return { success: true, message: action.message || '' };

      default:
        return { success: false, message: "Action non reconnue" };
    }
  } catch (error) {
    return { success: false, message: `Erreur: ${error}` };
  }
}
