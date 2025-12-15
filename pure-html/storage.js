/**
 * OrganizApp - Storage Module (Pure JavaScript)
 * Gestion du stockage localStorage pour Rush Mode
 */

// ==================== //
// STORAGE KEYS         //
// ==================== //
const RUSH_STORAGE_KEY = 'organizapp_rushes';
const WORKFLOW_STORAGE_KEY = 'organizapp_workflows';

// ==================== //
// UTILITY FUNCTIONS    //
// ==================== //

function generateId() {
  return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ==================== //
// DEFAULT WORKFLOWS    //
// ==================== //

const DEFAULT_WORKFLOWS = [
  {
    name: 'Feature Simple',
    steps: [
      { title: 'Feature', order: 1, timeLimit: 30 },
      { title: 'Commit Push PR', order: 2, timeLimit: 5 },
      { title: 'Vercel Test', order: 3, timeLimit: 10 },
      { title: 'Correction', order: 4, timeLimit: 15 },
    ],
  },
  {
    name: 'App Mobile (Expo)',
    steps: [
      { title: 'Clone repo', order: 1, timeLimit: 5 },
      { title: 'Verifier dependances', order: 2, timeLimit: 5 },
      { title: 'Lancer Expo/localhost', order: 3, timeLimit: 10 },
      { title: 'Integration feature', order: 4, timeLimit: 30 },
      { title: 'Commit & Push', order: 5, timeLimit: 5 },
      { title: 'Test', order: 6, timeLimit: 15 },
      { title: 'Deploy Vercel', order: 7, timeLimit: 10 },
      { title: 'Test final', order: 8, timeLimit: 10 },
    ],
  },
  {
    name: 'Web App (Next.js)',
    steps: [
      { title: 'Clone repo', order: 1, timeLimit: 5 },
      { title: 'npm install', order: 2, timeLimit: 5 },
      { title: 'Lancer dev server', order: 3, timeLimit: 5 },
      { title: 'Implementation', order: 4, timeLimit: 45 },
      { title: 'Commit & Push', order: 5, timeLimit: 5 },
      { title: 'Test local', order: 6, timeLimit: 15 },
      { title: 'Deploy', order: 7, timeLimit: 10 },
      { title: 'Test production', order: 8, timeLimit: 10 },
    ],
  },
];

// Color mapping for Rush tabs
const RUSH_COLORS = [
  { value: 'gray', label: 'Gris', bg: '#374151', text: '#ffffff', border: '#374151' },
  { value: 'blue', label: 'Bleu', bg: '#3b82f6', text: '#ffffff', border: '#3b82f6' },
  { value: 'red', label: 'Rouge', bg: '#ef4444', text: '#ffffff', border: '#ef4444' },
  { value: 'orange', label: 'Orange', bg: '#f97316', text: '#ffffff', border: '#f97316' },
  { value: 'violet', label: 'Violet', bg: '#8b5cf6', text: '#ffffff', border: '#8b5cf6' },
  { value: 'green', label: 'Vert', bg: '#22c55e', text: '#ffffff', border: '#22c55e' },
  { value: 'cyan', label: 'Cyan', bg: '#06b6d4', text: '#ffffff', border: '#06b6d4' },
  { value: 'pink', label: 'Rose', bg: '#ec4899', text: '#ffffff', border: '#ec4899' },
  { value: 'yellow', label: 'Jaune', bg: '#eab308', text: '#713f12', border: '#eab308' },
];

// ==================== //
// RUSH STORAGE         //
// ==================== //

function isValidRush(rush) {
  if (!rush || typeof rush !== 'object') return false;
  if (typeof rush.id !== 'string' || typeof rush.name !== 'string') return false;
  if (!Array.isArray(rush.workflow) || !Array.isArray(rush.projects)) return false;

  for (const step of rush.workflow) {
    if (!step || typeof step !== 'object') return false;
    if (typeof step.id !== 'string' || typeof step.title !== 'string') return false;
  }

  for (const project of rush.projects) {
    if (!project || typeof project !== 'object') return false;
    if (typeof project.id !== 'string' || typeof project.name !== 'string') return false;
    if (!Array.isArray(project.tasks)) return false;
  }

  return true;
}

function getRushes() {
  try {
    const data = localStorage.getItem(RUSH_STORAGE_KEY);
    if (!data) return [];

    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];

    const validRushes = parsed.filter(rush => isValidRush(rush));

    if (validRushes.length !== parsed.length) {
      localStorage.setItem(RUSH_STORAGE_KEY, JSON.stringify(validRushes));
    }

    return validRushes;
  } catch (e) {
    console.error('Error loading rushes:', e);
    return [];
  }
}

