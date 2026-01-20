// ============================================================================
// MULTI-MODEL COMPARISON - Phase 11 Week 3
// Query multiple AI models simultaneously and compare responses
// ============================================================================

class MultiModelComparison {
    constructor() {
        this.isQuerying = false;
        this.currentResponses = [];
        this.selectedModels = [
            { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5' },
            { provider: 'openai', model: 'gpt-5.2', name: 'GPT-5.2' },
            { provider: 'google', model: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash' },
            { provider: 'xai', model: 'grok-4-latest', name: 'Grok 4' }
        ];
        
        // Initialize after DOM loads
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log('✅ Multi-Model Comparison initialized');
        this.bindEvents();
    }

    bindEvents() {
        // Listen for multi-model command trigger
        document.addEventListener('trigger-multi-model', (e) => {
            this.queryMultipleModels(e.detail.prompt);
        });
    }

    /**
     * Query multiple AI models simultaneously
     * @param {string} prompt - The question/prompt to send to all models
     * @returns {Promise<Object>} Results with responses, consensus, and metrics
     */
    async queryMultipleModels(prompt) {
        if (this.isQuerying) {
            console.log('⚠️ Multi-model query already in progress');
            return;
        }

        this.isQuerying = true;
        this.currentResponses = [];

        try {
            // Show comparison UI
            this.showComparisonUI();

            // Query all models in parallel
            const promises = this.selectedModels.map(model => 
                this.queryModel(model, prompt)
            );

            const results = await Promise.allSettled(promises);

            // Process results
            results.forEach((result, index) => {
                const model = this.selectedModels[index];
                if (result.status === 'fulfilled') {
                    this.currentResponses.push({
                        model: model.name,
                        provider: model.provider,
                        response: result.value.response,
                        time: result.value.time,
                        tokens: result.value.tokens,
                        cost: result.value.cost
                    });
                } else {
                    this.currentResponses.push({
                        model: model.name,
                        provider: model.provider,
                        response: `Error: ${result.reason.message || 'Unknown error'}`,
                        time: 0,
                        tokens: 0,
                        cost: 0,
                        error: true
                    });
                }
            });

            // Generate consensus
            const consensus = await this.generateConsensus(this.currentResponses, prompt);

            // Calculate aggregate metrics
            const metrics = this.calculateMetrics(this.currentResponses);

            // Display results
            this.displayResults(this.currentResponses, consensus, metrics);

            return {
                responses: this.currentResponses,
                consensus,
                metrics
            };

        } catch (error) {
            console.error('❌ Multi-model query error:', error);
            this.showError(error.message);
        } finally {
            this.isQuerying = false;
        }
    }

    /**
     * Query a single AI model
     * @param {Object} model - Model configuration
     * @param {string} prompt - The prompt to send
     * @returns {Promise<Object>} Response with time and tokens
     */
    async queryModel(model, prompt) {
        const startTime = Date.now();

        try {
            const response = await fetch('/api/multi-model', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: model.provider,
                    model: model.model,
                    prompt: prompt,
                    maxTokens: 2000
                })
            });

            if (!response.ok) {
                throw new Error(`${model.name} failed: ${response.statusText}`);
            }

            const data = await response.json();
            const endTime = Date.now();
            const time = (endTime - startTime) / 1000;

            return {
                response: data.response || data.text || 'No response',
                time: time,
                tokens: data.tokens || 0,
                cost: data.cost || 0
            };

        } catch (error) {
            const endTime = Date.now();
            const time = (endTime - startTime) / 1000;
            throw new Error(`${model.name} error after ${time.toFixed(2)}s: ${error.message}`);
        }
    }

    /**
     * Generate consensus summary from all responses
     * @param {Array} responses - All model responses
     * @param {string} originalPrompt - The original question
     * @returns {Promise<string>} Consensus summary
     */
    async generateConsensus(responses, originalPrompt) {
        // Filter out error responses
        const validResponses = responses.filter(r => !r.error);

        if (validResponses.length === 0) {
            return 'Unable to generate consensus - all models failed.';
        }

        // Use Claude to analyze and synthesize
        const synthesisPrompt = `You are analyzing responses from multiple AI models to the same question.

Original Question: "${originalPrompt}"

Model Responses:
${validResponses.map((r, i) => `
${i + 1}. ${r.model}:
${r.response}
`).join('\n---\n')}

Please provide:
1. **Key Agreement Points**: What do all/most models agree on?
2. **Notable Differences**: Where do models diverge in their answers?
3. **Synthesis**: A brief, balanced consensus answer that integrates the best insights from all responses (2-3 sentences).

Keep your analysis concise and focused.`;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: synthesisPrompt }],
                    provider: 'anthropic',
                    model: 'claude-sonnet-4-5-20250929',
                    maxTokens: 1000
                })
            });

            const data = await response.json();
            return data.response || 'Unable to generate consensus.';

        } catch (error) {
            console.error('Consensus generation error:', error);
            return 'Error generating consensus summary.';
        }
    }

    /**
     * Calculate aggregate performance metrics
     * @param {Array} responses - All model responses
     * @returns {Object} Aggregate metrics
     */
    calculateMetrics(responses) {
        const validResponses = responses.filter(r => !r.error);

        if (validResponses.length === 0) {
            return { avgTime: 0, totalTokens: 0, totalCost: 0, successRate: 0 };
        }

        const totalTime = validResponses.reduce((sum, r) => sum + r.time, 0);
        const totalTokens = validResponses.reduce((sum, r) => sum + r.tokens, 0);
        const totalCost = validResponses.reduce((sum, r) => sum + r.cost, 0);

        return {
            avgTime: totalTime / validResponses.length,
            fastestModel: validResponses.reduce((fastest, r) => 
                r.time < fastest.time ? r : fastest
            ),
            slowestModel: validResponses.reduce((slowest, r) => 
                r.time > slowest.time ? r : slowest
            ),
            totalTokens,
            totalCost,
            successRate: (validResponses.length / responses.length) * 100
        };
    }

    /**
     * Show comparison UI container
     */
    showComparisonUI() {
        const existingContainer = document.getElementById('multi-model-comparison');
        if (existingContainer) {
            existingContainer.style.display = 'block';
            existingContainer.innerHTML = `
                <div class="comparison-loading">
                    <div class="spinner"></div>
                    <p>Querying ${this.selectedModels.length} models in parallel...</p>
                </div>
            `;
        } else {
            // Create container if it doesn't exist
            const container = document.createElement('div');
            container.id = 'multi-model-comparison';
            container.className = 'multi-model-comparison';
            container.innerHTML = `
                <div class="comparison-loading">
                    <div class="spinner"></div>
                    <p>Querying ${this.selectedModels.length} models in parallel...</p>
                </div>
            `;
            
            // Insert into AI messages container
            const messagesContainer = document.querySelector('.ai-messages');
            if (messagesContainer) {
                messagesContainer.appendChild(container);
            }
        }
    }

    /**
     * Display comparison results
     * @param {Array} responses - All model responses
     * @param {string} consensus - Consensus summary
     * @param {Object} metrics - Performance metrics
     */
    displayResults(responses, consensus, metrics) {
        const container = document.getElementById('multi-model-comparison');
        if (!container) return;

        container.innerHTML = `
            <div class="comparison-header">
                <h3>🤖 Multi-Model Comparison</h3>
                <div class="comparison-metrics">
                    <span>⚡ Avg: ${metrics.avgTime.toFixed(2)}s</span>
                    <span>📊 ${metrics.successRate.toFixed(0)}% success</span>
                    <span>🎯 ${responses.length} models</span>
                </div>
            </div>

            <div class="consensus-panel">
                <h4>🤝 Consensus Summary</h4>
                <div class="consensus-content">${this.formatMarkdown(consensus)}</div>
            </div>

            <div class="model-responses-grid">
                ${responses.map(r => `
                    <div class="model-response ${r.error ? 'error' : ''}">
                        <div class="model-header">
                            <span class="model-name">${r.model}</span>
                            <div class="model-stats">
                                ${!r.error ? `
                                    <span>⚡ ${r.time.toFixed(2)}s</span>
                                    ${r.tokens > 0 ? `<span>📝 ${r.tokens} tokens</span>` : ''}
                                ` : '<span>❌ Error</span>'}
                            </div>
                        </div>
                        <div class="response-content">
                            ${this.formatMarkdown(r.response)}
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="comparison-footer">
                <button class="btn-secondary" onclick="window.multiModel.closeComparison()">
                    Close Comparison
                </button>
                <button class="btn-primary" onclick="window.multiModel.exportComparison()">
                    📥 Export Results
                </button>
            </div>
        `;
    }

    /**
     * Simple markdown formatter (basic support)
     * @param {string} text - Text to format
     * @returns {string} Formatted HTML
     */
    formatMarkdown(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^(.+)$/, '<p>$1</p>');
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        const container = document.getElementById('multi-model-comparison');
        if (container) {
            container.innerHTML = `
                <div class="comparison-error">
                    <h3>❌ Multi-Model Query Failed</h3>
                    <p>${message}</p>
                    <button onclick="window.multiModel.closeComparison()">Close</button>
                </div>
            `;
        }
    }

    /**
     * Close comparison UI
     */
    closeComparison() {
        const container = document.getElementById('multi-model-comparison');
        if (container) {
            container.style.display = 'none';
        }
    }

    /**
     * Export comparison results
     */
    exportComparison() {
        const exportData = {
            timestamp: new Date().toISOString(),
            responses: this.currentResponses,
            selectedModels: this.selectedModels
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `multi-model-comparison-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        console.log('✅ Comparison exported');
    }
}

// Initialize global instance
window.multiModel = new MultiModelComparison();
