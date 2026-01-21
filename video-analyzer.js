/**
 * Video Analyzer - Multi-Agent Video Analysis
 * 
 * Orchestrates multi-agent analysis of YouTube video transcripts
 * Generates multi-level summaries and expert perspectives
 */

export class VideoAnalyzer {
    constructor() {
        this.apiEndpoint = '/api/video-analyze';
    }

    /**
     * Analyze video with multi-agent system
     * @param {Object} videoData - Video metadata and transcript
     * @param {Array} selectedPersonas - Array of persona IDs to use (null = all)
     * @returns {Promise<Object>} Analysis results
     */
    async analyzeVideo(videoData, selectedPersonas = null) {
        const { videoId, title, author, transcript, duration } = videoData;

        // Prepare analysis request
        const request = {
            videoId,
            title,
            author,
            duration,
            // ✅ Handle both transcript-based AND direct video analysis
            transcript: transcript ? transcript.fullText : null,
            segments: transcript ? transcript.segments : null,
            selectedPersonas,
            requestedSummaries: ['tldr', 'abstract', 'detailed', 'timestamped'],
            // If no transcript, Gemini will watch video directly
            useVideoAnalysis: !transcript
        };

        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Analysis failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Video analysis error:', error);
            throw error;
        }
    }

    /**
     * Generate multi-level summaries locally (for quick preview)
     * @param {Object} transcript - Transcript data
     * @returns {Object} Summary levels
     */
    generateQuickSummary(transcript) {
        const text = transcript.fullText;
        const wordCount = transcript.wordCount;
        
        // TLDR: First sentence or first 100 characters
        const tldr = this.extractTLDR(text);
        
        // Abstract: First paragraph or first 150 words
        const abstract = this.extractAbstract(text, 150);
        
        // Key moments: Find segments with high information density
        const keyMoments = this.extractKeyMoments(transcript.segments);
        
        return {
            tldr,
            abstract,
            keyMoments,
            wordCount,
            estimatedReadingTime: Math.ceil(wordCount / 200) // 200 words per minute
        };
    }

    /**
     * Extract TLDR summary (one sentence)
     */
    extractTLDR(text) {
        // Get first sentence or first 100 characters
        const firstSentence = text.match(/^[^.!?]+[.!?]/);
        if (firstSentence) {
            return firstSentence[0].trim();
        }
        return text.substring(0, 100) + '...';
    }

    /**
     * Extract abstract summary
     */
    extractAbstract(text, maxWords = 150) {
        const words = text.split(/\s+/);
        if (words.length <= maxWords) {
            return text;
        }
        
        // Take first maxWords and try to end at sentence boundary
        let abstract = words.slice(0, maxWords).join(' ');
        const lastPunctuation = Math.max(
            abstract.lastIndexOf('.'),
            abstract.lastIndexOf('!'),
            abstract.lastIndexOf('?')
        );
        
        if (lastPunctuation > abstract.length * 0.7) {
            abstract = abstract.substring(0, lastPunctuation + 1);
        } else {
            abstract += '...';
        }
        
        return abstract;
    }

    /**
     * Extract key moments from transcript segments
     */
    extractKeyMoments(segments) {
        if (!segments || segments.length === 0) return [];
        
        // Simple heuristic: segments with longer text might be more important
        // In production, use NLP to detect topic changes, important keywords, etc.
        const avgLength = segments.reduce((sum, s) => sum + s.text.length, 0) / segments.length;
        
        const keyMoments = segments
            .filter(s => s.text.length > avgLength * 1.5) // 50% longer than average
            .slice(0, 10) // Max 10 key moments
            .map(segment => ({
                timestamp: segment.timestamp,
                time: segment.start,
                text: segment.text,
                duration: segment.duration
            }));
        
        return keyMoments;
    }

    /**
     * Search within transcript
     * @param {Object} transcript - Transcript data
     * @param {string} query - Search query
     * @returns {Array} Search results with context
     */
    searchTranscript(transcript, query) {
        if (!query || query.trim().length === 0) return [];
        
        const searchTerm = query.toLowerCase();
        const results = [];
        
        transcript.segments.forEach((segment, index) => {
            const text = segment.text.toLowerCase();
            if (text.includes(searchTerm)) {
                // Get context (previous and next segments)
                const contextBefore = index > 0 ? transcript.segments[index - 1].text : '';
                const contextAfter = index < transcript.segments.length - 1 
                    ? transcript.segments[index + 1].text : '';
                
                results.push({
                    segment,
                    timestamp: segment.timestamp,
                    time: segment.start,
                    text: segment.text,
                    contextBefore,
                    contextAfter,
                    highlightedText: this.highlightMatch(segment.text, query)
                });
            }
        });
        
        return results;
    }

    /**
     * Highlight search matches in text
     */
    highlightMatch(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    /**
     * Export analysis to Markdown
     * @param {Object} analysis - Full analysis results
     * @param {Object} videoData - Video metadata
     * @returns {string} Markdown formatted text
     */
    exportToMarkdown(analysis, videoData) {
        const { title, author, duration, videoId } = videoData;
        const { summaries, agentAnalyses } = analysis;
        
        let markdown = `# Video Analysis: ${title}\n\n`;
        markdown += `**Author**: ${author}\n`;
        markdown += `**Duration**: ${duration}\n`;
        markdown += `**Video ID**: ${videoId}\n`;
        markdown += `**URL**: https://www.youtube.com/watch?v=${videoId}\n\n`;
        
        markdown += `---\n\n`;
        
        // TLDR
        if (summaries.tldr) {
            markdown += `## 🎯 TLDR\n\n`;
            markdown += `${summaries.tldr}\n\n`;
        }
        
        // Abstract
        if (summaries.abstract) {
            markdown += `## 📝 Abstract\n\n`;
            markdown += `${summaries.abstract}\n\n`;
        }
        
        // Detailed Summary
        if (summaries.detailed) {
            markdown += `## 📊 Detailed Summary\n\n`;
            markdown += `${summaries.detailed}\n\n`;
        }
        
        // Key Moments
        if (summaries.keyMoments && summaries.keyMoments.length > 0) {
            markdown += `## ⏱️ Key Moments\n\n`;
            summaries.keyMoments.forEach(moment => {
                markdown += `### ${moment.timestamp}\n`;
                markdown += `${moment.description}\n\n`;
            });
        }
        
        // Agent Analyses
        if (agentAnalyses && agentAnalyses.length > 0) {
            markdown += `## 👥 Expert Perspectives\n\n`;
            agentAnalyses.forEach(agent => {
                markdown += `### ${agent.persona}\n\n`;
                markdown += `${agent.analysis}\n\n`;
            });
        }
        
        markdown += `---\n\n`;
        markdown += `*Generated by Universal Cognitive Amplification System (UCAS)*\n`;
        markdown += `*Analysis Date: ${new Date().toLocaleDateString()}*\n`;
        
        return markdown;
    }

    /**
     * Export transcript to SRT format
     * @param {Object} transcript - Transcript data
     * @returns {string} SRT formatted text
     */
    exportToSRT(transcript) {
        let srt = '';
        
        transcript.segments.forEach((segment, index) => {
            // SRT index (1-based)
            srt += `${index + 1}\n`;
            
            // Timestamps (HH:MM:SS,mmm --> HH:MM:SS,mmm)
            const startTime = this.formatSRTTime(segment.start);
            const endTime = this.formatSRTTime(segment.end);
            srt += `${startTime} --> ${endTime}\n`;
            
            // Text
            srt += `${segment.text}\n\n`;
        });
        
        return srt;
    }

    /**
     * Format time for SRT (HH:MM:SS,mmm)
     */
    formatSRTTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const millis = Math.floor((seconds % 1) * 1000);
        
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
    }

    /**
     * Download text as file
     * @param {string} content - File content
     * @param {string} filename - File name
     * @param {string} mimeType - MIME type
     */
    downloadAsFile(content, filename, mimeType = 'text/plain') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>} Success status
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Copy to clipboard failed:', error);
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            return success;
        }
    }
}
