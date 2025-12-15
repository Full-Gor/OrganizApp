/**
 * OrganizApp - Pages Module (Pure JavaScript)
 * Rendu des différentes pages de l'application
 */

// ==================== //
// RUSH PAGE STATE      //
// ==================== //

const RushPageState = {
  rushes: [],
  activeRush: null,
  currentTime: 0,
  timerInterval: null,
  blinkIntervals: {},
};

// ==================== //
// DASHBOARD PAGE       //
// ==================== //

function renderDashboard() {
  const container = Utils.$('#mainContent');
  container.innerHTML = `
    <div class="animate-fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">Vue d'ensemble de vos projets et taches</p>
        </div>
      </div>

      <div class="stats-grid mb-4">
        <div class="stat-card">
          <div class="stat-card-inner">
            <div class="stat-icon stat-icon-blue">${Utils.Icons.folder}</div>
            <div class="stat-content">
              <p class="stat-label">Projets actifs</p>
              <p class="stat-value">${RushPageState.rushes.length}</p>
            </div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card-inner">
            <div class="stat-icon stat-icon-green">${Utils.Icons.checkCircle}</div>
            <div class="stat-content">
              <p class="stat-label">Rush actifs</p>
              <p class="stat-value">${RushPageState.rushes.filter(r => r.status === 'active').length}</p>
            </div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card-inner">
            <div class="stat-icon stat-icon-yellow">${Utils.Icons.clock}</div>
            <div class="stat-content">
              <p class="stat-label">En pause</p>
              <p class="stat-value">${RushPageState.rushes.filter(r => r.status === 'paused').length}</p>
            </div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card-inner">
            <div class="stat-icon stat-icon-green">${Utils.Icons.check}</div>
            <div class="stat-content">
              <p class="stat-label">Termines</p>
              <p class="stat-value">${RushPageState.rushes.filter(r => r.status === 'completed').length}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-body text-center" style="padding: 48px;">
          <div style="color: var(--gray-300); margin-bottom: 16px;">${Utils.Icons.zap}</div>
          <h3 style="font-size: 1.25rem; font-weight: 500; color: var(--gray-600); margin-bottom: 8px;">Mode Rush</h3>
          <p style="color: var(--gray-400); margin-bottom: 24px;">Gerez vos projets en mode rush pour une productivite maximale</p>
          <button class="btn btn-orange" onclick="App.navigateTo('rush')">
            ${Utils.Icons.zap} Acceder au Rush Mode
          </button>
        </div>
      </div>
    </div>
  `;
}

// ==================== //
// RUSH PAGE            //
// ==================== //

function renderRushPage() {
  // Load data
  RushPageState.rushes = RushStorage.getRushes();
  const active = RushPageState.rushes.find(r => r.status === 'active');
  if (active && !RushPageState.activeRush) {
    RushPageState.activeRush = active;
  }

  const container = Utils.$('#mainContent');
  container.innerHTML = `
    <div class="animate-fade-in" id="rushPageContainer">
      <!-- Header -->
      <div class="page-header" style="flex-wrap: wrap;">
        <div class="rush-header">
          <div class="rush-icon">${Utils.Icons.zap}</div>
          <div>
            <h1 class="page-title">Rush Mode</h1>
            <p class="page-subtitle">Gestion multi-projets en parallele</p>
          </div>
        </div>

        <div class="flex items-center gap-2" style="flex-wrap: wrap;">
          ${RushPageState.activeRush ? `
            <div id="clockContainer"></div>
            <div class="flex gap-1">
              <button class="btn btn-sm ${RushPageState.activeRush.clockTheme === 'fluid' ? 'btn-primary' : 'btn-secondary'}" onclick="RushPage.setClockTheme('fluid')">Cyan</button>
              <button class="btn btn-sm ${RushPageState.activeRush.clockTheme === 'flap' ? 'btn-primary' : 'btn-secondary'}" onclick="RushPage.setClockTheme('flap')">Flap</button>
              <button class="btn btn-sm ${RushPageState.activeRush.clockTheme === 'flap-light' ? 'btn-primary' : 'btn-secondary'}" onclick="RushPage.setClockTheme('flap-light')">Light</button>
            </div>
          ` : ''}
          ${RushPageState.activeRush ? `
            <button class="btn btn-secondary" onclick="RushPage.showStats()">
              ${Utils.Icons.barChart} <span class="hidden-mobile">Stats</span>
            </button>
          ` : ''}
          ${RushPageState.rushes.length > 0 ? `
            <button class="btn btn-violet" onclick="RushPage.showWorkflowModal()">
              ${Utils.Icons.settings} <span class="hidden-mobile">Workflows</span>
            </button>
          ` : ''}
          <button class="btn btn-orange" onclick="RushPage.showCreateModal()">
            ${Utils.Icons.plus} <span class="hidden-mobile">Nouveau Rush</span>
          </button>
        </div>
      </div>

      <!-- Rush Tabs -->
      ${RushPageState.rushes.length > 0 ? `
        <div class="rush-tabs" id="rushTabs">
          ${renderRushTabs()}
        </div>
      ` : ''}

      <!-- Active Rush or Empty State -->
      <div id="rushContent">
        ${RushPageState.activeRush ? renderRushBoard() : renderEmptyRushState()}
      </div>
    </div>
  `;

  // Add clock if active rush
  if (RushPageState.activeRush) {
    const clockContainer = Utils.$('#clockContainer');
    if (clockContainer) {
      const timer = Components.createDissolveTimer(RushPageState.activeRush.clockTheme || 'fluid');
      clockContainer.appendChild(timer);
    }
  }

  // Start timer
  startRushTimer();

  // Start blinking effects
  startBlinkingEffects();
}

