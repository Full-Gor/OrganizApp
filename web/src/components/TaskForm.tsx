'use client';

import { useState } from 'react';
import { Task, Priority, TaskStatus, SubTask } from '@/types';
import { useTasks, useProjects } from '@/hooks/useStore';
import { generateId, priorityLabels, statusLabels } from '@/lib/utils';
import { Plus, X } from 'lucide-react';

interface TaskFormProps {
  task?: Task;
  projectId?: string;
  onSuccess: () => void;
  onCancel: () => void;
  isEvent?: boolean;
}

export default function TaskForm({ task, projectId, onSuccess, onCancel, isEvent }: TaskFormProps) {
  const { addTask, updateTask } = useTasks();
  const { projects } = useProjects();
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [selectedProjectId, setSelectedProjectId] = useState(task?.projectId || projectId || '');
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'pending');
  const [priority, setPriority] = useState<Priority>(task?.priority || 'medium');
  const [dueDate, setDueDate] = useState(task?.dueDate || '');
  const [subtasks, setSubtasks] = useState<SubTask[]>(task?.subtasks || []);
  const [newSubtask, setNewSubtask] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Le titre est requis');
      return;
    }

    if (!selectedProjectId) {
      setError('Veuillez sélectionner un projet');
      return;
    }

    const now = new Date().toISOString();
    const taskData: Task = {
      id: task?.id || generateId(),
      projectId: selectedProjectId,
      title: title.trim(),
      description: description.trim(),
      priority,
      status,
      dueDate: dueDate || null,
      subtasks,
      createdAt: task?.createdAt || now,
      updatedAt: now,
    };

    if (task) {
      updateTask(taskData);
    } else {
      addTask(taskData);
    }

    onSuccess();
  };

  const addSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks([
        ...subtasks,
        {
          id: generateId(),
          title: newSubtask.trim(),
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ]);
      setNewSubtask('');
    }
  };

  const removeSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  const toggleSubtask = (id: string) => {
    setSubtasks(
      subtasks.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {isEvent ? 'Titre de l\'événement *' : 'Titre de la tâche *'}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder={isEvent ? 'Mon événement' : 'Ma nouvelle tâche'}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Description..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Projet *
        </label>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">Sélectionner un projet</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {Object.entries(priorityLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {isEvent ? 'Date' : 'Échéance'}
        </label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {!isEvent && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sous-tâches
          </label>
          <div className="space-y-2">
            {subtasks.map((subtask) => (
              <div
                key={subtask.id}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
              >
                <input
                  type="checkbox"
                  checked={subtask.completed}
                  onChange={() => toggleSubtask(subtask.id)}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <span
                  className={`flex-1 text-sm ${
                    subtask.completed ? 'line-through text-gray-400' : ''
                  }`}
                >
                  {subtask.title}
                </span>
                <button
                  type="button"
                  onClick={() => removeSubtask(subtask.id)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSubtask();
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Nouvelle sous-tâche..."
              />
              <button
                type="button"
                onClick={addSubtask}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          {task ? 'Modifier' : 'Créer'}
        </button>
      </div>
    </form>
  );
}
