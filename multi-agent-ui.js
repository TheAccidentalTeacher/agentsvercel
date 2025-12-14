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

// ═══════════════════════════════════════════════════════════════════════════
// ENHANCED LOGGING SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

const LOG_LEVELS = {
  DEBUG: { color: '#888888', prefix: '🔍' },
  INFO: { color: '#00AA00', prefix: 'ℹ️' },
  WARN: { color: '#FFAA00', prefix: '⚠️' },
  ERROR: { color: '#FF0000', prefix: '❌' },
  SUCCESS: { color: '#00FF00', prefix: '✅' },
  EVENT: { color: '#0088FF', prefix: '📌' },
  PERSONA: { color: '#AA00FF', prefix: '👤' },
  API: { color: '#FF8800', prefix: '🔗' },
  UI: { color: '#00CCCC', prefix: '🎨' },
  PERF: { color: '#FFFF00', prefix: '⚡' }
};

function log(level, ...args) {
  const config = LOG_LEVELS[level] || LOG_LEVELS.DEBUG;
  const timestamp = new Date().toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    fractionalSecondDigits: 3
  });
  
  console.log(
    `%c[${timestamp}] ${config.prefix} %s`,
    `color: ${config.color}; font-weight: bold; font-size: 12px;`,
    level,
    ...args
  );
}

// ═══════════════════════════════════════════════════════════════════════════

class MultiAgentUIController {
  constructor() {
    log('INFO', '🤖 Multi-Agent UI Controller constructor called');
    this.client = new MultiAgentClient();
    this.currentMode = 'panel';
    this.selectedPersonas = [];
    this.isLoading = false;
    this.currentResult = null;
    this.debugMode = true;
    
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
    log('INFO', '📍 init() called');
    
    // Check if multi-agent section exists
    const section = document.getElementById('multi-agent-section');
    if (!section) {
      log('ERROR', 'Multi-agent section not found in DOM!');
      log('DEBUG', 'Searching for element by id: multi-agent-section');
      const allDivs = document.querySelectorAll('[id*="multi"]');
      log('DEBUG', `Found ${allDivs.length} elements with "multi" in id:`, Array.from(allDivs).map(d => d.id));
      return;
    }
    
    log('SUCCESS', 'Multi-agent section found in DOM', section);
    log('DEBUG', `Section display style: ${section.style.display}`);
    
    this.setupEventListeners();
    this.setupToggleButtons();
    this.loadStoredPreferences();
    log('SUCCESS', '✅ Multi-Agent UI Controller fully initialized');
    
    // Log system state
    this.logSystemState();
  }

  logSystemState() {
    log('INFO', '📊 Current System State:');
    log('DEBUG', `  Mode: ${this.currentMode}`);
    log('DEBUG', `  Selected Personas: ${this.selectedPersonas.length || 'None selected'}`);
    log('DEBUG', `  IsLoading: ${this.isLoading}`);
    log('DEBUG', `  Personas Available: ${Object.keys(this.personas).length}`);
    
    const questionInput = document.querySelector('.question-input');
    if (questionInput) {
      log('DEBUG', `  Question Input Value: "${questionInput.value || '[empty]'}"`);
      log('DEBUG', `  Character Count: ${questionInput.value.length}/2000`);
    }
  }