function renderRushTabs() {
  return RushPageState.rushes.map(rush => {
    const isActive = RushPageState.activeRush?.id === rush.id;
    const isCompleted = rush.status === 'completed';
    const shouldBlink = rush.isBlinking && !rush.blinkingStopped && !isActive && !isCompleted;
    const colorStyle = Utils.getRushColorStyle(rush.color);

    return `
      <div class="rush-tab ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${shouldBlink ? 'blink' : ''}"
           data-rush-id="${rush.id}"
           style="${isActive ? `background: ${colorStyle.bg}; color: ${colorStyle.text}; border-color: ${colorStyle.border};` : ''}"
           onclick="RushPage.selectRush('${rush.id}')">
        ${rush.color && !isActive ? `<div class="rush-tab-color" style="background: ${colorStyle.bg};"></div>` : ''}
        <span ondblclick="event.stopPropagation(); RushPage.renameRush('${rush.id}')">${rush.name}</span>
        ${isCompleted ? Utils.Icons.check : ''}
        ${shouldBlink ? `<button class="rush-tab-action" onclick="event.stopPropagation(); RushPage.stopBlinking('${rush.id}')" style="position: absolute; top: -8px; right: -8px; background: var(--red-500); color: white; border-radius: 50%; width: 20px; height: 20px;">${Utils.Icons.x}</button>` : ''}
        <div class="rush-tab-actions">
          <button class="rush-tab-action" onclick="event.stopPropagation(); RushPage.renameRush('${rush.id}')" title="Renommer">${Utils.Icons.edit}</button>
          <button class="rush-tab-action" onclick="event.stopPropagation(); RushPage.showColorPicker('${rush.id}')" title="Couleur">${Utils.Icons.palette}</button>
          <button class="rush-tab-action" onclick="event.stopPropagation(); RushPage.deleteRush('${rush.id}')" title="Supprimer">${Utils.Icons.trash}</button>
        </div>
      </div>
    `;
  }).join('');
}

function renderEmptyRushState() {
  return `
    <div class="empty-state">
      <div class="empty-state-icon" style="width: 64px; height: 64px; color: var(--gray-300);">${Utils.Icons.zap}</div>
      <h3 class="empty-state-title">Aucun Rush actif</h3>
      <p class="empty-state-text">Creez un nouveau Rush pour commencer</p>
      <button class="btn btn-orange" onclick="RushPage.showCreateModal()">
        Creer un Rush
      </button>
    </div>
  `;
}

function renderRushBoard() {
  const rush = RushPageState.activeRush;
  if (!rush) return '';

  const activeProject = rush.projects.find(p => p.id === rush.activeProjectId);
  const currentStep = activeProject ? rush.workflow[activeProject.currentStepIndex] : null;

  return `
    <!-- Controls -->
    <div class="rush-controls">
      <div class="flex items-center gap-2" style="flex-wrap: wrap;">
        ${currentStep ? `
          <div class="rush-current-task">Tache actuelle: ${currentStep.title}</div>
        ` : ''}
      </div>
      <div class="rush-control-buttons">
        <button class="btn ${rush.status === 'paused' ? 'btn-success' : 'btn-secondary'}" onclick="RushPage.togglePause()">
          ${rush.status === 'paused' ? Utils.Icons.play : Utils.Icons.pause}
        </button>
        <button class="btn btn-warning" onclick="RushPage.skipTask()" title="Passer cette tache">
          ${Utils.Icons.skipForward} <span class="hidden-mobile">Passer</span>
        </button>
        <button class="btn btn-success" onclick="RushPage.completeTask()">
          ${Utils.Icons.check} <span class="hidden-mobile">Termine</span>
        </button>
      </div>
    </div>

    <!-- Project Tabs -->
    <div class="rush-projects" id="projectTabs">
      ${rush.projects.map(project => {
        const isActive = project.id === rush.activeProjectId;
        const isCompleted = project.tasks.every(t => t.status === 'completed' || t.status === 'skipped');
        const progress = Math.round((project.tasks.filter(t => t.status === 'completed' || t.status === 'skipped').length / project.tasks.length) * 100);

        return `
          <div class="rush-project-tab ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}"
               onclick="RushPage.activateProject('${project.id}')">
            <button class="rush-project-notes-btn ${project.notes ? 'has-notes' : ''}"
                    onclick="event.stopPropagation(); RushPage.editProjectNotes('${project.id}')"
                    title="Notes du projet">
              ${Utils.Icons.fileText}
            </button>
            <span class="rush-project-name">${project.name}</span>
            <div class="rush-project-progress">
              ${Components.createProgressBar(progress, { size: 'xs', color: isCompleted ? 'green' : 'orange' }).outerHTML}
            </div>
            <span class="rush-project-step">${project.currentStepIndex + 1}/${project.tasks.length}</span>
          </div>
        `;
      }).join('')}
    </div>

    <!-- Active Project Tasks -->
    ${activeProject ? renderProjectTasks(rush, activeProject) : ''}

    <!-- Waiting Projects Alert -->
    ${renderWaitingProjects(rush)}
  `;
}

