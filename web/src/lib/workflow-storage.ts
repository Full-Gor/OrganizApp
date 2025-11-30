import { SavedWorkflow, RushWorkflowStep } from '@/types';

const WORKFLOW_STORAGE_KEY = 'organizapp_workflows';

// Default workflow templates
export const DEFAULT_WORKFLOWS: SavedWorkflow[] = [
  {
    id: 'default-feature-simple',
    name: 'Feature Simple',
    steps: [
      { title: 'Analyse', order: 0, timeLimit: 10 },
      { title: 'Implem', order: 1, timeLimit: 25 },
      { title: 'Test', order: 2, timeLimit: 10 },
      { title: 'Review', order: 3, timeLimit: 10 },
    ],
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-app-mobile',
    name: 'App Mobile (Expo)',
    steps: [
      { title: 'Setup', order: 0, timeLimit: 15 },
      { title: 'UI/UX', order: 1, timeLimit: 30 },
      { title: 'Logic', order: 2, timeLimit: 45 },
      { title: 'API', order: 3, timeLimit: 30 },
      { title: 'Test Device', order: 4, timeLimit: 20 },
    ],
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-web-app',
    name: 'Web App (Next.js)',
    steps: [
      { title: 'Setup', order: 0, timeLimit: 10 },
      { title: 'Components', order: 1, timeLimit: 30 },
      { title: 'API Routes', order: 2, timeLimit: 25 },
      { title: 'Integration', order: 3, timeLimit: 20 },
      { title: 'Deploy', order: 4, timeLimit: 15 },
    ],
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-bug-fix',
    name: 'Bug Fix',
    steps: [
      { title: 'Repro', order: 0, timeLimit: 10 },
      { title: 'Debug', order: 1, timeLimit: 20 },
      { title: 'Fix', order: 2, timeLimit: 15 },
      { title: 'Test', order: 3, timeLimit: 10 },
    ],
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Get all workflows (defaults + custom)
export function getWorkflows(): SavedWorkflow[] {
  if (typeof window === 'undefined') return DEFAULT_WORKFLOWS;

  try {
    const data = localStorage.getItem(WORKFLOW_STORAGE_KEY);
    const customWorkflows: SavedWorkflow[] = data ? JSON.parse(data) : [];

    // Combine defaults with custom, defaults first
    return [...DEFAULT_WORKFLOWS, ...customWorkflows];
  } catch (e) {
    console.error('Error loading workflows:', e);
    return DEFAULT_WORKFLOWS;
  }
}

// Get only custom workflows (excluding defaults)
export function getCustomWorkflows(): SavedWorkflow[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(WORKFLOW_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error loading custom workflows:', e);
    return [];
  }
}

// Get workflow by ID
export function getWorkflowById(id: string): SavedWorkflow | undefined {
  const workflows = getWorkflows();
  return workflows.find(w => w.id === id);
}

// Save custom workflows to localStorage
function saveCustomWorkflows(workflows: SavedWorkflow[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(workflows));
}

// Create a new custom workflow
export function createWorkflow(
  name: string,
  steps: Omit<RushWorkflowStep, 'id'>[]
): SavedWorkflow {
  const now = new Date().toISOString();
  const newWorkflow: SavedWorkflow = {
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

// Update an existing custom workflow
export function updateWorkflow(
  id: string,
  updates: Partial<Pick<SavedWorkflow, 'name' | 'steps'>>
): SavedWorkflow | null {
  // Cannot update default workflows
  const workflow = getWorkflowById(id);
  if (!workflow || workflow.isDefault) return null;

  const customWorkflows = getCustomWorkflows();
  const index = customWorkflows.findIndex(w => w.id === id);
  if (index === -1) return null;

  const updatedWorkflow: SavedWorkflow = {
    ...customWorkflows[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  if (updates.steps) {
    updatedWorkflow.steps = updates.steps.map((step, i) => ({
      ...step,
      order: i,
    }));
  }

  customWorkflows[index] = updatedWorkflow;
  saveCustomWorkflows(customWorkflows);

  return updatedWorkflow;
}

// Delete a custom workflow
export function deleteWorkflow(id: string): boolean {
  // Cannot delete default workflows
  const workflow = getWorkflowById(id);
  if (!workflow || workflow.isDefault) return false;

  const customWorkflows = getCustomWorkflows();
  const filtered = customWorkflows.filter(w => w.id !== id);

  if (filtered.length === customWorkflows.length) return false;

  saveCustomWorkflows(filtered);
  return true;
}

// Convert SavedWorkflow steps to RushWorkflowStep[] with IDs
export function workflowToRushSteps(workflow: SavedWorkflow): RushWorkflowStep[] {
  return workflow.steps.map((step, index) => ({
    id: `step-${Date.now()}-${index}`,
    title: step.title,
    order: index,
    timeLimit: step.timeLimit,
  }));
}
