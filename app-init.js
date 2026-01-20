/**
 * UCAS Application Initialization
 * Handles basic app setup that was previously in editor.js
 */

import { initDocumentUpload } from './document-upload.js';
import { initChatAttachments } from './chat-attachments.js';
import { chatHistory } from './chat-history-manager.js';

let conversationHistory = [];

// Initialize chat history manager
chatHistory.initialize().then(initialized => {
    if (initialized) {
        console.log('[App Init] ✓ Chat history manager initialized');
    } else {
        console.warn('[App Init] Chat history not available (user not authenticated)');
    }
});

// Check if API keys are configured
function checkAPIConfiguration() {
    const statusElement = document.getElementById('ai-status');
    if (!statusElement) return;

    // For now, always show as "Ready" since we're using server-side API keys
    // The server loads keys from .env file
    statusElement.textContent = 'Ready';
    statusElement.style.color = '#4CAF50';
    
    console.log('✅ UCAS initialized - API keys configured on server');
    
    // Show persona and model switchers
    const personaSwitcher = document.getElementById('ai-persona-switcher');
    const modelSwitcher = document.getElementById('ai-model-switcher');
    
    if (personaSwitcher) {
        personaSwitcher.style.display = 'block';
        console.log('✅ Persona switcher enabled');
    }
    
    if (modelSwitcher) {
        modelSwitcher.style.display = 'block';
        console.log('✅ Model switcher enabled');
    }
    
    // Enable chat input and send button
    const chatInput = document.getElementById('ai-input');
    const sendButton = document.getElementById('ai-send');
    
    if (chatInput) {
        chatInput.disabled = false;
        chatInput.placeholder = 'Ask The Consortium anything... (Enter to send, Ctrl+Enter for new line)';
        chatInput.title = 'Chat with your AI experts';
        console.log('✅ Chat input enabled');
        
        // Add keyboard handler: Enter = send, Ctrl+Enter = new line
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (e.ctrlKey) {
                    // Ctrl+Enter = new line (allow default behavior)
                    return;
                } else {
                    // Enter alone = send message
                    e.preventDefault();
                    if (sendButton && !sendButton.disabled) {
                        sendMessage();
                    }
                }
            }
        });
    }
    
    if (sendButton) {
        sendButton.disabled = false;
        sendButton.addEventListener('click', sendMessage);
        console.log('✅ Send button enabled');
    }
}

// Send AI message
async function sendMessage() {
    const chatInput = document.getElementById('ai-input');
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    // Add user message to UI
    addMessage('user', message);
    chatInput.value = '';
    
    // Show thinking status
    const statusElement = document.getElementById('ai-status');
    statusElement.textContent = 'Thinking...';
    statusElement.style.color = '#FFA500';
    
    try {
        // Get persona and model from dropdowns
        const personaSelect = document.getElementById('quick-persona-switch');
        const modelSelect = document.getElementById('quick-model-switch');
        
        const persona = personaSelect ? personaSelect.value : 'default';
        const modelValue = modelSelect ? modelSelect.value : 'anthropic:claude-sonnet-4-5-20250929';
        const [provider, model] = modelValue.split(':');
        
        // Build conversation history
        conversationHistory.push({ role: 'user', content: message });
        
        // Save user message to persistent storage
        try {
            await chatHistory.saveMessage('user', message);
            console.log('[App Init] ✓ Saved user message to database');
        } catch (error) {
            console.error('[App Init] ❌ Failed to save user message:', error);
        }
        
        // Get conversation ID from chat attachments module
        const conversationId = window.getCurrentConversationId ? window.getCurrentConversationId() : null;
        
        // Get attached files if any
        const attachedFiles = window.multiFileHandler ? await window.multiFileHandler.getAllDocumentText() : [];
        
        // Make API call
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                provider: provider,
                model: model,
                messages: conversationHistory,
                persona: persona,
                enableImages: false,
                conversationId: conversationId,
                attachedFiles: attachedFiles
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Handle streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantMessage = '';
        let buffer = '';
        
        // Create message div for streaming updates
        const messagesContainer = document.getElementById('ai-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'ai-message assistant';
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';  // ADD CLASS SO TEXT IS VISIBLE
        contentDiv.style.color = '#cccccc';  // ENSURE TEXT COLOR IS SET
        messageDiv.appendChild(contentDiv);
        messagesContainer.appendChild(messageDiv);
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const chunks = buffer.split('\n\n');
            buffer = chunks.pop() || '';
            
            for (const chunk of chunks) {
                // SSE format has both event: and data: lines - split and find data:
                const chunkLines = chunk.split('\n');
                for (const line of chunkLines) {
                    if (line.startsWith('data: ')) {
                        const jsonStr = line.substring(6);
                        if (jsonStr === '[DONE]') continue;
                        try {
                            const data = JSON.parse(jsonStr);
                            // Anthropic format: { type: "content_block_delta", delta: { text: "..." } }
                            if (data.type === 'content_block_delta' && data.delta && data.delta.text) {
                                assistantMessage += data.delta.text;
                                // Update the message div in real-time
                                contentDiv.innerHTML = formatMarkdown(assistantMessage);
                                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                            }
                            // Fallback for other formats
                            else if (data.delta && typeof data.delta === 'string') {
                                assistantMessage += data.delta;
                                contentDiv.innerHTML = formatMarkdown(assistantMessage);
                                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                            }
                        } catch (e) {
                            console.error('Parse error:', e, 'Line:', line);
                        }
                    }
                }
            }
        }
        
        // Add to history
        conversationHistory.push({ role: 'assistant', content: assistantMessage });
        
        // Save assistant message to persistent storage
        try {
            await chatHistory.saveMessage('assistant', assistantMessage);
            console.log('[App Init] ✓ Saved assistant message to database');
        } catch (error) {
            console.error('[App Init] ❌ Failed to save assistant message:', error);
        }
        
        // Restore status
        statusElement.textContent = 'Ready';
        statusElement.style.color = '#4CAF50';
        
    } catch (error) {
        console.error('Chat error:', error);
        addMessage('system', `Error: ${error.message}`);
        
        // Restore status
        statusElement.textContent = 'Ready';
        statusElement.style.color = '#4CAF50';
    }
}

// Add message to chat UI
function addMessage(role, content) {
    const messagesContainer = document.getElementById('ai-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-message ${role}`;
    
    if (role === 'user') {
        messageDiv.innerHTML = `<p><strong>You:</strong> ${escapeHtml(content)}</p>`;
    } else if (role === 'assistant') {
        messageDiv.innerHTML = `<div>${formatMarkdown(content)}</div>`;
    } else {
        messageDiv.innerHTML = `<p style="color: #ff6b6b;">${escapeHtml(content)}</p>`;
    }
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Simple HTML escape
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Simple markdown formatter
function formatMarkdown(text) {
    return text
        .split('\n\n').map(para => `<p>${para}</p>`).join('')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    checkAPIConfiguration();
    
    // Initialize Phase 11: Document Upload & Chat Attachments
    await initDocumentUpload();
    await initChatAttachments();
    
    console.log('🚀 UCAS Application Initialized');
});