function renderProjectTasks(rush, project) {
  const sessionTime = RushStorage.getCurrentSessionTime(project);
  const totalTime = RushStorage.getProjectTotalTime(project);

  return `
    <div class="rush-workflow">
      <div class="rush-workflow-header">
        <div class="rush-workflow-title">${project.name}</div>
        <div class="flex items-center gap-2">
          <div class="rush-session-timer">
            ${Utils.Icons.clock}
            <span class="rush-session-timer-value" id="sessionTimer">${RushStorage.formatTime(sessionTime)}</span>
            <button onclick="RushPage.resetSession('${project.id}')" title="Reset session" style="padding: 2px; color: var(--blue-600);">
              ${Utils.Icons.rotateCcw}
            </button>
          </div>
          <div style="padding: 6px 12px; background: var(--gray-50); border: 1px solid var(--gray-200); border-radius: var(--radius-lg); font-size: 0.75rem;">
            Total: <span class="font-mono">${RushStorage.formatTime(totalTime)}</span>
          </div>
          <button class="btn btn-sm btn-secondary" onclick="RushPage.resetProject('${project.id}')" title="Reset projet">
            ${Utils.Icons.rotateCcw} Reset
          </button>
        </div>
      </div>

      <div id="tasksList">
        ${rush.workflow.map((step, index) => {
          const task = project.tasks[index];
          const isCurrent = index === project.currentStepIndex;
          const isCompleted = task.status === 'completed';
          const isSkipped = task.status === 'skipped';

          return `
            <div class="rush-task ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''} ${isSkipped ? 'skipped' : ''} ${!isCurrent && !isCompleted && !isSkipped ? 'pending' : ''}"
                 draggable="true"
                 data-index="${index}"
                 ondragstart="RushPage.onDragStart(event, ${index})"
                 ondragover="RushPage.onDragOver(event)"
                 ondrop="RushPage.onDrop(event, ${index})">
              <div class="rush-task-status">
                ${isCompleted ? Utils.Icons.check : isSkipped ? Utils.Icons.skipForward : (index + 1)}
              </div>
              <div class="rush-task-content">
                <div class="rush-task-title" ondblclick="RushPage.renameTask(${index})">${step.title}</div>
                ${task.notes ? `<div class="rush-task-notes">${Utils.Icons.fileText} ${task.notes.length > 30 ? task.notes.substring(0, 30) + '...' : task.notes}</div>` : ''}
              </div>
              ${(isCompleted || isCurrent) ? `
                <span class="rush-task-time">${isCurrent ? RushStorage.formatTime(RushPageState.currentTime) : RushStorage.formatTime(task.timeSpent)}</span>
              ` : ''}
              <div class="rush-task-actions">
                <button class="rush-task-action" onclick="RushPage.renameTask(${index})" title="Renommer">${Utils.Icons.edit}</button>
                ${isCurrent ? `<button class="rush-task-action notes" onclick="RushPage.editTaskNotes(${index})" title="Notes">${Utils.Icons.fileText}</button>` : ''}
                ${rush.workflow.length > 1 ? `<button class="rush-task-action delete" onclick="RushPage.deleteTask(${index})" title="Supprimer">${Utils.Icons.trash}</button>` : ''}
              </div>
            </div>
            <div class="rush-insert-task">
              <button class="rush-insert-task-btn" onclick="RushPage.showInsertTask(${index})">
                ${Utils.Icons.plusCircle} Inserer une tache
              </button>
            </div>
          `;
        }).join('')}
      </div>

      <div class="rush-total-time">
        <span class="rush-total-time-label">Temps total projet</span>
        <span class="rush-total-time-value">${RushStorage.formatTime(project.totalTimeSpent + RushPageState.currentTime)}</span>
      </div>
    </div>
  `;
}

