/**
 * OrganizApp - Components Module (Pure JavaScript)
 * Composants UI réutilisables
 */

// ==================== //
// MODAL COMPONENT      //
// ==================== //

const Modal = {
  overlay: null,
  modal: null,
  title: null,
  content: null,
  closeBtn: null,

  init() {
    this.overlay = Utils.$('#modalOverlay');
    this.modal = Utils.$('#modal');
    this.title = Utils.$('#modalTitle');
    this.content = Utils.$('#modalContent');
    this.closeBtn = Utils.$('#modalClose');

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }

    if (this.overlay) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) {
          this.close();
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });
  },

  isOpen() {
    return this.overlay && this.overlay.style.display !== 'none';
  },

  open(title, content, options = {}) {
    if (!this.overlay) return;

    this.title.textContent = title;

    if (typeof content === 'string') {
      this.content.innerHTML = content;
    } else {
      Utils.clearElement(this.content);
      this.content.appendChild(content);
    }

    // Set modal size
    this.modal.className = 'modal';
    if (options.size) {
      this.modal.classList.add(`modal-${options.size}`);
    }

    this.overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Auto focus first input
    const firstInput = this.content.querySelector('input, textarea, select');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  },

  close() {
    if (!this.overlay) return;

    this.overlay.style.display = 'none';
    document.body.style.overflow = '';
    Utils.clearElement(this.content);
  },

  confirm(title, message, onConfirm, options = {}) {
    const content = Utils.createElement('div', 'modal-confirm');
    content.innerHTML = `
      <p style="color: var(--gray-600); margin-bottom: 24px;">${message}</p>
      <div class="modal-footer" style="border: none; padding: 0;">
        <button class="btn btn-secondary" id="modalCancelBtn">Annuler</button>
        <button class="btn ${options.danger ? 'btn-danger' : 'btn-primary'}" id="modalConfirmBtn">
          ${options.confirmText || 'Confirmer'}
        </button>
      </div>
    `;

    this.open(title, content, { size: 'sm' });

    Utils.$('#modalCancelBtn').addEventListener('click', () => this.close());
    Utils.$('#modalConfirmBtn').addEventListener('click', () => {
      this.close();
      if (onConfirm) onConfirm();
    });
  },

  prompt(title, label, defaultValue, onSubmit, options = {}) {
    const content = Utils.createElement('div', 'modal-prompt');
    content.innerHTML = `
      <div class="form-group">
        <label class="form-label">${label}</label>
        ${options.multiline
          ? `<textarea class="form-textarea" id="modalPromptInput" rows="4">${defaultValue || ''}</textarea>`
          : `<input type="${options.type || 'text'}" class="form-input" id="modalPromptInput" value="${defaultValue || ''}" />`
        }
      </div>
      <div class="modal-footer" style="border: none; padding: 0; margin-top: 16px;">
        <button class="btn btn-secondary" id="modalCancelBtn">Annuler</button>
        <button class="btn btn-primary" id="modalConfirmBtn">
          ${options.confirmText || 'Enregistrer'}
        </button>
      </div>
    `;

    this.open(title, content, { size: 'sm' });

    const input = Utils.$('#modalPromptInput');

    Utils.$('#modalCancelBtn').addEventListener('click', () => this.close());
    Utils.$('#modalConfirmBtn').addEventListener('click', () => {
      const value = input.value.trim();
      this.close();
      if (onSubmit) onSubmit(value);
    });

    // Submit on Enter for single-line inputs
    if (!options.multiline) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const value = input.value.trim();
          this.close();
          if (onSubmit) onSubmit(value);
        }
      });
    }
  }
};

// ==================== //
// TOAST NOTIFICATIONS  //
// ==================== //

const Toast = {
  container: null,

  init() {
    this.container = Utils.createElement('div', 'toast-container');
    this.container.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 24px;
      z-index: 200;
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;
    document.body.appendChild(this.container);
  },

  show(message, type = 'info', duration = 3000) {
    if (!this.container) this.init();

    const toast = Utils.createElement('div', `toast toast-${type}`);
    toast.style.cssText = `
      padding: 12px 20px;
      background: ${type === 'error' ? 'var(--red-600)' : type === 'success' ? 'var(--green-600)' : 'var(--gray-800)'};
      color: white;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      font-size: 0.875rem;
      animation: slideInLeft 200ms ease-out;
    `;
    toast.textContent = message;

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOutLeft 200ms ease-out';
      setTimeout(() => toast.remove(), 200);
    }, duration);
  },

  success(message) {
    this.show(message, 'success');
  },

  error(message) {
    this.show(message, 'error');
  },

  info(message) {
    this.show(message, 'info');
  }
};

// Add toast animations to document
const toastStyles = document.createElement('style');
toastStyles.textContent = `
  @keyframes slideInLeft {
    from { transform: translateX(-100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOutLeft {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(-100%); opacity: 0; }
  }
`;
document.head.appendChild(toastStyles);

