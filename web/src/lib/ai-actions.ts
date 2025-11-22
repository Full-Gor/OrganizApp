import { Project, Task, WatchItem, Notification, Priority, TaskStatus, ProjectStatus } from '@/types';
import * as storage from './storage';
import { generateId, projectColors } from './utils';

export interface AIAction {
  type: 'create_project' | 'create_task' | 'create_watch_item' | 'create_notification' |
        'create_event' | 'update_event' | 'delete_event' | 'update_project' | 'update_task' |
        'delete_project' | 'delete_task' | 'complete_task' | 'list_projects' | 'list_tasks' |
        'list_events' | 'get_stats' | 'search' | 'message' | 'plan_day';
  data?: any;
  message?: string;
}

// Helper: Check if two time ranges overlap
function checkTimeConflict(
  start1: Date, end1: Date,
  start2: Date, end2: Date
): boolean {
  return start1 < end2 && start2 < end1;
}

// Helper: Format time in French
function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
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

        // Parser la date et l'heure
        let eventDate = action.data.date || action.data.dueDate || now.split('T')[0];
        const eventTime = action.data.time || '09:00';
        if (typeof eventDate === 'string' && !eventDate.includes('T')) {
          eventDate = `${eventDate}T${eventTime}:00`;
        }

        // Calculer les heures de départ et de fin
        const startDate = new Date(eventDate);
        const duration = action.data.duration || 60; // Durée par défaut: 1h
        const travelTime = action.data.travelTime || 0;

        const departureDate = new Date(startDate.getTime() - travelTime * 60000);
        const endDate = new Date(startDate.getTime() + duration * 60000);

        // Construire la description
        let description = action.data.description || '';
        const descParts = [];
        if (eventTime) descParts.push(`🕐 ${eventTime}`);
        if (duration) descParts.push(`⏱️ Durée: ${duration >= 60 ? `${Math.floor(duration/60)}h${duration%60 > 0 ? duration%60 : ''}` : `${duration}min`}`);
        if (travelTime > 0) descParts.push(`🚗 Trajet: ${travelTime}min (départ ${departureDate.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})})`);
        if (action.data.location) descParts.push(`📍 ${action.data.location}`);
        if (description) descParts.push(description);

        const task: Task = {
          id: generateId(),
          projectId,
          title: action.data.title || action.data.name || 'Événement',
          description: descParts.join('\n'),
          priority: action.data.priority || 'high',
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
        storage.saveTask(task);

        // Créer notification de rappel pour le départ (si trajet)
        const notifications: Notification[] = [];
        if (travelTime > 0) {
          const departureNotif: Notification = {
            id: generateId(),
            title: `🚗 Départ pour ${task.title}`,
            message: `Partez maintenant pour arriver à l'heure !`,
            type: 'reminder',
            read: false,
            relatedId: task.id,
            relatedType: 'task',
            scheduledFor: departureDate.toISOString(),
            createdAt: now,
          };
          storage.saveNotification(departureNotif);
          notifications.push(departureNotif);
        }

        // Notification de rappel principal
        const mainNotif: Notification = {
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
        storage.saveNotification(mainNotif);
        notifications.push(mainNotif);

        const timeInfo = travelTime > 0
          ? `Départ: ${departureDate.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})} → Fin: ${endDate.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}`
          : `${eventTime} → ${endDate.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}`;

        return {
          success: true,
          message: `Événement "${task.title}" ajouté ! ${timeInfo}`,
          data: { task, notifications }
        };
      }

      case 'update_event': {
        const tasks = storage.getTasks();
        const task = tasks.find(t =>
          (t.isEvent && t.title.toLowerCase().includes(action.data.eventName?.toLowerCase() || '')) ||
          t.id === action.data.eventId
        );

        if (!task) {
          return { success: false, message: "Événement non trouvé" };
        }

        // Mettre à jour les champs
        if (action.data.title) task.title = action.data.title;
        if (action.data.time || action.data.date) {
          const newDate = action.data.date || task.dueDate?.split('T')[0];
          const newTime = action.data.time || task.dueDate?.split('T')[1]?.substring(0, 5) || '09:00';
          task.dueDate = `${newDate}T${newTime}:00`;
        }
        if (action.data.duration !== undefined) task.duration = action.data.duration;
        if (action.data.travelTime !== undefined) task.travelTime = action.data.travelTime;
        if (action.data.location) task.location = action.data.location;

        // Recalculer les heures
        if (task.dueDate) {
          const startDate = new Date(task.dueDate);
          const duration = task.duration || 60;
          const travelTime = task.travelTime || 0;

          task.endTime = new Date(startDate.getTime() + duration * 60000).toISOString();
          task.departureTime = travelTime > 0 ? new Date(startDate.getTime() - travelTime * 60000).toISOString() : undefined;
        }

        task.updatedAt = now;
        storage.saveTask(task);

        return {
          success: true,
          message: `Événement "${task.title}" mis à jour !`,
          data: { task }
        };
      }

      case 'delete_event': {
        const tasks = storage.getTasks();
        const task = tasks.find(t =>
          (t.isEvent && t.title.toLowerCase().includes(action.data.eventName?.toLowerCase() || '')) ||
          t.id === action.data.eventId
        );

        if (!task) {
          return { success: false, message: "Événement non trouvé" };
        }

        // Supprimer les notifications liées
        const notifications = storage.getNotifications();
        notifications.filter(n => n.relatedId === task.id).forEach(n => {
          storage.deleteNotification(n.id);
        });

        storage.deleteTask(task.id);
        return { success: true, message: `Événement "${task.title}" supprimé` };
      }

      case 'list_events': {
        const tasks = storage.getTasks().filter(t => t.isEvent);
        return {
          success: true,
          message: `${tasks.length} événement(s) trouvé(s)`,
          data: tasks
        };
      }

      case 'plan_day': {
        // Planifier plusieurs événements en une fois avec détection de conflits
        const events = action.data.events || [];
        if (!Array.isArray(events) || events.length === 0) {
          return { success: false, message: "Aucun événement à planifier" };
        }

        const projects = storage.getProjects();
        let projectId = action.data.projectId;

        // Trouver ou créer le projet Planning
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
            storage.saveProject(newProject);
            projectId = newProject.id;
          }
        }

        // Parser et calculer tous les événements
        const baseDate = action.data.date || now.split('T')[0];
        const parsedEvents: Array<{
          title: string;
          startTime: Date;
          endTime: Date;
          departureTime: Date;
          duration: number;
          travelTime: number;
          location?: string;
        }> = [];

        for (const evt of events) {
          const time = evt.time || '09:00';
          const startTime = new Date(`${baseDate}T${time}:00`);
          const duration = evt.duration || 60;
          const travelTime = evt.travelTime || 0;
          const endTime = new Date(startTime.getTime() + duration * 60000);
          const departureTime = new Date(startTime.getTime() - travelTime * 60000);

          parsedEvents.push({
            title: evt.title || 'Événement',
            startTime,
            endTime,
            departureTime,
            duration,
            travelTime,
            location: evt.location,
          });
        }

        // Trier par heure de départ
        parsedEvents.sort((a, b) => a.departureTime.getTime() - b.departureTime.getTime());

        // Détecter les conflits
        const conflicts: string[] = [];
        for (let i = 0; i < parsedEvents.length; i++) {
          for (let j = i + 1; j < parsedEvents.length; j++) {
            const evt1 = parsedEvents[i];
            const evt2 = parsedEvents[j];

            // Vérifier si le temps occupé (départ → fin) chevauche
            if (checkTimeConflict(evt1.departureTime, evt1.endTime, evt2.departureTime, evt2.endTime)) {
              conflicts.push(`⚠️ ${evt1.title} (fin ${formatTime(evt1.endTime)}) chevauche ${evt2.title} (départ ${formatTime(evt2.departureTime)})`);
            }
          }
        }

        // Créer les événements
        const createdTasks: Task[] = [];
        for (const evt of parsedEvents) {
          const descParts = [`🕐 ${formatTime(evt.startTime)}`];
          descParts.push(`⏱️ ${evt.duration >= 60 ? `${Math.floor(evt.duration/60)}h${evt.duration%60 > 0 ? evt.duration%60 : ''}` : `${evt.duration}min`}`);
          if (evt.travelTime > 0) descParts.push(`🚗 ${evt.travelTime}min (départ ${formatTime(evt.departureTime)})`);
          if (evt.location) descParts.push(`📍 ${evt.location}`);

          const task: Task = {
            id: generateId(),
            projectId,
            title: evt.title,
            description: descParts.join('\n'),
            priority: 'high',
            status: 'pending',
            dueDate: evt.startTime.toISOString(),
            subtasks: [],
            duration: evt.duration,
            travelTime: evt.travelTime > 0 ? evt.travelTime : undefined,
            endTime: evt.endTime.toISOString(),
            departureTime: evt.travelTime > 0 ? evt.departureTime.toISOString() : undefined,
            location: evt.location,
            isEvent: true,
            createdAt: now,
            updatedAt: now,
          };
          storage.saveTask(task);
          createdTasks.push(task);
        }

        // Construire le résumé de la journée
        let summary = `📅 Planning du jour:\n\n`;
        for (const evt of parsedEvents) {
          const depInfo = evt.travelTime > 0 ? `🚗 ${formatTime(evt.departureTime)} → ` : '';
          summary += `${depInfo}${formatTime(evt.startTime)} - ${formatTime(evt.endTime)} : ${evt.title}\n`;
        }

        if (conflicts.length > 0) {
          summary += `\n❌ CONFLITS DÉTECTÉS:\n${conflicts.join('\n')}`;
        } else {
          summary += `\n✅ Pas de conflit, planning OK !`;
        }

        return {
          success: true,
          message: summary,
          data: { tasks: createdTasks, conflicts, schedule: parsedEvents }
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
