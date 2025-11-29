import { Rush, RushProject, RushWorkflowStep, RushStats, RushTaskStatus, RushColor } from '@/types';
import { generateId } from './utils';

const RUSH_STORAGE_KEY = 'organizapp_rushes';
const RUSH_TEMPLATES_KEY = 'organizapp_rush_templates';

// Default workflow templates
export const DEFAULT_WORKFLOWS: { name: string; steps: Omit<RushWorkflowStep, 'id'>[] }[] = [
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

// Validate a Rush object structure
function isValidRush(rush: any): rush is Rush {
  if (!rush || typeof rush !== 'object') return false;
  if (typeof rush.id !== 'string' || typeof rush.name !== 'string') return false;
  if (!Array.isArray(rush.workflow) || !Array.isArray(rush.projects)) return false;

  // Validate workflow steps
  for (const step of rush.workflow) {
    if (!step || typeof step !== 'object') return false;
    if (typeof step.id !== 'string' || typeof step.title !== 'string') return false;
    // Check for corrupted data (wrong keys like taskName)
    if ('taskName' in step || (typeof step.workflow === 'object')) return false;
  }

  // Validate projects
  for (const project of rush.projects) {
    if (!project || typeof project !== 'object') return false;
    if (typeof project.id !== 'string' || typeof project.name !== 'string') return false;
    if (!Array.isArray(project.tasks)) return false;
  }

  return true;
}

// Get all rushes
export function getRushes(): Rush[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(RUSH_STORAGE_KEY);
    if (!data) return [];

    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];

    // Filter out corrupted Rush data
    const validRushes = parsed.filter((rush: any) => {
      const isValid = isValidRush(rush);
      if (!isValid) {
        console.warn('Filtered out corrupted Rush data:', rush?.name || 'unknown');
      }
      return isValid;
    });

    // If we filtered some out, save the cleaned data
    if (validRushes.length !== parsed.length) {
      console.log(`Cleaned up ${parsed.length - validRushes.length} corrupted Rush entries`);
      localStorage.setItem(RUSH_STORAGE_KEY, JSON.stringify(validRushes));
    }

    return validRushes;
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
    sessions: [],
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

    // Initialize sessions array if it doesn't exist (backward compatibility)
    if (!project.sessions) {
      project.sessions = [];
    }

    // Start a new session if not already started
    if (!project.currentSessionStart) {
      project.currentSessionStart = now;
    }

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

// Set blinking state for a Rush (between rushes)
export function setRushBlinking(rushId: string, isBlinking: boolean): Rush | null {
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

// Stop blinking for a Rush (user manually stopped it or activated it)
export function stopRushBlinking(rushId: string): Rush | null {
  const rush = getRush(rushId);
  if (!rush) return null;

  rush.isBlinking = false;
  rush.blinkingStopped = true;

  rush.updatedAt = new Date().toISOString();
  saveRush(rush);
  return rush;
}

// Clear Rush blinking when activating it
export function clearRushBlinking(rushId: string): Rush | null {
  const rush = getRush(rushId);
  if (!rush) return null;

  rush.isBlinking = false;

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

// Update notes for a project
export function updateProjectNotes(rushId: string, projectId: string, notes: string): Rush | null {
  const rush = getRush(rushId);
  if (!rush) return null;

  const project = rush.projects.find(p => p.id === projectId);
  if (!project) return null;

  project.notes = notes;

  rush.updatedAt = new Date().toISOString();
  saveRush(rush);
  return rush;
}

// Start a new session for a project
export function startProjectSession(rushId: string, projectId: string): Rush | null {
  const rush = getRush(rushId);
  if (!rush) return null;

  const project = rush.projects.find(p => p.id === projectId);
  if (!project) return null;

  // End current session if exists
  if (project.currentSessionStart) {
    endProjectSession(rushId, projectId);
  }

  project.currentSessionStart = new Date().toISOString();

  rush.updatedAt = new Date().toISOString();
  saveRush(rush);
  return rush;
}

// End current session for a project
export function endProjectSession(rushId: string, projectId: string, notes?: string): Rush | null {
  const rush = getRush(rushId);
  if (!rush) return null;

  const project = rush.projects.find(p => p.id === projectId);
  if (!project || !project.currentSessionStart) return null;

  const now = new Date().toISOString();
  const duration = Math.floor((new Date(now).getTime() - new Date(project.currentSessionStart).getTime()) / 1000);

  // Initialize sessions array if it doesn't exist (for backward compatibility)
  if (!project.sessions) {
    project.sessions = [];
  }

  // Add session to history
  const session = {
    id: generateId(),
    startedAt: project.currentSessionStart,
    endedAt: now,
    duration,
    notes,
  };
  project.sessions.push(session);

  // Clear current session
  project.currentSessionStart = undefined;

  rush.updatedAt = new Date().toISOString();
  saveRush(rush);
  return rush;
}

// Reset project session timer (end current and start new)
export function resetProjectSession(rushId: string, projectId: string): Rush | null {
  const rush = getRush(rushId);
  if (!rush) return null;

  // End current session
  endProjectSession(rushId, projectId);

  // Start new session
  return startProjectSession(rushId, projectId);
}

// Get total time across all sessions for a project
export function getProjectTotalTime(project: RushProject): number {
  if (!project.sessions) return project.totalTimeSpent || 0;

  const sessionsTotal = project.sessions.reduce((sum, session) => sum + session.duration, 0);

  // Add current session time if running
  if (project.currentSessionStart) {
    const currentDuration = Math.floor((Date.now() - new Date(project.currentSessionStart).getTime()) / 1000);
    return sessionsTotal + currentDuration;
  }

  return sessionsTotal;
}

// Get current session time
export function getCurrentSessionTime(project: RushProject): number {
  if (!project.currentSessionStart) return 0;
  return Math.floor((Date.now() - new Date(project.currentSessionStart).getTime()) / 1000);
}

// Update clock theme for a Rush
export function updateClockTheme(rushId: string, theme: 'fluid' | 'flap' | 'flap-light'): Rush | null {
  const rush = getRush(rushId);
  if (!rush) return null;

  rush.clockTheme = theme;
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
  console.log('[completeTaskWithBlinking] START - rushId:', rushId, 'projectId:', projectId);
  const rush = getRush(rushId);
  if (!rush) {
    console.log('[completeTaskWithBlinking] ERROR: rush not found');
    return null;
  }

  const projectIndex = rush.projects.findIndex(p => p.id === projectId);
  const project = rush.projects[projectIndex];
  console.log('[completeTaskWithBlinking] projectIndex:', projectIndex, 'project:', project?.name);
  if (!project) {
    console.log('[completeTaskWithBlinking] ERROR: project not found');
    return null;
  }

  const now = new Date().toISOString();
  const currentTask = project.tasks[project.currentStepIndex];
  console.log('[completeTaskWithBlinking] currentStepIndex:', project.currentStepIndex, 'currentTask status:', currentTask?.status);

  if (currentTask) {
    currentTask.status = 'completed';
    currentTask.completedAt = now;
    console.log('[completeTaskWithBlinking] Task marked as completed');

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
      console.log('[completeTaskWithBlinking] Moved to next task, new index:', project.currentStepIndex);
    }

    // Trigger blinking on next project (if exists and not completed)
    const nextProjectIndex = projectIndex + 1;
    console.log('[completeTaskWithBlinking] Checking next project, nextProjectIndex:', nextProjectIndex, 'total projects:', rush.projects.length);
    if (nextProjectIndex < rush.projects.length) {
      const nextProject = rush.projects[nextProjectIndex];
      const isNextCompleted = nextProject.tasks.every(t => t.status === 'completed' || t.status === 'skipped');
      console.log('[completeTaskWithBlinking] Next project:', nextProject.name, 'isNextCompleted:', isNextCompleted, 'blinkingStopped:', nextProject.blinkingStopped);
      if (!isNextCompleted && !nextProject.blinkingStopped) {
        nextProject.isBlinking = true;
        console.log('[completeTaskWithBlinking] SET isBlinking=true on:', nextProject.name);
      }
    } else {
      console.log('[completeTaskWithBlinking] No next project to blink');
    }

    // Check if all projects are done
    const allCompleted = rush.projects.every(p =>
      p.tasks.every(t => t.status === 'completed' || t.status === 'skipped')
    );
    if (allCompleted) {
      rush.status = 'completed';
      rush.completedAt = now;
    }
  } else {
    console.log('[completeTaskWithBlinking] ERROR: no currentTask');
  }

  rush.updatedAt = now;
  saveRush(rush);
  console.log('[completeTaskWithBlinking] DONE - returning rush');
  return rush;
}

// Skip task with blinking cascade - skips current task and switches to NEXT PROJECT
export function skipTaskWithBlinking(rushId: string, projectId: string): Rush | null {
  console.log('[skipTaskWithBlinking] START - rushId:', rushId, 'projectId:', projectId);
  const rush = getRush(rushId);
  if (!rush) {
    console.log('[skipTaskWithBlinking] ERROR: rush not found');
    return null;
  }

  const projectIndex = rush.projects.findIndex(p => p.id === projectId);
  const project = rush.projects[projectIndex];
  console.log('[skipTaskWithBlinking] projectIndex:', projectIndex, 'project:', project?.name, 'total projects:', rush.projects.length);
  if (!project) {
    console.log('[skipTaskWithBlinking] ERROR: project not found');
    return null;
  }

  const now = new Date().toISOString();
  const currentTask = project.tasks[project.currentStepIndex];
  console.log('[skipTaskWithBlinking] currentStepIndex:', project.currentStepIndex, 'currentTask status:', currentTask?.status);

  if (currentTask) {
    // Mark current task as skipped
    currentTask.status = 'skipped';
    currentTask.completedAt = now;
    console.log('[skipTaskWithBlinking] Task marked as skipped');

    // Find next project that is not completed (search BEFORE setting blinking)
    let nextProject: RushProject | null = null;

    // Look for the next non-completed project after current
    console.log('[skipTaskWithBlinking] Looking for next project after index', projectIndex);
    for (let i = projectIndex + 1; i < rush.projects.length; i++) {
      const candidate = rush.projects[i];
      const isCompleted = candidate.tasks.every(t => t.status === 'completed' || t.status === 'skipped');
      console.log('[skipTaskWithBlinking] Checking project', candidate.name, 'isCompleted:', isCompleted);
      if (!isCompleted) {
        nextProject = candidate;
        break;
      }
    }

    // Wrap around: look from beginning up to current project
    if (!nextProject) {
      console.log('[skipTaskWithBlinking] No next project found, wrapping around...');
      for (let i = 0; i < projectIndex; i++) {
        const candidate = rush.projects[i];
        const isCompleted = candidate.tasks.every(t => t.status === 'completed' || t.status === 'skipped');
        if (!isCompleted) {
          nextProject = candidate;
          break;
        }
      }
    }

    console.log('[skipTaskWithBlinking] nextProject found:', nextProject?.name || 'NONE');

    // If we found another project to switch to
    if (nextProject && nextProject.id !== project.id) {
      console.log('[skipTaskWithBlinking] SWITCHING to next project:', nextProject.name);
      // Set current project as blinking (reminder to come back)
      project.isBlinking = true;
      project.waitingSince = now;
      console.log('[skipTaskWithBlinking] SET isBlinking=true on current project:', project.name);

      // Switch to next project
      rush.activeProjectId = nextProject.id;
      nextProject.waitingSince = undefined;
      nextProject.isBlinking = false; // Clear blinking since we're activating it
      console.log('[skipTaskWithBlinking] activeProjectId changed to:', nextProject.id);

      // Start current task of next project if not started
      const nextProjectTask = nextProject.tasks[nextProject.currentStepIndex];
      if (nextProjectTask && nextProjectTask.status === 'pending') {
        nextProjectTask.status = 'in_progress';
        nextProjectTask.startedAt = now;
      }
    } else {
      console.log('[skipTaskWithBlinking] NO other project available - staying on current project');
      // No other project available - just move to next task in current project
      if (project.currentStepIndex < project.tasks.length - 1) {
        project.currentStepIndex++;
        const nextTask = project.tasks[project.currentStepIndex];
        if (nextTask.status === 'pending') {
          nextTask.status = 'in_progress';
          nextTask.startedAt = now;
        }
        console.log('[skipTaskWithBlinking] Moved to next task in same project, new index:', project.currentStepIndex);
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
  console.log('[skipTaskWithBlinking] DONE - Projects blinking status:', rush.projects.map(p => ({ name: p.name, isBlinking: p.isBlinking })));
  return rush;
}

// Reset all tasks in a project to pending state
export function resetProjectTasks(rushId: string, projectId: string): Rush | null {
  const rush = getRush(rushId);
  if (!rush) return null;

  const project = rush.projects.find(p => p.id === projectId);
  if (!project) return null;

  const now = new Date().toISOString();

  // Reset all tasks to pending
  project.tasks.forEach(task => {
    task.status = 'pending';
    task.startedAt = undefined;
    task.completedAt = undefined;
    task.timeSpent = 0;
    // Keep notes - user might want them
  });

  // Reset project state
  project.currentStepIndex = 0;
  project.totalTimeSpent = 0;
  project.isBlinking = false;
  project.blinkingStopped = false;

  // Start first task
  const firstTask = project.tasks[0];
  if (firstTask) {
    firstTask.status = 'in_progress';
    firstTask.startedAt = now;
  }

  // Update rush status if it was completed
  if (rush.status === 'completed') {
    rush.status = 'active';
    rush.completedAt = undefined;
  }

  rush.updatedAt = now;
  saveRush(rush);
  return rush;
}

// Delete a workflow step and its tasks from all projects
export function deleteWorkflowStep(rushId: string, stepIndex: number): Rush | null {
  const rush = getRush(rushId);
  if (!rush) return null;

  // Can't delete if only one step remains
  if (rush.workflow.length <= 1) return null;

  const now = new Date().toISOString();

  // Remove step from workflow
  rush.workflow.splice(stepIndex, 1);

  // Update order for remaining steps
  rush.workflow.forEach((step, i) => {
    step.order = i + 1;
  });

  // Remove corresponding task from each project
  rush.projects.forEach(project => {
    project.tasks.splice(stepIndex, 1);

    // Adjust currentStepIndex if needed
    if (project.currentStepIndex >= stepIndex) {
      project.currentStepIndex = Math.max(0, project.currentStepIndex - 1);
    }
    // Make sure currentStepIndex is valid
    if (project.currentStepIndex >= project.tasks.length) {
      project.currentStepIndex = project.tasks.length - 1;
    }
  });

  rush.updatedAt = now;
  saveRush(rush);
  return rush;
}

// Reorder workflow steps (move step from one index to another)
export function reorderWorkflowSteps(rushId: string, fromIndex: number, toIndex: number): Rush | null {
  const rush = getRush(rushId);
  if (!rush) return null;

  if (fromIndex === toIndex) return rush;
  if (fromIndex < 0 || fromIndex >= rush.workflow.length) return null;
  if (toIndex < 0 || toIndex >= rush.workflow.length) return null;

  const now = new Date().toISOString();

  // Move step in workflow
  const [movedStep] = rush.workflow.splice(fromIndex, 1);
  rush.workflow.splice(toIndex, 0, movedStep);

  // Update order for all steps
  rush.workflow.forEach((step, i) => {
    step.order = i + 1;
  });

  // Move corresponding task in each project
  rush.projects.forEach(project => {
    const [movedTask] = project.tasks.splice(fromIndex, 1);
    project.tasks.splice(toIndex, 0, movedTask);

    // Adjust currentStepIndex if needed
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

// Update Rush color
export function updateRushColor(rushId: string, color: RushColor): Rush | null {
  const rush = getRush(rushId);
  if (!rush) return null;

  rush.color = color;
  rush.updatedAt = new Date().toISOString();
  saveRush(rush);
  return rush;
}

// Rename Rush
export function renameRush(rushId: string, newName: string): Rush | null {
  const rush = getRush(rushId);
  if (!rush) return null;

  rush.name = newName.trim();
  rush.updatedAt = new Date().toISOString();
  saveRush(rush);
  return rush;
}

// Rename workflow step (task title)
export function renameWorkflowStep(rushId: string, stepIndex: number, newTitle: string): Rush | null {
  const rush = getRush(rushId);
  if (!rush) return null;

  if (stepIndex < 0 || stepIndex >= rush.workflow.length) return null;

  rush.workflow[stepIndex].title = newTitle.trim();
  rush.updatedAt = new Date().toISOString();
  saveRush(rush);
  return rush;
}

// Color mapping for Rush tabs
export const RUSH_COLORS: { value: RushColor; label: string; bg: string; text: string; border: string }[] = [
  { value: 'gray', label: 'Gris foncé', bg: 'bg-gray-700', text: 'text-white', border: 'border-gray-700' },
  { value: 'blue', label: 'Bleu', bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-500' },
  { value: 'red', label: 'Rouge', bg: 'bg-red-500', text: 'text-white', border: 'border-red-500' },
  { value: 'orange', label: 'Orange', bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-500' },
  { value: 'violet', label: 'Violet', bg: 'bg-violet-500', text: 'text-white', border: 'border-violet-500' },
  { value: 'green', label: 'Vert', bg: 'bg-green-500', text: 'text-white', border: 'border-green-500' },
  { value: 'cyan', label: 'Cyan', bg: 'bg-cyan-500', text: 'text-white', border: 'border-cyan-500' },
  { value: 'pink', label: 'Rose', bg: 'bg-pink-500', text: 'text-white', border: 'border-pink-500' },
  { value: 'yellow', label: 'Jaune', bg: 'bg-yellow-400', text: 'text-yellow-900', border: 'border-yellow-400' },
];
