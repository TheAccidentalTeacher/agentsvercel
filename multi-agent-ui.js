/**
 * Sprint 4: Multi-Agent UI Integration
 * Manages the multi-agent orchestration interface
 * 
 * Features:
 * - Mode selector (Panel, Consensus, Debate)
 * - Persona selector (12 experts, grouped)
 * - Question input area
 * - Results display with synthesis and individual responses
 * - Loading states and animations
 */

import MultiAgentClient from './multi-agent-client.js';

class MultiAgentUIController {
  constructor() {
    this.client = new MultiAgentClient();
    this.currentMode = 'panel';
    this.selectedPersonas = [];
    this.isLoading = false;
    this.currentResult = null;
    
    // Persona metadata
    this.personas = {
      'master-teacher': { icon: '👨‍🏫', name: 'Master Teacher', category: 'Core Council' },
      'technical-architect': { icon: '🏗️', name: 'Technical Architect', category: 'Specialists' },
      'strategist': { icon: '📊', name: 'Strategist', category: 'Core Council' },
      'theologian': { icon: '⛪', name: 'Theologian', category: 'Core Council' },
      'writer': { icon: '✍️', name: 'Writer', category: 'Specialists' },
      'analyst': { icon: '🔬', name: 'Analyst', category: 'Specialists' },
      'debugger': { icon: '🐛', name: 'Debugger', category: 'Specialists' },
      'classical-educator': { icon: '📖', name: 'Classical Educator', category: 'Core Council' },
      'gen-alpha-expert': { icon: '🎮', name: 'Gen-Alpha Expert', category: 'Specialists' },
      'ux-designer': { icon: '🎨', name: 'UX Designer', category: 'Specialists' },
      'marketing-strategist': { icon: '📢', name: 'Marketing Strategist', category: 'Specialists' },
      'game-designer': { icon: '🎯', name: 'Game Designer', category: 'Specialists' }
    };
    
    this.init();
  }

  init() {
    // Check if multi-agent section exists
    const section = document.getElementById('multi-agent-section');
    if (!section) {
      console.warn('Multi-agent section not found in DOM');
      return;
    }
    
    this.setupEventListeners();
    this.setupToggleButtons();
    this.loadStoredPreferences();
    console.log('✅ Multi-Agent UI Controller initialized');
  }

  setupToggleButtons() {
    // Show multi-agent button
    const showBtn = document.getElementById('show-multi-agent');
    if (showBtn) {
      showBtn.addEventListener('click', () => {
        document.getElementById('multi-agent-section').style.display = 'block';
      });
    }

    // Hide multi-agent button
    const hideBtn = document.getElementById('toggle-multi-agent');
    if (hideBtn) {
      hideBtn.addEventListener('click', () => {
        document.getElementById('multi-agent-section').style.display = 'none';
      });
    }
  }