// ==================== //
// DISSOLVE TIMER       //
// ==================== //

function createDissolveTimer(theme = 'fluid') {
  const container = Utils.createElement('div', 'dissolve-timer');

  const getThemeColors = () => {
    switch (theme) {
      case 'flap':
        return { bg: '#1a1a1a', text: '#e8e8e8' };
      case 'flap-light':
        return { bg: '#f5f5f5', text: '#1a1a1a' };
      default: // fluid
        return { bg: '#0a192f', text: '#00f5ff' };
    }
  };

  const colors = getThemeColors();

  container.style.cssText = `
    background: ${colors.bg};
    padding: 8px 16px;
    border-radius: var(--radius-lg);
    font-family: 'Orbitron', monospace;
    font-size: 1.5rem;
    font-weight: 700;
    color: ${colors.text};
    letter-spacing: 2px;
    ${theme === 'fluid' ? 'text-shadow: 0 0 10px rgba(0, 245, 255, 0.5);' : ''}
  `;

  container.textContent = '00:00:00';

  container.update = function() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const mins = now.getMinutes().toString().padStart(2, '0');
    const secs = now.getSeconds().toString().padStart(2, '0');
    this.textContent = `${hours}:${mins}:${secs}`;
  };

  // Start updating
  container.update();
  setInterval(() => container.update(), 1000);

  return container;
}

// ==================== //
// DROPDOWN COMPONENT   //
// ==================== //

function createDropdown(trigger, items) {
  const container = Utils.createElement('div', 'dropdown');

  const triggerBtn = Utils.createElement('button', 'dropdown-trigger');
  triggerBtn.innerHTML = trigger;

  const menu = Utils.createElement('div', 'dropdown-menu');

  items.forEach(item => {
    if (item.divider) {
      const divider = Utils.createElement('div', 'dropdown-divider');
      divider.style.cssText = 'height: 1px; background: var(--gray-200); margin: 4px 0;';
      menu.appendChild(divider);
    } else {
      const menuItem = Utils.createElement('button', `dropdown-item ${item.danger ? 'dropdown-item-danger' : ''}`);
      menuItem.innerHTML = `${item.icon || ''}${item.label}`;
      menuItem.addEventListener('click', () => {
        menu.classList.remove('open');
        if (item.onClick) item.onClick();
      });
      menu.appendChild(menuItem);
    }
  });

  container.appendChild(triggerBtn);
  container.appendChild(menu);

  triggerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('open');
  });

  document.addEventListener('click', () => {
    menu.classList.remove('open');
  });

  return container;
}

// ==================== //
// COLOR PICKER         //
// ==================== //

function createColorPicker(currentColor, onChange) {
  const container = Utils.createElement('div', 'color-picker');

  RushStorage.RUSH_COLORS.forEach(color => {
    const option = Utils.createElement('button', `color-option ${currentColor === color.value ? 'active' : ''}`);
    option.style.background = color.bg;
    option.title = color.label;
    option.addEventListener('click', () => {
      container.querySelectorAll('.color-option').forEach(o => o.classList.remove('active'));
      option.classList.add('active');
      if (onChange) onChange(color.value);
    });
    container.appendChild(option);
  });

  return container;
}

// ==================== //
// PROGRESS BAR         //
// ==================== //

function createProgressBar(percent, options = {}) {
  const container = Utils.createElement('div', `progress-bar ${options.size ? `progress-bar-${options.size}` : ''}`);

  const fill = Utils.createElement('div', `progress-fill ${options.color ? `progress-fill-${options.color}` : ''}`);
  fill.style.width = `${Math.min(100, Math.max(0, percent))}%`;

  if (options.customColor) {
    fill.style.background = options.customColor;
  }

  container.appendChild(fill);
  return container;
}

// ==================== //
// BADGE COMPONENT      //
// ==================== //

function createBadge(text, variant = 'gray') {
  const badge = Utils.createElement('span', `badge badge-${variant}`);
  badge.textContent = text;
  return badge;
}

// ==================== //
// EMPTY STATE          //
// ==================== //

function createEmptyState(icon, title, text, action) {
  const container = Utils.createElement('div', 'empty-state');
  container.innerHTML = `
    <div class="empty-state-icon">${icon}</div>
    <h3 class="empty-state-title">${title}</h3>
    <p class="empty-state-text">${text}</p>
  `;

  if (action) {
    const btn = Utils.createElement('button', `btn ${action.variant || 'btn-primary'}`);
    btn.innerHTML = `${action.icon || ''}${action.label}`;
    btn.addEventListener('click', action.onClick);
    container.appendChild(btn);
  }

  return container;
}

// ==================== //
// EXPORTS              //
// ==================== //

window.Components = {
  Modal,
  Toast,
  createDissolveTimer,
  createDropdown,
  createColorPicker,
  createProgressBar,
  createBadge,
  createEmptyState,
};
