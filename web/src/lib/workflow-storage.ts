import { SavedWorkflow, RushWorkflowStep } from '@/types';
import { DEFAULT_WORKFLOWS as RUSH_DEFAULT_WORKFLOWS } from './rush-storage';

const WORKFLOW_STORAGE_KEY = 'organizapp_workflows';

// Convert rush-storage templates to SavedWorkflow format
const DEFAULT_WORKFLOWS: SavedWorkflow[] = RUSH_DEFAULT_WORKFLOWS.map((template, index) => ({
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