  setupEventListeners() {
    // Mode selector buttons
    const modeBtns = document.querySelectorAll('.mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = e.target.dataset.mode;
        if (mode) this.selectMode(mode);
      });
    });

    // Persona checkboxes
    const personaCheckboxes = document.querySelectorAll('.persona-list input[type="checkbox"]');
    personaCheckboxes.forEach(cb => {
      cb.addEventListener('change', () => this.updateSelectedPersonas());
    });

    // Question input
    const questionInput = document.querySelector('.question-input');
    if (questionInput) {
      questionInput.addEventListener('input', (e) => this.updateCharCount(e.target.value));
      questionInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.executeWorkflow();
        }
      });
    }

    // Execute button
    const executeBtn = document.querySelector('.execute-btn');
    if (executeBtn) {
      executeBtn.addEventListener('click', () => this.executeWorkflow());
    }

    // Select All / Clear All buttons
    const selectAllBtn = document.querySelector('.persona-select-all');
    const clearAllBtn = document.querySelector('.persona-clear-all');
    if (selectAllBtn) selectAllBtn.addEventListener('click', () => this.selectAllPersonas());
    if (clearAllBtn) clearAllBtn.addEventListener('click', () => this.clearAllPersonas());
  }

  selectMode(mode) {
    if (!['panel', 'consensus', 'debate'].includes(mode)) {
      console.warn('Invalid mode:', mode);
      return;
    }

    this.currentMode = mode;
    
    // Update button states
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    localStorage.setItem('multiAgentMode', mode);
    console.log(`🧭 Mode selected: ${mode}`);
  }

  updateSelectedPersonas() {
    const checkboxes = document.querySelectorAll('.persona-list input[type="checkbox"]:checked');
    this.selectedPersonas = Array.from(checkboxes).map(cb => cb.value);
    
    // Update count display
    const countDisplay = document.querySelector('.persona-count');
    if (countDisplay) {
      countDisplay.textContent = this.selectedPersonas.length > 0 
        ? `${this.selectedPersonas.length} selected` 
        : 'None selected (auto-select)';
    }
    
    localStorage.setItem('multiAgentPersonas', JSON.stringify(this.selectedPersonas));
    console.log(`👥 Personas selected: ${this.selectedPersonas.join(', ') || 'auto-select'}`);
  }

  selectAllPersonas() {
    const checkboxes = document.querySelectorAll('.persona-list input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = true);
    this.updateSelectedPersonas();
  }

  clearAllPersonas() {
    const checkboxes = document.querySelectorAll('.persona-list input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    this.updateSelectedPersonas();
  }

  updateCharCount(text) {
    const charCountEl = document.querySelector('.char-count');
    if (charCountEl) {
      charCountEl.textContent = `${text.length} / 2000`;
    }
    
    const executeBtn = document.querySelector('.execute-btn');
    if (executeBtn) {
      executeBtn.disabled = text.trim().length === 0 || this.isLoading;
    }
  }

  async executeWorkflow() {
    const questionInput = document.querySelector('.question-input');
    const question = questionInput?.value?.trim();

    if (!question) {
      alert('Please enter a question');
      return;
    }

    try {
      this.setLoading(true);
      this.showLoadingState();
      
      console.log(`🚀 Executing ${this.currentMode} workflow...`);
      
      const result = await this.client.executeWorkflow(
        question,
        this.currentMode,
        this.selectedPersonas.length > 0 ? this.selectedPersonas : null
      );

      this.currentResult = result;
      this.displayResults(result);
      
    } catch (error) {
      console.error('❌ Workflow error:', error);
      this.showError(error.message);
    } finally {
      this.setLoading(false);
    }
  }

  setLoading(loading) {
    this.isLoading = loading;
    const executeBtn = document.querySelector('.execute-btn');
    if (executeBtn) {
      executeBtn.disabled = loading;
      executeBtn.textContent = loading ? '⏳ Orchestrating...' : '▶️ Execute Workflow';
    }
  }

  showLoadingState() {
    const resultsContainer = document.querySelector('.multi-agent-results');
    if (!resultsContainer) return;

    resultsContainer.innerHTML = `
      <div class="multi-agent-loading">
        <div class="loading-spinner"></div>
        <div class="loading-info">
          <h3>Orchestrating Agents...</h3>
          <p class="stage">Assembling the Consortium...</p>
          <div class="progress-bar">
            <div class="progress-fill" style="width: 25%;"></div>
          </div>
          <p class="est-time">This typically takes 15-20 seconds</p>
        </div>
      </div>
    `;
  }

  showError(message) {
    const resultsContainer = document.querySelector('.multi-agent-results');
    if (!resultsContainer) return;

    resultsContainer.innerHTML = `
      <div class="multi-agent-error">
        <h3>❌ Error</h3>
        <p>${message}</p>
        <p style="font-size: 12px; color: #999; margin-top: 10px;">
          Check that the API is running and your configuration is correct.
        </p>
      </div>
    `;
  }

  displayResults(result) {
    const resultsContainer = document.querySelector('.multi-agent-results');
    if (!resultsContainer) return;

    const html = this.formatResults(result);
    resultsContainer.innerHTML = html;
    
    // Add animations
    setTimeout(() => {
      const cards = resultsContainer.querySelectorAll('.response-card');
      cards.forEach((card, index) => {
        setTimeout(() => {
          card.style.animation = 'fadeIn 0.3s ease-out forwards';
        }, index * 100);
      });
    }, 0);
  }

  formatResults(result) {
    if (!result || !result.synthesis) {
      return '<p>No results received</p>';
    }

    const synthesisHTML = this.formatMarkdown(result.synthesis);
    const responsesHTML = (result.responses || []).map(r => `
      <div class="response-card" data-persona="${r.persona}">
        <header>
          <h4>
            <span class="persona-icon">${this.personas[r.persona]?.icon || '👤'}</span>
            <span class="persona-name">${this.formatPersonaName(r.persona)}</span>
          </h4>
          <span class="response-time">AI Response</span>
        </header>
        <div class="response-content">
          ${this.formatMarkdown(r.content)}
        </div>
        <footer class="response-actions">
          <button class="copy-btn" onclick="navigator.clipboard.writeText(${JSON.stringify(r.content)})">
            📋 Copy
          </button>
        </footer>
      </div>
    `).join('');

    const modeLabel = {
      panel: '📋 Panel Discussion',
      consensus: '🗳️ Consensus',
      debate: '💬 Debate'
    }[result.mode] || result.mode;

    return `
      <div class="synthesis-section">
        <header class="synthesis-header">
          <h3>📊 Synthesis</h3>
          <span class="mode-badge">${modeLabel}</span>
          <span class="agent-count">${result.personas?.length || 0} agents</span>
        </header>
        <div class="synthesis-content">
          ${synthesisHTML}
        </div>
      </div>
      
      <div class="individual-responses">
        <h3>Individual Perspectives</h3>
        <div class="responses-container">
          ${responsesHTML}
        </div>
      </div>
    `;
  }

  formatMarkdown(content) {
    if (!content) return '';
    
    return content
      .replace(/\n\n/g, '</p><p>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
      .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
      .replace(/^- (.*?)$/gm, '<li>$1</li>')
      .replace(/(<li>.*?<\/li>)/s, '<ul>$1</ul>')
      .split('\n')
      .map(line => line.trim() ? `<p>${line}</p>` : '')
      .join('')
      .replace(/<p><\/p>/g, '');
  }

  formatPersonaName(personaName) {
    return personaName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  loadStoredPreferences() {
    const savedMode = localStorage.getItem('multiAgentMode');
    if (savedMode && ['panel', 'consensus', 'debate'].includes(savedMode)) {
      this.selectMode(savedMode);
    }

    const savedPersonas = localStorage.getItem('multiAgentPersonas');
    if (savedPersonas) {
      try {
        const personas = JSON.parse(savedPersonas);
        if (Array.isArray(personas)) {
          personas.forEach(persona => {
            const checkbox = document.querySelector(`.persona-list input[value="${persona}"]`);
            if (checkbox) checkbox.checked = true;
          });
          this.updateSelectedPersonas();
        }
      } catch (e) {
        console.warn('Failed to load saved personas:', e);
      }
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.multiAgentUI = new MultiAgentUIController();
});

export default MultiAgentUIController;
