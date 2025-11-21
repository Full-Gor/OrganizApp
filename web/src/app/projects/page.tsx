'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useProjects, useTasks } from '@/hooks/useStore';
import {
  Plus,
  Search,
  Filter,
  Grid,
  List,
  MoreVertical,
  Edit,
  Trash2,
} from 'lucide-react';
import {
  cn,
  formatDate,
  priorityLabels,
  priorityColors,
  projectStatusLabels,
  projectStatusColors,
} from '@/lib/utils';
import Modal from '@/components/Modal';
import ProjectForm from '@/components/ProjectForm';
import { Project, Priority, ProjectStatus } from '@/types';

export default function ProjectsPage() {
  const { projects, removeProject, loading } = useProjects();
  const { tasks } = useTasks();
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Project | null>(null);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || project.priority === filterPriority;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [projects, searchQuery, filterStatus, filterPriority]);

  const handleDeleteProject = () => {
    if (confirmDelete) {
      removeProject(confirmDelete.id);
      setConfirmDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projets</h1>
          <p className="text-gray-500 mt-1">{projects.length} projet(s) au total</p>
        </div>
        <button
          onClick={() => setShowProjectForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Créer un projet
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un projet..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors',
              showFilters
                ? 'border-primary-500 bg-primary-50 text-primary-600'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            )}
          >
            <Filter className="w-5 h-5" />
            Filtres
          </button>
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-500 hover:bg-gray-50'
              )}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-500 hover:bg-gray-50'
              )}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as ProjectStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Tous</option>
              {Object.entries(projectStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as Priority | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Toutes</option>
              {Object.entries(priorityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Projects Grid/List */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500">
            {searchQuery || filterStatus !== 'all' || filterPriority !== 'all'
              ? 'Aucun projet ne correspond à vos critères'
              : 'Aucun projet créé'}
          </p>
          {!searchQuery && filterStatus === 'all' && filterPriority === 'all' && (
            <button
              onClick={() => setShowProjectForm(true)}
              className="mt-4 text-primary-600 hover:text-primary-700"
            >
              Créer votre premier projet
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const projectTasks = tasks.filter((t) => t.projectId === project.id);
            const completedCount = projectTasks.filter((t) => t.status === 'completed').length;
            const progress = projectTasks.length > 0
              ? Math.round((completedCount / projectTasks.length) * 100)
              : 0;

            return (
              <div
                key={project.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="h-2" style={{ backgroundColor: project.color }} />
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <Link href={`/projects/${project.id}`} className="flex-1">
                      <h3 className="font-semibold text-gray-900 hover:text-primary-600">
                        {project.name}
                      </h3>
                    </Link>
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === project.id ? null : project.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      {menuOpen === project.id && (
                        <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          <button
                            onClick={() => {
                              setEditingProject(project);
                              setMenuOpen(null);
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Edit className="w-4 h-4" />
                            Modifier
                          </button>
                          <button
                            onClick={() => {
                              setConfirmDelete(project);
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
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {project.description || 'Aucune description'}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full', projectStatusColors[project.status])}>
                      {projectStatusLabels[project.status]}
                    </span>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full border', priorityColors[project.priority])}>
                      {priorityLabels[project.priority]}
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-500">{completedCount}/{projectTasks.length} tâches</span>
                      <span className="font-medium text-primary-600">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  {project.dueDate && (
                    <p className="text-xs text-gray-500 mt-3">
                      Échéance: {formatDate(project.dueDate)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
          {filteredProjects.map((project) => {
            const projectTasks = tasks.filter((t) => t.projectId === project.id);
            const completedCount = projectTasks.filter((t) => t.status === 'completed').length;
            const progress = projectTasks.length > 0
              ? Math.round((completedCount / projectTasks.length) * 100)
              : 0;

            return (
              <div key={project.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <Link href={`/projects/${project.id}`}>
                      <h3 className="font-semibold text-gray-900 hover:text-primary-600">
                        {project.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-500 truncate">{project.description}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:block w-32">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500">{completedCount}/{projectTasks.length}</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-primary-600 h-1.5 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full hidden sm:inline-block', projectStatusColors[project.status])}>
                      {projectStatusLabels[project.status]}
                    </span>
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === project.id ? null : project.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      {menuOpen === project.id && (
                        <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          <button
                            onClick={() => {
                              setEditingProject(project);
                              setMenuOpen(null);
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Edit className="w-4 h-4" />
                            Modifier
                          </button>
                          <button
                            onClick={() => {
                              setConfirmDelete(project);
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
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Project Modal */}
      <Modal
        open={showProjectForm || !!editingProject}
        onClose={() => {
          setShowProjectForm(false);
          setEditingProject(null);
        }}
        title={editingProject ? 'Modifier le projet' : 'Nouveau projet'}
        size="lg"
      >
        <ProjectForm
          project={editingProject || undefined}
          onSuccess={() => {
            setShowProjectForm(false);
            setEditingProject(null);
          }}
          onCancel={() => {
            setShowProjectForm(false);
            setEditingProject(null);
          }}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Supprimer le projet"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Êtes-vous sûr de vouloir supprimer le projet &quot;{confirmDelete?.name}&quot; ?
            Cette action supprimera également toutes les tâches associées.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setConfirmDelete(null)}
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
