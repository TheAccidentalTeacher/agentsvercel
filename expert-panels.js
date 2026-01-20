// ============================================================================
// EXPERT PANELS - Phase 11 Week 4
// Create and manage custom AI expert panels with deliberation
// ============================================================================

class ExpertPanels {
    constructor() {
        this.panels = this.loadPanels();
        this.currentPanel = null;
        this.isDeliberating = false;
        
        // Pre-configured expert personas
        this.expertPersonas = {
            legal: {
                name: 'Legal Expert',
                icon: '⚖️',
                systemPrompt: 'You are a senior attorney with 20+ years of experience in corporate law, contracts, and legal compliance. Provide thorough legal analysis, cite relevant precedents, and always consider risk mitigation. Be precise with legal terminology.'
            },
            medical: {
                name: 'Medical Professional',
                icon: '⚕️',
                systemPrompt: 'You are a board-certified physician with expertise in internal medicine and patient care. Provide evidence-based medical advice, consider differential diagnoses, and prioritize patient safety. Use clear medical terminology.'
            },
            educator: {
                name: 'Education Specialist',
                icon: '🎓',
                systemPrompt: 'You are an experienced educator with expertise in curriculum design, pedagogy, and student learning. Focus on effective teaching strategies, learning outcomes, and inclusive education practices.'
            },
            engineer: {
                name: 'Software Engineer',
                icon: '💻',
                systemPrompt: 'You are a senior software engineer with deep expertise in system architecture, algorithms, and best practices. Focus on scalability, maintainability, security, and performance. Provide code examples when helpful.'
            },
            business: {
                name: 'Business Strategist',
                icon: '📊',
                systemPrompt: 'You are a business strategy consultant with MBA-level expertise. Analyze market opportunities, competitive positioning, ROI, and risk-reward tradeoffs. Focus on actionable business insights.'
            },
            scientist: {
                name: 'Research Scientist',
                icon: '🔬',
                systemPrompt: 'You are a research scientist with expertise in experimental design, data analysis, and scientific methodology. Focus on evidence, statistical rigor, reproducibility, and peer-reviewed best practices.'
            },
            writer: {
                name: 'Creative Writer',
                icon: '✍️',
                systemPrompt: 'You are an accomplished writer and editor with expertise in narrative structure, style, and compelling communication. Focus on clarity, engagement, and authentic voice.'
            },
            financial: {
                name: 'Financial Advisor',
                icon: '💰',
                systemPrompt: 'You are a certified financial advisor with expertise in investment strategy, risk management, and financial planning. Provide prudent financial analysis with attention to diversification and long-term goals.'
            },
            psychologist: {
                name: 'Psychologist',
                icon: '🧠',
                systemPrompt: 'You are a licensed clinical psychologist with expertise in human behavior, cognition, and mental health. Focus on evidence-based psychological principles, empathy, and holistic well-being.'
            },
            ethicist: {
                name: 'Ethics Advisor',
                icon: '🤔',
                systemPrompt: 'You are an ethics philosopher specializing in applied ethics, moral reasoning, and ethical frameworks. Analyze situations through multiple ethical lenses (utilitarian, deontological, virtue ethics) and consider stakeholder impacts.'
            }
        };
        
        // Initialize after DOM loads
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log('✅ Expert Panels initialized');
        this.bindEvents();
    }

    bindEvents() {
        // Listen for panel creation trigger
        document.addEventListener('create-expert-panel', (e) => {
            this.showPanelBuilder();
        });

        // Listen for panel convene trigger
        document.addEventListener('convene-panel', (e) => {
            this.convenePanel(e.detail.panelId, e.detail.question);
        });
    }

