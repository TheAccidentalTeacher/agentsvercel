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
    
    // Check if modal exists
    const modal = document.getElementById('multi-agent-modal');
    if (!modal) {
      log('ERROR', 'Multi-agent modal not found in DOM!');
      return;
    }
    
    log('SUCCESS', 'Multi-agent modal found in DOM');
    
    this.setupEventListeners();
    this.setupModalButtons();
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

  setupModalButtons() {
    log('EVENT', '⚙️ Setting up modal buttons');
    
    const modal = document.getElementById('multi-agent-modal');
    const closeBtn = document.getElementById('modal-close');
    const showBtn = document.getElementById('show-multi-agent');
    
    // Show modal
    if (showBtn) {
      log('DEBUG', 'Found show-multi-agent button');
      showBtn.addEventListener('click', (e) => {
        log('EVENT', '🤖 CLICKED: Show Multi-Agent Modal');
        if (modal) {
          modal.style.display = 'flex';
          log('SUCCESS', 'Multi-agent modal shown');
          this.logSystemState();
        }
      });
      log('SUCCESS', 'Show button listener attached');
    }
    
    // Close modal
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        log('EVENT', '👁️ CLICKED: Close Multi-Agent Modal');
        if (modal) {
          modal.style.display = 'none';
          log('SUCCESS', 'Multi-agent modal hidden');
        }
      });
      log('SUCCESS', 'Close button listener attached');
    }
    
    // Close modal when clicking outside
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          log('EVENT', 'Clicked outside modal - closing');
          modal.style.display = 'none';
        }
      });
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

    // Execute button (works for both modal and sidebar)
    const executeBtn = document.getElementById('modal-execute-workflow') || document.getElementById('execute-workflow');
    if (executeBtn) {
      log('DEBUG', 'Execute button found');
      executeBtn.addEventListener('click', () => {
        log('EVENT', '🚀 CLICKED Execute Workflow Button');
        this.executeWorkflow();
      });
      log('SUCCESS', 'Attached listener to execute button');
    } else {
      log('ERROR', 'Execute button not found!');
    }

    // Conversation start button
    const conversationBtn = document.getElementById('modal-start-conversation');
    if (conversationBtn) {
      log('DEBUG', 'Conversation button found');
      conversationBtn.addEventListener('click', () => {
        log('EVENT', '🎙️  CLICKED Start Conversation Button');
        this.startConversation();
      });
      log('SUCCESS', 'Attached listener to conversation button');
    }

    // Select All / Clear All buttons (works for both modal and sidebar)
    const selectAllBtn = document.getElementById('modal-select-all') || document.querySelector('.persona-select-all');
    const clearAllBtn = document.getElementById('modal-clear-all') || document.querySelector('.persona-clear-all');
    
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
    
    if (!['panel', 'consensus', 'debate', 'conversation', 'research'].includes(mode)) {
      log('ERROR', `Invalid mode "${mode}". Must be one of: panel, consensus, debate, conversation, research`);
      return;
    }

    this.currentMode = mode;
    log('DEBUG', `Current mode set to: ${mode}`);
    
    // Show/hide appropriate execute button
    const workflowBtn = document.getElementById('modal-execute-workflow');
    const conversationBtn = document.getElementById('modal-start-conversation');
    
    if (mode === 'conversation') {
      if (workflowBtn) workflowBtn.style.display = 'none';
      if (conversationBtn) conversationBtn.style.display = 'block';
    } else if (mode === 'research') {
      if (workflowBtn) {
        workflowBtn.style.display = 'block';
        workflowBtn.textContent = '🔍 Start Research';
      }
      if (conversationBtn) conversationBtn.style.display = 'none';
    } else {
      if (workflowBtn) {
        workflowBtn.style.display = 'block';
        workflowBtn.textContent = '▶️ Execute Workflow';
      }
      if (conversationBtn) conversationBtn.style.display = 'none';
    }
    
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

    // Handle research mode
    if (this.currentMode === 'research') {
      return await this.executeResearch(question);
    }
    
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
      
      // Get provider and model from localStorage (set by editor.js)
      let provider = 'anthropic';
      let model = undefined;
      try {
        const aiConfig = JSON.parse(localStorage.getItem('aiConfig') || '{}');
        if (aiConfig.provider) provider = aiConfig.provider;
        if (aiConfig.anthropic_model && provider === 'anthropic') model = aiConfig.anthropic_model;
        if (aiConfig.openai_model && provider === 'openai') model = aiConfig.openai_model;
      } catch (e) {
        log('DEBUG', `Could not parse AI config from localStorage: ${e.message}`);
      }
      
      log('API', `📨 Sending to API:`);
      log('DEBUG', `  Mode: ${this.currentMode}`);
      log('DEBUG', `  Provider: ${provider}`);
      log('DEBUG', `  Model: ${model || '(default)'}`);
      log('DEBUG', `  Personas: ${this.selectedPersonas.length} selected`);
      log('DEBUG', `  Selected: [${this.selectedPersonas.slice(0, 3).join(', ')}${this.selectedPersonas.length > 3 ? '...' : ''}]`);
      log('DEBUG', `  Question: "${question.substring(0, 100)}${question.length > 100 ? '...' : ''}"`);
      
      log('API', `📡 API Client: ${this.client ? 'initialized' : 'NOT INITIALIZED'}`);
      
      const startAPITime = performance.now();
      const result = await this.client.executeWorkflow(
        question,
        this.currentMode,
        this.selectedPersonas.length > 0 ? this.selectedPersonas : null,
        { provider, model }
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
    
    const lines = content.split('\n');
    const result = [];
    let inList = false;
    let inParagraph = false;
    let paragraphLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Skip empty lines
      if (!trimmed) {
        if (paragraphLines.length > 0) {
          // End current paragraph
          const paraText = paragraphLines.join(' ');
          let html = paraText
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
          result.push(`<p>${html}</p>`);
          paragraphLines = [];
        }
        inParagraph = false;
        inList = false;
        continue;
      }
      
      // Handle headings
      if (trimmed.match(/^###\s+/)) {
        result.push(`<h3>${trimmed.replace(/^###\s+/, '')}</h3>`);
        inParagraph = false;
        continue;
      }
      if (trimmed.match(/^##\s+/)) {
        result.push(`<h2>${trimmed.replace(/^##\s+/, '')}</h2>`);
        inParagraph = false;
        continue;
      }
      if (trimmed.match(/^#\s+/)) {
        result.push(`<h1>${trimmed.replace(/^#\s+/, '')}</h1>`);
        inParagraph = false;
        continue;
      }
      
      // Handle lists
      if (trimmed.match(/^-\s+/)) {
        if (!inList) {
          result.push('<ul>');
          inList = true;
        }
        const listItem = trimmed.replace(/^-\s+/, '');
        let html = listItem
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>');
        result.push(`  <li>${html}</li>`);
        continue;
      }
      
      // Close list if we're not in one anymore
      if (inList && !trimmed.match(/^-\s+/)) {
        result.push('</ul>');
        inList = false;
      }
      
      // Handle regular text as paragraphs
      paragraphLines.push(trimmed);
      inParagraph = true;
    }
    
    // Close any open tags
    if (paragraphLines.length > 0) {
      const paraText = paragraphLines.join(' ');
      let html = paraText
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
      result.push(`<p>${html}</p>`);
    }
    if (inList) {
      result.push('</ul>');
    }
    
    return result.join('\n');
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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

  // ═══════════════════════════════════════════════════════════════════════════
  // CONVERSATION MODE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  async startConversation() {
    log('EVENT', '🎙️  Starting conversation mode');
    
    const question = document.querySelector('.question-input')?.value?.trim();
    if (!question) {
      alert('Please enter a question to start conversation');
      return;
    }

    this.setLoading(true);
    this.showLoadingState();

    try {
      log('API', '📡 Initiating conversation...');
      
      // Get provider and model from localStorage
      let provider = 'anthropic';
      let model = undefined;
      try {
        const aiConfig = JSON.parse(localStorage.getItem('aiConfig') || '{}');
        if (aiConfig.provider) provider = aiConfig.provider;
        if (aiConfig.anthropic_model && provider === 'anthropic') model = aiConfig.anthropic_model;
        if (aiConfig.openai_model && provider === 'openai') model = aiConfig.openai_model;
      } catch (e) {
        log('DEBUG', `Could not parse AI config: ${e.message}`);
      }

      const result = await this.client.executeConversation(
        question,
        this.selectedPersonas.length > 0 ? this.selectedPersonas : [],
        [],  // Empty conversation history (start fresh)
        null,  // No user interjection yet
        null,  // Don't expand on anyone yet
        { provider, model, roundLimit: 2 }
      );

      log('SUCCESS', '✅ Conversation initiated');
      this.displayConversation(result);
      
    } catch (error) {
      log('ERROR', `Conversation failed: ${error.message}`);
      alert(`Conversation failed: ${error.message}`);
    } finally {
      this.setLoading(false);
    }
  }

  displayConversation(conversationData) {
    log('UI', '💬 Displaying conversation');
    
    const resultsContainer = document.querySelector('.multi-agent-results');
    if (!resultsContainer) {
      log('ERROR', 'Results container not found');
      return;
    }

    const html = this.formatConversation(conversationData);
    resultsContainer.innerHTML = html;
    
    // Setup user input area for interjections
    this.setupConversationInput(conversationData);
    
    log('SUCCESS', '✅ Conversation displayed');
  }

  formatConversation(data) {
    const { conversationHistory = [] } = data;

    if (conversationHistory.length === 0) {
      return '<p>No messages yet</p>';
    }

    const messagesHTML = conversationHistory.map(msg => {
      const isUser = msg.speaker === 'You';
      const classes = `conversation-message ${isUser ? 'user-message' : 'agent-message'}`;
      
      return `
        <div class="${classes}">
          <div class="message-header">
            <span class="speaker-icon">${msg.icon || '👤'}</span>
            <span class="speaker-name">${msg.speaker}</span>
            <span class="message-type-badge">${msg.responseType || 'standard'}</span>
          </div>
          <div class="message-content">
            ${this.formatMarkdown(msg.message)}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="conversation-thread">
        <div class="messages">
          ${messagesHTML}
        </div>
        <div class="conversation-actions">
          <div id="conversation-input-area" class="conversation-input-wrapper">
            <!-- Will be populated by setupConversationInput -->
          </div>
        </div>
      </div>
    `;
  }

  setupConversationInput(conversationData) {
    log('UI', '⌨️  Setting up conversation input');
    
    const inputArea = document.getElementById('conversation-input-area');
    if (!inputArea) {
      log('ERROR', 'Conversation input area not found');
      return;
    }

    const lastMessage = conversationData.conversationHistory?.[conversationData.conversationHistory.length - 1];
    const suggestedActions = conversationData.nextSuggestedActions || [];

    let html = `
      <div class="user-input-section">
        <input 
          type="text" 
          id="user-interjection-input" 
          placeholder="Jump into the conversation or say something..."
          class="conversation-input"
          maxlength="500"
        >
        <button id="send-interjection-btn" class="btn-primary">Send</button>
        <button id="continue-conversation-btn" class="btn-secondary">Continue Conversation</button>
      </div>
      
      <div class="suggested-actions">
        <p>Suggested actions:</p>
    `;

    suggestedActions.forEach(action => {
      html += `
        <button class="action-btn" data-action="${action.type}" title="${action.description}">
          ${action.label}
        </button>
      `;
    });

    html += `</div>`;

    inputArea.innerHTML = html;

    // Wire up buttons
    const sendBtn = document.getElementById('send-interjection-btn');
    const continueBtn = document.getElementById('continue-conversation-btn');
    const input = document.getElementById('user-interjection-input');

    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        const message = input.value.trim();
        if (message) {
          log('EVENT', '💬 User interjection sent');
          this.continueConversationWithInput(conversationData, message);
          input.value = '';
        }
      });
    }

    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        log('EVENT', '▶️  Continue conversation');
        this.continueConversationWithInput(conversationData, null);
      });
    }

    // Wire up suggested action buttons
    document.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        log('EVENT', `🎯 Action clicked: ${action}`);
        this.handleConversationAction(action, conversationData);
      });
    });

    log('SUCCESS', '✅ Conversation input ready');
  }

  async continueConversationWithInput(conversationData, userMessage) {
    log('EVENT', `🎙️  Continuing conversation${userMessage ? ` with input: "${userMessage}"` : ''}`);
    
    this.setLoading(true);
    this.showLoadingState();

    try {
      let provider = 'anthropic';
      let model = undefined;
      try {
        const aiConfig = JSON.parse(localStorage.getItem('aiConfig') || '{}');
        if (aiConfig.provider) provider = aiConfig.provider;
        if (aiConfig.anthropic_model && provider === 'anthropic') model = aiConfig.anthropic_model;
        if (aiConfig.openai_model && provider === 'openai') model = aiConfig.openai_model;
      } catch (e) {
        log('DEBUG', `Could not parse AI config: ${e.message}`);
      }

      const question = document.querySelector('.question-input')?.value?.trim() || '';

      const result = await this.client.executeConversation(
        question,
        this.selectedPersonas.length > 0 ? this.selectedPersonas : [],
        conversationData.conversationHistory || [],  // Continue with history
        userMessage || null,  // User input if any
        null,  // Don't expand yet
        { provider, model, roundLimit: 2 }
      );

      log('SUCCESS', '✅ Conversation continued');
      this.displayConversation(result);
      
    } catch (error) {
      log('ERROR', `Conversation continuation failed: ${error.message}`);
      alert(`Failed to continue conversation: ${error.message}`);
    } finally {
      this.setLoading(false);
    }
  }

  handleConversationAction(action, conversationData) {
    log('EVENT', `🎯 Handling action: ${action}`);
    
    switch(action) {
      case 'expand':
        const lastMessage = conversationData.conversationHistory?.[conversationData.conversationHistory.length - 1];
        if (lastMessage?.speakerId) {
          log('INFO', `Expanding on ${lastMessage.speaker}`);
          this.continueConversationWithExpansion(conversationData, lastMessage.speakerId);
        }
        break;
      case 'next':
        this.continueConversationWithInput(conversationData, null);
        break;
      case 'steer':
        const direction = prompt('What direction should we take the conversation?');
        if (direction) {
          this.continueConversationWithInput(conversationData, `Let's focus on: ${direction}`);
        }
        break;
      case 'summarize':
        log('INFO', 'Summarize requested (to be implemented)');
        break;
    }
  }

  async continueConversationWithExpansion(conversationData, personaId) {
    log('EVENT', `📖 Expanding on ${personaId}`);
    
    this.setLoading(true);
    this.showLoadingState();

    try {
      let provider = 'anthropic';
      let model = undefined;
      try {
        const aiConfig = JSON.parse(localStorage.getItem('aiConfig') || '{}');
        if (aiConfig.provider) provider = aiConfig.provider;
        if (aiConfig.anthropic_model && provider === 'anthropic') model = aiConfig.anthropic_model;
        if (aiConfig.openai_model && provider === 'openai') model = aiConfig.openai_model;
      } catch (e) {
        log('DEBUG', `Could not parse AI config: ${e.message}`);
      }

      const question = document.querySelector('.question-input')?.value?.trim() || '';

      const result = await this.client.executeConversation(
        question,
        this.selectedPersonas.length > 0 ? this.selectedPersonas : [],
        conversationData.conversationHistory || [],
        null,
        personaId,  // Tell API to expand on this persona
        { provider, model, roundLimit: 1 }
      );

      log('SUCCESS', '✅ Expansion generated');
      this.displayConversation(result);
      
    } catch (error) {
      log('ERROR', `Expansion failed: ${error.message}`);
      alert(`Failed to expand: ${error.message}`);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Execute research workflow
   * Phase 6: Deep research with multi-source search
   */
  async executeResearch(query) {
    log('INFO', '🔍 executeResearch() called');
    const startTime = performance.now();

    if (!query) {
      log('ERROR', '❌ No query provided!');
      alert('⚠️ Please enter a search query');
      return;
    }

    try {
      log('SUCCESS', '✅ Query validated, starting research...');
      this.setLoading(true);
      this.showLoadingState();

      log('API', `📨 Sending research query: "${query}"`);
      
      const startAPITime = performance.now();
      const result = await this.client.research(query, {
        maxResults: 10,
        extractContent: true,  // Enable content extraction
        maxExtract: 5          // Extract top 5 results
      });
      const apiTime = performance.now() - startAPITime;
      
      log('PERF', `⚡ Research response received in ${(apiTime).toFixed(2)}ms`);
      log('SUCCESS', '✅ Research completed successfully');
      log('DEBUG', `Found ${result.results.length} results`);
      log('DEBUG', `Stats:`, result.stats);

      this.currentResult = result;
      this.displayResearchResults(result);

      const totalTime = performance.now() - startTime;
      log('PERF', `⚡ Total execution time: ${(totalTime / 1000).toFixed(2)}s`);

    } catch (error) {
      log('ERROR', `❌ Research failed: ${error.message}`);
      this.showError(error.message);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Display research results
   */
  displayResearchResults(result) {
    log('UI', '🎨 Rendering research results');
    const resultsContainer = document.querySelector('.multi-agent-results');
    if (!resultsContainer) {
      log('ERROR', 'Results container not found!');
      return;
    }

    const { results, stats, query, extractedContent = [], chunks = [] } = result;

    const hasExtractedContent = extractedContent.some(e => !e.error);

    let html = `
      <div class="research-results">
        <div class="research-header">
          <h3>🔍 Research Results</h3>
          <div class="research-query">"${this.escapeHtml(query)}"</div>
          <div class="research-stats">
            <span>📊 ${results.length} results</span>
            <span>⏱️ ${stats.totalDuration}ms</span>
            <span>🔗 ${stats.totalSources} sources (${stats.afterDeduplication} unique)</span>
            ${hasExtractedContent ? `<span>📄 ${stats.extractedCount} extracted</span>` : ''}
            ${chunks.length > 0 ? `<span>📚 ${chunks.length} chunks</span>` : ''}
          </div>
        </div>
        
        ${hasExtractedContent ? this.renderExtractedContent(extractedContent) : ''}
        
        <div class="research-results-list">
          <h4>Search Results</h4>
    `;

    results.forEach((result, index) => {
      const sources = result.sources ? result.sources.join(', ') : result.source;
      html += `
        <div class="research-result-item">
          <div class="result-header">
            <span class="result-number">#${index + 1}</span>
            <a href="${this.escapeHtml(result.url)}" target="_blank" class="result-title">
              ${this.escapeHtml(result.title)}
            </a>
            <span class="result-score">Score: ${result.relevanceScore?.toFixed(1) || 'N/A'}</span>
          </div>
          <div class="result-url">${this.escapeHtml(result.url)}</div>
          <div class="result-snippet">${this.escapeHtml(result.snippet)}</div>
          <div class="result-meta">
            <span class="result-source">📡 ${sources}</span>
            ${result.date || result.publishedDate ? `<span class="result-date">📅 ${result.date || result.publishedDate}</span>` : ''}
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    resultsContainer.innerHTML = html;
    log('SUCCESS', '✅ Research results rendered');
  }

  /**
   * Render extracted content section
   */
  renderExtractedContent(extractedContent) {
    const successful = extractedContent.filter(e => !e.error);
    if (successful.length === 0) return '';

    let html = `
      <div class="extracted-content-section">
        <h4>📄 Extracted Content (${successful.length} sources)</h4>
        <div class="extracted-content-list">
    `;

    successful.forEach((content, index) => {
      const excerpt = content.excerpt || (content.content ? content.content.substring(0, 200) + '...' : 'No content');
      html += `
        <details class="extracted-item">
          <summary class="extracted-summary">
            <span class="extracted-number">${index + 1}</span>
            <span class="extracted-title">${this.escapeHtml(content.title)}</span>
            <span class="extracted-meta">
              ${content.wordCount} words
              ${content.author ? `• by ${this.escapeHtml(content.author)}` : ''}
            </span>
          </summary>
          <div class="extracted-content">
            <div class="extracted-url">
              <a href="${this.escapeHtml(content.url)}" target="_blank">
                ${this.escapeHtml(content.url)}
              </a>
            </div>
            ${content.publishedDate ? `<div class="extracted-date">📅 ${content.publishedDate}</div>` : ''}
            <div class="extracted-excerpt">
              ${this.escapeHtml(excerpt)}
            </div>
            <div class="extracted-full">
              <strong>Full Content:</strong>
              <div class="content-text">${this.escapeHtml(content.content).replace(/\n/g, '<br>')}</div>
            </div>
          </div>
        </details>
      `;
    });

    html += `
        </div>
      </div>
    `;

    return html;
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
