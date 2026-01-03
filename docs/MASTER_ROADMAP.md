# Master Implementation Roadmap: AI-Powered Level Editor
**Created**: December 11, 2025  
**Goal**: Transform MVP into the best AI-powered game level editor in the universe  
**Approach**: Incremental, tested phases with clear milestones

---

## 🎯 Vision

A game level editor that combines:
- **Human creativity** with **AI intelligence**
- **Manual control** with **automated optimization**
- **Simple interface** with **powerful capabilities**
- **Single-user focus** with **unlimited potential**

**North Star**: "The AI co-designer that reads your mind and executes your vision"

---

## 📋 Phase-by-Phase Roadmap

### ✅ Phase 0: Foundation (COMPLETE)
**Status**: ✅ Done (December 11, 2025)  
**Time**: Initial development  

**Deliverables**:
- [x] Core editor (1,050 lines of code)
- [x] Canvas rendering system
- [x] Object management (add, move, delete, duplicate)
- [x] Export/save/load functionality
- [x] Keyboard shortcuts
- [x] Epic documentation (4,900+ lines)
- [x] GitHub repository + Netlify deployment

**Result**: Fully functional MVP

---

### 🎯 Phase 1: Universal Tooltips System
**Status**: 🔜 Next  
**Estimated Time**: 2-3 hours  
**Priority**: CRITICAL (Non-negotiable #1)

#### Step 1.1: Create Tooltip Infrastructure (30 min)
**File**: `tooltip.js` (new file)

```javascript
class TooltipManager {
  constructor() {
    this.tooltip = null;
    this.showTimeout = null;
    this.hideTimeout = null;
    this.showDelay = 500; // ms
    this.hideDelay = 100;
  }
  
  init() {
    this.createTooltipElement();
    this.bindGlobalEvents();
  }
  
  createTooltipElement() { /* ... */ }
  show(element, text, position) { /* ... */ }
  hide() { /* ... */ }
  position(element, position) { /* ... */ }
}
```

**Checklist**:
- [ ] Create tooltip.js file
- [ ] Implement TooltipManager class
- [ ] Add CSS for tooltip styling
- [ ] Test positioning (top, bottom, left, right)
- [ ] Test on all browsers

#### Step 1.2: Add Tooltip CSS (15 min)
**File**: `style.css`

**Checklist**:
- [ ] Add .tooltip base styles
- [ ] Add positioning variants (.tooltip.top, .bottom, etc.)
- [ ] Add arrow/pointer styles
- [ ] Add fade-in/fade-out animations
- [ ] Test dark theme compatibility

#### Step 1.3: Define All Tooltips (45 min)
**File**: `editor.js`

Create comprehensive tooltip definitions:
```javascript
const TOOLTIPS = {
  // Toolbar buttons (6)
  'load-background': 'Load a background image for your level (Ctrl+B). Supports PNG, JPG, GIF, WebP.',
  'add-asset': 'Add game objects like sprites, enemies, or items (Ctrl+A). Select multiple files at once.',
  'export-json': 'Export level data as clean JSON for your game (Ctrl+E). Auto-copies to clipboard.',
  'save-project': 'Save complete project with all images embedded (Ctrl+S). Can reload later.',
  'load-project': 'Load a previously saved project file (Ctrl+O). Restores all objects and background.',
  'clear-all': 'Remove all objects and background. Cannot be undone - you will be asked to confirm.',
  
  // Properties panel inputs (6)
  'prop-name': 'Display name for this object. Used in exports and for organization.',
  'prop-x': 'Horizontal position in pixels. 0 = left edge, increases rightward.',
  'prop-y': 'Vertical position in pixels. 0 = top edge, increases downward.',
  'prop-width': 'Object width in pixels. Original size can be restored by reloading asset.',
  'prop-height': 'Object height in pixels. Maintains aspect ratio if both width and height changed.',
  'prop-rotation': 'Rotation angle in degrees. 0 = no rotation, 90 = quarter turn, 360 = full circle.',
  
  // Properties panel buttons (2)
  'btn-duplicate-obj': 'Create a copy of this object offset by 20px (Ctrl+D). Shares same image data.',
  'btn-delete-obj': 'Remove this object from the level permanently (Delete key). Cannot be undone.',
  
  // Canvas (1)
  'canvas': 'Main editing area. Click objects to select. Drag to move. Arrow keys for precise positioning. Shift+Arrows moves 10px.',
  
  // Status bar (2)
  'mouse-coords': 'Current mouse position on canvas in pixels (X, Y). Updates in real-time.',
  'object-count': 'Total number of objects currently in your level. Does not include background.',
  
  // Future: AI panel (will add in Phase 2)
};
```

**Checklist**:
- [ ] Document all toolbar buttons (6)
- [ ] Document all property inputs (6)
- [ ] Document all property buttons (2)
- [ ] Document canvas interaction (1)
- [ ] Document status bar elements (2)
- [ ] Total: 17 tooltip definitions
- [ ] Review for clarity and completeness

#### Step 1.4: Integrate Tooltips (30 min)
**File**: `editor.js` (constructor + setupEventListeners)

**Checklist**:
- [ ] Initialize TooltipManager in constructor
- [ ] Register all tooltips on DOM elements
- [ ] Test hover behavior on each element
- [ ] Test tooltip positioning (avoid going off-screen)
- [ ] Test with keyboard navigation (focus states)

#### Step 1.5: Testing & Polish (30 min)
**Checklist**:
- [ ] Test on Chrome
- [ ] Test on Firefox
- [ ] Test on Safari
- [ ] Test on Edge
- [ ] Test long tooltip text (wrapping)
- [ ] Test rapid hovering (no flicker)
- [ ] Test tooltip hiding on scroll
- [ ] Verify 100% UI coverage (every interactive element)

#### Phase 1 Completion Criteria
- [ ] ✅ Every button has tooltip
- [ ] ✅ Every input has tooltip
- [ ] ✅ Every interactive element has tooltip
- [ ] ✅ Tooltips work in all browsers
- [ ] ✅ Documentation updated
- [ ] ✅ Committed to Git
- [ ] ✅ Deployed to Netlify

**Deliverable**: Complete tooltip system with 17+ tooltips

---

### 🎯 Phase 2: AI Chat Panel (UI Only)
**Status**: ⏳ After Phase 1  
**Estimated Time**: 3-4 hours  
**Priority**: HIGH

#### Step 2.1: Layout Restructure (45 min)
**Files**: `index.html`, `style.css`

**HTML Changes**:
```html
<!-- Add new AI panel to workspace -->
<div class="workspace">
  <div class="canvas-wrapper">
    <canvas id="canvas"></canvas>
  </div>
  <aside class="properties-panel">
    <!-- Existing properties -->
  </aside>
  <!-- NEW: AI Assistant Panel -->
  <aside class="ai-panel" id="ai-panel">
    <div class="ai-header">
      <div class="ai-title">
        <span class="ai-icon">🤖</span>
        <h3>AI Assistant</h3>
        <span class="ai-status" id="ai-status">Ready</span>
      </div>
      <div class="ai-actions">
        <button id="ai-settings" class="icon-btn" title="Configure AI settings">⚙️</button>
        <button id="ai-clear" class="icon-btn" title="Clear conversation">🗑️</button>
        <button id="ai-toggle" class="icon-btn" title="Collapse panel">◀</button>
      </div>
    </div>
    
    <div class="ai-messages" id="ai-messages">
      <div class="ai-message system">
        Welcome! I'm your AI educational content assistant. I can analyze your curriculum, answer questions, and help you create engaging learning experiences. Configure your API key to get started.
      </div>
    </div>
    
    <div class="ai-input-container">
      <textarea 
        id="ai-input" 
        placeholder="Ask about your content or request help with curriculum design..." 
        rows="3"
        title="Type your message to the AI assistant. Press Enter to send, Shift+Enter for new line."></textarea>
      <div class="ai-input-actions">
        <button id="ai-send" class="btn-primary" title="Send message (Enter)">
          <span class="icon">➤</span> Send
        </button>
      </div>
    </div>
  </aside>
</div>
```

**CSS Changes**:
```css
.workspace {
  display: grid;
  grid-template-columns: 1fr 320px 450px; /* canvas + properties + AI */
  gap: 0;
  height: calc(100vh - 90px);
}

.ai-panel {
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  border-left: 1px solid #333;
  overflow: hidden;
}

.ai-panel.collapsed {
  width: 50px;
}

/* Full styling in implementation */
```

**Checklist**:
- [ ] Add AI panel HTML structure
- [ ] Update grid layout (3 columns)
- [ ] Style AI panel header
- [ ] Style message container
- [ ] Style input area
- [ ] Add collapse/expand animation
- [ ] Test responsive behavior
- [ ] Add tooltips to AI panel elements

#### Step 2.2: Settings Modal (45 min)
**Files**: `index.html`, `style.css`

**Modal HTML**:
```html
<div id="ai-settings-modal" class="modal hidden">
  <div class="modal-overlay"></div>
  <div class="modal-content">
    <div class="modal-header">
      <h2>AI Assistant Configuration</h2>
      <button class="modal-close" id="close-ai-settings">×</button>
    </div>
    
    <div class="modal-body">
      <div class="form-group">
        <label for="ai-provider">AI Provider</label>
        <select id="ai-provider">
          <option value="anthropic">Anthropic (Claude)</option>
          <option value="openai">OpenAI (GPT-4)</option>
        </select>
        <small>Choose your preferred AI provider</small>
      </div>
      
      <div class="form-group" id="anthropic-group">
        <label for="anthropic-key">Anthropic API Key</label>
        <input 
          type="password" 
          id="anthropic-key" 
          placeholder="sk-ant-..."
          autocomplete="off">
        <small>Get your key at <a href="https://console.anthropic.com" target="_blank">console.anthropic.com</a></small>
      </div>
      
      <div class="form-group hidden" id="openai-group">
        <label for="openai-key">OpenAI API Key</label>
        <input 
          type="password" 
          id="openai-key" 
          placeholder="sk-..."
          autocomplete="off">
        <small>Get your key at <a href="https://platform.openai.com" target="_blank">platform.openai.com</a></small>
      </div>
      
      <div class="form-group">
        <label for="ai-model">Model</label>
        <select id="ai-model">
          <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Recommended)</option>
          <option value="claude-3-opus-20240229">Claude 3 Opus (Most Capable)</option>
          <option value="gpt-4-turbo">GPT-4 Turbo</option>
          <option value="gpt-4">GPT-4</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>
          <input type="checkbox" id="ai-auto-analyze">
          Automatically analyze level changes
        </label>
        <small>AI will proactively comment on your edits</small>
      </div>
    </div>
    
    <div class="modal-footer">
      <button class="btn-secondary" id="cancel-ai-settings">Cancel</button>
      <button class="btn-primary" id="save-ai-settings">Save Configuration</button>
    </div>
  </div>
</div>
```

**Checklist**:
- [ ] Create modal HTML structure
- [ ] Style modal (dark theme)
- [ ] Add modal show/hide animations
- [ ] Implement provider switching logic
- [ ] Test keyboard navigation (Tab, Escape)
- [ ] Add validation (key format check)
- [ ] Test localStorage save/load

#### Step 2.3: Message Rendering (45 min)
**File**: `editor.js` (new AIController class)

```javascript
class AIController {
  constructor(editor) {
    this.editor = editor;
    this.messages = [];
    this.config = null;
    this.isThinking = false;
  }
  
  init() {
    this.loadConfig();
    this.setupEventListeners();
    this.renderWelcomeMessage();
  }
  
  addMessage(role, content, toolCalls = null, toolResults = null) {
    const message = {
      id: Date.now() + Math.random(),
      role: role, // 'user', 'assistant', 'system'
      content: content,
      toolCalls: toolCalls,
      toolResults: toolResults,
      timestamp: new Date().toISOString()
    };
    this.messages.push(message);
    this.renderMessage(message);
    this.scrollToBottom();
  }
  
  renderMessage(message) {
    const container = document.getElementById('ai-messages');
    const div = document.createElement('div');
    div.className = `ai-message ${message.role}`;
    div.dataset.messageId = message.id;
    
    // Format content (markdown support)
    div.innerHTML = this.formatContent(message.content);
    
    // Add tool calls if present
    if (message.toolCalls) {
      div.appendChild(this.renderToolCalls(message.toolCalls));
    }
    
    // Add timestamp
    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = new Date(message.timestamp).toLocaleTimeString();
    div.appendChild(time);
    
    container.appendChild(div);
  }
  
  formatContent(content) {
    // Simple markdown: **bold**, *italic*, `code`, ```code blocks```
    // Links, lists, etc.
    return marked.parse(content); // Or simple regex replacements
  }
  
  renderToolCalls(toolCalls) {
    const div = document.createElement('div');
    div.className = 'tool-calls';
    toolCalls.forEach(tool => {
      const toolDiv = document.createElement('div');
      toolDiv.className = 'tool-call';
      toolDiv.textContent = `🔧 ${tool.name}(${JSON.stringify(tool.input)})`;
      div.appendChild(toolDiv);
    });
    return div;
  }
  
  showThinking() {
    const div = document.createElement('div');
    div.className = 'ai-message assistant thinking';
    div.id = 'thinking-indicator';
    div.innerHTML = '<div class="thinking-dots"><span>●</span><span>●</span><span>●</span></div>';
    document.getElementById('ai-messages').appendChild(div);
    this.scrollToBottom();
  }
  
  hideThinking() {
    const thinking = document.getElementById('thinking-indicator');
    if (thinking) thinking.remove();
  }
}
```

**Checklist**:
- [ ] Create AIController class
- [ ] Implement message rendering
- [ ] Add markdown formatting
- [ ] Style user vs assistant messages
- [ ] Add thinking indicator
- [ ] Test message overflow scrolling
- [ ] Add copy message button
- [ ] Add message timestamps

#### Step 2.4: Input Handling (30 min)
**File**: `editor.js` (AIController)

**Checklist**:
- [ ] Capture input field events
- [ ] Handle Enter key (send)
- [ ] Handle Shift+Enter (new line)
- [ ] Disable send when empty
- [ ] Clear input after send
- [ ] Handle textarea auto-resize
- [ ] Add character count (optional)
- [ ] Test paste handling

#### Step 2.5: Configuration Persistence (30 min)
**File**: `editor.js` (AIController)

```javascript
saveConfig() {
  const config = {
    provider: document.getElementById('ai-provider').value,
    anthropic_key: document.getElementById('anthropic-key').value,
    openai_key: document.getElementById('openai-key').value,
    model: document.getElementById('ai-model').value,
    auto_analyze: document.getElementById('ai-auto-analyze').checked
  };
  localStorage.setItem('ai_config', JSON.stringify(config));
  this.config = config;
}

loadConfig() {
  const stored = localStorage.getItem('ai_config');
  if (stored) {
    this.config = JSON.parse(stored);
    this.populateConfigForm();
  }
}
```

**Checklist**:
- [ ] Implement save to localStorage
- [ ] Implement load from localStorage
- [ ] Validate API key format
- [ ] Handle missing config gracefully
- [ ] Add "clear config" option
- [ ] Test across browser refresh

#### Phase 2 Completion Criteria
- [ ] ✅ AI panel renders correctly
- [ ] ✅ Panel can collapse/expand
- [ ] ✅ Settings modal works
- [ ] ✅ Config saves to localStorage
- [ ] ✅ Messages render with proper styling
- [ ] ✅ Input field functional (no API yet)
- [ ] ✅ All tooltips on AI elements
- [ ] ✅ Documentation updated
- [ ] ✅ Committed to Git

**Deliverable**: Fully functional AI panel UI (no API integration yet)

---

### 🎯 Phase 3: AI API Integration (Basic)
**Status**: ⏳ After Phase 2  
**Estimated Time**: 4-5 hours  
**Priority**: HIGH

#### Step 3.1: Anthropic API Client (90 min)
**File**: `ai-client.js` (new file)

```javascript
class AnthropicClient {
  constructor(apiKey, model = 'claude-3-5-sonnet-20241022') {
    this.apiKey = apiKey;
    this.model = model;
    this.baseURL = 'https://api.anthropic.com/v1';
  }
  
  async createMessage(messages, system = null, tools = null, maxTokens = 8096) {
    const response = await fetch(`${this.baseURL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: maxTokens,
        messages: messages,
        system: system,
        tools: tools,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Anthropic API Error: ${error.error.message}`);
    }
    
    return await response.json();
  }
  
  async streamMessage(messages, system, tools, onChunk, onComplete, onError) {
    // Streaming implementation for better UX
    // Shows text as it's generated
  }
}
```

**Checklist**:
- [ ] Create AnthropicClient class
- [ ] Implement createMessage method
- [ ] Add error handling
- [ ] Test with real API key
- [ ] Implement streaming (optional but nice)
- [ ] Handle rate limits
- [ ] Handle network errors

#### Step 3.2: OpenAI API Client (90 min)
**File**: `ai-client.js`

```javascript
class OpenAIClient {
  constructor(apiKey, model = 'gpt-4-turbo') {
    this.apiKey = apiKey;
    this.model = model;
    this.baseURL = 'https://api.openai.com/v1';
  }
  
  async createChatCompletion(messages, tools = null, maxTokens = 8096) {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages,
        tools: tools,
        max_tokens: maxTokens,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API Error: ${error.error.message}`);
    }
    
    return await response.json();
  }
}
```

**Checklist**:
- [ ] Create OpenAIClient class
- [ ] Implement createChatCompletion method
- [ ] Add error handling
- [ ] Test with real API key
- [ ] Handle different response formats
- [ ] Implement streaming (optional)

#### Step 3.3: Basic Conversation Flow (60 min)
**File**: `editor.js` (AIController)

```javascript
async sendMessage(userMessage) {
  // Add user message to UI
  this.addMessage('user', userMessage);
  
  // Disable input
  this.setInputEnabled(false);
  this.showThinking();
  
  try {
    // Build conversation history
    const messages = this.buildMessageHistory();
    
    // Get AI response
    const client = this.getClient();
    const response = await client.createMessage(
      messages,
      this.buildSystemPrompt(),
      null, // No tools yet (Phase 4)
      8096
    );
    
    // Add AI response to UI
    this.hideThinking();
    this.addMessage('assistant', response.content[0].text);
    
  } catch (error) {
    this.hideThinking();
    this.showError(error.message);
  } finally {
    this.setInputEnabled(true);
  }
}