function getRush(id) {
  const rushes = getRushes();
  return rushes.find(r => r.id === id) || null;
}

function saveRush(rush) {
  const rushes = getRushes();
  const index = rushes.findIndex(r => r.id === rush.id);
  if (index >= 0) {
    rushes[index] = rush;
  } else {
    rushes.push(rush);
  }
  localStorage.setItem(RUSH_STORAGE_KEY, JSON.stringify(rushes));
}

function deleteRush(id) {
  const rushes = getRushes().filter(r => r.id !== id);
  localStorage.setItem(RUSH_STORAGE_KEY, JSON.stringify(rushes));
}

function createRush(name, workflow, projectNames) {
  const now = new Date().toISOString();

  const workflowSteps = workflow.map((step, index) => ({
    ...step,
    id: generateId(),
    order: index + 1,
  }));

  const projects = projectNames.map(projectName => ({
    id: generateId(),
    name: projectName,
    currentStepIndex: 0,
    tasks: workflowSteps.map(step => ({
      stepId: step.id,
      status: 'pending',
      timeSpent: 0,
    })),
    totalTimeSpent: 0,
    sessions: [],
    createdAt: now,
  }));

  const rush = {
    id: generateId(),
    name,
    workflow: workflowSteps,
    projects,
    status: 'active',
    activeProjectId: projects[0]?.id,
    totalTimeSpent: 0,
    createdAt: now,
    updatedAt: now,
  };

  saveRush(rush);
  return rush;
}

function activateProject(rushId, projectId) {
  const rush = getRush(rushId);
  if (!rush) return null;

  const now = new Date().toISOString();

  if (rush.activeProjectId && rush.activeProjectId !== projectId) {
    const prevProject = rush.projects.find(p => p.id === rush.activeProjectId);
    if (prevProject) {
      prevProject.waitingSince = now;
    }
  }

  rush.activeProjectId = projectId;
  const project = rush.projects.find(p => p.id === projectId);
  if (project) {
    project.waitingSince = undefined;
    project.isBlinking = false;

    if (!project.sessions) {
      project.sessions = [];
    }

    if (!project.currentSessionStart) {
      project.currentSessionStart = now;
    }

    const currentTask = project.tasks[project.currentStepIndex];
    if (currentTask && currentTask.status === 'pending') {
      currentTask.status = 'in_progress';
      currentTask.startedAt = now;
    }
  }

  rush.updatedAt = now;
  saveRush(rush);
  return rush;
}

function completeTask(rushId, projectId) {
  const rush = getRush(rushId);
  if (!rush) return null;

  const project = rush.projects.find(p => p.id === projectId);
  if (!project) return null;

  const now = new Date().toISOString();
  const currentTask = project.tasks[project.currentStepIndex];

  if (currentTask) {
    currentTask.status = 'completed';
    currentTask.completedAt = now;

    if (currentTask.startedAt) {
      const elapsed = Math.floor((new Date(now).getTime() - new Date(currentTask.startedAt).getTime()) / 1000);
      currentTask.timeSpent = elapsed;
      project.totalTimeSpent += elapsed;
      rush.totalTimeSpent += elapsed;
    }

    if (project.currentStepIndex < project.tasks.length - 1) {
      project.currentStepIndex++;
      const nextTask = project.tasks[project.currentStepIndex];
      nextTask.status = 'in_progress';
      nextTask.startedAt = now;
    } else {
      const allCompleted = rush.projects.every(p =>
        p.tasks.every(t => t.status === 'completed' || t.status === 'skipped')
      );
      if (allCompleted) {
        rush.status = 'completed';
        rush.completedAt = now;
      }
    }
  }

  rush.updatedAt = now;
  saveRush(rush);
  return rush;
}

