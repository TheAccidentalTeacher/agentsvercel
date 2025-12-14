/**
 * AgentMemory - Persistent memory system for AI personas
 * 
 * Each persona maintains:
 * - Short-term memory: Last N interactions (raw conversation history)
 * - Long-term memory: Extracted insights, patterns, user preferences
 * 
 * Storage: Browser localStorage (can be migrated to backend later)
 * 
 * @version 1.0.0
 * @date 2025-12-12
 */

class AgentMemory {
    constructor(personaName = 'default') {
        this.personaName = personaName;
        this.shortTermLimit = 20; // Keep last 20 interactions
        this.storageKey = 'agentMemories';
        this.memory = this.load();
        
        console.log(`🧠 [AgentMemory] Initialized for persona: ${personaName}`);
        console.log(`🧠 [AgentMemory] Current interactions: ${this.memory.shortTerm.length}`);
    }

    /**
     * Initialize empty memory structure
     */
    initializeMemory() {
        return {
            shortTerm: [],
            longTerm: {
                userProfile: {
                    preferences: [],
                    technicalLevel: null,
                    learningStyle: null
                },
                projectContext: {
                    gameType: null,
                    keyFeatures: [],
                    challenges: []
                },
                interactionStats: {
                    totalConversations: 0,
                    firstSeen: new Date().toISOString(),
                    lastSeen: new Date().toISOString(),
                    topTopics: []
                }
            }
        };
    }

    /**
     * Load memory from localStorage
     */
    load() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (!stored) {
                console.log('🧠 [AgentMemory] No stored memory found, initializing fresh');
                return this.initializeMemory();
            }

            const allMemories = JSON.parse(stored);
            
            if (!allMemories[this.personaName]) {
                console.log(`🧠 [AgentMemory] No memory for persona "${this.personaName}", initializing`);
                return this.initializeMemory();
            }