buildMessageHistory() {
  return this.messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({
      role: m.role,
      content: m.content
    }));
}

buildSystemPrompt() {
  return `You are an AI assistant integrated into Hypomnemata, an educational content creation platform.
You help users design curriculum and create learning materials by answering questions and providing guidance.

Current workspace:
- Canvas size: ${this.editor.canvas.width}x${this.editor.canvas.height}
- Background: ${this.editor.background ? 'loaded' : 'none'}
- Objects: ${this.editor.objects.length} total

You have deep knowledge of:
- Educational design principles
- Curriculum structure patterns
- Content organization strategies
- Learning progression and scaffolding

Be helpful, specific, and proactive.`;
}
```

**Checklist**:
- [ ] Implement sendMessage method
- [ ] Build conversation history
- [ ] Create system prompt
- [ ] Add error handling
- [ ] Test with simple questions
- [ ] Handle API errors gracefully
- [ ] Add retry logic

#### Step 3.4: Testing & Validation (30 min)
**Test Scenarios**:

```
1. "What's in my level?" 
   → Should describe objects and background

2. "How do I add objects?"
   → Should explain the process

3. "What's good spacing for enemies?"
   → Should give game design advice

4. "Tell me about tower defense design"
   → Should share knowledge

5. Invalid API key
   → Should show clear error