function skipTask(rushId, projectId) {
  const rush = getRush(rushId);
  if (!rush) return null;

  const project = rush.projects.find(p => p.id === projectId);
  if (!project) return null;

  const now = new Date().toISOString();
  const currentTask = project.tasks[project.currentStepIndex];

  if (currentTask) {
    currentTask.status = 'skipped';
    currentTask.completedAt = now;

    if (project.currentStepIndex < project.tasks.length - 1) {
      project.currentStepIndex++;
      const nextTask = project.tasks[project.currentStepIndex];
      nextTask.status = 'in_progress';
      nextTask.startedAt = now;
    }
  }

  rush.updatedAt = now;
  saveRush(rush);
  return rush;
}

function toggleRushPause(rushId) {
  const rush = getRush(rushId);
  if (!rush) return null;

  rush.status = rush.status === 'paused' ? 'active' : 'paused';
  rush.updatedAt = new Date().toISOString();
  saveRush(rush);
  return rush;
}

function getRushStats(rush) {
  const totalProjects = rush.projects.length;
  const completedProjects = rush.projects.filter(p =>
    p.tasks.every(t => t.status === 'completed' || t.status === 'skipped')
  ).length;

  const totalTasks = rush.projects.reduce((sum, p) => sum + p.tasks.length, 0);
  const completedTasks = rush.projects.reduce(
    (sum, p) => sum + p.tasks.filter(t => t.status === 'completed').length,
    0
  );

  const completedTaskTimes = rush.projects.flatMap(p =>
    p.tasks.filter(t => t.status === 'completed' && t.timeSpent > 0).map(t => t.timeSpent)
  );
  const averageTimePerTask = completedTaskTimes.length > 0
    ? Math.floor(completedTaskTimes.reduce((a, b) => a + b, 0) / completedTaskTimes.length)
    : 0;

  const completedProjectsData = rush.projects
    .filter(p => p.tasks.every(t => t.status === 'completed' || t.status === 'skipped'))
    .map(p => ({ name: p.name, time: p.totalTimeSpent }))
    .sort((a, b) => a.time - b.time);

  return {
    totalProjects,
    completedProjects,
    totalTasks,
    completedTasks,
    averageTimePerTask,
    fastestProject: completedProjectsData[0],
    slowestProject: completedProjectsData[completedProjectsData.length - 1],
  };
}

function getWaitingTime(project) {
  if (!project.waitingSince) return 0;
  return Math.floor((Date.now() - new Date(project.waitingSince).getTime()) / 1000);
}

function setRushBlinking(rushId, isBlinking) {
  const rush = getRush(rushId);
  if (!rush) return null;

  rush.isBlinking = isBlinking;
  if (isBlinking) {
    rush.blinkingStopped = false;
  }

  rush.updatedAt = new Date().toISOString();
  saveRush(rush);
  return rush;
}

function stopRushBlinking(rushId) {
  const rush = getRush(rushId);
  if (!rush) return null;

  rush.isBlinking = false;
  rush.blinkingStopped = true;

  rush.updatedAt = new Date().toISOString();
  saveRush(rush);
  return rush;
}

function clearRushBlinking(rushId) {
  const rush = getRush(rushId);
  if (!rush) return null;

  rush.isBlinking = false;

  rush.updatedAt = new Date().toISOString();
  saveRush(rush);
  return rush;
}