    /**
     * Show panel builder UI
     */
    showPanelBuilder() {
        const modal = document.createElement('div');
        modal.id = 'panel-builder-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content panel-builder-modal">
                <div class="modal-header">
                    <h2>🎭 Create Expert Panel</h2>
                    <button class="close-btn" onclick="window.expertPanels.closePanelBuilder()">×</button>
                </div>
                
                <div class="modal-body">
                    <div class="panel-name-input">
                        <label>Panel Name</label>
                        <input type="text" id="panel-name" placeholder="e.g., Healthcare Advisory Board" />
                    </div>

                    <div class="expert-selection">
                        <h3>Select Experts (3-10)</h3>
                        <div class="expert-grid">
                            ${Object.entries(this.expertPersonas).map(([id, expert]) => `
                                <div class="expert-card" data-expert-id="${id}">
                                    <input type="checkbox" id="expert-${id}" class="expert-checkbox" />
                                    <label for="expert-${id}" class="expert-label">
                                        <span class="expert-icon">${expert.icon}</span>
                                        <span class="expert-name">${expert.name}</span>
                                    </label>
                                    <select class="model-select" data-expert-id="${id}">
                                        <option value="anthropic:claude-sonnet-4-5-20250929">Claude Sonnet 4.5</option>
                                        <option value="openai:gpt-5.2">GPT-5.2</option>
                                        <option value="google:gemini-2.0-flash-exp">Gemini 2.0</option>
                                        <option value="xai:grok-4-latest">Grok 4</option>
                                    </select>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="panel-settings">
                        <label>
                            <input type="checkbox" id="enable-deliberation" checked />
                            Enable panel deliberation (experts discuss and debate)
                        </label>
                        <label>
                            <input type="checkbox" id="generate-report" checked />
                            Generate comprehensive panel report
                        </label>
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="btn-secondary" onclick="window.expertPanels.closePanelBuilder()">
                        Cancel
                    </button>
                    <button class="btn-primary" onclick="window.expertPanels.createPanel()">
                        Create Panel
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    /**
     * Create a new expert panel
     */
    createPanel() {
        const panelName = document.getElementById('panel-name').value.trim();
        if (!panelName) {
            alert('Please enter a panel name');
            return;
        }

        const selectedExperts = [];
        document.querySelectorAll('.expert-checkbox:checked').forEach(checkbox => {
            const expertId = checkbox.id.replace('expert-', '');
            const modelSelect = document.querySelector(`.model-select[data-expert-id="${expertId}"]`);
            const [provider, model] = modelSelect.value.split(':');
            
            selectedExperts.push({
                id: expertId,
                ...this.expertPersonas[expertId],
                provider,
                model
            });
        });

        if (selectedExperts.length < 3 || selectedExperts.length > 10) {
            alert('Please select 3-10 experts for the panel');
            return;
        }

        const panel = {
            id: `panel_${Date.now()}`,
            name: panelName,
            experts: selectedExperts,
            enableDeliberation: document.getElementById('enable-deliberation').checked,
            generateReport: document.getElementById('generate-report').checked,
            createdAt: new Date().toISOString()
        };

        this.panels.push(panel);
        this.savePanels();
        this.closePanelBuilder();

        console.log('✅ Panel created:', panel.name);
        alert(`Panel "${panelName}" created with ${selectedExperts.length} experts!`);
    }

    /**
     * Convene panel to answer a question
     * @param {string} panelId - Panel ID
     * @param {string} question - Question for the panel
     */
    async convenePanel(panelId, question) {
        if (this.isDeliberating) {
            console.log('⚠️ Panel already in session');
            return;
        }

        const panel = this.panels.find(p => p.id === panelId);
        if (!panel) {
            console.error('Panel not found:', panelId);
            return;
        }

        this.isDeliberating = true;
        this.currentPanel = panel;

        try {
            // Show panel session UI
            this.showPanelSession(panel, question);

            // Step 1: Get individual expert opinions
            const expertOpinions = await this.gatherExpertOpinions(panel, question);

            // Step 2: Facilitate deliberation (if enabled)
            let deliberation = null;
            if (panel.enableDeliberation) {
                deliberation = await this.facilitateDeliberation(panel, question, expertOpinions);
            }

            // Step 3: Vote on conclusion
            const consensus = await this.voteOnConclusion(panel, question, expertOpinions, deliberation);

            // Step 4: Generate panel report (if enabled)
            let report = null;
            if (panel.generateReport) {
                report = await this.generatePanelReport(panel, question, expertOpinions, deliberation, consensus);
            }

            // Display final results
            this.displayPanelResults(panel, question, expertOpinions, deliberation, consensus, report);

        } catch (error) {
            console.error('❌ Panel session error:', error);
            this.showPanelError(error.message);
        } finally {
            this.isDeliberating = false;
        }
    }

    /**
     * Gather opinions from all experts
     * @param {Object} panel - Panel configuration
     * @param {string} question - Question to answer
     * @returns {Promise<Array>} Expert opinions
     */
    async gatherExpertOpinions(panel, question) {
        this.updateSessionStatus('Gathering expert opinions...');

        const promises = panel.experts.map(expert => 
            this.queryExpert(expert, question)
        );

        const results = await Promise.allSettled(promises);

        return results.map((result, index) => {
            const expert = panel.experts[index];
            if (result.status === 'fulfilled') {
                return {
                    expert: expert.name,
                    icon: expert.icon,
                    opinion: result.value.response,
                    time: result.value.time
                };
            } else {
                return {
                    expert: expert.name,
                    icon: expert.icon,
                    opinion: `Error: ${result.reason.message}`,
                    error: true
                };
            }
        });
    }

    /**
     * Query a single expert
     * @param {Object} expert - Expert configuration
     * @param {string} question - Question to answer
     * @returns {Promise<Object>} Expert response
     */
    async queryExpert(expert, question) {
        const startTime = Date.now();

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: expert.systemPrompt },
                    { role: 'user', content: question }
                ],
                provider: expert.provider,
                model: expert.model,
                maxTokens: 1500
            })
        });

        if (!response.ok) {
            throw new Error(`${expert.name} query failed`);
        }

        const data = await response.json();
        const endTime = Date.now();

        return {
            response: data.response || 'No response',
            time: (endTime - startTime) / 1000
        };
    }

    /**
     * Facilitate panel deliberation
     * @param {Object} panel - Panel configuration
     * @param {string} question - Original question
     * @param {Array} opinions - Expert opinions
     * @returns {Promise<string>} Deliberation summary
     */
    async facilitateDeliberation(panel, question, opinions) {
        this.updateSessionStatus('Facilitating panel deliberation...');

        const validOpinions = opinions.filter(o => !o.error);

        const deliberationPrompt = `You are facilitating a panel discussion between experts.

Question: "${question}"

Expert Panel Members and Their Initial Opinions:
${validOpinions.map(o => `
${o.icon} ${o.expert}:
${o.opinion}
`).join('\n---\n')}

As the facilitator:
1. Identify key areas of agreement and disagreement
2. Highlight complementary insights from different perspectives
3. Note any concerns or cautions raised by experts
4. Synthesize a balanced discussion summary (3-4 paragraphs)

Keep the deliberation focused and professional.`;

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: deliberationPrompt }],
                provider: 'anthropic',
                model: 'claude-sonnet-4-5-20250929',
                maxTokens: 2000
            })
        });

        const data = await response.json();
        return data.response || 'Unable to generate deliberation.';
    }

    /**
     * Vote on final conclusion
     * @param {Object} panel - Panel configuration
     * @param {string} question - Original question
     * @param {Array} opinions - Expert opinions
     * @param {string} deliberation - Deliberation summary
     * @returns {Promise<string>} Consensus conclusion
     */
    async voteOnConclusion(panel, question, opinions, deliberation) {
        this.updateSessionStatus('Panel voting on conclusion...');

        const votingPrompt = `Based on the expert panel discussion, provide a final consensus conclusion.

Question: "${question}"

${deliberation ? `Panel Deliberation:\n${deliberation}\n\n` : ''}

Expert Opinions Summary:
${opinions.filter(o => !o.error).map(o => `- ${o.expert}: ${o.opinion.substring(0, 200)}...`).join('\n')}

Provide a concise, actionable consensus that represents the panel's collective wisdom (2-3 paragraphs).`;

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: votingPrompt }],
                provider: 'anthropic',
                model: 'claude-opus-4-5-20251101',
                maxTokens: 1500
            })
        });

        const data = await response.json();
        return data.response || 'Unable to generate consensus.';
    }

    /**
     * Generate comprehensive panel report
     * @param {Object} panel - Panel configuration
     * @param {string} question - Original question
     * @param {Array} opinions - Expert opinions
     * @param {string} deliberation - Deliberation summary
     * @param {string} consensus - Consensus conclusion
     * @returns {Promise<string>} Full panel report
     */
    async generatePanelReport(panel, question, opinions, deliberation, consensus) {
        this.updateSessionStatus('Generating panel report...');

        return `
# Expert Panel Report: ${panel.name}

**Date:** ${new Date().toLocaleDateString()}
**Panel Members:** ${panel.experts.map(e => `${e.icon} ${e.name}`).join(', ')}

## Question
${question}

## Expert Opinions

${opinions.map(o => `
### ${o.icon} ${o.expert}
${o.opinion}
${o.time ? `*Response time: ${o.time.toFixed(2)}s*` : ''}
`).join('\n')}

${deliberation ? `
## Panel Deliberation
${deliberation}
` : ''}

## Consensus Conclusion
${consensus}

---
*This report was generated by an AI expert panel and should be used as advisory input, not as definitive guidance. Always consult qualified professionals for important decisions.*
`;
    }

    /**
     * Show panel session UI
     * @param {Object} panel - Panel configuration
     * @param {string} question - Question being answered
     */
    showPanelSession(panel, question) {
        const container = document.getElementById('expert-panel-session') || this.createSessionContainer();

        container.style.display = 'block';
        container.innerHTML = `
            <div class="panel-session-header">
                <h3>🎭 ${panel.name}</h3>
                <p class="session-question">"${question}"</p>
                <div class="session-status">Initializing panel session...</div>
            </div>
            <div class="panel-progress">
                <div class="progress-bar"></div>
            </div>
            <div class="panel-session-content">
                <p>Convening ${panel.experts.length} experts...</p>
            </div>
        `;
    }

    /**
     * Create session container if doesn't exist
     */
    createSessionContainer() {
        const container = document.createElement('div');
        container.id = 'expert-panel-session';
        container.className = 'expert-panel-session';
        
        const messagesContainer = document.querySelector('.ai-messages');
        if (messagesContainer) {
            messagesContainer.appendChild(container);
        }
        
        return container;
    }

    /**
     * Update session status message
     * @param {string} status - Status message
     */
    updateSessionStatus(status) {
        const statusEl = document.querySelector('.session-status');
        if (statusEl) {
            statusEl.textContent = status;
        }
    }

    /**
     * Display final panel results
     */
    displayPanelResults(panel, question, opinions, deliberation, consensus, report) {
        const container = document.getElementById('expert-panel-session');
        if (!container) return;

        container.innerHTML = `
            <div class="panel-results">
                <div class="panel-results-header">
                    <h3>🎭 ${panel.name} - Final Report</h3>
                    <button class="btn-export" onclick="window.expertPanels.exportPanelReport()">
                        📥 Export Report
                    </button>
                </div>

                <div class="consensus-section">
                    <h4>📋 Consensus Conclusion</h4>
                    <div class="consensus-text">${this.formatText(consensus)}</div>
                </div>

                ${deliberation ? `
                    <div class="deliberation-section">
                        <h4>💬 Panel Deliberation</h4>
                        <div class="deliberation-text">${this.formatText(deliberation)}</div>
                    </div>
                ` : ''}

                <div class="expert-opinions-section">
                    <h4>👥 Individual Expert Opinions</h4>
                    ${opinions.map(o => `
                        <div class="expert-opinion-card ${o.error ? 'error' : ''}">
                            <div class="expert-opinion-header">
                                <span class="expert-icon-large">${o.icon}</span>
                                <span class="expert-name-large">${o.expert}</span>
                            </div>
                            <div class="expert-opinion-content">
                                ${this.formatText(o.opinion)}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="panel-footer">
                    <button class="btn-secondary" onclick="window.expertPanels.closeSession()">
                        Close Session
                    </button>
                </div>
            </div>
        `;

        // Store report for export
        this.lastReport = report;
    }

    /**
     * Format text with basic markdown support
     */
    formatText(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^(.+)$/, '<p>$1</p>');
    }

    /**
     * Show panel error
     */
    showPanelError(message) {
        const container = document.getElementById('expert-panel-session');
        if (container) {
            container.innerHTML = `
                <div class="panel-error">
                    <h3>❌ Panel Session Error</h3>
                    <p>${message}</p>
                    <button onclick="window.expertPanels.closeSession()">Close</button>
                </div>
            `;
        }
    }

    /**
     * Export panel report
     */
    exportPanelReport() {
        if (!this.lastReport) {
            alert('No report to export');
            return;
        }

        const blob = new Blob([this.lastReport], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expert-panel-report-${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);

        console.log('✅ Panel report exported');
    }

    /**
     * Close panel builder
     */
    closePanelBuilder() {
        const modal = document.getElementById('panel-builder-modal');
        if (modal) {
            modal.remove();
        }
    }

    /**
     * Close panel session
     */
    closeSession() {
        const container = document.getElementById('expert-panel-session');
        if (container) {
            container.style.display = 'none';
        }
    }

    /**
     * Load saved panels from localStorage
     */
    loadPanels() {
        try {
            const saved = localStorage.getItem('expert_panels');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading panels:', error);
            return [];
        }
    }

    /**
     * Save panels to localStorage
     */
    savePanels() {
        try {
            localStorage.setItem('expert_panels', JSON.stringify(this.panels));
        } catch (error) {
            console.error('Error saving panels:', error);
        }
    }
}

// Initialize global instance
window.expertPanels = new ExpertPanels();
