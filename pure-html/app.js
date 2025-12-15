/**
 * OrganizApp - Main Application (Pure JavaScript)
 * Point d'entrée et gestion de la navigation
 */

// ==================== //
// APP STATE            //
// ==================== //

const AppState = {
  currentPage: 'dashboard',
  isAIPanelOpen: false,
};

// ==================== //
// APP OBJECT           //
// ==================== //

const App = {
  init() {
    // Initialize components
    Components.Modal.init();

    // Load initial data
    RushPageState.rushes = RushStorage.getRushes();

    // Setup navigation
    this.setupNavigation();

    // Setup quick add
    this.setupQuickAdd();

    // Setup AI panel
    this.setupAIPanel();

    // Handle initial route from hash
    const hash = window.location.hash.slice(1);
    if (hash && Pages[hash]) {
      this.navigateTo(hash);
    } else {
      this.navigateTo('dashboard');
    }

    // Listen for hash changes
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.slice(1);
      if (hash && Pages[hash]) {
        this.navigateTo(hash, false);
      }
    });

    // Update notification badge
    this.updateNotificationBadge();

    console.log('OrganizApp initialized');
  },

  setupNavigation() {
    // Desktop sidebar navigation
    const sidebarNavItems = Utils.$$('.sidebar .nav-item');
    sidebarNavItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        if (page) {
          this.navigateTo(page);
        }
      });
    });

    // Mobile navigation
    const mobileNavItems = Utils.$$('.mobile-nav-item');
    mobileNavItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        if (page) {
          this.navigateTo(page);
        }
      });
    });
  },

  setupQuickAdd() {
    const quickAddBtn = Utils.$('#quickAddBtn');
    const mobileQuickAddBtn = Utils.$('#mobileQuickAddBtn');

    const showQuickAdd = () => {
      this.navigateTo('rush');
      setTimeout(() => {
        RushPage.showCreateModal();
      }, 100);
    };

    if (quickAddBtn) {
      quickAddBtn.addEventListener('click', showQuickAdd);
    }

    if (mobileQuickAddBtn) {
      mobileQuickAddBtn.addEventListener('click', showQuickAdd);
    }
  },

  setupAIPanel() {
    const aiBtn = Utils.$('#aiAssistantBtn');
    const aiPanel = Utils.$('#aiPanel');
    const aiCloseBtn = Utils.$('#aiPanelClose');
    const aiInput = Utils.$('#aiInput');
    const aiSendBtn = Utils.$('#aiSendBtn');
    const aiMessages = Utils.$('#aiMessages');

    if (aiBtn) {
      aiBtn.addEventListener('click', () => {
        AppState.isAIPanelOpen = !AppState.isAIPanelOpen;
        aiPanel.style.display = AppState.isAIPanelOpen ? 'flex' : 'none';
        if (AppState.isAIPanelOpen && aiInput) {
          aiInput.focus();
        }
      });
    }

    if (aiCloseBtn) {
      aiCloseBtn.addEventListener('click', () => {
        AppState.isAIPanelOpen = false;
        aiPanel.style.display = 'none';
      });
    }

    const sendMessage = () => {
      const message = aiInput.value.trim();
      if (!message) return;

      // Add user message
      const userMsg = Utils.createElement('div', 'ai-message ai-message-user');
      userMsg.textContent = message;
      aiMessages.appendChild(userMsg);

      // Clear input
      aiInput.value = '';

      // Scroll to bottom
      aiMessages.scrollTop = aiMessages.scrollHeight;

      // Simulate AI response
      setTimeout(() => {
        const response = this.processAIMessage(message);
        const aiMsg = Utils.createElement('div', 'ai-message ai-message-assistant');
        aiMsg.textContent = response;
        aiMessages.appendChild(aiMsg);
        aiMessages.scrollTop = aiMessages.scrollHeight;
      }, 500);
    };

    if (aiSendBtn) {
      aiSendBtn.addEventListener('click', sendMessage);
    }

    if (aiInput) {
      aiInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          sendMessage();
        }
      });
    }
  },

  processAIMessage(message) {
    const lowerMessage = message.toLowerCase();

    // Simple pattern matching for demo
    if (lowerMessage.includes('rush') && (lowerMessage.includes('creer') || lowerMessage.includes('nouveau'))) {
      return 'Pour creer un nouveau Rush, cliquez sur le bouton "Nouveau Rush" dans l\'onglet Rush, ou utilisez le bouton "Ajout rapide" dans la sidebar.';
    }

    if (lowerMessage.includes('aide') || lowerMessage.includes('help')) {
      return 'Je peux vous aider avec:\n- Creer des Rush (sessions de travail)\n- Gerer vos projets\n- Suivre votre progression\n\nQue souhaitez-vous faire ?';
    }

    if (lowerMessage.includes('statistique') || lowerMessage.includes('stats')) {
      const rushes = RushStorage.getRushes();
      const activeCount = rushes.filter(r => r.status === 'active').length;
      const completedCount = rushes.filter(r => r.status === 'completed').length;
      return `Voici vos statistiques:\n- Rush actifs: ${activeCount}\n- Rush termines: ${completedCount}\n- Total: ${rushes.length}`;
    }

    return 'Je suis Cell, votre assistant. Je peux vous aider a creer des projets, gerer vos Rush et suivre votre progression. Posez-moi une question !';
  },

  navigateTo(page, updateHash = true) {
    if (!Pages[page]) {
      console.error('Page not found:', page);
      return;
    }

    AppState.currentPage = page;

    // Update hash
    if (updateHash) {
      window.location.hash = page;
    }

    // Update active state in navigation
    Utils.$$('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    Utils.$$('.mobile-nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    // Render page
    Pages[page]();
  },

  updateNotificationBadge() {
    const badge = Utils.$('#notificationBadge');
    const mobileBadge = Utils.$('#mobileNotificationBadge');

    // For now, just hide badges (no notification system yet)
    if (badge) badge.style.display = 'none';
    if (mobileBadge) mobileBadge.style.display = 'none';
  },
};

// ==================== //
// INITIALIZE APP       //
// ==================== //

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

// Export App globally
window.App = App;