function stopProjectBlinking(rushId, projectId) {
  const rush = getRush(rushId);
  if (!rush) return null;

  const project = rush.projects.find(p => p.id === projectId);
  if (project) {
    project.isBlinking = false;
    project.blinkingStopped = true;
  }

  rush.updatedAt = new Date().toISOString();
  saveRush(rush);
  return rush;
}

function updateTaskNotes(rushId, projectId, taskIndex, notes) {
  const rush = getRush(rushId);
  if (!rush) return null;

  const project = rush.projects.find(p => p.id === projectId);
  if (!project) return null;

  const task = project.tasks[taskIndex];
  if (task) {
    task.notes = notes;
  }

  rush.updatedAt = new Date().toISOString();
  saveRush(rush);
  return rush;
}

function updateProjectNotes(rushId, projectId, notes) {
  const rush = getRush(rushId);
  if (!rush) return null;

  const project = rush.projects.find(p => p.id === projectId);
  if (!project) return null;

  project.notes = notes;

  rush.updatedAt = new Date().toISOString();
  saveRush(rush);
  return rush;
}

function startProjectSession(rushId, projectId) {
  const rush = getRush(rushId);
  if (!rush) return null;

  const project = rush.projects.find(p => p.id === projectId);
  if (!project) return null;

  if (project.currentSessionStart) {
    endProjectSession(rushId, projectId);
  }

  project.currentSessionStart = new Date().toISOString();

  rush.updatedAt = new Date().toISOString();
  saveRush(rush);
  return rush;
}

function endProjectSession(rushId, projectId, notes) {
  const rush = getRush(rushId);
  if (!rush) return null;

  const project = rush.projects.find(p => p.id === projectId);
  if (!project || !project.currentSessionStart) return null;

  const now = new Date().toISOString();
  const duration = Math.floor((new Date(now).getTime() - new Date(project.currentSessionStart).getTime()) / 1000);

  if (!project.sessions) {
    project.sessions = [];
  }

  const session = {
    id: generateId(),
    startedAt: project.currentSessionStart,
    endedAt: now,
    duration,
    notes,
  };
  project.sessions.push(session);

  project.currentSessionStart = undefined;

  rush.updatedAt = new Date().toISOString();
  saveRush(rush);
  return rush;
}

function resetProjectSession(rushId, projectId) {
  endProjectSession(rushId, projectId);
  return startProjectSession(rushId, projectId);
}

function getProjectTotalTime(project) {
  if (!project.sessions) return project.totalTimeSpent || 0;

  const sessionsTotal = project.sessions.reduce((sum, session) => sum + session.duration, 0);

  if (project.currentSessionStart) {
    const currentDuration = Math.floor((Date.now() - new Date(project.currentSessionStart).getTime()) / 1000);
    return sessionsTotal + currentDuration;
  }

  return sessionsTotal;
}

function getCurrentSessionTime(project) {
  if (!project.currentSessionStart) return 0;
  return Math.floor((Date.now() - new Date(project.currentSessionStart).getTime()) / 1000);
}

function updateClockTheme(rushId, theme) {
  const rush = getRush(rushId);
  if (!rush) return null;

  rush.clockTheme = theme;
  rush.updatedAt = new Date().toISOString();
  saveRush(rush);
  return rush;
}

function insertWorkflowStep(rushId, afterIndex, stepData) {
  const rush = getRush(rushId);
  if (!rush) return null;

  const now = new Date().toISOString();
  const newStepId = generateId();

  const newStep = {
    id: newStepId,
    title: stepData.title,
    order: afterIndex + 2,
    timeLimit: stepData.timeLimit,
  };

  rush.workflow.splice(afterIndex + 1, 0, newStep);

  rush.workflow.forEach((step, i) => {
    step.order = i + 1;
  });

  rush.projects.forEach(project => {
    const newTask = {
      stepId: newStepId,
      status: 'pending',
      timeSpent: 0,
    };
    project.tasks.splice(afterIndex + 1, 0, newTask);

    if (project.currentStepIndex > afterIndex) {
      project.currentStepIndex++;
    }
  });

  rush.updatedAt = now;
  saveRush(rush);
  return rush;
}