            console.log(`🧠 [AgentMemory] Loaded ${allMemories[this.personaName].shortTerm.length} interactions`);
            return allMemories[this.personaName];
        } catch (error) {
            console.error('🧠 [AgentMemory] Error loading memory:', error);
            return this.initializeMemory();
        }
    }

    /**
     * Save memory to localStorage
     */
    save() {
        try {
            const allMemories = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
            
            // Update this persona's memory
            allMemories[this.personaName] = this.memory;
            
            // Update metadata
            allMemories.metadata = {
                version: '1.0.0',
                lastUpdated: new Date().toISOString(),
                personas: Object.keys(allMemories).filter(k => k !== 'metadata')
            };

            localStorage.setItem(this.storageKey, JSON.stringify(allMemories));
            console.log(`🧠 [AgentMemory] Saved memory for ${this.personaName}`);
            return true;
        } catch (error) {
            console.error('🧠 [AgentMemory] Error saving memory:', error);
            
            // Check if quota exceeded
            if (error.name === 'QuotaExceededError') {
                console.warn('🧠 [AgentMemory] localStorage quota exceeded, pruning old data');
                this.emergencyPrune();
                return this.save(); // Retry
            }
            
            return false;
        }
    }

    /**
     * Add interaction to short-term memory
     */
    addInteraction(role, content, metadata = {}) {
        const interaction = {
            timestamp: new Date().toISOString(),
            role,
            content,
            ...metadata
        };

        this.memory.shortTerm.push(interaction);
        this.memory.longTerm.interactionStats.totalConversations++;
        this.memory.longTerm.interactionStats.lastSeen = interaction.timestamp;

        console.log(`🧠 [AgentMemory] Added ${role} interaction (${content.length} chars)`);

        // Auto-prune if needed
        this.pruneShortTerm();

        // Extract insights from user messages
        if (role === 'user') {
            this.extractInsights(content);
        }

        this.save();
    }

    /**
     * Prune short-term memory to keep only recent interactions
     */
    pruneShortTerm() {
        if (this.memory.shortTerm.length > this.shortTermLimit) {
            const removed = this.memory.shortTerm.splice(0, 
                this.memory.shortTerm.length - this.shortTermLimit
            );
            
            console.log(`🧠 [AgentMemory] Pruned ${removed.length} old interactions`);
            
            // Extract insights from removed items before discarding
            removed.forEach(interaction => {
                if (interaction.role === 'user') {
                    this.extractInsights(interaction.content, true);
                }
            });
        }
    }

    /**
     * Emergency pruning when storage quota exceeded
     */
    emergencyPrune() {
        console.warn('🧠 [AgentMemory] Emergency pruning activated');
        
        // Keep only last 10 interactions
        const emergencyLimit = 10;
        if (this.memory.shortTerm.length > emergencyLimit) {
            this.memory.shortTerm = this.memory.shortTerm.slice(-emergencyLimit);
        }

        // Trim topic list to top 5
        if (this.memory.longTerm.interactionStats.topTopics.length > 5) {
            this.memory.longTerm.interactionStats.topTopics.length = 5;
        }

        console.log(`🧠 [AgentMemory] Pruned to ${this.memory.shortTerm.length} interactions`);
    }

    /**
     * Extract insights from user message
     */
    extractInsights(content, fromPruned = false) {
        // Extract keywords/topics (simple implementation)
        const keywords = this.extractKeywords(content);
        keywords.forEach(keyword => this.recordTopic(keyword));

        // Detect user preferences
        const lowerContent = content.toLowerCase();
        
        // Technical level hints
        if (lowerContent.includes('beginner') || lowerContent.includes('new to')) {
            this.memory.longTerm.userProfile.technicalLevel = 'beginner';
        } else if (lowerContent.includes('advanced') || lowerContent.includes('optimize')) {
            this.memory.longTerm.userProfile.technicalLevel = 'advanced';
        }

        // Learning style hints
        if (lowerContent.includes('example') || lowerContent.includes('show me')) {
            this.addPreference('prefers code examples');
        }
        if (lowerContent.includes('why') || lowerContent.includes('explain')) {
            this.addPreference('wants detailed explanations');
        }

        // Project context hints
        if (lowerContent.includes('platformer')) {
            this.memory.longTerm.projectContext.gameType = 'platformer';
        } else if (lowerContent.includes('rpg')) {
            this.memory.longTerm.projectContext.gameType = 'RPG';
        } else if (lowerContent.includes('puzzle')) {
            this.memory.longTerm.projectContext.gameType = 'puzzle game';
        }
    }

    /**
     * Extract keywords from text (simple implementation)
     */
    extractKeywords(text) {
        const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'what', 'which', 'who', 'when', 'where', 'why', 'how']);
        
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 3 && !commonWords.has(word));

        // Return unique words
        return [...new Set(words)];
    }

    /**
     * Record topic frequency
     */
    recordTopic(topic) {
        const topics = this.memory.longTerm.interactionStats.topTopics;
        const existing = topics.find(t => t.topic === topic);
        
        if (existing) {
            existing.count++;
        } else {
            topics.push({ topic, count: 1 });
        }

        // Keep only top 10, sorted by count
        topics.sort((a, b) => b.count - a.count);
        if (topics.length > 10) {
            topics.length = 10;
        }
    }

    /**
     * Add user preference (avoid duplicates)
     */
    addPreference(preference) {
        const prefs = this.memory.longTerm.userProfile.preferences;
        if (!prefs.includes(preference)) {
            prefs.push(preference);
            console.log(`🧠 [AgentMemory] Learned preference: ${preference}`);
        }
    }

    /**
     * Get recent interactions for context
     */
    getRecentContext(limit = 10) {
        const recent = this.memory.shortTerm.slice(-limit);
        return recent;
    }

    /**
     * Summarize memory for inclusion in system prompt
     */
    summarizeForPrompt() {
        const summary = [];
        const { userProfile, projectContext, interactionStats } = this.memory.longTerm;

        // User profile
        if (userProfile.preferences.length > 0) {
            summary.push('## What I Know About You');
            summary.push('- ' + userProfile.preferences.join('\n- '));
        }

        if (userProfile.technicalLevel) {
            summary.push(`\n**Your Level**: ${userProfile.technicalLevel}`);
        }

        // Project context
        if (projectContext.gameType || projectContext.keyFeatures.length > 0) {
            summary.push('\n## Your Project');
            if (projectContext.gameType) {
                summary.push(`**Type**: ${projectContext.gameType}`);
            }
            if (projectContext.keyFeatures.length > 0) {
                summary.push(`**Features**: ${projectContext.keyFeatures.join(', ')}`);
            }
        }

        // Recent topics
        if (interactionStats.topTopics.length > 0) {
            summary.push('\n## Topics We\'ve Discussed');
            const topFive = interactionStats.topTopics.slice(0, 5);
            summary.push(topFive.map(t => `- ${t.topic} (${t.count}x)`).join('\n'));
        }

        // Recent context
        const recent = this.getRecentContext(5);
        if (recent.length > 0) {
            summary.push('\n## Recent Conversation');
            recent.forEach((interaction, i) => {
                const preview = interaction.content.substring(0, 80);
                summary.push(`${i + 1}. **${interaction.role}**: ${preview}${interaction.content.length > 80 ? '...' : ''}`);
            });
        }

        const result = summary.join('\n');
        
        if (result) {
            console.log(`🧠 [AgentMemory] Generated memory summary (${result.length} chars)`);
        }
        
        return result;
    }

    /**
     * Get memory statistics
     */
    getMemoryStats() {
        return {
            personaName: this.personaName,
            interactionCount: this.memory.longTerm.interactionStats.totalConversations,
            shortTermCount: this.memory.shortTerm.length,
            firstSeen: this.memory.longTerm.interactionStats.firstSeen,
            lastSeen: this.memory.longTerm.interactionStats.lastSeen,
            topTopics: this.memory.longTerm.interactionStats.topTopics.slice(0, 5),
            preferences: this.memory.longTerm.userProfile.preferences,
            technicalLevel: this.memory.longTerm.userProfile.technicalLevel,
            gameType: this.memory.longTerm.projectContext.gameType
        };
    }

    /**
     * Export memory for debugging or backup
     */
    exportMemory() {
        return JSON.parse(JSON.stringify(this.memory)); // Deep clone
    }

    /**
     * Clear all memory for this persona
     */
    clearMemory() {
        console.warn(`🧠 [AgentMemory] Clearing all memory for ${this.personaName}`);
        this.memory = this.initializeMemory();
        this.save();
    }

    /**
     * Import memory from backup
     */
    importMemory(memoryData) {
        try {
            this.memory = memoryData;
            this.save();
            console.log(`🧠 [AgentMemory] Imported memory for ${this.personaName}`);
            return true;
        } catch (error) {
            console.error('🧠 [AgentMemory] Error importing memory:', error);
            return false;
        }
    }
}

// Export for both ESM and CommonJS
export default AgentMemory;
export { AgentMemory };

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AgentMemory;
}
