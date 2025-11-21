'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProjects, useTasks } from '@/hooks/useStore';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Check,
  Clock,
  AlertTriangle,
  MoreVertical,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import {
  cn,
  formatDate,
  getRelativeDate,
  isOverdue,
  priorityLabels,
  priorityColors,
  statusLabels,
  statusColors,
  projectStatusLabels,
  projectStatusColors,
} from '@/lib/utils';
import Modal from '@/components/Modal';
import ProjectForm from '@/components/ProjectForm';
import TaskForm from '@/components/TaskForm';
import { Task, TaskStatus, Priority } from '@/types';
import * as storage from '@/lib/storage';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { projects, removeProject } = useProjects();
  const { tasks, updateTask, removeTask, refresh: refreshTasks } = useTasks(projectId);

  const [project, setProject] = useState(projects.find((p) => p.id === projectId));
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Task | null>(null);
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(false);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    const p = storage.getProject(projectId);
    if (p) setProject(p);
  }, [projectId, projects]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
      return matchesStatus && matchesPriority;
    });
  }, [tasks, filterStatus, filterPriority]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const overdue = tasks.filter(
      (t) => t.dueDate && isOverdue(t.dueDate) && t.status !== 'completed'
    ).length;
    return { total, completed, inProgress, overdue };
  }, [tasks]);

  const handleToggleTaskStatus = (task: Task) => {
    const newStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
    updateTask({ ...task, status: newStatus, updatedAt: new Date().toISOString() });
  };

  const handleToggleSubtask = (task: Task, subtaskId: string) => {
    const updatedSubtasks = task.subtasks.map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    updateTask({ ...task, subtasks: updatedSubtasks, updatedAt: new Date().toISOString() });
  };

  const handleDeleteTask = () => {
    if (confirmDelete) {
      removeTask(confirmDelete.id);
      setConfirmDelete(null);
    }
  };

  const handleDeleteProject = () => {
    if (project) {
      removeProject(project.id);
      router.push('/projects');
    }
  };

  const toggleExpand = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Projet non trouvé</p>
        <Link href="/projects" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
          Retour aux projets
        </Link>
      </div>
    );
  }

  const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/projects"
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              </div>
              <p className="text-gray-500 mt-1">{project.description || 'Aucune description'}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowProjectForm(true)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={() => setConfirmDeleteProject(true)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className={cn('text-sm px-3 py-1 rounded-full', projectStatusColors[project.status])}>
              {projectStatusLabels[project.status]}
            </span>
            <span className={cn('text-sm px-3 py-1 rounded-full border', priorityColors[project.priority])}>
              Priorité: {priorityLabels[project.priority]}
            </span>
            {project.dueDate && (
              <span className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                Échéance: {formatDate(project.dueDate)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Terminées</p>
              <p className="text-xl font-bold text-gray-900">{stats.completed}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">En cours</p>
              <p className="text-xl font-bold text-gray-900">{stats.inProgress}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', stats.overdue > 0 ? 'bg-red-100' : 'bg-gray-100')}>
              <AlertTriangle className={cn('w-5 h-5', stats.overdue > 0 ? 'text-red-600' : 'text-gray-600')} />
            </div>
            <div>
              <p className="text-sm text-gray-500">En retard</p>
              <p className={cn('text-xl font-bold', stats.overdue > 0 ? 'text-red-600' : 'text-gray-900')}>
                {stats.overdue}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-gray-700">Progression</span>
          <span className="text-lg font-bold text-primary-600">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-primary-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Tasks Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-gray-200 gap-4">
          <h2 className="font-semibold text-gray-900">Tâches</h2>
          <div className="flex flex-wrap gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'all')}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
            >
              <option value="all">Tous les statuts</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as Priority | 'all')}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
            >
              <option value="all">Toutes priorités</option>
              {Object.entries(priorityLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <button
              onClick={() => setShowTaskForm(true)}
              className="flex items-center gap-2 px-4 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {filterStatus !== 'all' || filterPriority !== 'all'
                ? 'Aucune tâche ne correspond aux filtres'
                : 'Aucune tâche dans ce projet'}
            </div>
          ) : (
            filteredTasks.map((task) => {
              const overdue = task.dueDate && isOverdue(task.dueDate) && task.status !== 'completed';
              const isExpanded = expandedTasks.has(task.id);
              const hasSubtasks = task.subtasks.length > 0;
              const completedSubtasks = task.subtasks.filter((s) => s.completed).length;

              return (
                <div key={task.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleTaskStatus(task)}
                      className={cn(
                        'mt-1 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                        task.status === 'completed'
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-primary-500'
                      )}
                    >
                      {task.status === 'completed' && <Check className="w-3 h-3" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {hasSubtasks && (
                              <button
                                onClick={() => toggleExpand(task.id)}
                                className="p-0.5 text-gray-400 hover:text-gray-600"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </button>
                            )}
                            <h3
                              className={cn(
                                'font-medium',
                                task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'
                              )}
                            >
                              {task.title}
                            </h3>
                          </div>
                          {task.description && (
                            <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className={cn('text-xs px-2 py-0.5 rounded-full', statusColors[task.status])}>
                              {statusLabels[task.status]}
                            </span>
                            <span className={cn('text-xs px-2 py-0.5 rounded-full border', priorityColors[task.priority])}>
                              {priorityLabels[task.priority]}
                            </span>
                            {task.dueDate && (
                              <span className={cn('text-xs', overdue ? 'text-red-600 font-medium' : 'text-gray-500')}>
                                {getRelativeDate(task.dueDate)}
                              </span>
                            )}
                            {hasSubtasks && (
                              <span className="text-xs text-gray-500">
                                {completedSubtasks}/{task.subtasks.length} sous-tâches
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="relative">
                          <button
                            onClick={() => setMenuOpen(menuOpen === task.id ? null : task.id)}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          {menuOpen === task.id && (
                            <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                              <button
                                onClick={() => {
                                  setEditingTask(task);
                                  setMenuOpen(null);
                                }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Edit className="w-4 h-4" />
                                Modifier
                              </button>
                              <button
                                onClick={() => {
                                  setConfirmDelete(task);
                                  setMenuOpen(null);
                                }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                                Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Subtasks */}
                      {isExpanded && hasSubtasks && (
                        <div className="mt-3 pl-6 space-y-2">
                          {task.subtasks.map((subtask) => (
                            <div key={subtask.id} className="flex items-center gap-2">
                              <button
                                onClick={() => handleToggleSubtask(task, subtask.id)}
                                className={cn(
                                  'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                                  subtask.completed
                                    ? 'bg-green-500 border-green-500 text-white'
                                    : 'border-gray-300'
                                )}
                              >
                                {subtask.completed && <Check className="w-2.5 h-2.5" />}
                              </button>
                              <span
                                className={cn(
                                  'text-sm',
                                  subtask.completed ? 'text-gray-400 line-through' : 'text-gray-700'
                                )}
                              >
                                {subtask.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Project Form Modal */}
      <Modal
        open={showProjectForm}
        onClose={() => setShowProjectForm(false)}
        title="Modifier le projet"
        size="lg"
      >
        <ProjectForm
          project={project}
          onSuccess={() => {
            setShowProjectForm(false);
            setProject(storage.getProject(projectId));
          }}
          onCancel={() => setShowProjectForm(false)}
        />
      </Modal>

      {/* Task Form Modal */}
      <Modal
        open={showTaskForm || !!editingTask}
        onClose={() => {
          setShowTaskForm(false);
          setEditingTask(null);
        }}
        title={editingTask ? 'Modifier la tâche' : 'Nouvelle tâche'}
        size="lg"
      >
        <TaskForm
          task={editingTask || undefined}
          projectId={projectId}
          onSuccess={() => {
            setShowTaskForm(false);
            setEditingTask(null);
            refreshTasks();
          }}
          onCancel={() => {
            setShowTaskForm(false);
            setEditingTask(null);
          }}
        />
      </Modal>

      {/* Delete Task Confirmation */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Supprimer la tâche"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Êtes-vous sûr de vouloir supprimer la tâche &quot;{confirmDelete?.title}&quot; ?
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setConfirmDelete(null)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              onClick={handleDeleteTask}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Supprimer
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Project Confirmation */}
      <Modal
        open={confirmDeleteProject}
        onClose={() => setConfirmDeleteProject(false)}
        title="Supprimer le projet"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Êtes-vous sûr de vouloir supprimer le projet &quot;{project.name}&quot; et toutes ses tâches ?
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setConfirmDeleteProject(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              onClick={handleDeleteProject}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Supprimer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
