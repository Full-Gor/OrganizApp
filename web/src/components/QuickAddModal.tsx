'use client';

import { useState } from 'react';
import Modal from './Modal';
import { FolderKanban, CheckSquare, Lightbulb, Calendar } from 'lucide-react';
import ProjectForm from './ProjectForm';
import TaskForm from './TaskForm';
import WatchItemForm from './WatchItemForm';

type AddType = 'project' | 'task' | 'idea' | 'event' | null;

interface QuickAddModalProps {
  open: boolean;
  onClose: () => void;
}

const options = [
  { id: 'project', label: 'Projet', icon: FolderKanban, color: 'bg-blue-100 text-blue-600' },
  { id: 'task', label: 'Tâche', icon: CheckSquare, color: 'bg-green-100 text-green-600' },
  { id: 'idea', label: 'Idée / Veille', icon: Lightbulb, color: 'bg-yellow-100 text-yellow-600' },
  { id: 'event', label: 'Événement', icon: Calendar, color: 'bg-purple-100 text-purple-600' },
] as const;

export default function QuickAddModal({ open, onClose }: QuickAddModalProps) {
  const [selectedType, setSelectedType] = useState<AddType>(null);

  const handleClose = () => {
    setSelectedType(null);
    onClose();
  };

  const handleSuccess = () => {
    handleClose();
  };

  if (selectedType === 'project') {
    return (
      <Modal open={open} onClose={handleClose} title="Nouveau projet" size="lg">
        <ProjectForm onSuccess={handleSuccess} onCancel={() => setSelectedType(null)} />
      </Modal>
    );
  }

  if (selectedType === 'task') {
    return (
      <Modal open={open} onClose={handleClose} title="Nouvelle tâche" size="lg">
        <TaskForm onSuccess={handleSuccess} onCancel={() => setSelectedType(null)} />
      </Modal>
    );
  }

  if (selectedType === 'idea') {
    return (
      <Modal open={open} onClose={handleClose} title="Nouvelle idée" size="lg">
        <WatchItemForm onSuccess={handleSuccess} onCancel={() => setSelectedType(null)} />
      </Modal>
    );
  }

  if (selectedType === 'event') {
    return (
      <Modal open={open} onClose={handleClose} title="Nouvel événement" size="lg">
        <TaskForm onSuccess={handleSuccess} onCancel={() => setSelectedType(null)} isEvent />
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={handleClose} title="Ajout rapide">
      <div className="grid grid-cols-2 gap-4">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => setSelectedType(option.id)}
            className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all"
          >
            <div className={`p-3 rounded-full ${option.color}`}>
              <option.icon className="w-6 h-6" />
            </div>
            <span className="font-medium text-gray-700">{option.label}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