6. Network error
   → Should show retry option
```

**Checklist**:
- [ ] Test conversation flow
- [ ] Test error handling
- [ ] Test with both providers
- [ ] Test rate limiting
- [ ] Verify message history works
- [ ] Test clear conversation
- [ ] Check token usage

#### Phase 3 Completion Criteria
- [ ] ✅ Anthropic API integration works
- [ ] ✅ OpenAI API integration works
- [ ] ✅ Basic Q&A conversations functional
- [ ] ✅ Error handling robust
- [ ] ✅ Config switching works
- [ ] ✅ Message history preserved
- [ ] ✅ Documentation updated
- [ ] ✅ Committed to Git

**Deliverable**: Working AI chat with Q&A capability (no actions yet)

---

### 🎯 Phase 4: AI Tool Calling System
**Status**: ⏳ After Phase 3  
**Estimated Time**: 6-8 hours  
**Priority**: CRITICAL (Non-negotiable #2)

#### Step 4.1: Define Tool Schema (60 min)
**File**: `ai-tools.js` (new file)

```javascript
const AI_TOOLS = [
  {
    name: "get_editor_state",
    description: "Get the complete current state of the level editor including canvas size, background status, and all objects with their properties",
    input_schema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  
  {
    name: "move_object",
    description: "Move an object to a new position on the canvas",
    input_schema: {
      type: "object",
      properties: {
        object_id: {
          type: "string",
          description: "The unique ID of the object to move"
        },
        x: {
          type: "number",
          description: "New X position in pixels"
        },
        y: {
          type: "number",
          description: "New Y position in pixels"
        }
      },
      required: ["object_id", "x", "y"]
    }
  },
  
  // ... 10 more tools (full definitions in implementation)
];
```

**Complete Tool List** (12 tools):
1. get_editor_state
2. move_object
3. resize_object
4. rotate_object
5. delete_object
6. duplicate_object
7. select_object
8. arrange_objects_grid
9. analyze_level_layout
10. find_object_by_name
11. get_object_details
12. export_level

**Checklist**:
- [ ] Define all 12 tool schemas
- [ ] Follow Anthropic tool format
- [ ] Add clear descriptions
- [ ] Document all parameters
- [ ] Add parameter validation
- [ ] Test schema validity

#### Step 4.2: Implement Tool Handlers (120 min)
**File**: `ai-tools.js`

```javascript
class AIToolExecutor {
  constructor(editor) {
    this.editor = editor;
  }
  
  execute(toolName, parameters) {
    const handler = this[`handle_${toolName}`];
    if (!handler) {
      throw new Error(`Unknown tool: ${toolName}`);
    }
    
    try {
      const result = handler.call(this, parameters);
      return {
        success: true,
        result: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  handle_get_editor_state(params) {
    return {
      canvas: {
        width: this.editor.canvas.width,
        height: this.editor.canvas.height
      },
      background: this.editor.background ? {
        loaded: true,
        name: "background image"
      } : null,
      objects: this.editor.objects.map(obj => ({
        id: obj.id,
        name: obj.name,
        x: Math.round(obj.x),
        y: Math.round(obj.y),
        width: Math.round(obj.width),
        height: Math.round(obj.height),
        rotation: obj.rotation
      })),
      selected_object_id: this.editor.selectedObject?.id || null,
      total_objects: this.editor.objects.length
    };
  }
  
  handle_move_object(params) {
    const obj = this.editor.objects.find(o => o.id === params.object_id);
    if (!obj) {
      throw new Error(`Object with ID ${params.object_id} not found`);
    }
    
    const oldX = obj.x;
    const oldY = obj.y;
    obj.x = params.x;
    obj.y = params.y;
    
    this.editor.updateProperties();
    
    return {
      object_name: obj.name,
      old_position: { x: oldX, y: oldY },
      new_position: { x: params.x, y: params.y },
      message: `Moved "${obj.name}" from (${oldX}, ${oldY}) to (${params.x}, ${params.y})`
    };
  }
  
  // ... implement remaining 10 handlers
}
```

**Checklist** (per tool):
- [ ] Implement get_editor_state
- [ ] Implement move_object
- [ ] Implement resize_object
- [ ] Implement rotate_object
- [ ] Implement delete_object
- [ ] Implement duplicate_object
- [ ] Implement select_object
- [ ] Implement arrange_objects_grid
- [ ] Implement analyze_level_layout
- [ ] Implement find_object_by_name
- [ ] Implement get_object_details
- [ ] Implement export_level
- [ ] Add error handling to each
- [ ] Add validation to each
- [ ] Test each individually

#### Step 4.3: Integrate Tool Calling (90 min)
**File**: `editor.js` (AIController)

```javascript
async sendMessage(userMessage) {
  this.addMessage('user', userMessage);
  this.setInputEnabled(false);
  this.showThinking();
  
  try {
    const messages = this.buildMessageHistory();
    const tools = AI_TOOLS; // From ai-tools.js
    
    // First API call
    const client = this.getClient();
    let response = await client.createMessage(
      messages,
      this.buildSystemPrompt(),
      tools,
      8096
    );
    
    // Handle tool calls
    while (response.stop_reason === 'tool_use') {
      const toolCalls = response.content.filter(c => c.type === 'tool_use');
      
      // Execute tools
      const toolResults = [];
      for (const toolCall of toolCalls) {
        const result = this.toolExecutor.execute(
          toolCall.name,
          toolCall.input
        );
        toolResults.push({
          tool_use_id: toolCall.id,
          content: JSON.stringify(result)
        });
        
        // Show tool execution in UI
        this.addToolCallMessage(toolCall, result);
      }
      
      // Continue conversation with tool results
      messages.push({
        role: 'assistant',
        content: response.content
      });
      messages.push({
        role: 'user',
        content: toolResults
      });
      
      // Get next response
      response = await client.createMessage(messages, this.buildSystemPrompt(), tools, 8096);
    }
    
    // Final response
    this.hideThinking();
    const textContent = response.content.find(c => c.type === 'text');
    if (textContent) {
      this.addMessage('assistant', textContent.text);
    }
    
  } catch (error) {
    this.hideThinking();
    this.showError(error.message);
  } finally {
    this.setInputEnabled(true);
  }
}
```

**Checklist**:
- [ ] Implement tool calling loop
- [ ] Handle tool_use responses
- [ ] Execute tools via AIToolExecutor
- [ ] Return results to AI
- [ ] Handle multi-turn tool calling
- [ ] Display tool executions in UI
- [ ] Add error handling for tool failures
- [ ] Test complete flow

#### Step 4.4: Enhanced System Prompt (30 min)
**File**: `editor.js` (AIController)

```javascript
buildSystemPrompt() {
  const editorState = this.toolExecutor.handle_get_editor_state({});
  
  return `You are an AI assistant integrated into Hypomnemata, an educational content creation platform. You help users design curriculum, create learning materials, and develop engaging educational experiences.

## Your Capabilities

You can:
1. Answer questions about curriculum design and content creation
2. Analyze learning materials for clarity, engagement, and pedagogical quality
3. **Use tools to directly support content development** - organize resources, structure lessons, create assessments
4. Provide specific, actionable advice
5. Learn from the conversation and build on previous interactions

## Current Editor State

${JSON.stringify(editorState, null, 2)}

## Available Tools

You have ${AI_TOOLS.length} tools to manipulate the editor:
${AI_TOOLS.map(t => `- ${t.name}: ${t.description}`).join('\n')}

## Guidelines

1. **Be proactive**: Don't just describe what to do - actually DO IT using tools
2. **Confirm actions**: Before major changes (deleting multiple objects), confirm with user
3. **Be specific**: When referencing objects, use their exact IDs or names
4. **Think like an educator**: Consider learning objectives, scaffolding, differentiation, learner engagement
5. **Explain reasoning**: When suggesting changes, explain the educational design principles
6. **Use tools liberally**: If user says "move that left", actually move it
7. **Multi-step operations**: You can call multiple tools in sequence for complex tasks

## Example Interactions

User: "This lesson needs more engagement"
You: [analyze content] → [suggest interactive elements] → "I've added discussion prompts and hands-on activities"

User: "Create a quiz for this unit"
You: [analyze learning objectives] → [generate assessment items] → [offer quiz structure]

User: "Structure this curriculum"
You: [identify key concepts] → [suggest lesson sequence] → "Organized into 5 progressive units"

Remember: You're a collaborative co-designer. Take initiative and take action!`;
}
```

**Checklist**:
- [ ] Include current editor state
- [ ] List all available tools
- [ ] Provide clear guidelines
- [ ] Add example interactions
- [ ] Emphasize proactive behavior
- [ ] Update as tools are added

#### Step 4.5: Testing Tool Calling (60 min)
**Test Scenarios**:

```
1. "Move the enemy at x=100 to x=200"
   → Should use move_object tool
   → Should confirm action
   → Should show object moving in editor

2. "Delete all objects named 'temp'"
   → Should find objects by name
   → Should confirm deletion
   → Should use delete_object for each

3. "Arrange my enemies in a 3x3 grid"
   → Should use arrange_objects_grid
   → Should calculate positions
   → Should move all objects

4. "What objects do I have?"
   → Should use get_editor_state
   → Should list all objects

5. "Make object 'enemy1' bigger"
   → Should use find_object_by_name
   → Should use resize_object
   → Should confirm resize

6. "Analyze my level layout"
   → Should use analyze_level_layout
   → Should provide insights
```

**Checklist**:
- [ ] Test simple tool use
- [ ] Test multi-tool sequences
- [ ] Test error handling (invalid IDs)
- [ ] Test confirmation flow
- [ ] Test visual feedback in editor
- [ ] Test tool result display
- [ ] Verify objects actually move/change
- [ ] Test undo (future feature)

#### Phase 4 Completion Criteria
- [ ] ✅ All 12 tools implemented
- [ ] ✅ Tool calling loop works
- [ ] ✅ AI successfully executes actions
- [ ] ✅ Changes reflected in editor immediately
- [ ] ✅ Tool results shown in chat
- [ ] ✅ Error handling robust
- [ ] ✅ Complex multi-step tasks work
- [ ] ✅ Documentation updated
- [ ] ✅ Committed to Git

**Deliverable**: Fully functional AI that can manipulate the editor

---

### 🎯 Phase 5: Advanced AI Features
**Status**: ⏳ After Phase 4  
**Estimated Time**: 6-8 hours  
**Priority**: MEDIUM

#### Step 5.1: Level Analysis Tools (120 min)
**New Tools**:

1. **analyze_spacing** - Calculate and critique object spacing
2. **analyze_balance** - Check for balanced enemy/resource distribution
3. **analyze_difficulty** - Estimate difficulty based on object density
4. **find_issues** - Detect common problems (overlaps, out of bounds, etc.)
5. **suggest_improvements** - Generate specific improvement recommendations

**Implementation**:
```javascript
handle_analyze_spacing(params) {
  const objects = this.editor.objects;
  const distances = [];
  
  for (let i = 0; i < objects.length; i++) {
    for (let j = i + 1; j < objects.length; j++) {
      const dx = objects[i].x - objects[j].x;
      const dy = objects[i].y - objects[j].y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      distances.push({
        obj1: objects[i].name,
        obj2: objects[j].name,
        distance: Math.round(dist)
      });
    }
  }
  
  distances.sort((a, b) => a.distance - b.distance);
  
  return {
    total_objects: objects.length,
    average_distance: distances.reduce((s, d) => s + d.distance, 0) / distances.length,
    closest_pair: distances[0],
    furthest_pair: distances[distances.length - 1],
    too_close: distances.filter(d => d.distance < 50), // Threshold
    recommendations: this.generateSpacingRecommendations(distances)
  };
}
```

**Checklist**:
- [ ] Implement spacing analysis
- [ ] Implement balance analysis
- [ ] Implement difficulty estimation
- [ ] Implement issue detection
- [ ] Implement improvement suggestions
- [ ] Test with various level layouts
- [ ] Verify recommendations make sense

#### Step 5.2: Bulk Operations (90 min)
**New Tools**:

1. **select_multiple_objects** - Select by pattern/criteria
2. **move_objects_batch** - Move multiple at once
3. **resize_objects_batch** - Bulk resize
4. **delete_objects_batch** - Bulk delete with confirmation
5. **clone_selection** - Duplicate multiple objects

**Checklist**:
- [ ] Implement batch selection
- [ ] Implement batch move
- [ ] Implement batch resize
- [ ] Implement batch delete (with confirmation)
- [ ] Implement clone selection
- [ ] Add progress indicators for bulk ops
- [ ] Test performance with 50+ objects

#### Step 5.3: Pattern Generation (90 min)
**New Tools**:

1. **arrange_circular** - Arrange objects in circle
2. **arrange_spiral** - Create spiral pattern
3. **arrange_wave** - Create wave pattern
4. **arrange_random** - Randomize with constraints
5. **distribute_evenly** - Even distribution across canvas

**Checklist**:
- [ ] Implement circular arrangement
- [ ] Implement spiral pattern
- [ ] Implement wave pattern
- [ ] Implement constrained randomization
- [ ] Implement even distribution
- [ ] Add pattern preview (optional)
- [ ] Test each pattern visually

#### Step 5.4: Smart Suggestions (90 min)
**Features**:

```javascript
class SmartSuggestions {
  analyze(editor) {
    const suggestions = [];
    
    // Check for common issues
    if (this.hasOverlappingObjects(editor)) {
      suggestions.push({
        type: 'warning',
        message: 'Some objects are overlapping',
        action: 'auto_fix_overlaps'
      });
    }
    
    if (this.hasUnevenSpacing(editor)) {
      suggestions.push({
        type: 'suggestion',
        message: 'Spacing could be more consistent',
        action: 'distribute_evenly'
      });
    }
    
    if (this.hasEmptyAreas(editor)) {
      suggestions.push({
        type: 'info',
        message: 'Large empty areas detected',
        action: 'suggest_placements'
      });
    }
    
    return suggestions;
  }
}
```

**Checklist**:
- [ ] Detect overlapping objects
- [ ] Detect uneven spacing
- [ ] Detect empty areas
- [ ] Detect edge-case positions
- [ ] Generate actionable suggestions
- [ ] Add "Apply Suggestion" buttons
- [ ] Test suggestion accuracy

#### Step 5.5: Auto-Analyze Mode (60 min)
**Feature**: AI proactively comments on changes

```javascript
class AutoAnalyzer {
  constructor(editor, aiController) {
    this.editor = editor;
    this.aiController = aiController;
    this.enabled = false;
    this.lastState = null;
  }
  
  enable() {
    this.enabled = true;
    this.lastState = this.captureState();
    this.startWatching();
  }
  
  startWatching() {
    // Watch for changes
    setInterval(() => {
      if (!this.enabled) return;
      
      const currentState = this.captureState();
      const changes = this.detectChanges(this.lastState, currentState);
      
      if (changes.length > 0) {
        this.aiController.sendAutoComment(changes);
        this.lastState = currentState;
      }
    }, 3000); // Check every 3 seconds
  }
  
  detectChanges(oldState, newState) {
    const changes = [];
    
    // Object added
    if (newState.objectCount > oldState.objectCount) {
      changes.push('Object added');
    }
    
    // Object moved significantly
    // ... detect movement, resizing, rotation, etc.
    
    return changes;
  }
}
```

**Checklist**:
- [ ] Implement state capture
- [ ] Implement change detection
- [ ] Generate auto-comments
- [ ] Add enable/disable toggle
- [ ] Add frequency controls
- [ ] Test doesn't spam chat
- [ ] Make comments helpful not annoying

#### Phase 5 Completion Criteria
- [ ] ✅ Advanced analysis tools work
- [ ] ✅ Bulk operations functional
- [ ] ✅ Pattern generation works
- [ ] ✅ Smart suggestions accurate
- [ ] ✅ Auto-analyze mode optional
- [ ] ✅ Performance acceptable
- [ ] ✅ Documentation updated
- [ ] ✅ Committed to Git

**Deliverable**: AI with advanced analysis and automation capabilities

---

### 🎯 Phase 6: Polish & UX Enhancement
**Status**: ⏳ After Phase 5  
**Estimated Time**: 4-6 hours  
**Priority**: MEDIUM

#### Step 6.1: Conversation Management (90 min)
**Features**:
- Export conversation to file
- Import previous conversations
- Branch conversations (fork at any point)
- Search conversation history
- Pin important messages
- Delete individual messages

**Checklist**:
- [ ] Add export conversation button
- [ ] Add import conversation feature
- [ ] Implement conversation branching
- [ ] Add search functionality
- [ ] Add pin message feature
- [ ] Add delete message (with confirmation)
- [ ] Test with long conversations (100+ messages)

#### Step 6.2: Visual Feedback (60 min)
**Features**:
- Highlight objects when AI mentions them
- Show object paths when AI moves them
- Animate tool executions
- Show before/after previews
- Add success/error toasts

**Checklist**:
- [ ] Implement object highlighting
- [ ] Add movement animations
- [ ] Show tool execution visually
- [ ] Add preview mode
- [ ] Implement toast notifications
- [ ] Test visual clarity

#### Step 6.3: Keyboard Shortcuts (30 min)
**New Shortcuts**:
- `Ctrl+Shift+A` - Focus AI input
- `Ctrl+Shift+Enter` - Send AI message
- `Ctrl+Shift+K` - Clear conversation
- `Ctrl+Shift+S` - Toggle AI settings
- `Escape` - Close AI panel / cancel operation

**Checklist**:
- [ ] Implement all shortcuts
- [ ] Update tooltips with shortcuts
- [ ] Test shortcut conflicts
- [ ] Document in README
- [ ] Add shortcut help modal

#### Step 6.4: Performance Optimization (90 min)
**Optimizations**:
- Debounce input field
- Lazy load conversation history
- Optimize tool execution rendering
- Cache API responses (where appropriate)
- Reduce re-renders

**Checklist**:
- [ ] Profile current performance
- [ ] Implement debouncing
- [ ] Add lazy loading
- [ ] Optimize rendering
- [ ] Add loading indicators
- [ ] Test with stress scenarios

#### Step 6.5: Error Handling (60 min)
**Comprehensive Error Handling**:
- API key invalid/expired
- Network timeouts
- Rate limiting
- Tool execution failures
- Malformed responses
- Out of tokens

**Checklist**:
- [ ] Handle all error types
- [ ] Show user-friendly messages
- [ ] Add retry mechanisms
- [ ] Log errors for debugging
- [ ] Add error recovery
- [ ] Test error scenarios

#### Phase 6 Completion Criteria
- [ ] ✅ Conversation management complete
- [ ] ✅ Visual feedback polished
- [ ] ✅ All shortcuts work
- [ ] ✅ Performance optimized
- [ ] ✅ Error handling robust
- [ ] ✅ UX smooth and intuitive
- [ ] ✅ Documentation updated
- [ ] ✅ Committed to Git

**Deliverable**: Polished, production-ready AI experience

---

### 🎯 Phase 7: Help Documentation System
**Status**: ⏳ After Phase 6  
**Estimated Time**: 3-4 hours  
**Priority**: HIGH

#### Step 7.1: Create AI Help File (120 min)
**File**: `docs/AI_HELP.md` (comprehensive guide for AI)

**Sections**:
1. Platform Capabilities
2. Tool Reference (all 20+ tools)
3. Common Tasks & Examples
4. Educational Design Best Practices
5. Curriculum Structure Patterns
6. Troubleshooting Guide
7. API Reference
8. Example Conversations

**Content** (~2000 lines):
```markdown
# AI Assistant Help Documentation

## Platform Capabilities

Hypomnemata allows users to...

## Tool Reference

### get_editor_state
**Purpose**: Get complete current state
**Parameters**: None
**Returns**: Canvas info, background status, all objects
**Example**: User asks "what's in my workspace?"

### move_object
**Purpose**: Reposition content elements
**Parameters**: object_id, x, y
**Returns**: Success confirmation
**Example**: "Move this text block to the center"
...

## Common Tasks

### Task: Analyzing Curriculum
1. Use get_editor_state to see all elements
2. Use analyze_content for insights
3. Check organization with analyze_structure
4. Provide specific feedback

### Task: Improving Engagement
1. Analyze content distribution
2. Identify pacing issues
3. Suggest specific improvements
4. Offer to implement automatically
...

## Educational Design Best Practices

### Unit Structure
- Learning objectives should be clear and measurable
- Scaffolding increases complexity gradually
- Assessment aligned with objectives
...

### Lesson Design
- Hook: Engage learners in first 5 minutes
- Direct instruction: Clear, concise explanations
- Guided practice: Support before independence
...
```

**Checklist**:
- [ ] Document all tools comprehensively
- [ ] Add 50+ example tasks
- [ ] Include educational design theory
- [ ] Add troubleshooting section
- [ ] Include conversation examples
- [ ] Review for completeness
- [ ] Test AI can find info quickly

#### Step 7.2: Integrate Help into System Prompt (30 min)
**File**: `editor.js` (AIController)

```javascript
async loadHelpDocumentation() {
  // Load AI_HELP.md content
  const response = await fetch('docs/AI_HELP.md');
  const helpContent = await response.text();
  this.helpDocs = helpContent;
}

buildSystemPrompt() {
  return `${basePrompt}

## Help Documentation

You have access to comprehensive help documentation:

${this.helpDocs}

Use this documentation to:
- Answer user questions accurately
- Learn about available tools
- Follow best practices
- Provide examples

Always check the documentation when unsure.`;
}
```

**Checklist**:
- [ ] Load help file at startup
- [ ] Include in system prompt
- [ ] Test AI uses documentation
- [ ] Verify answers are more accurate
- [ ] Add fallback if file missing

#### Step 7.3: In-App Help Panel (60 min)
**Feature**: User-accessible help panel

**HTML**:
```html
<button id="show-help" title="Show help documentation">❓</button>

<div id="help-panel" class="modal hidden">
  <div class="modal-content help-content">
    <div class="help-sidebar">
      <input type="search" placeholder="Search help...">
      <nav>
        <a href="#capabilities">Capabilities</a>
        <a href="#tools">AI Tools</a>
        <a href="#examples">Examples</a>
        <a href="#design">Educational Design</a>
      </nav>
    </div>
    <div class="help-body">
      <!-- Rendered markdown from AI_HELP.md -->
    </div>
  </div>
</div>
```

**Checklist**:
- [ ] Create help panel UI
- [ ] Render markdown help content
- [ ] Add search functionality
- [ ] Add navigation sidebar
- [ ] Make searchable
- [ ] Add copy code examples
- [ ] Test usability

#### Phase 7 Completion Criteria
- [ ] ✅ Comprehensive AI help file created
- [ ] ✅ Help integrated into AI system prompt
- [ ] ✅ User help panel accessible
- [ ] ✅ Search works
- [ ] ✅ Examples clear and helpful
- [ ] ✅ Documentation updated
- [ ] ✅ Committed to Git

**Deliverable**: Complete help system for both AI and users

---

### 🎯 Phase 8: Advanced Features (The "Best in Universe" Phase)
**Status**: ⏳ After Phase 7  
**Estimated Time**: 10-15 hours  
**Priority**: FUTURE

#### Epic Features to Consider:

**8.1: AI Vision Integration**
- Upload reference images
- AI analyzes level screenshots
- Generate levels from sketches
- Visual similarity detection

**8.2: Learning from User**
- Remember user preferences
- Learn user's design style
- Suggest based on past patterns
- Personalized recommendations

**8.3: Collaborative Design**
- AI suggests, user refines
- Iterative improvement cycles
- A/B testing different layouts
- Difficulty tuning assistant

**8.4: Game-Specific Templates**
- Tower Defense template
- Platformer template
- Puzzle game template
- RPG map template

**8.5: Procedural Generation**
- Generate entire levels from prompts
- Procedural decoration placement
- Random but balanced layouts
- Seed-based generation

**8.6: Playtesting Simulation**
- AI simulates player behavior
- Predict difficulty
- Find exploits
- Suggest balance changes

**8.7: Export Templates**
- Multiple game engine formats
- Custom export scripts
- Animation paths
- Event triggers

**8.8: Undo/Redo with AI**
- AI-aware undo system
- Redo with variations
- Branch timeline
- Time travel debugging

*(These are future possibilities - not committed to roadmap yet)*

---

## 📊 Progress Tracking

### Phase Completion Status

| Phase | Status | Completion % | Estimated Time | Actual Time |
|-------|--------|--------------|----------------|-------------|
| Phase 0: Foundation | ✅ Complete | 100% | - | Completed |
| Phase 1: Tooltips | 🔜 Next | 0% | 2-3 hours | - |
| Phase 2: AI Panel UI | ⏳ Waiting | 0% | 3-4 hours | - |
| Phase 3: AI API | ⏳ Waiting | 0% | 4-5 hours | - |
| Phase 4: Tool Calling | ⏳ Waiting | 0% | 6-8 hours | - |
| Phase 5: Advanced AI | ⏳ Waiting | 0% | 6-8 hours | - |
| Phase 6: Polish | ⏳ Waiting | 0% | 4-6 hours | - |
| Phase 7: Help Docs | ⏳ Waiting | 0% | 3-4 hours | - |
| Phase 8: Epic Features | 💭 Future | 0% | 10-15 hours | - |

**Total Estimated Time**: 38-53 hours (not including Phase 8)

---

## 🎯 Success Criteria

### Minimum Viable AI Integration (Phases 1-4)
- [ ] Every UI element has tooltip
- [ ] AI chat panel functional
- [ ] Basic Q&A works
- [ ] AI can execute 12 core tools
- [ ] Changes reflected in editor immediately
- [ ] Error handling robust

### Complete AI Integration (Phases 1-7)
- [ ] All above +
- [ ] Advanced analysis tools
- [ ] Bulk operations
- [ ] Pattern generation
- [ ] Smart suggestions
- [ ] Polished UX
- [ ] Comprehensive help system

### "Best in Universe" (Phase 8+)
- [ ] All above +
- [ ] AI vision integration
- [ ] Learns user preferences
- [ ] Procedural generation
- [ ] Playtesting simulation
- [ ] Multiple export formats

---

## 🚀 Deployment Strategy

### After Each Phase:
1. **Test Thoroughly** (run full test suite)
2. **Update Documentation** (all affected docs)
3. **Commit to Git** (descriptive commit message)
4. **Push to GitHub** (triggers Netlify deploy)
5. **Verify Deployment** (test on live site)
6. **Update CHANGELOG** (document new features)

### Version Numbering:
- Phase 1 Complete → **v1.1.0** (Tooltips)
- Phase 2 Complete → **v1.2.0** (AI Panel UI)
- Phase 3 Complete → **v2.0.0** (AI Integration)
- Phase 4 Complete → **v2.1.0** (Tool Calling)
- Phase 5 Complete → **v2.2.0** (Advanced AI)
- Phase 6 Complete → **v2.3.0** (Polish)
- Phase 7 Complete → **v2.4.0** (Help System)

---

## 📝 Documentation Updates Needed

### Per Phase:
- [ ] Update `AI_CONTEXT.md` (current state)
- [ ] Update `ARCHITECTURE.md` (system design)
- [ ] Update `API_REFERENCE.md` (new code)
- [ ] Update `CHANGELOG.md` (what changed)
- [ ] Update `README.md` (user-facing features)
- [ ] Update `TROUBLESHOOTING.md` (new issues)

### New Documentation:
- [ ] `AI_INTEGRATION_DESIGN.md` (complete design)
- [ ] `AI_HELP.md` (help for AI)
- [ ] `AI_TOOLS_REFERENCE.md` (tool documentation)
- [ ] `GAME_DESIGN_GUIDE.md` (design principles)

---

## ⚠️ Risk Management

### Known Risks:

**API Rate Limiting**
- Risk: High usage could hit rate limits
- Mitigation: Add usage tracking, warn user, implement retry logic

**API Costs**
- Risk: Long conversations = high token usage
- Mitigation: User controls their API keys, show token estimates

**CORS Issues**
- Risk: Browser may block API calls
- Mitigation: Test early, add proxy if needed (Netlify Functions)

**Tool Execution Bugs**
- Risk: AI might break levels with bad tool calls
- Mitigation: Extensive testing, add undo system, validate parameters

**Performance**
- Risk: Large levels + complex AI operations = slow
- Mitigation: Optimize rendering, debounce, show progress

**User Expectations**
- Risk: AI might not be as smart as hoped
- Mitigation: Clear documentation, set realistic expectations

---

## 🎉 Celebration Milestones

- ✅ **Phase 1 Complete**: First tooltip appears!
- ⭐ **Phase 2 Complete**: AI panel looks amazing!
- 🚀 **Phase 3 Complete**: AI responds to messages!
- 🎯 **Phase 4 Complete**: AI moves an object for the first time!
- 🔥 **Phase 5 Complete**: AI analyzes a level!
- ✨ **Phase 6 Complete**: Everything feels polished!
- 📚 **Phase 7 Complete**: Documentation is epic!
- 🌟 **Phase 8 Complete**: Best editor in the universe!

---

## 📞 Next Actions

**Immediate**:
1. ✅ Review this roadmap
2. ✅ Get user approval
3. 🔜 Start Phase 1: Universal Tooltips
4. ⏭️ One phase at a time, fully tested

**Ready to begin Phase 1?** 🚀

---

**Document Version**: 1.0  
**Last Updated**: December 11, 2025  
**Status**: Ready for Implementation  
**Commitment**: Fully robust, phase-by-phase, best product in the universe
