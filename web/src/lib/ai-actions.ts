import { Project, Task, WatchItem, Notification, Priority, TaskStatus, ProjectStatus } from '@/types';
import * as storage from './storage';
import { generateId, projectColors } from './utils';

export interface AIAction {
  type: 'create_project' | 'create_task' | 'create_watch_item' | 'create_notification' |
        'create_event' | 'update_project' | 'update_task' | 'delete_project' | 'delete_task' |
        'complete_task' | 'list_projects' | 'list_tasks' | 'get_stats' | 'search' | 'message';
  data?: any;
  message?: string;
}

export interface AIContext {
  projects: Project[];
  tasks: Task[];
  watchItems: WatchItem[];
  notifications: Notification[];
}

export function getAIContext(): AIContext {
  return {
    projects: storage.getProjects(),
    tasks: storage.getTasks(),
    watchItems: storage.getWatchItems(),
    notifications: storage.getNotifications(),
  };
}

export function executeAIAction(action: AIAction): { success: boolean; message: string; data?: any } {
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
        storage.saveProject(project);

        // Créer les tâches suggérées si présentes
        if (action.data.tasks && Array.isArray(action.data.tasks)) {
          action.data.tasks.forEach((taskData: any) => {
            const task: Task = {
              id: generateId(),
              projectId: project.id,
              title: taskData.title || taskData,
              description: taskData.description || '',
              priority: taskData.priority || 'medium',
              status: 'pending',
              dueDate: taskData.dueDate || null,
              subtasks: taskData.subtasks || [],
              createdAt: now,
              updatedAt: now,
            };
            storage.saveTask(task);
          });
        }

        return { success: true, message: `Projet "${project.name}" créé avec succès`, data: project };
      }

      case 'create_task': {
        const projects = storage.getProjects();
        let projectId = action.data.projectId;

        // Trouver le projet par nom si pas d'ID
        if (!projectId && action.data.projectName) {
          const project = projects.find(p =>
            p.name.toLowerCase().includes(action.data.projectName.toLowerCase())
          );
          if (project) projectId = project.id;
        }

        // Utiliser le premier projet actif si aucun spécifié
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
        storage.saveTask(task);
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
        storage.saveWatchItem(item);
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
        storage.saveNotification(notification);
        return { success: true, message: `Rappel "${notification.title}" créé`, data: notification };
      }

      case 'create_event': {
        // Créer un événement = une tâche avec une date (apparaît dans le calendrier)
        const projects = storage.getProjects();
        let projectId = action.data.projectId;

        // Chercher un projet "Planning" ou "Agenda" ou utiliser le premier projet actif
        if (!projectId) {
          const planningProject = projects.find(p =>
            p.name.toLowerCase().includes('planning') ||
            p.name.toLowerCase().includes('agenda') ||
            p.name.toLowerCase().includes('rdv') ||
            p.name.toLowerCase().includes('événement')
          );
          if (planningProject) {
            projectId = planningProject.id;
          } else {
            // Créer un projet "Planning" s'il n'existe pas
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
            storage.saveProject(newProject);
            projectId = newProject.id;
          }
        }

        // Parser la date
        let eventDate = action.data.date || action.data.dueDate || now;
        if (typeof eventDate === 'string' && !eventDate.includes('T')) {
          // Si c'est juste une date sans heure, ajouter l'heure si fournie
          if (action.data.time) {
            eventDate = `${eventDate}T${action.data.time}:00`;
          } else {
            eventDate = `${eventDate}T09:00:00`;
          }
        }

        const task: Task = {
          id: generateId(),
          projectId,
          title: action.data.title || action.data.name || 'Événement',
          description: action.data.description || `${action.data.time ? 'Heure: ' + action.data.time : ''} ${action.data.location ? '- Lieu: ' + action.data.location : ''}`.trim(),
          priority: action.data.priority || 'high',
          status: 'pending',
          dueDate: eventDate,
          subtasks: [],
          createdAt: now,
          updatedAt: now,
        };
        storage.saveTask(task);

        // Créer aussi une notification de rappel
        const notification: Notification = {
          id: generateId(),
          title: `Rappel: ${task.title}`,
          message: task.description || `Événement prévu le ${new Date(eventDate).toLocaleDateString('fr-FR')}`,
          type: 'reminder',
          read: false,
          relatedId: task.id,
          relatedType: 'task',
          scheduledFor: eventDate,
          createdAt: now,
        };
        storage.saveNotification(notification);

        return {
          success: true,
          message: `Événement "${task.title}" ajouté au planning pour le ${new Date(eventDate).toLocaleDateString('fr-FR')}`,
          data: { task, notification }
        };
      }

      case 'complete_task': {
        const tasks = storage.getTasks();
        const task = tasks.find(t =>
          t.title.toLowerCase().includes(action.data.taskName?.toLowerCase() || '') ||
          t.id === action.data.taskId
        );
        if (task) {
          task.status = 'completed';
          task.updatedAt = now;
          storage.saveTask(task);
          return { success: true, message: `Tâche "${task.title}" marquée comme terminée` };
        }
        return { success: false, message: "Tâche non trouvée" };
      }

      case 'delete_project': {
        const projects = storage.getProjects();
        const project = projects.find(p =>
          p.name.toLowerCase().includes(action.data.projectName?.toLowerCase() || '') ||
          p.id === action.data.projectId
        );
        if (project) {
          storage.deleteProject(project.id);
          return { success: true, message: `Projet "${project.name}" supprimé` };
        }
        return { success: false, message: "Projet non trouvé" };
      }

      case 'delete_task': {
        const tasks = storage.getTasks();
        const task = tasks.find(t =>
          t.title.toLowerCase().includes(action.data.taskName?.toLowerCase() || '') ||
          t.id === action.data.taskId
        );
        if (task) {
          storage.deleteTask(task.id);
          return { success: true, message: `Tâche "${task.title}" supprimée` };
        }
        return { success: false, message: "Tâche non trouvée" };
      }

      case 'list_projects': {
        const projects = storage.getProjects();
        return { success: true, message: `${projects.length} projet(s) trouvé(s)`, data: projects };
      }

      case 'list_tasks': {
        const tasks = storage.getTasks();
        const projects = storage.getProjects();

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
        const projects = storage.getProjects();
        const tasks = storage.getTasks();
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
        const projects = storage.getProjects().filter(p =>
          p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)
        );
        const tasks = storage.getTasks().filter(t =>
          t.title.toLowerCase().includes(query) || t.description.toLowerCase().includes(query)
        );
        const watchItems = storage.getWatchItems().filter(w =>
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
