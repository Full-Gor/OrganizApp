'use client';

import { useState, useMemo } from 'react';
import { useProjects, useTasks, useWatchItems, useNotifications } from '@/hooks/useStore';
import {
  Settings,
  BarChart3,
  Download,
  Upload,
  Trash2,
  Database,
  PieChart,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { cn, formatDate, projectStatusLabels, priorityLabels } from '@/lib/utils';
import Modal from '@/components/Modal';
import * as storage from '@/lib/storage';

export default function SettingsPage() {
  const { projects } = useProjects();
  const { tasks } = useTasks();
  const { watchItems } = useWatchItems();
  const { notifications } = useNotifications();
  const [confirmClear, setConfirmClear] = useState(false);
  const [importError, setImportError] = useState('');

  // Statistics
  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
    const pendingTasks = tasks.filter((t) => t.status === 'pending').length;

    const activeProjects = projects.filter((p) => p.status === 'active').length;
    const completedProjects = projects.filter((p) => p.status === 'completed').length;

    const highPriorityTasks = tasks.filter((t) => t.priority === 'high' && t.status !== 'completed').length;
    const overdueTasks = tasks.filter((t) => {
      if (!t.dueDate || t.status === 'completed') return false;
      return new Date(t.dueDate) < new Date();
    }).length;

    // Tasks by project
    const tasksByProject = projects.map((project) => {
      const projectTasks = tasks.filter((t) => t.projectId === project.id);
      const completed = projectTasks.filter((t) => t.status === 'completed').length;
      return {
        name: project.name,
        total: projectTasks.length,
        completed,
        progress: projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0,
        color: project.color,
      };
    });

    // Weekly completion (last 7 days)
    const weeklyCompletion: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = tasks.filter((t) => {
        if (t.status !== 'completed') return false;
        const updatedAt = new Date(t.updatedAt);
        return updatedAt >= date && updatedAt < nextDate;
      }).length;

      weeklyCompletion.push({
        date: formatDate(date),
        count,
      });
    }

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      activeProjects,
      completedProjects,
      highPriorityTasks,
      overdueTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      tasksByProject,
      weeklyCompletion,
    };
  }, [projects, tasks]);

  const handleExportData = () => {
    const data = storage.getStorageData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `organizapp_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.projects && data.tasks && data.watchItems && data.notifications) {
          storage.setStorageData(data);
          window.location.reload();
        } else {
          setImportError('Format de fichier invalide');
        }
      } catch {
        setImportError('Erreur lors de la lecture du fichier');
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    storage.setStorageData({
      projects: [],
      tasks: [],
      watchItems: [],
      notifications: [],
    });
    setConfirmClear(false);
    window.location.reload();
  };

  const maxWeeklyCount = Math.max(...stats.weeklyCompletion.map((d) => d.count), 1);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres & Statistiques</h1>
        <p className="text-gray-500 mt-1">Gérez vos données et consultez vos statistiques</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600" />
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
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Taux de complétion</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
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
              <AlertCircle className={cn('w-5 h-5', stats.overdueTasks > 0 ? 'text-red-600' : 'text-gray-600')} />
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

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Tasks Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-primary-600" />
            <h2 className="font-semibold text-gray-900">Répartition des tâches</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-gray-600">Terminées</span>
              </div>
              <span className="font-medium">{stats.completedTasks}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-gray-600">En cours</span>
              </div>
              <span className="font-medium">{stats.inProgressTasks}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${stats.totalTasks > 0 ? (stats.inProgressTasks / stats.totalTasks) * 100 : 0}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400" />
                <span className="text-sm text-gray-600">En attente</span>
              </div>
              <span className="font-medium">{stats.pendingTasks}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gray-400 h-2 rounded-full"
                style={{ width: `${stats.totalTasks > 0 ? (stats.pendingTasks / stats.totalTasks) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Weekly Activity */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            <h2 className="font-semibold text-gray-900">Activité de la semaine</h2>
          </div>

          <div className="flex items-end justify-between h-40 gap-2">
            {stats.weeklyCompletion.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col items-center justify-end h-32">
                  <span className="text-xs text-gray-500 mb-1">{day.count}</span>
                  <div
                    className="w-full bg-primary-500 rounded-t"
                    style={{
                      height: `${(day.count / maxWeeklyCount) * 100}%`,
                      minHeight: day.count > 0 ? '8px' : '0',
                    }}
                  />
                </div>
                <span className="text-xs text-gray-500 mt-2">
                  {day.date.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Projects Progress */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Progression par projet</h2>

          {stats.tasksByProject.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucun projet</p>
          ) : (
            <div className="space-y-4">
              {stats.tasksByProject.map((project, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="text-sm font-medium text-gray-700 truncate">
                        {project.name}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {project.completed}/{project.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${project.progress}%`,
                        backgroundColor: project.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-primary-600" />
            <h2 className="font-semibold text-gray-900">Gestion des données</h2>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Stockage actuel:</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>{projects.length} projet(s)</li>
                <li>{tasks.length} tâche(s)</li>
                <li>{watchItems.length} élément(s) de veille</li>
                <li>{notifications.length} notification(s)</li>
              </ul>
            </div>

            {importError && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{importError}</div>
            )}

            <div className="space-y-2">
              <button
                onClick={handleExportData}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="w-5 h-5" />
                Exporter les données
              </button>

              <label className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <Upload className="w-5 h-5" />
                Importer des données
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => setConfirmClear(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                Effacer toutes les données
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Data Confirmation */}
      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Effacer toutes les données"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Êtes-vous sûr de vouloir effacer toutes vos données ? Cette action est irréversible.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setConfirmClear(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              onClick={handleClearData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Effacer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
