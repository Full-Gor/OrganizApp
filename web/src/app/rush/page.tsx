// Rush Mode - Multi-project management with blinking cascade system
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Zap, Plus, Play, Pause, Check, SkipForward, Clock, AlertTriangle, BarChart3, X, Trash2, StopCircle, FileText, PlusCircle, RotateCcw, GripVertical, Palette, Edit3, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Rush, RushProject, RushWorkflowStep, RushStats, RushColor } from '@/types';
import * as rushStorage from '@/lib/rush-storage';
import DissolveTimer from '@/components/DissolveTimer';

export default function RushPage() {
  const [rushes, setRushes] = useState<Rush[]>([]);
  const [activeRush, setActiveRush] = useState<Rush | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [taskStartTime, setTaskStartTime] = useState<number | null>(null);

  // Load rushes on mount
  useEffect(() => {
    const loaded = rushStorage.getRushes();
    setRushes(loaded);
    const active = loaded.find(r => r.status === 'active');
    if (active) setActiveRush(active);
  }, []);

  // Timer effect
  useEffect(() => {
    if (!activeRush || activeRush.status !== 'active') return;

    const interval = setInterval(() => {
      const project = activeRush.projects.find(p => p.id === activeRush.activeProjectId);
      if (project) {
        const task = project.tasks[project.currentStepIndex];
        if (task?.startedAt) {
          const elapsed = Math.floor((Date.now() - new Date(task.startedAt).getTime()) / 1000);
          setCurrentTime(elapsed);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeRush]);

  const handleCreateRush = (name: string, workflow: Omit<RushWorkflowStep, 'id'>[], projectNames: string[]) => {
    const newRush = rushStorage.createRush(name, workflow, projectNames);
    setRushes(prev => [...prev, newRush]);
    setActiveRush(newRush);
    setShowCreateModal(false);
  };

  const handleActivateProject = (projectId: string) => {
    if (!activeRush) return;
    const updated = rushStorage.activateProject(activeRush.id, projectId);
    if (updated) {
      setActiveRush(updated);
      setRushes(prev => prev.map(r => r.id === updated.id ? updated : r));
    }
  };

  const handleCompleteTask = () => {
    if (!activeRush?.activeProjectId) return;

    // Complete task in current rush
    const updated = rushStorage.completeTask(activeRush.id, activeRush.activeProjectId);
    if (updated) {
      // Find next Rush in the list to make it blink (with wrap-around)
      const currentRushIndex = rushes.findIndex(r => r.id === activeRush.id);
      let updatedRushes = rushes.map(r => r.id === updated.id ? updated : r);

      // Find next non-completed Rush to blink (wrap around to beginning)
      let nextRush: Rush | null = null;

      // First look after current index
      for (let i = currentRushIndex + 1; i < rushes.length; i++) {
        if (rushes[i].status !== 'completed' && rushes[i].id !== activeRush.id) {
          nextRush = rushes[i];
          break;
        }
      }

      // Wrap around: look from beginning up to current index
      if (!nextRush) {
        for (let i = 0; i < currentRushIndex; i++) {
          if (rushes[i].status !== 'completed' && rushes[i].id !== activeRush.id) {
            nextRush = rushes[i];
            break;
          }
        }
      }

      // Make next Rush blink
      if (nextRush) {
        const blinkingRush = rushStorage.setRushBlinking(nextRush.id, true);
        if (blinkingRush) {
          updatedRushes = updatedRushes.map(r => r.id === blinkingRush.id ? blinkingRush : r);
          console.log('[handleCompleteTask] Set blinking on next Rush:', blinkingRush.name);
        }
      }

      setActiveRush(updated);
      setRushes(updatedRushes);
      setCurrentTime(0);
    }
  };

  const handleSkipTask = () => {
    if (!activeRush?.activeProjectId) return;

    // Skip task in current rush
    const updated = rushStorage.skipTask(activeRush.id, activeRush.activeProjectId);
    if (updated) {
      // Find next Rush to switch to
      const currentRushIndex = rushes.findIndex(r => r.id === activeRush.id);
      let updatedRushes = rushes.map(r => r.id === updated.id ? updated : r);

      // Set current Rush as blinking (reminder to come back)
      const currentBlinking = rushStorage.setRushBlinking(activeRush.id, true);
      if (currentBlinking) {
        updatedRushes = updatedRushes.map(r => r.id === currentBlinking.id ? currentBlinking : r);
      }

      // Find next non-completed Rush
      let nextRush: Rush | null = null;
      for (let i = currentRushIndex + 1; i < rushes.length; i++) {
        if (rushes[i].status !== 'completed') {
          nextRush = rushes[i];
          break;
        }
      }
      // Wrap around if needed
      if (!nextRush) {
        for (let i = 0; i < currentRushIndex; i++) {
          if (rushes[i].status !== 'completed') {
            nextRush = rushes[i];
            break;
          }
        }
      }

      // Switch to next Rush if found
      if (nextRush && nextRush.id !== activeRush.id) {
        // Clear blinking on next Rush since we're activating it
        const clearedRush = rushStorage.clearRushBlinking(nextRush.id);
        if (clearedRush) {
          updatedRushes = updatedRushes.map(r => r.id === clearedRush.id ? clearedRush : r);
          setActiveRush(clearedRush);
          console.log('[handleSkipTask] Switched to Rush:', clearedRush.name);
        }
      } else {
        setActiveRush(currentBlinking || updated);
      }

      setRushes(updatedRushes);
      setCurrentTime(0);
    }
  };

  const handleStopBlinking = (projectId: string) => {
    if (!activeRush) return;
    const updated = rushStorage.stopProjectBlinking(activeRush.id, projectId);
    if (updated) {
      setActiveRush(updated);
      setRushes(prev => prev.map(r => r.id === updated.id ? updated : r));
    }
  };

  const handleUpdateNotes = (taskIndex: number, notes: string) => {
    if (!activeRush?.activeProjectId) return;
    const updated = rushStorage.updateTaskNotes(activeRush.id, activeRush.activeProjectId, taskIndex, notes);
    if (updated) {
      setActiveRush(updated);
      setRushes(prev => prev.map(r => r.id === updated.id ? updated : r));
    }
  };

  const handleUpdateProjectNotes = (projectId: string, notes: string) => {
    if (!activeRush) return;
    const updated = rushStorage.updateProjectNotes(activeRush.id, projectId, notes);
    if (updated) {
      setActiveRush(updated);
      setRushes(prev => prev.map(r => r.id === updated.id ? updated : r));
    }
  };

  const handleStartSession = (projectId: string) => {
    if (!activeRush) return;
    const updated = rushStorage.startProjectSession(activeRush.id, projectId);
    if (updated) {
      setActiveRush(updated);
      setRushes(prev => prev.map(r => r.id === updated.id ? updated : r));
    }
  };

  const handleEndSession = (projectId: string) => {
    if (!activeRush) return;
    const updated = rushStorage.endProjectSession(activeRush.id, projectId);
    if (updated) {
      setActiveRush(updated);
      setRushes(prev => prev.map(r => r.id === updated.id ? updated : r));
    }
  };

  const handleResetSession = (projectId: string) => {
    if (!activeRush) return;
    const updated = rushStorage.resetProjectSession(activeRush.id, projectId);
    if (updated) {
      setActiveRush(updated);
      setRushes(prev => prev.map(r => r.id === updated.id ? updated : r));
    }
  };

  const handleInsertTask = (afterIndex: number, title: string, timeLimit?: number) => {
    if (!activeRush) return;
    const updated = rushStorage.insertWorkflowStep(activeRush.id, afterIndex, { title, timeLimit });
    if (updated) {
      setActiveRush(updated);
      setRushes(prev => prev.map(r => r.id === updated.id ? updated : r));
    }
  };

  const handleResetProject = (projectId: string) => {
    if (!activeRush) return;
    const updated = rushStorage.resetProjectTasks(activeRush.id, projectId);
    if (updated) {
      setActiveRush(updated);
      setRushes(prev => prev.map(r => r.id === updated.id ? updated : r));
      setCurrentTime(0);
    }
  };

  const handleDeleteTask = (stepIndex: number) => {
    if (!activeRush) return;
    const updated = rushStorage.deleteWorkflowStep(activeRush.id, stepIndex);
    if (updated) {
      setActiveRush(updated);
      setRushes(prev => prev.map(r => r.id === updated.id ? updated : r));
    }
  };

  const handleReorderTasks = (fromIndex: number, toIndex: number) => {
    if (!activeRush) return;
    const updated = rushStorage.reorderWorkflowSteps(activeRush.id, fromIndex, toIndex);
    if (updated) {
      setActiveRush(updated);
      setRushes(prev => prev.map(r => r.id === updated.id ? updated : r));
    }
  };

  const handleTogglePause = () => {
    if (!activeRush) return;
    const updated = rushStorage.toggleRushPause(activeRush.id);
    if (updated) {
      setActiveRush(updated);
      setRushes(prev => prev.map(r => r.id === updated.id ? updated : r));
    }
  };

  const handleDeleteRush = (id: string) => {
    rushStorage.deleteRush(id);
    setRushes(prev => prev.filter(r => r.id !== id));
    if (activeRush?.id === id) setActiveRush(null);
  };

  const handleUpdateClockTheme = (theme: 'fluid' | 'flap' | 'flap-light') => {
    if (!activeRush) return;
    const updated = rushStorage.updateClockTheme(activeRush.id, theme);
    if (updated) {
      setActiveRush(updated);
      setRushes(prev => prev.map(r => r.id === updated.id ? updated : r));
    }
  };

  const handleUpdateRushColor = (rushId: string, color: RushColor) => {
    const updated = rushStorage.updateRushColor(rushId, color);
    if (updated) {
      setRushes(prev => prev.map(r => r.id === updated.id ? updated : r));
      if (activeRush?.id === updated.id) setActiveRush(updated);
    }
  };

  const handleRenameRush = (rushId: string, newName: string) => {
    const updated = rushStorage.renameRush(rushId, newName);
    if (updated) {
      setRushes(prev => prev.map(r => r.id === updated.id ? updated : r));
      if (activeRush?.id === updated.id) setActiveRush(updated);
    }
  };

  const handleRenameTask = (stepIndex: number, newTitle: string) => {
    if (!activeRush) return;
    const updated = rushStorage.renameWorkflowStep(activeRush.id, stepIndex, newTitle);
    if (updated) {
      setActiveRush(updated);
      setRushes(prev => prev.map(r => r.id === updated.id ? updated : r));
    }
  };

  const getProjectProgress = (project: RushProject) => {
    const completed = project.tasks.filter(t => t.status === 'completed' || t.status === 'skipped').length;
    return Math.round((completed / project.tasks.length) * 100);
  };

  const isProjectCompleted = (project: RushProject) => {
    return project.tasks.every(t => t.status === 'completed' || t.status === 'skipped');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Rush Mode</h1>
            <p className="text-xs sm:text-sm text-gray-500">Gestion multi-projets en parallele</p>
          </div>
        </div>

        {/* Clock Display and Theme Switcher - Mobile: centered row, Desktop: right aligned */}
        {activeRush && (
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-2">
            <DissolveTimer theme={activeRush.clockTheme || 'fluid'} className="scale-90 sm:scale-100" />

            {/* Theme Switcher Buttons */}
            <div className="flex gap-1.5 items-center">
              <button
                onClick={() => handleUpdateClockTheme('fluid')}
                className={cn(
                  'px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                  activeRush.clockTheme === 'fluid'
                    ? 'bg-[#00f5ff] text-[#0a192f] shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-[#00f5ff]'
                )}
              >
                Cyan
              </button>
              <button
                onClick={() => handleUpdateClockTheme('flap')}
                className={cn(
                  'px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                  activeRush.clockTheme === 'flap'
                    ? 'bg-[#e8e8e8] text-[#1a1a1a] shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-[#e8e8e8]'
                )}
              >
                Flap
              </button>
              <button
                onClick={() => handleUpdateClockTheme('flap-light')}
                className={cn(
                  'px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                  activeRush.clockTheme === 'flap-light'
                    ? 'bg-white text-[#1a1a1a] shadow-lg border-2 border-gray-300'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                )}
              >
                Light
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {activeRush && (
            <button
              onClick={() => setShowStatsModal(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Stats</span>
            </button>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouveau Rush</span>
          </button>
        </div>
      </div>

      {/* Rush selector if multiple rushes */}
      {rushes.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {rushes.map(rush => (
            <RushTab
              key={rush.id}
              rush={rush}
              isActive={activeRush?.id === rush.id}
              onSelect={() => {
                if (rush.isBlinking) {
                  const cleared = rushStorage.clearRushBlinking(rush.id);
                  if (cleared) {
                    setRushes(prev => prev.map(r => r.id === cleared.id ? cleared : r));
                    setActiveRush(cleared);
                    return;
                  }
                }
                setActiveRush(rush);
              }}
              onDelete={() => handleDeleteRush(rush.id)}
              onUpdateColor={(color) => handleUpdateRushColor(rush.id, color)}
              onRename={(newName) => handleRenameRush(rush.id, newName)}
              onStopBlinking={() => {
                const stopped = rushStorage.stopRushBlinking(rush.id);
                if (stopped) {
                  setRushes(prev => prev.map(r => r.id === stopped.id ? stopped : r));
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Active Rush Display */}
      {activeRush ? (
        <RushBoard
          rush={activeRush}
          currentTime={currentTime}
          onActivateProject={handleActivateProject}
          onCompleteTask={handleCompleteTask}
          onSkipTask={handleSkipTask}
          onTogglePause={handleTogglePause}
          onStopBlinking={handleStopBlinking}
          onUpdateNotes={handleUpdateNotes}
          onUpdateProjectNotes={handleUpdateProjectNotes}
          onStartSession={handleStartSession}
          onEndSession={handleEndSession}
          onResetSession={handleResetSession}
          onInsertTask={handleInsertTask}
          onResetProject={handleResetProject}
          onDeleteTask={handleDeleteTask}
          onReorderTasks={handleReorderTasks}
          onRenameTask={handleRenameTask}
        />
      ) : (
        <div className="text-center py-20">
          <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-600 mb-2">Aucun Rush actif</h2>
          <p className="text-gray-400 mb-6">Creez un nouveau Rush pour commencer</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Creer un Rush
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateRushModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateRush}
        />
      )}

      {/* Stats Modal */}
      {showStatsModal && activeRush && (
        <StatsModal
          rush={activeRush}
          onClose={() => setShowStatsModal(false)}
        />
      )}
    </div>
  );
}

// RushTab Component - Individual Rush tab with color picker and rename
function RushTab({
  rush,
  isActive,
  onSelect,
  onDelete,
  onUpdateColor,
  onRename,
  onStopBlinking,
}: {
  rush: Rush;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onUpdateColor: (color: RushColor) => void;
  onRename: (newName: string) => void;
  onStopBlinking: () => void;
}) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(rush.name);
  const [blinkState, setBlinkState] = useState(false);

  const isCompleted = rush.status === 'completed';
  const shouldBlink = rush.isBlinking && !rush.blinkingStopped && !isActive && !isCompleted;

  // Fast blinking effect for shouldBlink
  useEffect(() => {
    if (!shouldBlink) return;
    const interval = setInterval(() => {
      setBlinkState(prev => !prev);
    }, 300); // Fast blink: 300ms
    return () => clearInterval(interval);
  }, [shouldBlink]);

  // Get color classes based on rush color
  const getColorClasses = () => {
    if (shouldBlink) {
      // Blink between the rush's color and white
      const colorConfig = rushStorage.RUSH_COLORS.find(c => c.value === rush.color);
      if (colorConfig) {
        return blinkState
          ? `${colorConfig.bg} border-2 ${colorConfig.border} ${colorConfig.text}`
          : `bg-white border-2 ${colorConfig.border} ${colorConfig.text === 'text-white' ? 'text-gray-700' : colorConfig.text}`;
      }
      // Default to orange if no color set
      return blinkState
        ? 'bg-orange-500 border-2 border-orange-500 text-white'
        : 'bg-white border-2 border-orange-500 text-orange-600';
    }
    if (isActive) {
      const colorConfig = rushStorage.RUSH_COLORS.find(c => c.value === rush.color);
      if (colorConfig) return `${colorConfig.bg} ${colorConfig.text}`;
      return 'bg-orange-600 text-white';
    }
    return 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50';
  };

  const handleRename = () => {
    if (editName.trim() && editName.trim() !== rush.name) {
      onRename(editName.trim());
    }
    setIsEditing(false);
  };

  return (
    <div className="relative">
      <div
        className={cn(
          'relative px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer',
          getColorClasses()
        )}
        onClick={() => !isEditing && onSelect()}
      >
        {/* Color indicator dot */}
        {rush.color && !isActive && !shouldBlink && (
          <div className={cn(
            'w-2 h-2 rounded-full',
            rushStorage.RUSH_COLORS.find(c => c.value === rush.color)?.bg || 'bg-gray-400'
          )} />
        )}

        {/* Stop blinking button */}
        {shouldBlink && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStopBlinking();
            }}
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors z-10"
            title="Arreter le clignotement"
          >
            <StopCircle className="w-3 h-3" />
          </button>
        )}

        {/* Name - editable or display */}
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') { setEditName(rush.name); setIsEditing(false); }
            }}
            onClick={(e) => e.stopPropagation()}
            className="bg-transparent border-b border-current outline-none w-20 text-center"
            autoFocus
          />
        ) : (
          <span onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }}>
            {rush.name}
          </span>
        )}

        {isCompleted && <Check className="w-4 h-4" />}

        {/* Edit button */}
        <button
          onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
          className="p-1 hover:bg-black/10 rounded"
          title="Renommer"
        >
          <Edit3 className="w-3 h-3" />
        </button>

        {/* Color picker button */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowColorPicker(!showColorPicker); }}
          className="p-1 hover:bg-black/10 rounded"
          title="Changer la couleur"
        >
          <Palette className="w-3 h-3" />
        </button>

        {/* Delete button */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1 hover:bg-black/10 rounded"
          title="Supprimer"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Color picker dropdown */}
      {showColorPicker && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-20">
          <div className="grid grid-cols-3 gap-1">
            {rushStorage.RUSH_COLORS.map(color => (
              <button
                key={color.value}
                onClick={() => { onUpdateColor(color.value); setShowColorPicker(false); }}
                className={cn(
                  'w-8 h-8 rounded-full transition-transform hover:scale-110',
                  color.bg,
                  rush.color === color.value && 'ring-2 ring-offset-2 ring-gray-400'
                )}
                title={color.label}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Rush Board Component
function RushBoard({
  rush,
  currentTime,
  onActivateProject,
  onCompleteTask,
  onSkipTask,
  onTogglePause,
  onStopBlinking,
  onUpdateNotes,
  onUpdateProjectNotes,
  onStartSession,
  onEndSession,
  onResetSession,
  onInsertTask,
  onResetProject,
  onDeleteTask,
  onReorderTasks,
  onRenameTask,
}: {
  rush: Rush;
  currentTime: number;
  onActivateProject: (id: string) => void;
  onCompleteTask: () => void;
  onSkipTask: () => void;
  onTogglePause: () => void;
  onStopBlinking: (projectId: string) => void;
  onUpdateNotes: (taskIndex: number, notes: string) => void;
  onUpdateProjectNotes: (projectId: string, notes: string) => void;
  onStartSession: (projectId: string) => void;
  onEndSession: (projectId: string) => void;
  onResetSession: (projectId: string) => void;
  onInsertTask: (afterIndex: number, title: string, timeLimit?: number) => void;
  onResetProject: (projectId: string) => void;
  onDeleteTask: (stepIndex: number) => void;
  onReorderTasks: (fromIndex: number, toIndex: number) => void;
  onRenameTask: (stepIndex: number, newTitle: string) => void;
}) {
  const [showInsertModal, setShowInsertModal] = useState<number | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTimeLimit, setNewTaskTimeLimit] = useState<number>(10);
  const [editingNotes, setEditingNotes] = useState<number | null>(null);
  const [notesText, setNotesText] = useState('');
  const [editingProjectNotes, setEditingProjectNotes] = useState<string | null>(null);
  const [projectNotesText, setProjectNotesText] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');

  const activeProject = rush.projects.find(p => p.id === rush.activeProjectId);
  const currentStep = activeProject ? rush.workflow[activeProject.currentStepIndex] : null;
  const currentTask = activeProject ? activeProject.tasks[activeProject.currentStepIndex] : null;

  return (
    <div className="space-y-6">
      {/* Task Controls */}
      <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-4">
            {currentStep && (
              <div className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs sm:text-sm font-medium truncate">
                Tache actuelle: {currentStep.title}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onTogglePause}
              className={cn(
                'p-2 sm:p-3 rounded-lg transition-colors flex-shrink-0',
                rush.status === 'paused' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {rush.status === 'paused' ? <Play className="w-4 h-4 sm:w-5 sm:h-5" /> : <Pause className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            <button
              onClick={onSkipTask}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors font-medium text-sm flex-1 sm:flex-initial justify-center"
              title="Passer cette tache"
            >
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">Passer</span>
            </button>
            <button
              onClick={onCompleteTask}
              className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex-1 sm:flex-initial justify-center"
            >
              <Check className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">Termine</span>
            </button>
          </div>
        </div>
      </div>

      {/* Project Tabs (within current Rush) */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
        {rush.projects.map((project) => {
          const isActive = project.id === rush.activeProjectId;
          const isCompleted = project.tasks.every(t => t.status === 'completed' || t.status === 'skipped');
          const progress = Math.round(
            (project.tasks.filter(t => t.status === 'completed' || t.status === 'skipped').length / project.tasks.length) * 100
          );

          return (
            <div
              key={project.id}
              className={cn(
                'relative flex flex-col items-center px-3 sm:px-4 py-2 sm:py-3 rounded-xl min-w-[100px] sm:min-w-[120px] transition-all border-2 flex-shrink-0',
                isActive
                  ? 'bg-orange-50 border-orange-500 shadow-lg shadow-orange-500/20'
                  : isCompleted
                  ? 'bg-green-50 border-green-300'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              )}
            >
              {/* Notes button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingProjectNotes(project.id);
                  setProjectNotesText(project.notes || '');
                }}
                className={cn(
                  'absolute top-1 right-1 p-1 rounded hover:bg-black/10 transition-colors',
                  project.notes ? 'text-blue-600' : 'text-gray-400'
                )}
                title="Notes du projet"
              >
                <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>

              <div
                className="w-full flex flex-col items-center cursor-pointer"
                onClick={() => onActivateProject(project.id)}
              >
                <span className={cn(
                  'font-medium text-xs sm:text-sm text-center',
                  isActive ? 'text-orange-700' : isCompleted ? 'text-green-700' : 'text-gray-700'
                )}>
                  {project.name}
                </span>

                {/* Mini progress bar */}
                <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all',
                      isCompleted ? 'bg-green-500' : 'bg-orange-500'
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <span className="text-xs text-gray-500 mt-1">
                  {project.currentStepIndex + 1}/{project.tasks.length}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Project Tasks */}
      {activeProject && (
        <div className="bg-white rounded-xl p-3 sm:p-6 shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                {activeProject.name}
              </h3>

              {/* Session Timer */}
              <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                <span className="text-xs sm:text-sm font-mono text-blue-900">
                  {rushStorage.formatTime(rushStorage.getCurrentSessionTime(activeProject))}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onResetSession(activeProject.id);
                  }}
                  className="p-0.5 hover:bg-blue-200 rounded transition-colors"
                  title="Reset session timer"
                >
                  <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600" />
                </button>
              </div>

              {/* Total Time across all sessions */}
              <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-xs text-gray-500">Total:</span>
                <span className="text-xs sm:text-sm font-mono text-gray-700">
                  {rushStorage.formatTime(rushStorage.getProjectTotalTime(activeProject))}
                </span>
              </div>
            </div>

            <button
              onClick={() => onResetProject(activeProject.id)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors self-start sm:self-auto"
              title="Remettre les taches a zero"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>

          <div className="space-y-2">
            {rush.workflow.map((step, index) => {
              const task = activeProject.tasks[index];
              const isCurrentTask = index === activeProject.currentStepIndex;
              const isCompleted = task.status === 'completed';
              const isSkipped = task.status === 'skipped';
              const isDragging = draggedIndex === index;
              const isDragOver = dragOverIndex === index;

              return (
                <div key={step.id}>
                  <div
                    draggable
                    onDragStart={() => setDraggedIndex(index)}
                    onDragEnd={() => {
                      if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
                        onReorderTasks(draggedIndex, dragOverIndex);
                      }
                      setDraggedIndex(null);
                      setDragOverIndex(null);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverIndex(index);
                    }}
                    onDragLeave={() => setDragOverIndex(null)}
                    onTouchStart={() => setDraggedIndex(index)}
                    onTouchEnd={() => {
                      setDraggedIndex(null);
                      setDragOverIndex(null);
                    }}
                    className={cn(
                      'flex items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg transition-all',
                      isCurrentTask
                        ? 'bg-orange-50 border-2 border-orange-300'
                        : isCompleted
                        ? 'bg-green-50'
                        : isSkipped
                        ? 'bg-gray-50 opacity-50'
                        : 'bg-gray-50',
                      isDragging && 'opacity-50 scale-95',
                      isDragOver && 'border-2 border-dashed border-orange-400'
                    )}
                  >
                    {/* Drag handle - hide on mobile */}
                    <div className="hidden sm:block cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 touch-none">
                      <GripVertical className="w-4 h-4" />
                    </div>

                    {/* Status indicator */}
                    <div className={cn(
                      'w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0',
                      isCurrentTask
                        ? 'bg-orange-500 text-white'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : isSkipped
                        ? 'bg-gray-400 text-white'
                        : 'bg-gray-200 text-gray-500'
                    )}>
                      {isCompleted ? (
                        <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : isSkipped ? (
                        <SkipForward className="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : (
                        <span className="text-xs sm:text-sm font-medium">{index + 1}</span>
                      )}
                    </div>

                    {/* Task info */}
                    <div className="flex-1 min-w-0">
                      {editingTaskIndex === index ? (
                        <input
                          type="text"
                          value={editTaskTitle}
                          onChange={(e) => setEditTaskTitle(e.target.value)}
                          onBlur={() => {
                            if (editTaskTitle.trim() && editTaskTitle.trim() !== step.title) {
                              onRenameTask(index, editTaskTitle.trim());
                            }
                            setEditingTaskIndex(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (editTaskTitle.trim() && editTaskTitle.trim() !== step.title) {
                                onRenameTask(index, editTaskTitle.trim());
                              }
                              setEditingTaskIndex(null);
                            }
                            if (e.key === 'Escape') {
                              setEditingTaskIndex(null);
                            }
                          }}
                          className="w-full px-2 py-1 border border-orange-300 rounded text-xs sm:text-sm font-medium"
                          autoFocus
                        />
                      ) : (
                        <div
                          className={cn(
                            'font-medium truncate cursor-pointer hover:underline text-xs sm:text-sm',
                            isCurrentTask ? 'text-orange-700' : isCompleted ? 'text-green-700' : 'text-gray-700'
                          )}
                          onDoubleClick={() => {
                            setEditingTaskIndex(index);
                            setEditTaskTitle(step.title);
                          }}
                          title="Double-cliquer pour renommer"
                        >
                          {step.title}
                        </div>
                      )}
                      {/* Show notes if exists */}
                      {task.notes && (
                        <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                          <FileText className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          <span className="truncate">{task.notes.length > 30 ? task.notes.substring(0, 30) + '...' : task.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Time spent */}
                    {(isCompleted || isCurrentTask) && (
                      <div className={cn(
                        'text-xs sm:text-sm font-mono flex-shrink-0',
                        isCurrentTask ? 'text-orange-600' : 'text-gray-500'
                      )}>
                        {isCurrentTask
                          ? rushStorage.formatTime(currentTime)
                          : rushStorage.formatTime(task.timeSpent)}
                      </div>
                    )}

                    {/* Action buttons group - compact on mobile */}
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      {/* Edit task name button */}
                      <button
                        onClick={() => {
                          setEditingTaskIndex(index);
                          setEditTaskTitle(step.title);
                        }}
                        className="p-1 sm:p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Renommer la tache"
                      >
                        <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </button>

                      {/* Notes button for current task */}
                      {isCurrentTask && (
                        <button
                          onClick={() => {
                            setEditingNotes(index);
                            setNotesText(task.notes || '');
                          }}
                          className="p-1 sm:p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ajouter une note"
                        >
                          <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      )}

                      {/* Delete button */}
                      {rush.workflow.length > 1 && (
                        <button
                          onClick={() => onDeleteTask(index)}
                          className="p-1 sm:p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer cette tache"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Insert task button */}
                  <div className="flex justify-center my-1">
                    <button
                      onClick={() => setShowInsertModal(index)}
                      className="text-xs text-gray-400 hover:text-orange-500 flex items-center gap-1 transition-colors"
                    >
                      <PlusCircle className="w-3 h-3" />
                      Inserer une tache
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Notes editing modal */}
          {editingNotes !== null && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl w-full max-w-md p-6">
                <h3 className="text-lg font-semibold mb-4">Notes pour cette tache</h3>
                <textarea
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Ajouter des notes, observations, problemes..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setEditingNotes(null)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => {
                      onUpdateNotes(editingNotes, notesText);
                      setEditingNotes(null);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Project notes editing modal */}
          {editingProjectNotes !== null && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl w-full max-w-md p-6">
                <h3 className="text-lg font-semibold mb-4">Notes pour ce projet</h3>
                <textarea
                  value={projectNotesText}
                  onChange={(e) => setProjectNotesText(e.target.value)}
                  placeholder="Ajouter des notes sur ce projet: observations, problemes, liens utiles..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setEditingProjectNotes(null)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => {
                      onUpdateProjectNotes(editingProjectNotes, projectNotesText);
                      setEditingProjectNotes(null);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Insert task modal */}
          {showInsertModal !== null && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl w-full max-w-md p-6">
                <h3 className="text-lg font-semibold mb-4">Inserer une nouvelle tache</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la tache</label>
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Ex: Revue de code"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Limite de temps (min)</label>
                    <input
                      type="number"
                      value={newTaskTimeLimit}
                      onChange={(e) => setNewTaskTimeLimit(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end mt-6">
                  <button
                    onClick={() => { setShowInsertModal(null); setNewTaskTitle(''); }}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => {
                      if (newTaskTitle.trim()) {
                        onInsertTask(showInsertModal, newTaskTitle.trim(), newTaskTimeLimit || undefined);
                        setShowInsertModal(null);
                        setNewTaskTitle('');
                        setNewTaskTimeLimit(10);
                      }
                    }}
                    disabled={!newTaskTitle.trim()}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                  >
                    Inserer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Project total time */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
            <span className="text-sm text-gray-600">Temps total projet</span>
            <span className="font-mono font-medium text-gray-900">
              {rushStorage.formatTime(activeProject.totalTimeSpent + currentTime)}
            </span>
          </div>
        </div>
      )}

      {/* Waiting Projects Alert */}
      {rush.projects.some(p => rushStorage.getWaitingTime(p) > 180 && p.id !== rush.activeProjectId) && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-orange-700 font-medium mb-2">
            <AlertTriangle className="w-5 h-5" />
            Projets en attente
          </div>
          <div className="space-y-1">
            {rush.projects
              .filter(p => rushStorage.getWaitingTime(p) > 180 && p.id !== rush.activeProjectId)
              .sort((a, b) => rushStorage.getWaitingTime(b) - rushStorage.getWaitingTime(a))
              .map(p => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-orange-800">{p.name}</span>
                  <span className={cn(
                    'font-mono',
                    rushStorage.getWaitingTime(p) > 300 ? 'text-red-600 font-bold' : 'text-orange-600'
                  )}>
                    {Math.floor(rushStorage.getWaitingTime(p) / 60)} min
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Create Rush Modal
function CreateRushModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, workflow: Omit<RushWorkflowStep, 'id'>[], projectNames: string[]) => void;
}) {
  const [name, setName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [customWorkflow, setCustomWorkflow] = useState<{ title: string; timeLimit: number }[]>([]);
  const [projectNames, setProjectNames] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const projects = projectNames.split('\n').map(p => p.trim()).filter(Boolean);
    if (!name || projects.length === 0) return;

    const workflow = useCustom
      ? customWorkflow.map((w, i) => ({ title: w.title, order: i + 1, timeLimit: w.timeLimit || undefined }))
      : rushStorage.DEFAULT_WORKFLOWS[selectedTemplate].steps;

    onCreate(name, workflow, projects);
  };

  const addCustomStep = () => {
    setCustomWorkflow(prev => [...prev, { title: '', timeLimit: 10 }]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Nouveau Rush</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Rush Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nom du Rush</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Sprint Apps Semaine 47"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Workflow Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Workflow</label>
            <div className="space-y-2">
              {rushStorage.DEFAULT_WORKFLOWS.map((wf, index) => (
                <label
                  key={index}
                  className={cn(
                    'flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors',
                    selectedTemplate === index && !useCustom
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <input
                    type="radio"
                    name="template"
                    checked={selectedTemplate === index && !useCustom}
                    onChange={() => { setSelectedTemplate(index); setUseCustom(false); }}
                    className="text-orange-500"
                  />
                  <div>
                    <div className="font-medium">{wf.name}</div>
                    <div className="text-xs text-gray-500">{wf.steps.length} etapes</div>
                  </div>
                </label>
              ))}

              <label
                className={cn(
                  'flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors',
                  useCustom
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <input
                  type="radio"
                  name="template"
                  checked={useCustom}
                  onChange={() => setUseCustom(true)}
                  className="text-orange-500"
                />
                <div>
                  <div className="font-medium">Personnalise</div>
                  <div className="text-xs text-gray-500">Creer vos propres etapes</div>
                </div>
              </label>
            </div>
          </div>

          {/* Custom Workflow Editor */}
          {useCustom && (
            <div className="space-y-2">
              {customWorkflow.map((step, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={step.title}
                    onChange={(e) => {
                      const updated = [...customWorkflow];
                      updated[index].title = e.target.value;
                      setCustomWorkflow(updated);
                    }}
                    placeholder={`Etape ${index + 1}`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="number"
                    value={step.timeLimit}
                    onChange={(e) => {
                      const updated = [...customWorkflow];
                      updated[index].timeLimit = parseInt(e.target.value) || 0;
                      setCustomWorkflow(updated);
                    }}
                    placeholder="min"
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setCustomWorkflow(prev => prev.filter((_, i) => i !== index))}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addCustomStep}
                className="text-sm text-orange-600 hover:text-orange-700"
              >
                + Ajouter une etape
              </button>
            </div>
          )}

          {/* Project Names */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Projets (un par ligne)
            </label>
            <textarea
              value={projectNames}
              onChange={(e) => setProjectNames(e.target.value)}
              placeholder="App Client A&#10;App Client B&#10;App Client C"
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!name || !projectNames.trim()}
            className="w-full py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Creer le Rush
          </button>
        </form>
      </div>
    </div>
  );
}

// Stats Modal
function StatsModal({ rush, onClose }: { rush: Rush; onClose: () => void }) {
  const stats = rushStorage.getRushStats(rush);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Statistiques</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Progress */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-gray-900">
                {stats.completedProjects}/{stats.totalProjects}
              </div>
              <div className="text-sm text-gray-500">Projets termines</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-gray-900">
                {stats.completedTasks}/{stats.totalTasks}
              </div>
              <div className="text-sm text-gray-500">Taches terminees</div>
            </div>
          </div>

          {/* Time Stats */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Temps total</span>
              <span className="font-mono font-bold text-gray-900">
                {rushStorage.formatTime(rush.totalTimeSpent)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Moyenne par tache</span>
              <span className="font-mono font-bold text-gray-900">
                {rushStorage.formatTime(stats.averageTimePerTask)}
              </span>
            </div>
            {stats.fastestProject && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Projet le plus rapide</span>
                <span className="text-green-600 font-medium">
                  {stats.fastestProject.name} ({rushStorage.formatTime(stats.fastestProject.time)})
                </span>
              </div>
            )}
            {stats.slowestProject && stats.slowestProject !== stats.fastestProject && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Projet le plus lent</span>
                <span className="text-orange-600 font-medium">
                  {stats.slowestProject.name} ({rushStorage.formatTime(stats.slowestProject.time)})
                </span>
              </div>
            )}
          </div>

          {/* Per Project Stats */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Par projet</h3>
            <div className="space-y-2">
              {rush.projects
                .sort((a, b) => b.totalTimeSpent - a.totalTimeSpent)
                .map(project => {
                  const completed = project.tasks.filter(t => t.status === 'completed').length;
                  const progress = Math.round((completed / project.tasks.length) * 100);
                  return (
                    <div key={project.id} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{project.name}</span>
                          <span className="text-gray-500">{progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-500 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <span className="font-mono text-sm text-gray-600 w-16 text-right">
                        {rushStorage.formatTime(project.totalTimeSpent)}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