function renderWaitingProjects(rush) {
  const waitingProjects = rush.projects
    .filter(p => RushStorage.getWaitingTime(p) > 180 && p.id !== rush.activeProjectId)
    .sort((a, b) => RushStorage.getWaitingTime(b) - RushStorage.getWaitingTime(a));

  if (waitingProjects.length === 0) return '';

  return `
    <div style="background: var(--orange-50); border: 1px solid var(--orange-200); border-radius: var(--radius-xl); padding: 16px; margin-top: 24px;">
      <div style="display: flex; align-items: center; gap: 8px; color: var(--orange-700); font-weight: 500; margin-bottom: 8px;">
        ${Utils.Icons.alertTriangle} Projets en attente
      </div>
      <div style="display: flex; flex-direction: column; gap: 4px;">
        ${waitingProjects.map(p => `
          <div style="display: flex; justify-content: space-between; font-size: 0.875rem;">
            <span style="color: var(--orange-800);">${p.name}</span>
            <span class="font-mono" style="color: ${RushStorage.getWaitingTime(p) > 300 ? 'var(--red-600)' : 'var(--orange-600)'}; font-weight: ${RushStorage.getWaitingTime(p) > 300 ? '700' : '400'};">
              ${Math.floor(RushStorage.getWaitingTime(p) / 60)} min
            </span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ==================== //
// RUSH PAGE ACTIONS    //
// ==================== //

const RushPage = {
  draggedIndex: null,

  selectRush(id) {
    const rush = RushPageState.rushes.find(r => r.id === id);
    if (rush) {
      if (rush.isBlinking) {
        RushStorage.clearRushBlinking(id);
        rush.isBlinking = false;
      }
      RushPageState.activeRush = rush;
      renderRushPage();
    }
  },

  showCreateModal() {
    const content = Utils.createElement('div', '');
    content.innerHTML = `
      <form id="createRushForm">
        <div class="form-group">
          <label class="form-label">Nom du Rush</label>
          <input type="text" class="form-input" id="rushName" placeholder="Ex: Sprint Apps Semaine 47" required />
        </div>

        <div class="form-group">
          <label class="form-label">Workflow</label>
          <div id="workflowOptions" style="display: flex; flex-direction: column; gap: 8px;">
            ${RushStorage.DEFAULT_WORKFLOWS.map((wf, i) => `
              <label style="display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid var(--gray-200); border-radius: var(--radius-lg); cursor: pointer;">
                <input type="radio" name="workflow" value="${i}" ${i === 0 ? 'checked' : ''} />
                <div>
                  <div style="font-weight: 500;">${wf.name}</div>
                  <div style="font-size: 0.75rem; color: var(--gray-500);">${wf.steps.length} etapes</div>
                </div>
              </label>
            `).join('')}
            <label style="display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid var(--gray-200); border-radius: var(--radius-lg); cursor: pointer;">
              <input type="radio" name="workflow" value="custom" />
              <div>
                <div style="font-weight: 500;">Personnaliser</div>
                <div style="font-size: 0.75rem; color: var(--gray-500);">Creer vos propres etapes</div>
              </div>
            </label>
          </div>
        </div>

        <div id="customWorkflowEditor" style="display: none; margin-bottom: 16px;">
          <div id="customSteps"></div>
          <button type="button" class="btn btn-sm btn-secondary" onclick="RushPage.addCustomStep()">
            + Ajouter une etape
          </button>
        </div>

        <div class="form-group">
          <label class="form-label">Projets (un par ligne)</label>
          <textarea class="form-textarea" id="projectNames" rows="5" placeholder="App Client A&#10;App Client B&#10;App Client C" required></textarea>
        </div>

        <div class="modal-footer" style="padding: 0; border: none; margin-top: 24px;">
          <button type="button" class="btn btn-secondary" onclick="Components.Modal.close()">Annuler</button>
          <button type="submit" class="btn btn-orange">Creer le Rush</button>
        </div>
      </form>
    `;

    Components.Modal.open('Nouveau Rush', content);

    // Toggle custom workflow editor
    const workflowInputs = content.querySelectorAll('input[name="workflow"]');
    const customEditor = content.querySelector('#customWorkflowEditor');

    workflowInputs.forEach(input => {
      input.addEventListener('change', () => {
        customEditor.style.display = input.value === 'custom' ? 'block' : 'none';
      });
    });

    // Form submit
    content.querySelector('#createRushForm').addEventListener('submit', (e) => {
      e.preventDefault();

      const name = content.querySelector('#rushName').value.trim();
      const projectNames = content.querySelector('#projectNames').value.split('\n').map(p => p.trim()).filter(Boolean);
      const selectedWorkflow = content.querySelector('input[name="workflow"]:checked').value;

      let workflow;
      if (selectedWorkflow === 'custom') {
        const customSteps = content.querySelectorAll('.custom-step');
        workflow = Array.from(customSteps).map((step, i) => ({
          title: step.querySelector('.step-title').value.trim(),
          order: i + 1,
          timeLimit: parseInt(step.querySelector('.step-time').value) || 10,
        })).filter(s => s.title);
      } else {
        workflow = RushStorage.DEFAULT_WORKFLOWS[parseInt(selectedWorkflow)].steps;
      }

      if (name && projectNames.length > 0 && workflow.length > 0) {
        const newRush = RushStorage.createRush(name, workflow, projectNames);
        RushPageState.rushes = RushStorage.getRushes();
        RushPageState.activeRush = newRush;
        Components.Modal.close();
        renderRushPage();
        Components.Toast.success('Rush cree avec succes!');
      }
    });
  },

  addCustomStep() {
    const container = Utils.$('#customSteps');
    const index = container.children.length;
    const step = Utils.createElement('div', 'custom-step');
    step.style.cssText = 'display: flex; gap: 8px; margin-bottom: 8px;';
    step.innerHTML = `
      <input type="text" class="form-input step-title" placeholder="Etape ${index + 1}" style="flex: 1;" />
      <input type="number" class="form-input step-time" placeholder="min" value="10" style="width: 80px;" />
      <button type="button" class="btn btn-sm btn-danger-outline" onclick="this.parentElement.remove()">${Utils.Icons.x}</button>
    `;
    container.appendChild(step);
  },

  deleteRush(id) {
    Components.Modal.confirm(
      'Supprimer ce Rush ?',
      'Cette action est irreversible. Toutes les donnees seront perdues.',
      () => {
        RushStorage.deleteRush(id);
        RushPageState.rushes = RushStorage.getRushes();
        if (RushPageState.activeRush?.id === id) {
          RushPageState.activeRush = RushPageState.rushes[0] || null;
        }
        renderRushPage();
        Components.Toast.success('Rush supprime');
      },
      { danger: true, confirmText: 'Supprimer' }
    );
  },

  renameRush(id) {
    const rush = RushPageState.rushes.find(r => r.id === id);
    if (!rush) return;

    Components.Modal.prompt('Renommer le Rush', 'Nouveau nom', rush.name, (newName) => {
      if (newName && newName !== rush.name) {
        RushStorage.renameRush(id, newName);
        RushPageState.rushes = RushStorage.getRushes();
        if (RushPageState.activeRush?.id === id) {
          RushPageState.activeRush = RushPageState.rushes.find(r => r.id === id);
        }
        renderRushPage();
      }
    });
  },

  showColorPicker(id) {
    const rush = RushPageState.rushes.find(r => r.id === id);
    if (!rush) return;

    const content = Utils.createElement('div', '');
    content.innerHTML = `<p style="margin-bottom: 16px; color: var(--gray-600);">Choisissez une couleur pour ce Rush:</p>`;

    const picker = Components.createColorPicker(rush.color, (color) => {
      RushStorage.updateRushColor(id, color);
      RushPageState.rushes = RushStorage.getRushes();
      if (RushPageState.activeRush?.id === id) {
        RushPageState.activeRush = RushPageState.rushes.find(r => r.id === id);
      }
      Components.Modal.close();
      renderRushPage();
    });

    content.appendChild(picker);
    Components.Modal.open('Couleur du Rush', content, { size: 'sm' });
  },

  stopBlinking(id) {
    RushStorage.stopRushBlinking(id);
    RushPageState.rushes = RushStorage.getRushes();
    renderRushPage();
  },

  activateProject(projectId) {
    if (!RushPageState.activeRush) return;

    const updated = RushStorage.activateProject(RushPageState.activeRush.id, projectId);
    if (updated) {
      RushPageState.activeRush = updated;
      RushPageState.rushes = RushStorage.getRushes();
      RushPageState.currentTime = 0;
      renderRushPage();
    }
  },

  completeTask() {
    if (!RushPageState.activeRush?.activeProjectId) return;

    const rushId = RushPageState.activeRush.id;
    const updated = RushStorage.completeTask(rushId, RushPageState.activeRush.activeProjectId);

    if (updated) {
      // Find next rush to blink
      const currentIndex = RushPageState.rushes.findIndex(r => r.id === rushId);
      for (let i = currentIndex + 1; i < RushPageState.rushes.length; i++) {
        if (RushPageState.rushes[i].status !== 'completed') {
          RushStorage.setRushBlinking(RushPageState.rushes[i].id, true);
          break;
        }
      }

      RushPageState.activeRush = updated;
      RushPageState.rushes = RushStorage.getRushes();
      RushPageState.currentTime = 0;
      renderRushPage();
      Components.Toast.success('Tache terminee!');
    }
  },

  skipTask() {
    if (!RushPageState.activeRush?.activeProjectId) return;

    const updated = RushStorage.skipTask(RushPageState.activeRush.id, RushPageState.activeRush.activeProjectId);
    if (updated) {
      RushPageState.activeRush = updated;
      RushPageState.rushes = RushStorage.getRushes();
      RushPageState.currentTime = 0;
      renderRushPage();
    }
  },

  togglePause() {
    if (!RushPageState.activeRush) return;

    const updated = RushStorage.toggleRushPause(RushPageState.activeRush.id);
    if (updated) {
      RushPageState.activeRush = updated;
      RushPageState.rushes = RushStorage.getRushes();
      renderRushPage();
    }
  },

  setClockTheme(theme) {
    if (!RushPageState.activeRush) return;

    const updated = RushStorage.updateClockTheme(RushPageState.activeRush.id, theme);
    if (updated) {
      RushPageState.activeRush = updated;
      renderRushPage();
    }
  },

  resetProject(projectId) {
    Components.Modal.confirm(
      'Reinitialiser ce projet ?',
      'Toutes les taches seront remises a zero.',
      () => {
        const updated = RushStorage.resetProjectTasks(RushPageState.activeRush.id, projectId);
        if (updated) {
          RushPageState.activeRush = updated;
          RushPageState.rushes = RushStorage.getRushes();
          RushPageState.currentTime = 0;
          renderRushPage();
        }
      },
      { confirmText: 'Reinitialiser' }
    );
  },

  resetSession(projectId) {
    const updated = RushStorage.resetProjectSession(RushPageState.activeRush.id, projectId);
    if (updated) {
      RushPageState.activeRush = updated;
      renderRushPage();
    }
  },

  editTaskNotes(taskIndex) {
    if (!RushPageState.activeRush?.activeProjectId) return;

    const project = RushPageState.activeRush.projects.find(p => p.id === RushPageState.activeRush.activeProjectId);
    const task = project?.tasks[taskIndex];

    Components.Modal.prompt('Notes pour cette tache', 'Ajouter des notes, observations, problemes...', task?.notes || '', (notes) => {
      const updated = RushStorage.updateTaskNotes(RushPageState.activeRush.id, RushPageState.activeRush.activeProjectId, taskIndex, notes);
      if (updated) {
        RushPageState.activeRush = updated;
        renderRushPage();
      }
    }, { multiline: true });
  },

  editProjectNotes(projectId) {
    const project = RushPageState.activeRush?.projects.find(p => p.id === projectId);
    if (!project) return;

    Components.Modal.prompt('Notes pour ce projet', 'Ajouter des notes sur ce projet...', project.notes || '', (notes) => {
      const updated = RushStorage.updateProjectNotes(RushPageState.activeRush.id, projectId, notes);
      if (updated) {
        RushPageState.activeRush = updated;
        renderRushPage();
      }
    }, { multiline: true });
  },

  renameTask(stepIndex) {
    const step = RushPageState.activeRush?.workflow[stepIndex];
    if (!step) return;

    Components.Modal.prompt('Renommer la tache', 'Nouveau nom', step.title, (newTitle) => {
      if (newTitle && newTitle !== step.title) {
        const updated = RushStorage.renameWorkflowStep(RushPageState.activeRush.id, stepIndex, newTitle);
        if (updated) {
          RushPageState.activeRush = updated;
          renderRushPage();
        }
      }
    });
  },

  deleteTask(stepIndex) {
    Components.Modal.confirm('Supprimer cette tache ?', 'Cette action supprimera la tache de tous les projets.', () => {
      const updated = RushStorage.deleteWorkflowStep(RushPageState.activeRush.id, stepIndex);
      if (updated) {
        RushPageState.activeRush = updated;
        RushPageState.rushes = RushStorage.getRushes();
        renderRushPage();
      }
    }, { danger: true, confirmText: 'Supprimer' });
  },

  showInsertTask(afterIndex) {
    const content = Utils.createElement('div', '');
    content.innerHTML = `
      <form id="insertTaskForm">
        <div class="form-group">
          <label class="form-label">Nom de la tache</label>
          <input type="text" class="form-input" id="newTaskTitle" placeholder="Ex: Revue de code" required />
        </div>
        <div class="form-group">
          <label class="form-label">Limite de temps (min)</label>
          <input type="number" class="form-input" id="newTaskTime" value="10" />
        </div>
        <div class="modal-footer" style="padding: 0; border: none; margin-top: 24px;">
          <button type="button" class="btn btn-secondary" onclick="Components.Modal.close()">Annuler</button>
          <button type="submit" class="btn btn-orange">Inserer</button>
        </div>
      </form>
    `;

    Components.Modal.open('Inserer une nouvelle tache', content, { size: 'sm' });

    content.querySelector('#insertTaskForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const title = content.querySelector('#newTaskTitle').value.trim();
      const timeLimit = parseInt(content.querySelector('#newTaskTime').value) || 10;

      if (title) {
        const updated = RushStorage.insertWorkflowStep(RushPageState.activeRush.id, afterIndex, { title, timeLimit });
        if (updated) {
          RushPageState.activeRush = updated;
          RushPageState.rushes = RushStorage.getRushes();
          Components.Modal.close();
          renderRushPage();
        }
      }
    });
  },

  // Drag and Drop
  onDragStart(e, index) {
    this.draggedIndex = index;
    e.dataTransfer.effectAllowed = 'move';
  },

  onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  },

  onDrop(e, toIndex) {
    e.preventDefault();
    if (this.draggedIndex !== null && this.draggedIndex !== toIndex) {
      const updated = RushStorage.reorderWorkflowSteps(RushPageState.activeRush.id, this.draggedIndex, toIndex);
      if (updated) {
        RushPageState.activeRush = updated;
        RushPageState.rushes = RushStorage.getRushes();
        renderRushPage();
      }
    }
    this.draggedIndex = null;
  },

  showStats() {
    if (!RushPageState.activeRush) return;

    const stats = RushStorage.getRushStats(RushPageState.activeRush);

    const content = Utils.createElement('div', '');
    content.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
        <div style="background: var(--gray-50); border-radius: var(--radius-xl); padding: 16px; text-align: center;">
          <div style="font-size: 2rem; font-weight: 700;">${stats.completedProjects}/${stats.totalProjects}</div>
          <div style="font-size: 0.875rem; color: var(--gray-500);">Projets termines</div>
        </div>
        <div style="background: var(--gray-50); border-radius: var(--radius-xl); padding: 16px; text-align: center;">
          <div style="font-size: 2rem; font-weight: 700;">${stats.completedTasks}/${stats.totalTasks}</div>
          <div style="font-size: 0.875rem; color: var(--gray-500);">Taches terminees</div>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--gray-600);">Temps total</span>
          <span class="font-mono font-bold">${RushStorage.formatTime(RushPageState.activeRush.totalTimeSpent)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--gray-600);">Moyenne par tache</span>
          <span class="font-mono font-bold">${RushStorage.formatTime(stats.averageTimePerTask)}</span>
        </div>
        ${stats.fastestProject ? `
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--gray-600);">Projet le plus rapide</span>
            <span style="color: var(--green-600); font-weight: 500;">${stats.fastestProject.name} (${RushStorage.formatTime(stats.fastestProject.time)})</span>
          </div>
        ` : ''}
        ${stats.slowestProject && stats.slowestProject !== stats.fastestProject ? `
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--gray-600);">Projet le plus lent</span>
            <span style="color: var(--orange-600); font-weight: 500;">${stats.slowestProject.name} (${RushStorage.formatTime(stats.slowestProject.time)})</span>
          </div>
        ` : ''}
      </div>

      <h4 style="font-weight: 500; margin-bottom: 12px;">Par projet</h4>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${RushPageState.activeRush.projects.sort((a, b) => b.totalTimeSpent - a.totalTimeSpent).map(project => {
          const completed = project.tasks.filter(t => t.status === 'completed').length;
          const progress = Math.round((completed / project.tasks.length) * 100);
          return `
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 4px;">
                  <span style="font-weight: 500;">${project.name}</span>
                  <span style="color: var(--gray-500);">${progress}%</span>
                </div>
                ${Components.createProgressBar(progress, { size: 'xs', color: 'orange' }).outerHTML}
              </div>
              <span class="font-mono" style="font-size: 0.875rem; color: var(--gray-600); width: 64px; text-align: right;">
                ${RushStorage.formatTime(project.totalTimeSpent)}
              </span>
            </div>
          `;
        }).join('')}
      </div>
    `;

    Components.Modal.open('Statistiques', content);
  },

  showWorkflowModal() {
    const workflows = RushStorage.getSavedWorkflows();

    const content = Utils.createElement('div', '');
    content.innerHTML = `
      <div style="margin-bottom: 16px;">
        <label class="form-label">Choisir un workflow</label>
        <select class="form-select" id="workflowSelect">
          <option value="">-- Selectionner --</option>
          <optgroup label="Templates par defaut">
            ${workflows.filter(w => w.isDefault).map(wf => `
              <option value="${wf.id}">${wf.name} (${wf.steps.length} etapes)</option>
            `).join('')}
          </optgroup>
          ${workflows.filter(w => !w.isDefault).length > 0 ? `
            <optgroup label="Mes workflows">
              ${workflows.filter(w => !w.isDefault).map(wf => `
                <option value="${wf.id}">${wf.name} (${wf.steps.length} etapes)</option>
              `).join('')}
            </optgroup>
          ` : ''}
        </select>
      </div>

      <div id="workflowPreview" style="display: none; background: var(--violet-50); border-radius: var(--radius-lg); padding: 12px; margin-bottom: 16px;">
        <p style="font-size: 0.875rem; font-weight: 500; color: var(--violet-800); margin-bottom: 8px;">Etapes du workflow :</p>
        <div id="workflowSteps" style="display: flex; flex-wrap: wrap; gap: 4px;"></div>
      </div>

      <div style="margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <label class="form-label" style="margin: 0;">Selectionner les Rush</label>
          <div style="font-size: 0.75rem;">
            <button type="button" style="color: var(--violet-600);" onclick="document.querySelectorAll('.rush-checkbox').forEach(c => c.checked = true)">Tout</button>
            |
            <button type="button" style="color: var(--violet-600);" onclick="document.querySelectorAll('.rush-checkbox').forEach(c => c.checked = false)">Aucun</button>
          </div>
        </div>
        <div style="border: 1px solid var(--gray-200); border-radius: var(--radius-lg); padding: 8px; max-height: 200px; overflow-y: auto;">
          ${RushPageState.rushes.map(rush => {
            const colorStyle = Utils.getRushColorStyle(rush.color);
            return `
              <label style="display: flex; align-items: center; gap: 12px; padding: 8px; cursor: pointer; border-radius: var(--radius-lg);">
                <input type="checkbox" class="rush-checkbox" value="${rush.id}" />
                <div style="width: 12px; height: 12px; border-radius: 50%; background: ${colorStyle.bg};"></div>
                <span style="flex: 1; font-weight: 500;">${rush.name}</span>
                <span style="font-size: 0.75rem; color: var(--gray-500);">${rush.projects.length} projet${rush.projects.length > 1 ? 's' : ''}</span>
              </label>
            `;
          }).join('')}
        </div>
      </div>

      <div id="workflowWarning" style="display: none; background: var(--yellow-50); border: 1px solid var(--yellow-200); border-radius: var(--radius-lg); padding: 12px; margin-bottom: 16px;">
        <div style="display: flex; align-items: flex-start; gap: 8px;">
          ${Utils.Icons.alertTriangle}
          <div style="font-size: 0.875rem; color: var(--yellow-800);">
            <p style="font-weight: 500;">Attention</p>
            <p>La progression des taches sera reinitialisee pour les Rush selectionnes.</p>
          </div>
        </div>
      </div>

      <div class="modal-footer" style="padding: 0; border: none;">
        <button type="button" class="btn btn-secondary" onclick="Components.Modal.close()">Annuler</button>
        <button type="button" class="btn btn-violet" id="applyWorkflowBtn" disabled>
          ${Utils.Icons.check} Appliquer
        </button>
      </div>
    `;

    Components.Modal.open('Appliquer un Workflow', content);

    const select = content.querySelector('#workflowSelect');
    const preview = content.querySelector('#workflowPreview');
    const stepsContainer = content.querySelector('#workflowSteps');
    const warning = content.querySelector('#workflowWarning');
    const applyBtn = content.querySelector('#applyWorkflowBtn');
    const checkboxes = content.querySelectorAll('.rush-checkbox');

    const updateState = () => {
      const selectedWorkflow = workflows.find(w => w.id === select.value);
      const selectedRushes = Array.from(checkboxes).filter(c => c.checked).map(c => c.value);

      if (selectedWorkflow) {
        preview.style.display = 'block';
        stepsContainer.innerHTML = selectedWorkflow.steps.map((step, i) => `
          <span style="padding: 4px 8px; background: var(--violet-100); color: var(--violet-700); font-size: 0.75rem; border-radius: var(--radius);">
            ${i + 1}. ${step.title}${step.timeLimit ? ` <span style="color: var(--violet-500);">(${step.timeLimit}min)</span>` : ''}
          </span>
        `).join('');
      } else {
        preview.style.display = 'none';
      }

      warning.style.display = selectedRushes.length > 0 ? 'block' : 'none';
      applyBtn.disabled = !selectedWorkflow || selectedRushes.length === 0;
    };

    select.addEventListener('change', updateState);
    checkboxes.forEach(c => c.addEventListener('change', updateState));

    applyBtn.addEventListener('click', () => {
      const selectedWorkflow = workflows.find(w => w.id === select.value);
      const selectedRushIds = Array.from(checkboxes).filter(c => c.checked).map(c => c.value);

      if (selectedWorkflow && selectedRushIds.length > 0) {
        const result = RushStorage.applyWorkflowToRushes(selectedRushIds, selectedWorkflow.steps);
        RushPageState.rushes = RushStorage.getRushes();
        if (RushPageState.activeRush && result.success.includes(RushPageState.activeRush.id)) {
          RushPageState.activeRush = RushPageState.rushes.find(r => r.id === RushPageState.activeRush.id);
        }
        Components.Modal.close();
        renderRushPage();
        Components.Toast.success(`Workflow applique a ${result.success.length} Rush`);
      }
    });
  },
};

// ==================== //
// RUSH TIMER           //
// ==================== //

function startRushTimer() {
  if (RushPageState.timerInterval) {
    clearInterval(RushPageState.timerInterval);
  }

  RushPageState.timerInterval = setInterval(() => {
    if (!RushPageState.activeRush || RushPageState.activeRush.status !== 'active') return;

    const project = RushPageState.activeRush.projects.find(p => p.id === RushPageState.activeRush.activeProjectId);
    if (project) {
      const task = project.tasks[project.currentStepIndex];
      if (task?.startedAt) {
        const elapsed = Math.floor((Date.now() - new Date(task.startedAt).getTime()) / 1000);
        RushPageState.currentTime = elapsed;

        // Update timer display
        const timerEl = Utils.$('.rush-task.current .rush-task-time');
        if (timerEl) {
          timerEl.textContent = RushStorage.formatTime(elapsed);
        }

        // Update session timer
        const sessionTimerEl = Utils.$('#sessionTimer');
        if (sessionTimerEl) {
          sessionTimerEl.textContent = RushStorage.formatTime(RushStorage.getCurrentSessionTime(project));
        }
      }
    }
  }, 1000);
}

function startBlinkingEffects() {
  // Clear existing intervals
  Object.values(RushPageState.blinkIntervals).forEach(clearInterval);
  RushPageState.blinkIntervals = {};

  RushPageState.rushes.forEach(rush => {
    if (rush.isBlinking && !rush.blinkingStopped && rush.id !== RushPageState.activeRush?.id && rush.status !== 'completed') {
      let visible = true;
      RushPageState.blinkIntervals[rush.id] = setInterval(() => {
        const tab = Utils.$(`.rush-tab[data-rush-id="${rush.id}"]`);
        if (tab) {
          tab.style.opacity = visible ? '1' : '0.5';
          visible = !visible;
        }
      }, 300);
    }
  });
}

// ==================== //
// OTHER PAGES          //
// ==================== //

function renderProjectsPage() {
  const container = Utils.$('#mainContent');
  container.innerHTML = `
    <div class="animate-fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Projets</h1>
          <p class="page-subtitle">Gerez vos projets</p>
        </div>
      </div>
      <div class="card">
        <div class="card-body text-center" style="padding: 48px;">
          <p style="color: var(--gray-500);">Cette page sera disponible prochainement.</p>
          <p style="color: var(--gray-400); font-size: 0.875rem; margin-top: 8px;">Utilisez le Rush Mode pour gerer vos projets en mode productivite maximale.</p>
        </div>
      </div>
    </div>
  `;
}

function renderCalendarPage() {
  const container = Utils.$('#mainContent');
  container.innerHTML = `
    <div class="animate-fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Calendrier</h1>
          <p class="page-subtitle">Planifiez vos evenements</p>
        </div>
      </div>
      <div class="card">
        <div class="card-body text-center" style="padding: 48px;">
          <p style="color: var(--gray-500);">Cette page sera disponible prochainement.</p>
        </div>
      </div>
    </div>
  `;
}

function renderWatchPage() {
  const container = Utils.$('#mainContent');
  container.innerHTML = `
    <div class="animate-fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Veille</h1>
          <p class="page-subtitle">Suivez vos ressources</p>
        </div>
      </div>
      <div class="card">
        <div class="card-body text-center" style="padding: 48px;">
          <p style="color: var(--gray-500);">Cette page sera disponible prochainement.</p>
        </div>
      </div>
    </div>
  `;
}

function renderNotificationsPage() {
  const container = Utils.$('#mainContent');
  container.innerHTML = `
    <div class="animate-fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Notifications</h1>
          <p class="page-subtitle">Vos alertes et rappels</p>
        </div>
      </div>
      <div class="card">
        <div class="card-body text-center" style="padding: 48px;">
          <p style="color: var(--gray-500);">Aucune notification pour le moment.</p>
        </div>
      </div>
    </div>
  `;
}

function renderSettingsPage() {
  const container = Utils.$('#mainContent');
  container.innerHTML = `
    <div class="animate-fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Parametres & Statistiques</h1>
          <p class="page-subtitle">Gerez vos donnees</p>
        </div>
      </div>
      <div class="card">
        <div class="card-body">
          <h3 style="font-weight: 600; margin-bottom: 16px;">Gestion des donnees Rush</h3>
          <p style="color: var(--gray-500); margin-bottom: 16px;">
            ${RushPageState.rushes.length} Rush enregistre(s)
          </p>
          <button class="btn btn-danger-outline" onclick="Pages.clearAllData()">
            ${Utils.Icons.trash} Effacer toutes les donnees Rush
          </button>
        </div>
      </div>
    </div>
  `;
}

// ==================== //
// PAGES OBJECT         //
// ==================== //

const Pages = {
  dashboard: renderDashboard,
  projects: renderProjectsPage,
  rush: renderRushPage,
  calendar: renderCalendarPage,
  watch: renderWatchPage,
  notifications: renderNotificationsPage,
  settings: renderSettingsPage,

  clearAllData() {
    Components.Modal.confirm(
      'Effacer toutes les donnees ?',
      'Cette action est irreversible. Tous vos Rush seront supprimes.',
      () => {
        localStorage.removeItem('organizapp_rushes');
        localStorage.removeItem('organizapp_workflows');
        RushPageState.rushes = [];
        RushPageState.activeRush = null;
        renderSettingsPage();
        Components.Toast.success('Donnees effacees');
      },
      { danger: true, confirmText: 'Effacer' }
    );
  }
};

window.Pages = Pages;
window.RushPage = RushPage;
window.RushPageState = RushPageState;