  setupToggleButtons() {
    log('EVENT', '⚙️ Setting up toggle buttons');
    
    // Show multi-agent button
    const showBtn = document.getElementById('show-multi-agent');
    if (showBtn) {
      log('DEBUG', 'Found show-multi-agent button:', showBtn);
      showBtn.addEventListener('click', (e) => {
        log('EVENT', '🤖 CLICKED: Show Multi-Agent Button');
        const section = document.getElementById('multi-agent-section');
        if (section) {
          section.style.display = 'block';
          log('SUCCESS', 'Multi-agent section shown');
          log('DEBUG', `New display style: ${section.style.display}`);
          this.logSystemState();
        } else {
          log('ERROR', 'Could not find multi-agent-section to show!');
        }
      });
      log('SUCCESS', 'Show button listener attached');
    } else {
      log('ERROR', 'show-multi-agent button not found!');
    }

    // Hide multi-agent button
    const hideBtn = document.getElementById('toggle-multi-agent');
    if (hideBtn) {
      log('DEBUG', 'Found toggle-multi-agent (hide) button:', hideBtn);
      hideBtn.addEventListener('click', (e) => {
        log('EVENT', '👁️ CLICKED: Hide Multi-Agent Button');
        const section = document.getElementById('multi-agent-section');
        if (section) {
          section.style.display = 'none';
          log('SUCCESS', 'Multi-agent section hidden');
          log('DEBUG', `New display style: ${section.style.display}`);
        }
      });
      log('SUCCESS', 'Hide button listener attached');
    } else {
      log('WARN', 'toggle-multi-agent button not found');
    }
  }

