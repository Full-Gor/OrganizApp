'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useProjects, useTasks } from '@/hooks/useStore';
import {
  FolderKanban,
  CheckSquare,
  Clock,
  AlertTriangle,
  TrendingUp,
  Plus,
  ArrowRight,
} from 'lucide-react';
import {
  cn,
  formatDate,
  getRelativeDate,
  isOverdue,
  priorityColors,
  statusLabels,
  projectStatusColors,
  projectStatusLabels,
} from '@/lib/utils';
import Modal from '@/components/Modal';
import ProjectForm from '@/components/ProjectForm';

export default function Dashboard() {
  const { projects, loading: projectsLoading } = useProjects();
  const { tasks, loading: tasksLoading } = useTasks();
  const [showProjectForm, setShowProjectForm] = useState(false);

  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status === 'active').length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const overdueTasks = tasks.filter(
      (t) => t.dueDate && isOverdue(t.dueDate) && t.status !== 'completed'
    ).length;
    const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;

    return {
      totalProjects,
      activeProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
      inProgressTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  }, [projects, tasks]);

  const urgentTasks = useMemo(() => {
    return tasks
      .filter((t) => t.status !== 'completed')
      .sort((a, b) => {
        // Overdue first, then by due date
        const aOverdue = a.dueDate && isOverdue(a.dueDate);
        const bOverdue = b.dueDate && isOverdue(b.dueDate);
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
      })
      .slice(0, 5);
  }, [tasks]);

  const recentProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 4);
  }, [projects]);

  if (projectsLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Vue d&apos;ensemble de vos projets et tâches</p>
        </div>
        <button
          onClick={() => setShowProjectForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouveau projet
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FolderKanban className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Projets actifs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeProjects}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckSquare className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tâches terminées</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.completedTasks}/{stats.totalTasks}
              </p>
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
              <p className="text-2xl font-bold text-gray-900">{stats.inProgressTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', stats.overdueTasks > 0 ? 'bg-red-100' : 'bg-gray-100')}>
              <AlertTriangle
                className={cn('w-5 h-5', stats.overdueTasks > 0 ? 'text-red-600' : 'text-gray-600')}
              />
            </div>
            <div>
              <p className="text-sm text-gray-500">En retard</p>
              <p className={cn('text-2xl font-bold', stats.overdueTasks > 0 ? 'text-red-600' : 'text-gray-900')}>
                {stats.overdueTasks}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            <span className="font-medium text-gray-700">Progression globale</span>
          </div>
          <span className="text-lg font-bold text-primary-600">{stats.completionRate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-primary-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${stats.completionRate}%` }}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Urgent Tasks */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Tâches urgentes</h2>
            <Link
              href="/projects"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              Voir tout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {urgentTasks.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Aucune tâche urgente
              </div>
            ) : (
              urgentTasks.map((task) => {
                const project = projects.find((p) => p.id === task.projectId);
                const overdue = task.dueDate && isOverdue(task.dueDate);
                return (
                  <div key={task.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{task.title}</p>
                        <p className="text-sm text-gray-500 truncate">
                          {project?.name || 'Projet inconnu'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={cn('text-xs px-2 py-1 rounded-full', priorityColors[task.priority])}>
                          {statusLabels[task.status]}
                        </span>
                        {task.dueDate && (
                          <p className={cn('text-xs mt-1', overdue ? 'text-red-600 font-medium' : 'text-gray-500')}>
                            {getRelativeDate(task.dueDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Projects */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Projets récents</h2>
            <Link
              href="/projects"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              Voir tout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentProjects.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Aucun projet créé
              </div>
            ) : (
              recentProjects.map((project) => {
                const projectTasks = tasks.filter((t) => t.projectId === project.id);
                const completedCount = projectTasks.filter((t) => t.status === 'completed').length;
                const progress = projectTasks.length > 0
                  ? Math.round((completedCount / projectTasks.length) * 100)
                  : 0;

                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{project.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn('text-xs px-2 py-0.5 rounded-full', projectStatusColors[project.status])}>
                            {projectStatusLabels[project.status]}
                          </span>
                          <span className="text-xs text-gray-500">
                            {completedCount}/{projectTasks.length} tâches
                          </span>
                        </div>
                      </div>
                      <div className="w-16">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 text-center mt-1">{progress}%</p>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Project Form Modal */}
      <Modal
        open={showProjectForm}
        onClose={() => setShowProjectForm(false)}
        title="Nouveau projet"
        size="lg"
      >
        <ProjectForm
          onSuccess={() => setShowProjectForm(false)}
          onCancel={() => setShowProjectForm(false)}
        />
      </Modal>
    </div>
  );
}
