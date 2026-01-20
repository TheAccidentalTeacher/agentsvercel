/**
 * Video Batch Operations UI
 * Multi-select videos for batch operations
 */

import { videoHistory } from './video-history-manager.js';

export class VideoBatchUI {
    constructor(container) {
        this.container = container;
        this.history = [];
        this.selectedVideos = new Set();
    }

    async render() {
        if (!this.container) return;
        
        this.history = videoHistory.getRecentVideos(); // Fixed: Use correct method name
        
        if (this.history.length === 0) {
            this.container.innerHTML = `
                <div style="text-align: center; padding: 60px; color: #999;">
                    <div style="font-size: 64px; margin-bottom: 20px;">📦</div>
                    <h3 style="color: #61dafb;">No Videos in History</h3>
                    <p>Load some videos first to use batch operations</p>
                </div>
            `;
            return;
        }
        
        const html = this.history.map(v => this.renderVideoCard(v)).join('');
        this.container.innerHTML = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">${html}</div>`;
        
        this.attachEventListeners();
        this.updateSelectedCount();
    }

    renderVideoCard(video) {
        const videoId = video.videoId || video.video_id;
        const title = video.title || 'Unknown';
        const channel = video.channelName || video.channel_name || 'Unknown';
        const thumbnail = video.thumbnail || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
        const isSelected = this.selectedVideos.has(videoId);
        
        return `
            <div class="batch-video-card ${isSelected ? 'selected' : ''}" data-video-id="${videoId}" style="background: rgba(255,255,255,0.03); border: 2px solid ${isSelected ? '#61dafb' : 'rgba(255,255,255,0.1)'}; border-radius: 12px; overflow: hidden; cursor: pointer; transition: all 0.2s; position: relative;">
                <div style="position: relative;">
                    <img src="${thumbnail}" style="width: 100%; aspect-ratio: 16/9; object-fit: cover; opacity: ${isSelected ? '0.7' : '1'};" />
                    <div class="batch-checkbox" style="position: absolute; top: 8px; left: 8px; width: 24px; height: 24px; border-radius: 6px; background: ${isSelected ? '#61dafb' : 'rgba(0,0,0,0.7)'}; border: 2px solid ${isSelected ? '#61dafb' : '#fff'}; display: flex; align-items: center; justify-content: center; font-size: 16px; color: #000;">
                        ${isSelected ? '✓' : ''}
                    </div>
                </div>
                <div style="padding: 12px;">
                    <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #fff; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${title}</h4>
                    <p style="margin: 0; font-size: 12px; color: #999;">${channel}</p>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Video card click to toggle selection
        document.querySelectorAll('.batch-video-card').forEach(card => {
            card.addEventListener('click', () => {
                const videoId = card.dataset.videoId;
                this.toggleSelection(videoId);
            });
        });
        
        // Select all
        const selectAllBtn = document.getElementById('batch-select-all');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                this.history.forEach(v => this.selectedVideos.add(v.videoId || v.video_id));
                this.render();
            });
        }
        
        // Deselect all
        const deselectAllBtn = document.getElementById('batch-deselect-all');
        if (deselectAllBtn) {
            deselectAllBtn.addEventListener('click', () => {
                this.selectedVideos.clear();
                this.render();
            });
        }
        
        // Batch action buttons
        document.querySelectorAll('.batch-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.executeBatchAction(action);
            });
        });
    }

    toggleSelection(videoId) {
        if (this.selectedVideos.has(videoId)) {
            this.selectedVideos.delete(videoId);
        } else {
            this.selectedVideos.add(videoId);
        }
        this.render();
    }

    updateSelectedCount() {
        const countEl = document.getElementById('batch-selected-count');
        if (countEl) {
            const count = this.selectedVideos.size;
            countEl.textContent = `${count} selected`;
        }
        
        // Enable/disable batch action buttons
        const buttons = document.querySelectorAll('.batch-action-btn');
        const enabled = this.selectedVideos.size >= 2;
        
        buttons.forEach(btn => {
            btn.disabled = !enabled;
            if (enabled) {
                btn.style.cursor = 'pointer';
                btn.style.color = '#61dafb';
                btn.style.background = 'rgba(97, 218, 251, 0.2)';
                btn.style.borderColor = '#61dafb';
            } else {
                btn.style.cursor = 'not-allowed';
                btn.style.color = 'rgba(97, 218, 251, 0.5)';
                btn.style.background = 'rgba(97, 218, 251, 0.1)';
                btn.style.borderColor = 'rgba(97, 218, 251, 0.3)';
            }
        });
    }

    async executeBatchAction(action) {
        if (this.selectedVideos.size < 2) {
            alert('Please select at least 2 videos');
            return;
        }
        
        // Get selected video data
        const selectedVideos = this.history.filter(v => 
            this.selectedVideos.has(v.videoId || v.video_id)
        );
        
        // Show loading
        this.showBatchLoading(action);
        
        try {
            let result;
            
            if (action === 'weekly-summary') {
                result = await this.generateWeeklySummary(selectedVideos);
            } else if (action === 'combined-quiz') {
                result = await this.generateCombinedQuiz(selectedVideos);
            } else if (action === 'master-vocabulary') {
                result = await this.generateMasterVocabulary(selectedVideos);
            } else if (action === 'unit-study-guide') {
                result = await this.generateUnitStudyGuide(selectedVideos);
            }
            
            this.showBatchOutput(action, result);
        } catch (error) {
            console.error('Batch operation error:', error);
            alert('Error: ' + error.message);
        }
    }

    showBatchLoading(action) {
        const titles = {
            'weekly-summary': '📊 Generating Weekly Summary',
            'combined-quiz': '📝 Generating Combined Quiz',
            'master-vocabulary': '📖 Generating Master Vocabulary',
            'unit-study-guide': '📚 Generating Unit Study Guide'
        };
        
        const modal = document.getElementById('batch-output-modal');
        const title = document.getElementById('batch-output-title');
        const content = document.getElementById('batch-output-content');
        
        if (modal && title && content) {
            title.textContent = titles[action] || 'Generating...';
            content.innerHTML = `
                <div style="text-align: center; padding: 60px;">
                    <div style="font-size: 64px; margin-bottom: 20px;">⏳</div>
                    <h3 style="color: #61dafb; margin-bottom: 10px;">Processing ${this.selectedVideos.size} videos...</h3>
                    <p style="color: #999;">This may take 60-90 seconds</p>
                    <div style="margin-top: 30px;">
                        <div style="width: 200px; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin: 0 auto; overflow: hidden;">
                            <div style="width: 100%; height: 100%; background: linear-gradient(90deg, #61dafb, #3b82f6); animation: loading 2s ease-in-out infinite;"></div>
                        </div>
                    </div>
                </div>
                <style>
                    @keyframes loading {
                        0% { transform: translateX(-100%); }
                        50% { transform: translateX(100%); }
                        100% { transform: translateX(-100%); }
                    }
                </style>
            `;
            modal.style.display = 'block';
        }
    }

    showBatchOutput(action, result) {
        const titles = {
            'weekly-summary': '📊 Weekly Summary',
            'combined-quiz': '📝 Combined Quiz',
            'master-vocabulary': '📖 Master Vocabulary List',
            'unit-study-guide': '📚 Unit Study Guide'
        };
        
        const modal = document.getElementById('batch-output-modal');
        const title = document.getElementById('batch-output-title');
        const content = document.getElementById('batch-output-content');
        
        if (modal && title && content) {
            title.textContent = titles[action] || 'Result';
            
            // Convert markdown to HTML
            const html = this.markdownToHTML(result);
            content.innerHTML = html;
            
            modal.style.display = 'block';
            
            // Wire up buttons
            document.getElementById('batch-close-btn').onclick = () => {
                modal.style.display = 'none';
            };
            
            document.getElementById('batch-copy-btn').onclick = () => {
                navigator.clipboard.writeText(result);
                alert('Copied to clipboard!');
            };
            
            document.getElementById('batch-export-btn').onclick = () => {
                const blob = new Blob([result], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${action}-${Date.now()}.md`;
                a.click();
                URL.revokeObjectURL(url);
            };
        }
    }

    async generateWeeklySummary(videos) {
        const response = await fetch('/api/video-batch-summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videos })
        });
        
        if (!response.ok) {
            throw new Error('Failed to generate weekly summary');
        }
        
        const data = await response.json();
        return data.summary;
    }

    async generateCombinedQuiz(videos) {
        const response = await fetch('/api/video-batch-quiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videos })
        });
        
        if (!response.ok) {
            throw new Error('Failed to generate combined quiz');
        }
        
        const data = await response.json();
        return data.quiz;
    }

    async generateMasterVocabulary(videos) {
        const response = await fetch('/api/video-batch-vocabulary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videos })
        });
        
        if (!response.ok) {
            throw new Error('Failed to generate master vocabulary');
        }
        
        const data = await response.json();
        return data.vocabulary;
    }

    async generateUnitStudyGuide(videos) {
        const response = await fetch('/api/video-batch-study-guide', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videos })
        });
        
        if (!response.ok) {
            throw new Error('Failed to generate unit study guide');
        }
        
        const data = await response.json();
        return data.studyGuide;
    }

    markdownToHTML(markdown) {
        let html = markdown;
        
        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3 style="color: #61dafb; margin: 24px 0 12px 0; font-size: 18px;">$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2 style="color: #61dafb; margin: 30px 0 16px 0; font-size: 22px;">$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1 style="color: #61dafb; margin: 36px 0 20px 0; font-size: 28px;">$1</h1>');
        
        // Bold
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #fff;">$1</strong>');
        
        // Lists
        html = html.replace(/^\- (.*$)/gim, '<li style="margin-bottom: 8px;">$1</li>');
        html = html.replace(/(<li.*<\/li>)/s, '<ul style="margin: 12px 0; padding-left: 24px;">$1</ul>');
        
        // Paragraphs
        html = html.split('\n\n').map(p => {
            if (!p.startsWith('<') && p.trim()) {
                return `<p style="margin: 12px 0; line-height: 1.8;">${p}</p>`;
            }
            return p;
        }).join('\n');
        
        return html;
    }
}