  setupEventListeners() {
    log('EVENT', '⚙️ Setting up event listeners');
    
    // Mode selector buttons
    const modeBtns = document.querySelectorAll('.mode-btn');
    log('DEBUG', `Found ${modeBtns.length} mode buttons`);
    if (modeBtns.length === 0) {
      log('ERROR', 'No mode buttons found! Looking for .mode-btn elements');
    }
    
    modeBtns.forEach((btn, idx) => {
      const mode = btn.dataset.mode;
      log('DEBUG', `Mode button ${idx + 1}: mode="${mode}", text="${btn.textContent.trim()}"`);
      
      btn.addEventListener('click', (e) => {
        log('EVENT', `🎯 CLICKED Mode Button: ${mode}`);
        if (mode) this.selectMode(mode);
      });
    });
    log('SUCCESS', `Attached click listeners to ${modeBtns.length} mode buttons`);
    
    // Set first mode as active by default if none selected
    if (modeBtns.length > 0 && !this.currentMode) {
      log('DEBUG', 'Initializing default mode');
      this.selectMode(modeBtns[0].dataset.mode);
    }

    // Persona checkboxes
    const personaCheckboxes = document.querySelectorAll('input[type="checkbox"][name="persona"]');
    log('DEBUG', `Found ${personaCheckboxes.length} persona checkboxes`);
    personaCheckboxes.forEach((cb, idx) => {
      const label = cb.parentElement?.textContent || 'Unknown';
      cb.addEventListener('change', () => {
        log('PERSONA', `Persona checkbox changed: ${label} = ${cb.checked}`);
        this.updateSelectedPersonas();
      });
    });
    log('SUCCESS', `Attached listeners to ${personaCheckboxes.length} persona checkboxes`);

    // Question input
    const questionInput = document.querySelector('.question-input');
    if (questionInput) {
      log('DEBUG', 'Question input found', questionInput);
      questionInput.addEventListener('input', (e) => {
        log('DEBUG', `Question input changed: ${e.target.value.length} chars`);
        this.updateCharCount(e.target.value);
      });
      questionInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          log('EVENT', '⏎ ENTER pressed in question input');
          e.preventDefault();
          this.executeWorkflow();
        }
      });
      log('SUCCESS', 'Attached listeners to question input');
    } else {
      log('ERROR', 'Question input (.question-input) not found!');
    }

    // Execute button
    const executeBtn = document.getElementById('execute-workflow');
    if (executeBtn) {
      log('DEBUG', 'Execute button found', executeBtn);
      executeBtn.addEventListener('click', () => {
        log('EVENT', '🚀 CLICKED Execute Workflow Button');
        this.executeWorkflow();
      });
      log('SUCCESS', 'Attached listener to execute button');
    } else {
      log('ERROR', 'Execute button (#execute-workflow) not found!');
    }

    // Select All / Clear All buttons
    const selectAllBtn = document.querySelector('.persona-select-all');
    const clearAllBtn = document.querySelector('.persona-clear-all');
    
    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', () => {
        log('EVENT', '✓ CLICKED Select All Personas');
        this.selectAllPersonas();
      });
      log('SUCCESS', 'Attached listener to Select All button');
    }
    
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        log('EVENT', '✗ CLICKED Clear All Personas');
        this.clearAllPersonas();
      });
      log('SUCCESS', 'Attached listener to Clear All button');
    }
    
    log('SUCCESS', '✅ All event listeners attached');
  }

  selectMode(mode) {
    log('INFO', `🧭 selectMode() called with mode: "${mode}"`);
    
    if (!['panel', 'consensus', 'debate'].includes(mode)) {
      log('ERROR', `Invalid mode "${mode}". Must be one of: panel, consensus, debate`);
      return;
    }

    this.currentMode = mode;
    log('DEBUG', `Current mode set to: ${mode}`);
    
    // Update button states
    const modeBtns = document.querySelectorAll('.mode-btn');
    log('DEBUG', `Updating ${modeBtns.length} mode buttons to show active state`);
    modeBtns.forEach(btn => {
      const isActive = btn.dataset.mode === mode;
      btn.classList.toggle('active', isActive);
      log('DEBUG', `  Button "${btn.dataset.mode}": active=${isActive}`);
    });
    
    localStorage.setItem('multi-agent-mode', mode);
    log('SUCCESS', `✅ Mode "${mode}" selected and saved to localStorage`);
    this.logSystemState();
  }

  updateSelectedPersonas() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"][name="persona"]:checked');
    this.selectedPersonas = Array.from(checkboxes).map(cb => cb.value);
    
    log('PERSONA', `👥 Personas updated: ${this.selectedPersonas.length} selected`);
    this.selectedPersonas.forEach(p => {
      log('DEBUG', `  - ${this.personas[p]?.icon} ${this.personas[p]?.name || p}`);
    });
    
    // Update count display
    const countDisplay = document.querySelector('.persona-count');
    if (countDisplay) {
      const text = this.selectedPersonas.length > 0 
        ? `${this.selectedPersonas.length} selected` 
        : '0 selected';
      countDisplay.textContent = text;
      log('DEBUG', `Count display updated: "${text}"`);
    } else {
      log('WARN', 'Persona count display (.persona-count) not found');
    }
    
    localStorage.setItem('multi-agent-personas', JSON.stringify(this.selectedPersonas));
    log('SUCCESS', `✅ Persona selection saved to localStorage`);
  }

  selectAllPersonas() {
    log('EVENT', '✓ Selecting ALL personas');
    const checkboxes = document.querySelectorAll('input[type="checkbox"][name="persona"]');
    log('DEBUG', `Found ${checkboxes.length} persona checkboxes`);
    checkboxes.forEach(cb => {
      cb.checked = true;
    });
    this.updateSelectedPersonas();
  }

  clearAllPersonas() {
    log('EVENT', '✗ Clearing ALL personas');
    const checkboxes = document.querySelectorAll('input[type="checkbox"][name="persona"]');
    log('DEBUG', `Found ${checkboxes.length} persona checkboxes`);
    checkboxes.forEach(cb => {
      cb.checked = false;
    });
    this.updateSelectedPersonas();
  }

  updateCharCount(text) {
    const charCountEl = document.querySelector('.char-count');
    if (charCountEl) {
      const count = text.length;
      const max = 2000;
      const percentage = Math.round((count / max) * 100);
      charCountEl.textContent = `${count} / ${max}`;
      
      // Add warning class if getting close to limit
      if (count > 1800) {
        charCountEl.classList.add('warning');
        log('WARN', `⚠️ Character limit warning: ${count}/${max} (${percentage}%)`);
      } else {
        charCountEl.classList.remove('warning');
      }
      charCountEl.textContent = `${text.length} / 2000`;
    }
    
    const executeBtn = document.querySelector('.execute-btn');
    if (executeBtn) {
      executeBtn.disabled = text.trim().length === 0 || this.isLoading;
    }
  }

  async executeWorkflow() {
    log('INFO', '🚀 executeWorkflow() called');
    const startTime = performance.now();
    
    const questionInput = document.querySelector('.question-input');
    const question = questionInput?.value?.trim();

    log('DEBUG', `Question input element: ${questionInput ? 'found' : 'NOT FOUND'}`);
    log('DEBUG', `Question value: "${question || '[empty]'}"`);
    log('DEBUG', `Question length: ${question?.length || 0} chars`);
    log('DEBUG', `Current mode: ${this.currentMode}`);
    log('DEBUG', `Selected personas: ${this.selectedPersonas.length}`);
    
    if (this.selectedPersonas.length === 0) {
      log('WARN', '⚠️ No personas selected - auto-selecting all');
      // Auto-select all if none selected
      this.selectAllPersonas();
    }

    if (!question) {
      log('ERROR', '❌ No question provided!');
      alert('⚠️ Please enter a question before executing');
      return;
    }

    try {
      log('SUCCESS', '✅ Question validated, starting workflow...');
      this.setLoading(true);
      this.showLoadingState();
      
      log('API', `📨 Sending to API:`);
      log('DEBUG', `  Mode: ${this.currentMode}`);
      log('DEBUG', `  Personas: ${this.selectedPersonas.length} selected`);
      log('DEBUG', `  Selected: [${this.selectedPersonas.slice(0, 3).join(', ')}${this.selectedPersonas.length > 3 ? '...' : ''}]`);
      log('DEBUG', `  Question: "${question.substring(0, 100)}${question.length > 100 ? '...' : ''}"`);
      
      log('API', `📡 API Client: ${this.client ? 'initialized' : 'NOT INITIALIZED'}`);
      
      const startAPITime = performance.now();
      const result = await this.client.executeWorkflow(
        question,
        this.currentMode,
        this.selectedPersonas.length > 0 ? this.selectedPersonas : null
      );
      const apiTime = performance.now() - startAPITime;
      
      log('PERF', `⚡ API response received in ${(apiTime).toFixed(2)}ms`);
      log('SUCCESS', '✅ Workflow completed successfully');
      log('DEBUG', 'Result object keys:', Object.keys(result));
      
      this.currentResult = result;
      log('DEBUG', 'Response structure:', {
        synthesis: result.synthesis ? `${result.synthesis.substring(0, 50)}...` : 'MISSING',
        responses: result.responses?.length || 0,
        mode: result.mode
      });
      
      this.displayResults(result);
      
      const totalTime = performance.now() - startTime;
      log('PERF', `⚡ Total execution time: ${(totalTime).toFixed(2)}ms`);
      log('SUCCESS', '✅ Results displayed to user');
      
    } catch (error) {
      log('ERROR', `❌ Workflow error: ${error.message}`);
      log('DEBUG', 'Error type:', error.constructor.name);
      log('DEBUG', 'Error stack:', error.stack);
      this.showError(error.message);
    } finally {
      this.setLoading(false);
    }
  }

  setLoading(loading) {
    log('INFO', `Loading state: ${loading ? 'ON' : 'OFF'}`);
    this.isLoading = loading;
    const executeBtn = document.querySelector('.execute-btn');
    if (executeBtn) {
      executeBtn.disabled = loading;
      executeBtn.textContent = loading ? '⏳ Orchestrating...' : '▶️ Execute Workflow';
      log('DEBUG', `Execute button: disabled=${loading}, text="${executeBtn.textContent}"`);
    } else {
      log('ERROR', 'Execute button not found!');
    }
  }

  showLoadingState() {
    log('UI', '🎨 Showing loading state');
    const resultsContainer = document.querySelector('.multi-agent-results');
    if (!resultsContainer) {
      log('ERROR', 'Results container (.multi-agent-results) not found!');
      return;
    }

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
    log('ERROR', `📍 Displaying error: ${message}`);
    const resultsContainer = document.querySelector('.multi-agent-results');
    if (!resultsContainer) {
      log('ERROR', 'Results container not found!');
      return;
    }

    resultsContainer.innerHTML = `
      <div class="multi-agent-error">
        <h3>❌ Error Occurred</h3>
        <p><strong>Message:</strong> ${message}</p>
        <p style="font-size: 12px; color: #999; margin-top: 10px;">
          💡 Tips:<br>
          • Check that your ANTHROPIC_API_KEY is set<br>
          • Verify the development server is running<br>
          • Check browser console for additional details<br>
          • Try refreshing the page
        </p>
      </div>
    `;
    log('SUCCESS', '✅ Error message displayed to user');
  }

  displayResults(result) {
    log('INFO', '📊 displayResults() called');
    const resultsContainer = document.querySelector('.multi-agent-results');
    if (!resultsContainer) {
      log('ERROR', 'Results container (.multi-agent-results) not found!');
      return;
    }

    log('DEBUG', 'Result structure:');
    log('DEBUG', `  synthesis: ${result.synthesis ? `${result.synthesis.substring(0, 50)}...` : 'MISSING'}`);
    log('DEBUG', `  responses: ${result.responses?.length || 0} items`);
    log('DEBUG', `  mode: ${result.mode}`);

    const html = this.formatResults(result);
    resultsContainer.innerHTML = html;
    log('SUCCESS', '✅ Results HTML rendered');
    
    // Add animations
    setTimeout(() => {
      const cards = resultsContainer.querySelectorAll('.response-card');
      log('DEBUG', `Adding fade-in animation to ${cards.length} response cards`);
      cards.forEach((card, idx) => {
        card.style.animation = `fadeIn 0.5s ease-in-out ${idx * 0.1}s`;
      });
    }, 100);
    
    log('SUCCESS', '✅ Animations applied');
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
    log('INFO', '💾 Loading stored preferences from localStorage');
    
    // Load mode preference
    const savedMode = localStorage.getItem('multi-agent-mode');
    log('DEBUG', `Saved mode in localStorage: ${savedMode || '[none]'}`);
    if (savedMode && ['panel', 'consensus', 'debate'].includes(savedMode)) {
      log('SUCCESS', `✅ Restoring mode: ${savedMode}`);
      this.selectMode(savedMode);
    } else {
      log('DEBUG', `Using default mode: ${this.currentMode}`);
    }

    // Load persona preferences
    const savedPersonas = localStorage.getItem('multi-agent-personas');
    log('DEBUG', `Saved personas in localStorage: ${savedPersonas ? JSON.parse(savedPersonas).length + ' items' : '[none]'}`);
    if (savedPersonas) {
      try {
        const personas = JSON.parse(savedPersonas);
        if (Array.isArray(personas)) {
          log('SUCCESS', `✅ Restoring ${personas.length} selected personas`);
          personas.forEach(persona => {
            const checkbox = document.querySelector(`input[type="checkbox"][name="persona"][value="${persona}"]`);
            if (checkbox) {
              checkbox.checked = true;
              log('DEBUG', `  Checked: ${this.personas[persona]?.name || persona}`);
            } else {
              log('WARN', `  Checkbox not found for: ${persona}`);
            }
          });
          this.updateSelectedPersonas();
        }
      } catch (e) {
        log('ERROR', `Failed to parse saved personas: ${e.message}`);
      }
    } else {
      log('DEBUG', 'No saved personas found, will use auto-select');
    }
    
    log('SUCCESS', '✅ Preference loading complete');
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  log('EVENT', '🎬 DOMContentLoaded event fired');
  log('INFO', '🤖 Initializing Multi-Agent UI Controller...');
  window.multiAgentUI = new MultiAgentUIController();
  
  // Log that initialization is complete
  setTimeout(() => {
    log('SUCCESS', '✅ Multi-Agent UI fully initialized and ready!');
    log('INFO', '💡 Console logging enabled - watch this for detailed debugging');
  }, 100);
});

export default MultiAgentUIController;
