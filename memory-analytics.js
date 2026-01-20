/**
 * Memory Analytics Dashboard
 * Phase 10 Week 4: Visualize memory patterns and insights
 * 
 * Features:
 * - Pie chart: Memory distribution by type
 * - Timeline: Memory creation over time
 * - Bar chart: Most common topics/tags
 * - Word cloud: Tag visualization
 * - Heatmap: Connection density
 * - Session stats: Usage patterns
 */

export class MemoryAnalytics {
    constructor(container) {
        this.container = container;
        this.data = null;
        console.log('🔍 MemoryAnalytics initialized');
    }

    /**
     * Fetch analytics data from backend
     */
    async fetchAnalyticsData(userId) {
        try {
            if (!userId) {
                throw new Error('User ID required for analytics');
            }

            const response = await fetch(`/api/memory-analytics?userId=${userId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`Analytics fetch failed: ${response.status}`);
            }

            this.data = await response.json();
            console.log('📊 Analytics data loaded:', this.data);
            return this.data;
        } catch (error) {
            console.error('❌ Failed to fetch analytics:', error);
            throw error;
        }
    }

    /**
     * Render the full analytics dashboard
     */
    async render() {
        try {
            if (!this.data) {
                throw new Error('No analytics data available. Call fetchAnalyticsData() first.');
            }

            this.container.innerHTML = `
                <div class="analytics-dashboard">
                    <!-- Header -->
                    <div class="analytics-header">
                        <h2>📊 Memory Analytics</h2>
                        <p>Insights into your knowledge base and usage patterns</p>
                    </div>

                    <!-- Quick Stats -->
                    <div class="stats-grid">
                        ${this.renderQuickStats()}
                    </div>

                    <!-- Charts Row 1: Distribution & Timeline -->
                    <div class="charts-row">
                        <div class="chart-card">
                            <h3>Memory Distribution by Type</h3>
                            <div id="type-pie-chart" class="chart-container"></div>
                        </div>
                        <div class="chart-card">
                            <h3>Memory Creation Timeline</h3>
                            <div id="timeline-chart" class="chart-container"></div>
                        </div>
                    </div>

                    <!-- Charts Row 2: Topics & Word Cloud -->
                    <div class="charts-row">
                        <div class="chart-card">
                            <h3>Top Topics & Tags</h3>
                            <div id="topics-bar-chart" class="chart-container"></div>
                        </div>
                        <div class="chart-card">
                            <h3>Tag Word Cloud</h3>
                            <div id="word-cloud" class="chart-container"></div>
                        </div>
                    </div>

                    <!-- Charts Row 3: Connections & Activity -->
                    <div class="charts-row">
                        <div class="chart-card">
                            <h3>Connection Density Heatmap</h3>
                            <div id="connection-heatmap" class="chart-container"></div>
                        </div>
                        <div class="chart-card">
                            <h3>Activity by Time of Day</h3>
                            <div id="activity-heatmap" class="chart-container"></div>
                        </div>
                    </div>
                </div>
            `;

            // Render each chart
            this.renderTypePieChart();
            this.renderTimelineChart();
            this.renderTopicsBarChart();
            this.renderWordCloud();
            this.renderConnectionHeatmap();
            this.renderActivityHeatmap();

        } catch (error) {
            this.container.innerHTML = `
                <div class="analytics-error">
                    <h3>❌ Analytics Error</h3>
                    <p>${error.message}</p>
                    <button onclick="window.memoryAnalytics.render()">Retry</button>
                </div>
            `;
        }
    }

    /**
     * Render quick stats cards
     */
    renderQuickStats() {
        if (!this.data) return '';

        const stats = [
            {
                icon: '💾',
                label: 'Total Memories',
                value: this.data.totalMemories || 0,
                color: '#4CAF50'
            },
            {
                icon: '🔗',
                label: 'Total Connections',
                value: this.data.totalConnections || 0,
                color: '#2196F3'
            },
            {
                icon: '🏷️',
                label: 'Unique Tags',
                value: this.data.uniqueTags || 0,
                color: '#FF9800'
            },
            {
                icon: '📅',
                label: 'Days Active',
                value: this.data.daysActive || 0,
                color: '#9C27B0'
            }
        ];

        return stats.map(stat => `
            <div class="stat-card" style="border-left: 4px solid ${stat.color};">
                <div class="stat-icon">${stat.icon}</div>
                <div class="stat-content">
                    <div class="stat-value">${stat.value}</div>
                    <div class="stat-label">${stat.label}</div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render pie chart showing memory distribution by type
     */
    renderTypePieChart() {
        const container = document.getElementById('type-pie-chart');
        if (!container || !this.data?.typeDistribution) return;

        // Create simple SVG pie chart
        const typeData = this.data.typeDistribution;
        const total = Object.values(typeData).reduce((a, b) => a + b, 0);
        
        if (total === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">No data available</p>';
            return;
        }
        
        let currentAngle = 0;

        const colors = {
            'research': '#2196F3',
            'video': '#F44336',
            'creative': '#9C27B0',
            'conversation': '#4CAF50',
            'manual': '#607D8B'
        };

        const slices = Object.entries(typeData).map(([type, count]) => {
            const percentage = (count / total) * 100;
            const angle = (count / total) * 360;
            const color = colors[type.toLowerCase()] || '#999';
            const slice = this.createPieSlice(currentAngle, angle, color);
            currentAngle += angle;
            return { type, count, percentage, slice, color };
        });

        container.innerHTML = `
            <svg viewBox="0 0 200 200" class="pie-chart">
                ${slices.map(s => s.slice).join('')}
            </svg>
            <div class="pie-legend">
                ${slices.map(s => `
                    <div class="legend-item">
                        <span class="legend-color" style="background: ${s.color}"></span>
                        <span class="legend-label">${s.type}: ${s.count} (${s.percentage.toFixed(1)}%)</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Create SVG path for pie slice
     */
    createPieSlice(startAngle, angle, color) {
        const radius = 80;
        const cx = 100;
        const cy = 100;

        const startRad = (startAngle - 90) * Math.PI / 180;
        const endRad = (startAngle + angle - 90) * Math.PI / 180;

        const x1 = cx + radius * Math.cos(startRad);
        const y1 = cy + radius * Math.sin(startRad);
        const x2 = cx + radius * Math.cos(endRad);
        const y2 = cy + radius * Math.sin(endRad);

        const largeArc = angle > 180 ? 1 : 0;

        return `
            <path d="M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z"
                  fill="${color}" stroke="#1e1e1e" stroke-width="2" opacity="0.9">
            </path>
        `;
    }

    /**
     * Render timeline chart showing memory creation over time
     */
    renderTimelineChart() {
        const container = document.getElementById('timeline-chart');
        if (!container || !this.data?.timeline) return;

        const timeline = this.data.timeline;
        const maxCount = Math.max(...timeline.map(d => d.count));

        container.innerHTML = `
            <div class="timeline-chart">
                ${timeline.map((d, i) => {
                    const height = (d.count / maxCount) * 100;
                    return `
                        <div class="timeline-bar" style="height: ${height}%;" title="${d.date}: ${d.count} memories">
                            <div class="bar-label">${d.count}</div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="timeline-labels">
                ${timeline.map((d, i) => i % 2 === 0 ? `<span>${d.date}</span>` : '').join('')}
            </div>
        `;
    }

    /**
     * Render bar chart showing most common topics/tags
     */
    renderTopicsBarChart() {
        const container = document.getElementById('topics-bar-chart');
        if (!container || !this.data?.topTopics) return;

        const maxCount = Math.max(...this.data.topTopics.map(t => t.count));

        container.innerHTML = `
            <div class="bar-chart">
                ${this.data.topTopics.slice(0, 10).map(topic => {
                    const width = (topic.count / maxCount) * 100;
                    return `
                        <div class="bar-item">
                            <div class="bar-label">${topic.tag}</div>
                            <div class="bar-container">
                                <div class="bar-fill" style="width: ${width}%"></div>
                                <span class="bar-count">${topic.count}</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    /**
     * Render word cloud of tags
     */
    renderWordCloud() {
        const container = document.getElementById('word-cloud');
        if (!container || !this.data?.topTopics) return;

        const maxCount = Math.max(...this.data.topTopics.map(t => t.count));

        container.innerHTML = `
            <div class="word-cloud">
                ${this.data.topTopics.map(topic => {
                    const size = 12 + (topic.count / maxCount) * 24; // 12px to 36px
                    const opacity = 0.5 + (topic.count / maxCount) * 0.5;
                    return `
                        <span class="word-cloud-item" 
                              style="font-size: ${size}px; opacity: ${opacity};"
                              title="${topic.count} memories">
                            ${topic.tag}
                        </span>
                    `;
                }).join('')}
            </div>
        `;
    }

    /**
     * Render connection density heatmap
     */
    renderConnectionHeatmap() {
        const container = document.getElementById('connection-heatmap');
        if (!container || !this.data?.connectionMatrix) return;

        // Create 10x10 grid showing which memory types connect most
        const matrix = this.data.connectionMatrix;
        const types = ['Research', 'Video', 'Creative', 'Conversation', 'Manual'];

        container.innerHTML = `
            <div class="heatmap">
                <div class="heatmap-grid">
                    ${types.map(rowType => `
                        <div class="heatmap-row">
                            ${types.map(colType => {
                                const key = `${rowType}-${colType}`;
                                const value = matrix[key] || 0;
                                const maxValue = Math.max(...Object.values(matrix));
                                const intensity = value / maxValue;
                                const color = `rgba(33, 150, 243, ${intensity})`;
                                return `
                                    <div class="heatmap-cell" 
                                         style="background: ${color};"
                                         title="${rowType} ↔ ${colType}: ${value} connections">
                                        ${value > 0 ? value : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `).join('')}
                </div>
                <div class="heatmap-labels">
                    <div class="labels-vertical">
                        ${types.map(t => `<span>${t}</span>`).join('')}
                    </div>
                    <div class="labels-horizontal">
                        ${types.map(t => `<span>${t}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render activity heatmap (time of day)
     */
    renderActivityHeatmap() {
        const container = document.getElementById('activity-heatmap');
        if (!container || !this.data?.activityByHour) return;

        const hours = Array.from({ length: 24 }, (_, i) => i);
        const maxActivity = Math.max(...this.data.activityByHour);

        container.innerHTML = `
            <div class="activity-heatmap">
                ${hours.map(hour => {
                    const activity = this.data.activityByHour[hour] || 0;
                    const height = (activity / maxActivity) * 100;
                    const time = hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour-12}pm`;
                    return `
                        <div class="activity-bar" style="height: ${height}%;" title="${time}: ${activity} interactions">
                            <div class="activity-label">${time}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
}

// Make globally available
window.MemoryAnalytics = MemoryAnalytics;