function resetProjectTasks(rushId, projectId) {
  const rush = getRush(rushId);
  if (!rush) return null;

  const project = rush.projects.find(p => p.id === projectId);
  if (!project) return null;

  const now = new Date().toISOString();

  project.tasks.forEach(task => {
    task.status = 'pending';
    task.startedAt = undefined;
    task.completedAt = undefined;
    task.timeSpent = 0;
  });

  project.currentStepIndex = 0;
  project.totalTimeSpent = 0;
  project.isBlinking = false;
  project.blinkingStopped = false;

  const firstTask = project.tasks[0];
  if (firstTask) {
    firstTask.status = 'in_progress';
    firstTask.startedAt = now;
  }

  if (rush.status === 'completed') {
    rush.status = 'active';
    rush.completedAt = undefined;
  }

  rush.updatedAt = now;
  saveRush(rush);
  return rush;
}

function deleteWorkflowStep(rushId, stepIndex) {
  const rush = getRush(rushId);
  if (!rush) return null;

  if (rush.workflow.length <= 1) return null;

  const now = new Date().toISOString();

  rush.workflow.splice(stepIndex, 1);

  rush.workflow.forEach((step, i) => {
    step.order = i + 1;
  });

  rush.projects.forEach(project => {
    project.tasks.splice(stepIndex, 1);

    if (project.currentStepIndex >= stepIndex) {
      project.currentStepIndex = Math.max(0, project.currentStepIndex - 1);
    }
    if (project.currentStepIndex >= project.tasks.length) {
      project.currentStepIndex = project.tasks.length - 1;
    }
  });

  rush.updatedAt = now;
  saveRush(rush);
  return rush;
}

function reorderWorkflowSteps(rushId, fromIndex, toIndex) {
  const rush = getRush(rushId);
  if (!rush) return null;

  if (fromIndex === toIndex) return rush;
  if (fromIndex < 0 || fromIndex >= rush.workflow.length) return null;
  if (toIndex < 0 || toIndex >= rush.workflow.length) return null;

  const now = new Date().toISOString();

  const [movedStep] = rush.workflow.splice(fromIndex, 1);
  rush.workflow.splice(toIndex, 0, movedStep);

  rush.workflow.forEach((step, i) => {
    step.order = i + 1;
  });

  rush.projects.forEach(project => {
    const [movedTask] = project.tasks.splice(fromIndex, 1);
    project.tasks.splice(toIndex, 0, movedTask);

    if (project.currentStepIndex === fromIndex) {
      project.currentStepIndex = toIndex;
    } else if (fromIndex < project.currentStepIndex && toIndex >= project.currentStepIndex) {
      project.currentStepIndex--;
    } else if (fromIndex > project.currentStepIndex && toIndex <= project.currentStepIndex) {
      project.currentStepIndex++;
    }
  });

  rush.updatedAt = now;
  saveRush(rush);
  return rush;
}

function updateRushColor(rushId, color) {
  const rush = getRush(rushId);
  if (!rush) return null;

  rush.color = color;
  rush.updatedAt = new Date().toISOString();
  saveRush(rush);
  return rush;
}

function renameRush(rushId, newName) {
  const rush = getRush(rushId);
  if (!rush) return null;

  rush.name = newName.trim();
  rush.updatedAt = new Date().toISOString();
  saveRush(rush);
  return rush;
}

function renameWorkflowStep(rushId, stepIndex, newTitle) {
  const rush = getRush(rushId);
  if (!rush) return null;

  if (stepIndex < 0 || stepIndex >= rush.workflow.length) return null;

  rush.workflow[stepIndex].title = newTitle.trim();
  rush.updatedAt = new Date().toISOString();
  saveRush(rush);
  return rush;
}

