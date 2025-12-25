// ============================================================================
// AUTONOMOUS AGENTS - Task Queue & Scheduling System
// Phase 12: Background execution, scheduled tasks, workflow orchestration
// ============================================================================

class AutonomousAgents {
  constructor() {
    this.tasks = [];
    this.isInitialized = false;
    this.pollInterval = null;
  }

  async init() {
    if (this.isInitialized) return;
    
    console.log('🤖 Initializing Autonomous Agents...');
    await this.loadTasks();
    this.startPolling();
    this.isInitialized = true;
  }

  // ============================================================================
  // TASK CREATION
  // ============================================================================

  async createTask(taskConfig) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be logged in to create tasks');

    const task = {
      user_id: user.id,
      task_type: taskConfig.type || 'research',
      task_name: taskConfig.name,
      task_description: taskConfig.description || null,
      config: taskConfig.config,
      schedule_type: taskConfig.scheduleType || 'once',
      scheduled_for: taskConfig.scheduledFor,
      repeat_enabled: taskConfig.repeat || false,
      next_run_at: taskConfig.repeat ? taskConfig.scheduledFor : null,
      status: 'pending'
    };

    const { data, error } = await supabase
      .from('autonomous_tasks')
      .insert([task])
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to create task:', error);
      throw error;
    }

    console.log('✅ Task created:', data);
    this.tasks.push(data);
    this.updateUI();
    
    return data;
  }

  // ============================================================================
  // TASK MANAGEMENT
  // ============================================================================

  async loadTasks() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('autonomous_tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Failed to load tasks:', error);
      return;
    }

    this.tasks = data || [];
    this.updateUI();
  }

  async cancelTask(taskId) {
    const { error } = await supabase
      .from('autonomous_tasks')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', taskId);

    if (error) {
      console.error('❌ Failed to cancel task:', error);
      throw error;
    }

    await this.loadTasks();
  }

  async deleteTask(taskId) {
    const { error } = await supabase
      .from('autonomous_tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('❌ Failed to delete task:', error);
      throw error;
    }

    await this.loadTasks();
  }

  // ============================================================================
  // UI RENDERING
  // ============================================================================

  updateUI() {
    this.renderTaskDashboard();
    this.updateBadge();
  }

  renderTaskDashboard() {
    const container = document.getElementById('autonomous-tasks-list');
    if (!container) return;

    const activeTasks = this.tasks.filter(t => ['pending', 'running', 'paused'].includes(t.status));
    const completedTasks = this.tasks.filter(t => ['completed', 'failed', 'cancelled'].includes(t.status));

    if (activeTasks.length === 0 && completedTasks.length === 0) {
      container.innerHTML = `
        <div class="autonomous-empty-state">
          <div class="autonomous-empty-icon">🤖</div>
          <h3>No Autonomous Tasks Yet</h3>
          <p>Create your first scheduled task to let agents work in the background</p>
          <button onclick="autonomousAgents.showCreateModal()" class="btn-primary">
            ⏰ Create Task
          </button>
        </div>
      `;
      return;
    }

    let html = '';

    // Active Tasks
    if (activeTasks.length > 0) {
      html += `<div class="autonomous-section">
        <h3 class="autonomous-section-title">
          🔄 Active Tasks <span class="badge">${activeTasks.length}</span>
        </h3>`;
      
      activeTasks.forEach(task => {
        html += this.renderTaskCard(task);
      });
      
      html += `</div>`;
    }

    // Completed Tasks
    if (completedTasks.length > 0) {
      html += `<div class="autonomous-section">
        <h3 class="autonomous-section-title">
          ✅ Recent Completed <span class="badge">${completedTasks.slice(0, 10).length}</span>
        </h3>`;
      
      completedTasks.slice(0, 10).forEach(task => {
        html += this.renderTaskCard(task);
      });
      
      html += `</div>`;
    }

    container.innerHTML = html;
  }

  renderTaskCard(task) {
    const statusIcons = {
      pending: '⏳',
      running: '▶️',
      completed: '✅',
      failed: '❌',
      cancelled: '🚫',
      paused: '⏸️'
    };

    const statusColors = {
      pending: '#FFA500',
      running: '#2196F3',
      completed: '#4CAF50',
      failed: '#F44336',
      cancelled: '#9E9E9E',
      paused: '#FF9800'
    };

    const scheduledDate = new Date(task.scheduled_for);
    const isOverdue = scheduledDate < new Date() && task.status === 'pending';
    const timeStr = this.formatScheduleTime(scheduledDate);

    let progressHTML = '';
    if (task.status === 'running' && task.progress) {
      const progress = JSON.parse(JSON.stringify(task.progress));
      const percent = progress.percentComplete || (progress.currentStep / progress.totalSteps * 100) || 0;
      progressHTML = `
        <div class="autonomous-progress">
          <div class="autonomous-progress-bar" style="width: ${percent}%"></div>
        </div>
        <div class="autonomous-progress-text">${progress.message || 'Processing...'}</div>
      `;
    }

    return `
      <div class="autonomous-task-card" data-task-id="${task.id}" data-status="${task.status}">
        <div class="autonomous-task-header">
          <div class="autonomous-task-status" style="color: ${statusColors[task.status]}">
            ${statusIcons[task.status]} ${task.status.toUpperCase()}
          </div>
          <div class="autonomous-task-type">${this.getTaskTypeLabel(task.task_type)}</div>
        </div>
        
        <div class="autonomous-task-body">
          <h4 class="autonomous-task-name">${task.task_name}</h4>
          ${task.task_description ? `<p class="autonomous-task-description">${task.task_description}</p>` : ''}
          
          <div class="autonomous-task-meta">
            <div class="autonomous-meta-item">
              <span class="autonomous-meta-label">Scheduled:</span>
              <span class="autonomous-meta-value ${isOverdue ? 'overdue' : ''}">${timeStr}</span>
            </div>
            ${task.repeat_enabled ? `
              <div class="autonomous-meta-item">
                <span class="autonomous-meta-label">Repeats:</span>
                <span class="autonomous-meta-value">${task.schedule_type}</span>
              </div>
            ` : ''}
          </div>

          ${progressHTML}
        </div>

        <div class="autonomous-task-actions">
          ${task.status === 'pending' ? `
            <button onclick="autonomousAgents.cancelTask('${task.id}')" class="btn-text danger">
              Cancel
            </button>
          ` : ''}
          ${task.status === 'completed' ? `
            <button onclick="autonomousAgents.viewResults('${task.id}')" class="btn-text">
              View Results
            </button>
          ` : ''}
          ${['completed', 'failed', 'cancelled'].includes(task.status) ? `
            <button onclick="autonomousAgents.deleteTask('${task.id}')" class="btn-text danger">
              Delete
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  getTaskTypeLabel(type) {
    const labels = {
      research: '🔍 Research',
      workflow: '⚙️ Workflow',
      monitor: '👁️ Monitor',
      scheduled_query: '📅 Query'
    };
    return labels[type] || type;
  }

  formatScheduleTime(date) {
    const now = new Date();
    const diff = date - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (diff < 0) {
      return `${Math.abs(hours)}h ago (overdue)`;
    } else if (hours < 1) {
      return 'In < 1 hour';
    } else if (hours < 24) {
      return `In ${hours} hours`;
    } else if (days < 7) {
      return `In ${days} days`;
    } else {
      return date.toLocaleDateString();
    }
  }

  updateBadge() {
    const badge = document.getElementById('autonomous-badge');
    if (!badge) return;

    const activeCount = this.tasks.filter(t => ['pending', 'running'].includes(t.status)).length;
    
    if (activeCount > 0) {
      badge.textContent = activeCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }

  // ============================================================================
  // CREATE TASK MODAL
  // ============================================================================

  showCreateModal() {
    const modal = document.getElementById('autonomous-create-modal');
    if (!modal) {
      this.createModalHTML();
      return this.showCreateModal();
    }

    modal.classList.add('visible');
    document.getElementById('autonomous-task-name').focus();
  }

  hideCreateModal() {
    const modal = document.getElementById('autonomous-create-modal');
    if (modal) {
      modal.classList.remove('visible');
      this.resetCreateForm();
    }
  }

  createModalHTML() {
    const modalHTML = `
      <div id="autonomous-create-modal" class="autonomous-modal">
        <div class="autonomous-modal-content">
          <div class="autonomous-modal-header">
            <h2>⏰ Create Autonomous Task</h2>
            <button onclick="autonomousAgents.hideCreateModal()" class="autonomous-modal-close">&times;</button>
          </div>

          <form id="autonomous-create-form" onsubmit="autonomousAgents.handleCreateSubmit(event)">
            <div class="autonomous-form-group">
              <label for="autonomous-task-name">Task Name *</label>
              <input 
                type="text" 
                id="autonomous-task-name" 
                placeholder="e.g., Daily theology research"
                required
              />
            </div>

            <div class="autonomous-form-group">
              <label for="autonomous-task-description">Description (optional)</label>
              <textarea 
                id="autonomous-task-description" 
                rows="2"
                placeholder="What should this task do?"
              ></textarea>
            </div>

            <div class="autonomous-form-group">
              <label for="autonomous-task-type">Task Type *</label>
              <select id="autonomous-task-type" onchange="autonomousAgents.updateTaskTypeUI()">
                <option value="research">🔍 Research - Deep search across sources</option>
                <option value="workflow">⚙️ Workflow - Multi-step agent process</option>
                <option value="monitor">👁️ Monitor - Watch for updates</option>
                <option value="scheduled_query">📅 Scheduled Query - Run saved query</option>
              </select>
            </div>

            <!-- Research Config -->
            <div id="autonomous-config-research" class="autonomous-config-section">
              <div class="autonomous-form-group">
                <label for="autonomous-research-query">Research Query *</label>
                <input 
                  type="text" 
                  id="autonomous-research-query" 
                  placeholder="e.g., Puritan theology Reformed education"
                />
              </div>
              <div class="autonomous-form-group">
                <label for="autonomous-research-sources">Max Sources</label>
                <input 
                  type="number" 
                  id="autonomous-research-sources" 
                  value="20"
                  min="5"
                  max="50"
                />
              </div>
              <div class="autonomous-form-group">
                <label class="autonomous-checkbox-label">
                  <input type="checkbox" id="autonomous-research-save" checked />
                  Save results to memory
                </label>
              </div>
            </div>

            <!-- Schedule Config -->
            <div class="autonomous-form-group">
              <label for="autonomous-schedule-type">Schedule *</label>
              <select id="autonomous-schedule-type" onchange="autonomousAgents.updateScheduleUI()">
                <option value="once">⏱️ Run Once</option>
                <option value="hourly">🔁 Every Hour</option>
                <option value="daily">📅 Every Day</option>
                <option value="weekly">📆 Every Week</option>
              </select>
            </div>

            <div class="autonomous-form-group">
              <label>When to run? *</label>
              <div class="autonomous-schedule-buttons">
                <button type="button" onclick="autonomousAgents.setScheduleTime('now')" class="btn-schedule">
                  ▶️ Now
                </button>
                <button type="button" onclick="autonomousAgents.setScheduleTime('1h')" class="btn-schedule">
                  ⏰ In 1 Hour
                </button>
                <button type="button" onclick="autonomousAgents.setScheduleTime('tonight')" class="btn-schedule">
                  🌙 Tonight (8pm)
                </button>
                <button type="button" onclick="autonomousAgents.setScheduleTime('tomorrow')" class="btn-schedule">
                  🌅 Tomorrow (8am)
                </button>
              </div>
              <input 
                type="datetime-local" 
                id="autonomous-scheduled-for" 
                class="autonomous-datetime-input"
              />
            </div>

            <div class="autonomous-form-actions">
              <button type="button" onclick="autonomousAgents.hideCreateModal()" class="btn-secondary">
                Cancel
              </button>
              <button type="submit" class="btn-primary">
                🚀 Create Task
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Set default datetime to 1 hour from now
    this.setScheduleTime('1h');
  }

  updateTaskTypeUI() {
    const taskType = document.getElementById('autonomous-task-type').value;
    
    // Hide all config sections
    document.querySelectorAll('.autonomous-config-section').forEach(el => {
      el.style.display = 'none';
    });

    // Show relevant config section
    const configSection = document.getElementById(`autonomous-config-${taskType}`);
    if (configSection) {
      configSection.style.display = 'block';
    }
  }

  updateScheduleUI() {
    const scheduleType = document.getElementById('autonomous-schedule-type').value;
    const datetimeInput = document.getElementById('autonomous-scheduled-for');
    
    if (scheduleType === 'once') {
      datetimeInput.parentElement.style.display = 'block';
    } else {
      datetimeInput.parentElement.style.display = 'block'; // Show for initial run time
    }
  }

  setScheduleTime(preset) {
    const input = document.getElementById('autonomous-scheduled-for');
    const now = new Date();
    let targetDate;

    switch (preset) {
      case 'now':
        targetDate = now;
        break;
      case '1h':
        targetDate = new Date(now.getTime() + 60 * 60 * 1000);
        break;
      case 'tonight':
        targetDate = new Date(now);
        targetDate.setHours(20, 0, 0, 0);
        if (targetDate < now) targetDate.setDate(targetDate.getDate() + 1);
        break;
      case 'tomorrow':
        targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() + 1);
        targetDate.setHours(8, 0, 0, 0);
        break;
      default:
        targetDate = now;
    }

    // Format for datetime-local input (YYYY-MM-DDTHH:MM)
    const formatted = targetDate.toISOString().slice(0, 16);
    input.value = formatted;
  }

  async handleCreateSubmit(event) {
    event.preventDefault();

    const taskType = document.getElementById('autonomous-task-type').value;
    const scheduleType = document.getElementById('autonomous-schedule-type').value;

    // Build config based on task type
    let config = {};
    
    if (taskType === 'research') {
      config = {
        query: document.getElementById('autonomous-research-query').value,
        maxSources: parseInt(document.getElementById('autonomous-research-sources').value),
        saveToMemory: document.getElementById('autonomous-research-save').checked
      };
    }

    const taskConfig = {
      type: taskType,
      name: document.getElementById('autonomous-task-name').value,
      description: document.getElementById('autonomous-task-description').value || null,
      config: config,
      scheduleType: scheduleType,
      scheduledFor: new Date(document.getElementById('autonomous-scheduled-for').value).toISOString(),
      repeat: scheduleType !== 'once'
    };

    try {
      await this.createTask(taskConfig);
      this.hideCreateModal();
      showNotification('✅ Task created successfully!', 'success');
    } catch (error) {
      showNotification('❌ Failed to create task: ' + error.message, 'error');
    }
  }

  resetCreateForm() {
    const form = document.getElementById('autonomous-create-form');
    if (form) form.reset();
    this.setScheduleTime('1h');
  }

  // ============================================================================
  // TASK EXECUTION (Called by Netlify scheduled function)
  // ============================================================================

  async executeTask(taskId) {
    console.log(`🚀 Executing task ${taskId}...`);

    const task = this.tasks.find(t => t.id === taskId);
    if (!task) {
      console.error('❌ Task not found:', taskId);
      return;
    }

    // Update status to running
    await supabase
      .from('autonomous_tasks')
      .update({ 
        status: 'running',
        started_at: new Date().toISOString()
      })
      .eq('id', taskId);

    try {
      let result;

      switch (task.task_type) {
        case 'research':
          result = await this.executeResearchTask(task);
          break;
        case 'workflow':
          result = await this.executeWorkflowTask(task);
          break;
        case 'monitor':
          result = await this.executeMonitorTask(task);
          break;
        default:
          throw new Error(`Unknown task type: ${task.task_type}`);
      }

      // Update as completed
      await supabase
        .from('autonomous_tasks')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          result_data: result
        })
        .eq('id', taskId);

      console.log('✅ Task completed:', taskId);

    } catch (error) {
      console.error('❌ Task failed:', error);

      await supabase
        .from('autonomous_tasks')
        .update({ 
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error.message
        })
        .eq('id', taskId);
    }

    await this.loadTasks();
  }

  async executeResearchTask(task) {
    const config = task.config;
    console.log('🔍 Running research:', config.query);

    // Call deep research function
    const response = await fetch('/.netlify/functions/deep-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: config.query,
        maxSources: config.maxSources || 20
      })
    });

    const results = await response.json();

    // Save to memory if configured
    if (config.saveToMemory) {
      await saveToMemory(
        `Research: ${config.query}`,
        JSON.stringify(results, null, 2),
        'autonomous_research'
      );
    }

    return results;
  }

  async executeWorkflowTask(task) {
    console.log('⚙️ Running workflow...');
    // Workflow orchestration implementation (Phase 2)
    return { message: 'Workflow execution not yet implemented' };
  }

  async executeMonitorTask(task) {
    console.log('👁️ Running monitor...');
    // Monitoring implementation (Phase 4)
    return { message: 'Monitoring not yet implemented' };
  }

  // ============================================================================
  // VIEW RESULTS
  // ============================================================================

  async viewResults(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task || !task.result_data) {
      showNotification('No results available', 'info');
      return;
    }

    // Show results in a modal or panel
    const resultsHTML = `
      <div class="autonomous-results-modal">
        <div class="autonomous-results-content">
          <h2>📊 Task Results: ${task.task_name}</h2>
          <pre>${JSON.stringify(task.result_data, null, 2)}</pre>
          <button onclick="this.closest('.autonomous-results-modal').remove()" class="btn-primary">
            Close
          </button>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', resultsHTML);
  }

  // ============================================================================
  // POLLING (Check for task updates)
  // ============================================================================

  startPolling() {
    // Poll every 30 seconds for task updates
    this.pollInterval = setInterval(() => {
      this.loadTasks();
    }, 30000);
  }

  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }
}

// ============================================================================
// GLOBAL INSTANCE
// ============================================================================

const autonomousAgents = new AutonomousAgents();

// Auto-initialize when page loads (if user is logged in)
document.addEventListener('DOMContentLoaded', async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await autonomousAgents.init();
  }
});
