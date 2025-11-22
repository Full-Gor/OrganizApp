import { Rush, RushProject, RushWorkflowStep, RushStats, RushTaskStatus } from '@/types';
import { generateId } from './utils';

const RUSH_STORAGE_KEY = 'organizapp_rushes';
const RUSH_TEMPLATES_KEY = 'organizapp_rush_templates';

// Default workflow templates
export const DEFAULT_WORKFLOWS: { name: string; steps: Omit<RushWorkflowStep, 'id'>[] }[] = [
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

// Get all rushes
export function getRushes(): Rush[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(RUSH_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error loading rushes:', e);
    return [];
  }
}

// Get a single rush by ID
export function getRush(id: string): Rush | null {
  const rushes = getRushes();
  return rushes.find(r => r.id === id) || null;
}

// Save a rush
export function saveRush(rush: Rush): void {
  const rushes = getRushes();
  const index = rushes.findIndex(r => r.id === rush.id);
  if (index >= 0) {
    rushes[index] = rush;
  } else {
    rushes.push(rush);
  }
  localStorage.setItem(RUSH_STORAGE_KEY, JSON.stringify(rushes));
}

// Delete a rush
export function deleteRush(id: string): void {
  const rushes = getRushes().filter(r => r.id !== id);
  localStorage.setItem(RUSH_STORAGE_KEY, JSON.stringify(rushes));
}

// Create a new rush
export function createRush(
  name: string,
  workflow: Omit<RushWorkflowStep, 'id'>[],
  projectNames: string[]
): Rush {
  const now = new Date().toISOString();

  const workflowSteps: RushWorkflowStep[] = workflow.map((step, index) => ({
    ...step,
    id: generateId(),
    order: index + 1,
  }));

  const projects: RushProject[] = projectNames.map(projectName => ({
    id: generateId(),
    name: projectName,
    currentStepIndex: 0,
    tasks: workflowSteps.map(step => ({
      stepId: step.id,
      status: 'pending' as RushTaskStatus,
      timeSpent: 0,
    })),
    totalTimeSpent: 0,
    createdAt: now,
  }));

  const rush: Rush = {
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

// Start working on a project
export function activateProject(rushId: string, projectId: string): Rush | null {
  const rush = getRush(rushId);
  if (!rush) return null;

  const now = new Date().toISOString();

  // Mark previous active project as waiting
  if (rush.activeProjectId && rush.activeProjectId !== projectId) {
    const prevProject = rush.projects.find(p => p.id === rush.activeProjectId);
    if (prevProject) {
      prevProject.waitingSince = now;
    }
  }

  // Activate new project
  rush.activeProjectId = projectId;
  const project = rush.projects.find(p => p.id === projectId);
  if (project) {
    project.waitingSince = undefined;
    // Clear blinking when project is activated (user acknowledged notification)
    project.isBlinking = false;

    // Start current task if not started
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

// Complete current task and move to next
export function completeTask(rushId: string, projectId: string): Rush | null {
  const rush = getRush(rushId);
  if (!rush) return null;

  const project = rush.projects.find(p => p.id === projectId);
  if (!project) return null;

  const now = new Date().toISOString();
  const currentTask = project.tasks[project.currentStepIndex];

  if (currentTask) {
    currentTask.status = 'completed';
    currentTask.completedAt = now;

    // Calculate time spent if we have startedAt
    if (currentTask.startedAt) {
      const elapsed = Math.floor((new Date(now).getTime() - new Date(currentTask.startedAt).getTime()) / 1000);
      currentTask.timeSpent = elapsed;
      project.totalTimeSpent += elapsed;
      rush.totalTimeSpent += elapsed;
    }

    // Move to next task
    if (project.currentStepIndex < project.tasks.length - 1) {
      project.currentStepIndex++;
      const nextTask = project.tasks[project.currentStepIndex];
      nextTask.status = 'in_progress';
      nextTask.startedAt = now;
    } else {
      // Project completed - check if all projects are done
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

// Skip current task
export function skipTask(rushId: string, projectId: string): Rush | null {
  const rush = getRush(rushId);
  if (!rush) return null;

  const project = rush.projects.find(p => p.id === projectId);
  if (!project) return null;

  const now = new Date().toISOString();
  const currentTask = project.tasks[project.currentStepIndex];

  if (currentTask) {
    currentTask.status = 'skipped';
    currentTask.completedAt = now;

    // Move to next task
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

// Update time spent on current task (called periodically)
export function updateTaskTime(rushId: string, projectId: string, timeSpent: number): void {
  const rush = getRush(rushId);
  if (!rush) return;

  const project = rush.projects.find(p => p.id === projectId);
  if (!project) return;

  const currentTask = project.tasks[project.currentStepIndex];
  if (currentTask && currentTask.status === 'in_progress') {
    currentTask.timeSpent = timeSpent;
  }

  saveRush(rush);
}

// Pause/Resume rush
export function toggleRushPause(rushId: string): Rush | null {
  const rush = getRush(rushId);
  if (!rush) return null;

  rush.status = rush.status === 'paused' ? 'active' : 'paused';
  rush.updatedAt = new Date().toISOString();
  saveRush(rush);
  return rush;
}

// Get rush statistics
export function getRushStats(rush: Rush): RushStats {
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

  // Find fastest and slowest projects (only among completed ones)
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

// Get waiting time for a project
export function getWaitingTime(project: RushProject): number {
  if (!project.waitingSince) return 0;
  return Math.floor((Date.now() - new Date(project.waitingSince).getTime()) / 1000);
}

// Format seconds to mm:ss or hh:mm:ss
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Set blinking state for a project
export function setProjectBlinking(rushId: string, projectId: string, isBlinking: boolean): Rush | null {
  const rush = getRush(rushId);
  if (!rush) return null;

  const project = rush.projects.find(p => p.id === projectId);
  if (project) {
    project.isBlinking = isBlinking;
    if (isBlinking) {
      project.blinkingStopped = false;
    }
  }

  rush.updatedAt = new Date().toISOString();
  saveRush(rush);
  return rush;
}

// Stop blinking for a project (user manually stopped it)
export function stopProjectBlinking(rushId: string, projectId: string): Rush | null {
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

// Update notes for a task
export function updateTaskNotes(rushId: string, projectId: string, taskIndex: number, notes: string): Rush | null {
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

// Insert a new workflow step at a specific position
export function insertWorkflowStep(
  rushId: string,
  afterIndex: number,
  stepData: { title: string; timeLimit?: number }
): Rush | null {
  const rush = getRush(rushId);
  if (!rush) return null;

  const now = new Date().toISOString();
  const newStepId = generateId();

  // Create new workflow step
  const newStep: RushWorkflowStep = {
    id: newStepId,
    title: stepData.title,
    order: afterIndex + 2,
    timeLimit: stepData.timeLimit,
  };

  // Insert into workflow
  rush.workflow.splice(afterIndex + 1, 0, newStep);

  // Update order for all steps after
  rush.workflow.forEach((step, i) => {
    step.order = i + 1;
  });

  // Add new task to each project at the same position
  rush.projects.forEach(project => {
    const newTask = {
      stepId: newStepId,
      status: 'pending' as RushTaskStatus,
      timeSpent: 0,
    };
    project.tasks.splice(afterIndex + 1, 0, newTask);

    // Adjust currentStepIndex if needed
    if (project.currentStepIndex > afterIndex) {
      project.currentStepIndex++;
    }
  });

  rush.updatedAt = now;
  saveRush(rush);
  return rush;
}

// Complete task and trigger blinking on next project
export function completeTaskWithBlinking(rushId: string, projectId: string): Rush | null {
  const rush = getRush(rushId);
  if (!rush) return null;

  const projectIndex = rush.projects.findIndex(p => p.id === projectId);
  const project = rush.projects[projectIndex];
  if (!project) return null;

  const now = new Date().toISOString();
  const currentTask = project.tasks[project.currentStepIndex];

  if (currentTask) {
    currentTask.status = 'completed';
    currentTask.completedAt = now;

    // Calculate time spent
    if (currentTask.startedAt) {
      const elapsed = Math.floor((new Date(now).getTime() - new Date(currentTask.startedAt).getTime()) / 1000);
      currentTask.timeSpent = elapsed;
      project.totalTimeSpent += elapsed;
      rush.totalTimeSpent += elapsed;
    }

    // Move to next task in current project
    if (project.currentStepIndex < project.tasks.length - 1) {
      project.currentStepIndex++;
      const nextTask = project.tasks[project.currentStepIndex];
      nextTask.status = 'in_progress';
      nextTask.startedAt = now;
    }

    // Trigger blinking on next project (if exists and not completed)
    const nextProjectIndex = projectIndex + 1;
    if (nextProjectIndex < rush.projects.length) {
      const nextProject = rush.projects[nextProjectIndex];
      const isNextCompleted = nextProject.tasks.every(t => t.status === 'completed' || t.status === 'skipped');
      if (!isNextCompleted && !nextProject.blinkingStopped) {
        nextProject.isBlinking = true;
      }
    }

    // Check if all projects are done
    const allCompleted = rush.projects.every(p =>
      p.tasks.every(t => t.status === 'completed' || t.status === 'skipped')
    );
    if (allCompleted) {
      rush.status = 'completed';
      rush.completedAt = now;
    }
  }

  rush.updatedAt = now;
  saveRush(rush);
  return rush;
}

// Skip task with blinking cascade - skips current task and switches to NEXT PROJECT
export function skipTaskWithBlinking(rushId: string, projectId: string): Rush | null {
  const rush = getRush(rushId);
  if (!rush) return null;

  const projectIndex = rush.projects.findIndex(p => p.id === projectId);
  const project = rush.projects[projectIndex];
  if (!project) return null;

  const now = new Date().toISOString();
  const currentTask = project.tasks[project.currentStepIndex];

  if (currentTask) {
    // Mark current task as skipped
    currentTask.status = 'skipped';
    currentTask.completedAt = now;

    // Keep current project blinking (skipped means it still needs attention later)
    project.isBlinking = true;
    project.waitingSince = now;

    // Find next project that is not completed
    let nextProjectIndex = projectIndex + 1;
    let nextProject = null;

    // Look for the next non-completed project
    while (nextProjectIndex < rush.projects.length) {
      const candidate = rush.projects[nextProjectIndex];
      const isCompleted = candidate.tasks.every(t => t.status === 'completed' || t.status === 'skipped');
      if (!isCompleted) {
        nextProject = candidate;
        break;
      }
      nextProjectIndex++;
    }

    // If no next project found, wrap around to find first non-completed project
    if (!nextProject) {
      for (let i = 0; i < projectIndex; i++) {
        const candidate = rush.projects[i];
        const isCompleted = candidate.tasks.every(t => t.status === 'completed' || t.status === 'skipped');
        if (!isCompleted) {
          nextProject = candidate;
          break;
        }
      }
    }

    // Switch to next project if found
    if (nextProject) {
      rush.activeProjectId = nextProject.id;
      nextProject.waitingSince = undefined;

      // Start current task of next project if not started
      const nextProjectTask = nextProject.tasks[nextProject.currentStepIndex];
      if (nextProjectTask && nextProjectTask.status === 'pending') {
        nextProjectTask.status = 'in_progress';
        nextProjectTask.startedAt = now;
      }
    }

    // Check if all projects are done
    const allCompleted = rush.projects.every(p =>
      p.tasks.every(t => t.status === 'completed' || t.status === 'skipped')
    );
    if (allCompleted) {
      rush.status = 'completed';
      rush.completedAt = now;
    }
  }

  rush.updatedAt = now;
  saveRush(rush);
  return rush;
}