function applyWorkflowToRushes(rushIds, workflowSteps) {
  const result = { success: [], failed: [] };
  const now = new Date().toISOString();

  for (const rushId of rushIds) {
    const rush = getRush(rushId);
    if (!rush) {
      result.failed.push(rushId);
      continue;
    }

    const newWorkflow = workflowSteps.map((step, index) => ({
      id: generateId(),
      title: step.title,
      order: index,
      timeLimit: step.timeLimit,
    }));

    rush.projects.forEach(project => {
      project.currentStepIndex = 0;
      project.tasks = newWorkflow.map(step => ({
        stepId: step.id,
        status: 'pending',
        timeSpent: 0,
      }));
      if (project.tasks.length > 0) {
        project.tasks[0].status = 'in_progress';
        project.tasks[0].startedAt = now;
      }
    });

    rush.workflow = newWorkflow;
    rush.updatedAt = now;
    saveRush(rush);
    result.success.push(rushId);
  }

  return result;
}

// ==================== //
// WORKFLOW STORAGE     //
// ==================== //

function getSavedWorkflows() {
  const defaultWorkflows = DEFAULT_WORKFLOWS.map((template, index) => ({
    id: `default-${index}`,
    name: template.name,
    steps: template.steps.map((step, i) => ({
      title: step.title,
      order: i,
      timeLimit: step.timeLimit,
    })),
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  try {
    const data = localStorage.getItem(WORKFLOW_STORAGE_KEY);
    const customWorkflows = data ? JSON.parse(data) : [];
    return [...defaultWorkflows, ...customWorkflows];
  } catch (e) {
    console.error('Error loading workflows:', e);
    return defaultWorkflows;
  }
}

function getCustomWorkflows() {
  try {
    const data = localStorage.getItem(WORKFLOW_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error loading custom workflows:', e);
    return [];
  }
}

function saveCustomWorkflows(workflows) {
  localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(workflows));
}

function createWorkflow(name, steps) {
  const now = new Date().toISOString();
  const newWorkflow = {
    id: `workflow-${Date.now()}`,
    name,
    steps: steps.map((step, index) => ({
      ...step,
      order: index,
    })),
    isDefault: false,
    createdAt: now,
    updatedAt: now,
  };

  const customWorkflows = getCustomWorkflows();
  customWorkflows.push(newWorkflow);
  saveCustomWorkflows(customWorkflows);

  return newWorkflow;
}

function deleteWorkflow(id) {
  const customWorkflows = getCustomWorkflows();
  const filtered = customWorkflows.filter(w => w.id !== id);

  if (filtered.length === customWorkflows.length) return false;

  saveCustomWorkflows(filtered);
  return true;
}

// ==================== //
// EXPORTS              //
// ==================== //

window.RushStorage = {
  // Utils
  generateId,
  formatTime,

  // Constants
  DEFAULT_WORKFLOWS,
  RUSH_COLORS,

  // Rush CRUD
  getRushes,
  getRush,
  saveRush,
  deleteRush,
  createRush,

  // Rush Actions
  activateProject,
  completeTask,
  skipTask,
  toggleRushPause,
  getRushStats,
  getWaitingTime,

  // Blinking
  setRushBlinking,
  stopRushBlinking,
  clearRushBlinking,
  stopProjectBlinking,

  // Notes
  updateTaskNotes,
  updateProjectNotes,

  // Sessions
  startProjectSession,
  endProjectSession,
  resetProjectSession,
  getProjectTotalTime,
  getCurrentSessionTime,

  // Workflow
  updateClockTheme,
  insertWorkflowStep,
  resetProjectTasks,
  deleteWorkflowStep,
  reorderWorkflowSteps,

  // Rush Config
  updateRushColor,
  renameRush,
  renameWorkflowStep,
  applyWorkflowToRushes,

  // Workflow Storage
  getSavedWorkflows,
  getCustomWorkflows,
  createWorkflow,
  deleteWorkflow,
};
