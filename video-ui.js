/**
 * video-ui.js
 * UI component for YouTube video analysis in research panel
 * Phase 8: Video Intelligence Implementation
 * Phase 8 Week 4: Auto-transcript loading + history tracking
 */

import { getVideoMetadata, checkCaptionAvailability, extractVideoId, formatDuration } from './youtube-api.js';
import { getTranscript, searchTranscript, getTranscriptStats, formatTimestamp, TRANSCRIPT_SOURCE } from './transcript-fetcher.js';
import { VideoAnalyzer } from './video-analyzer.js';
import { videoHistory } from './video-history-manager.js';

class VideoUI {
  constructor(containerElement) {
    this.container = containerElement;
    this.currentVideo = null;
    this.currentTranscript = null;
    this.currentAnalysis = null;
    this.analyzer = new VideoAnalyzer();
    this.init();
  }

  init() {
    this.render();
    this.attachEventListeners();
    
    // Initialize video history manager
    this.initializeHistory();
  }

  async initializeHistory() {
    try {
      await videoHistory.initialize();
      console.log('📚 Video history ready');
    } catch (error) {
      console.error('❌ Error initializing video history:', error);
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="video-panel">
        <div style="padding: 30px; text-align: center;">
          <button id="open-video-modal-btn" class="primary-button" style="width: 100%; padding: 25px; font-size: 16px; display: flex; align-items: center; justify-content: center; gap: 10px;">
            <span style="font-size: 24px;">🎬</span>
            <span>Open YouTube Video Intelligence</span>
          </button>
          <p style="color: #888; font-size: 14px; margin-top: 15px; line-height: 1.6;">
            Search videos • Load transcripts • Generate AI summaries • Multi-agent analysis
          </p>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    // Open full video modal
    const openModalBtn = document.getElementById('open-video-modal-btn');
    const modal = document.getElementById('video-full-modal');
    const closeModalBtn = document.getElementById('video-full-modal-close');
    
    if (!modal) {
      console.error('Video full modal not found in DOM');
      return;
    }
    
    openModalBtn?.addEventListener('click', () => {
      modal.style.display = 'flex';
      // Focus search input
      document.getElementById('video-modal-input')?.focus();
    });
    
    closeModalBtn?.addEventListener('click', () => {
      modal.style.display = 'none';
    });
    
    // Close modal on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });

    // Modal search and load
    const searchBtn = document.getElementById('video-modal-search-btn');
    const loadBtn = document.getElementById('video-modal-load-btn');
    const input = document.getElementById('video-modal-input');
    
    searchBtn?.addEventListener('click', () => this.handleModalSearch());
    loadBtn?.addEventListener('click', () => this.handleModalLoadVideo());
    input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        // Determine if it's a URL/ID or search query
        const value = e.target.value.trim();
        if (value.includes('youtube.com') || value.includes('youtu.be') || /^[a-zA-Z0-9_-]{11}$/.test(value)) {
          this.handleModalLoadVideo();
        } else {
          this.handleModalSearch();
        }
      }
    });

    // Load transcript
    document.getElementById('video-modal-load-transcript-btn')?.addEventListener('click', () => {
      this.handleModalLoadTranscript();
    });

    // Generate summary
    document.getElementById('video-modal-generate-summary-btn')?.addEventListener('click', () => {
      this.handleModalGenerateSummary();
    });

    // Tab switching
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleTabSwitch(e.target.dataset.tab));
    });

    // Transcript search
    document.getElementById('video-modal-search-transcript-btn')?.addEventListener('click', () => {
      this.handleModalTranscriptSearch();
    });

    // Video fullscreen
    document.getElementById('video-fullscreen-btn')?.addEventListener('click', () => {
      this.handleVideoFullscreen();
    });
  }

  handleVideoFullscreen() {
    const iframe = document.getElementById('video-modal-iframe');
    if (!iframe) return;

    // Modern browsers
    if (iframe.requestFullscreen) {
      iframe.requestFullscreen();
    } else if (iframe.webkitRequestFullscreen) {
      iframe.webkitRequestFullscreen();
    } else if (iframe.mozRequestFullScreen) {
      iframe.mozRequestFullScreen();
    } else if (iframe.msRequestFullscreen) {
      iframe.msRequestFullscreen();
    }
  }

  async handleLoadVideo() {
    const urlInput = document.getElementById('video-url-input');
    const url = urlInput.value.trim();

    if (!url) {
      this.showError('Please enter a YouTube URL or video ID');
      return;
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      this.showError('Invalid YouTube URL or video ID');
      return;
    }

    this.showLoading(true);
    this.hideError();

    try {
      // Fetch video metadata
      const metadata = await getVideoMetadata(videoId);
      this.currentVideo = metadata;

      // Check caption availability
      const captions = await checkCaptionAvailability(videoId);
      this.currentVideo.captions = captions;

      // Display video info
      this.displayVideoInfo(metadata);
      this.showLoading(false);

      // Show video info section
      document.getElementById('video-info-section').style.display = 'block';

    } catch (error) {
      this.showLoading(false);
      this.showError(`Failed to load video: ${error.message}`);
      console.error('Video load error:', error);
    }
  }

  async handleModalYouTubeSearch() {
    const query = document.getElementById('modal-youtube-search-input').value.trim();
    
    if (!query) {
      return;
    }

    const resultsContainer = document.getElementById('modal-search-results');
    resultsContainer.innerHTML = '<div class="loading-indicator"><span class="spinner"></span> Searching...</div>';

    try {
      const response = await fetch('/api/youtube-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, maxResults: 25 })
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const results = await response.json();
      console.log(`📺 YouTube Search (Modal): Found ${results.items?.length || 0} videos`);
      this.displayModalYouTubeResults(results.items);

    } catch (error) {
      resultsContainer.innerHTML = `<div class="error-message">Search failed: ${error.message}</div>`;
      console.error('YouTube search error:', error);
    }
  }

  async handleModalSearch() {
    const query = document.getElementById('video-modal-input').value.trim();
    
    if (!query) {
      return;
    }

    const resultsContainer = document.getElementById('video-modal-search-results');
    const searchResultsSection = document.getElementById('video-modal-search-results-container');
    
    resultsContainer.innerHTML = '<div class="loading-indicator"><span class="spinner"></span> Searching...</div>';
    searchResultsSection.style.display = 'block';

    try {
      const response = await fetch('/api/youtube-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, maxResults: 25 })
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const results = await response.json();
      console.log(`📺 YouTube Search: Found ${results.items?.length || 0} videos`);
      this.displayModalSearchResults(results.items);

    } catch (error) {
      resultsContainer.innerHTML = `<div class="error-message">Search failed: ${error.message}</div>`;
      console.error('YouTube search error:', error);
    }
  }

  displayModalSearchResults(videos) {
    const resultsContainer = document.getElementById('video-modal-search-results');
    
    if (!videos || videos.length === 0) {
      resultsContainer.innerHTML = '<div class="no-results">No videos found</div>';
      return;
    }

    const html = videos.map(video => `
      <div class="search-result-item" data-video-id="${video.id || video.videoId}">
        <img src="${video.thumbnail}" alt="${video.title}" class="result-thumbnail" />
        <div class="result-info">
          <h4 class="result-title">${video.title}</h4>
          <div class="result-meta">
            <span>${video.channel}</span>
            ${video.duration ? `<span class="separator">•</span><span>${video.duration}</span>` : ''}
          </div>
        </div>
      </div>
    `).join('');

    resultsContainer.innerHTML = html;

    // Add click handlers to load videos
    resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const videoId = item.dataset.videoId;
        if (videoId && videoId !== 'undefined') {
          document.getElementById('video-modal-input').value = videoId;
          this.handleModalLoadVideo();
        }
      });
    });
  }

  async handleModalLoadVideo() {
    const input = document.getElementById('video-modal-input');
    const url = input.value.trim();

    if (!url) {
      alert('Please enter a YouTube URL or video ID');
      return;
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      alert('Invalid YouTube URL or video ID');
      return;
    }

    try {
      // Check if video is in history (instant reload!)
      const cachedVideo = videoHistory.getVideoById(videoId);
      
      if (cachedVideo && cachedVideo.transcript) {
        console.log('⚡ Loading video from history (instant!)');
        
        // **SHOW THE MODAL!**
        const modal = document.getElementById('video-modal');
        if (modal) {
          modal.style.display = 'flex';
          console.log('📺 Modal opened!');
        }
        
        this.currentVideo = {
          videoId: cachedVideo.videoId,
          title: cachedVideo.title,
          author: cachedVideo.channelName,
          duration: cachedVideo.duration,
          thumbnail: cachedVideo.thumbnail,
          views: null // Not stored in cache
        };
        this.currentTranscript = cachedVideo.transcript;
        
        // Display video immediately
        this.displayModalVideoInfo(this.currentVideo);
        this.displayModalTranscript(cachedVideo.transcript);
        this.displayModalStats(cachedVideo.transcript);
        
        // Mark transcript button as loaded
        const loadBtn = document.getElementById('video-modal-load-transcript-btn');
        if (loadBtn) {
          loadBtn.textContent = '✓ Transcript Ready';
          loadBtn.disabled = true;
        }
        
        // Show generate summary button
        const generateBtn = document.getElementById('video-modal-generate-summary-btn');
        if (generateBtn) {
          generateBtn.style.display = 'block';
        }
        
        // Initialize Video Content Tools
        if (window.initializeVideoTools) {
          const transcriptText = cachedVideo.transcript.segments.map(s => s.text).join(' ');
          window.initializeVideoTools(this.currentVideo, transcriptText);
          console.log('🎨 Content creation tools ready!');
        }
        
        // Hide search results, show video content
        document.getElementById('video-modal-search-results-container').style.display = 'none';
        document.getElementById('video-modal-content').style.display = 'block';
        
        return; // Done!
      }
      
      // Not in cache - fetch from YouTube
      console.log('📡 Fetching video from YouTube...');
      
      // Fetch video metadata
      const metadata = await getVideoMetadata(videoId);
      this.currentVideo = metadata;

      // Check caption availability
      const captions = await checkCaptionAvailability(videoId);
      this.currentVideo.captions = captions;

      // Display video info in modal
      this.displayModalVideoInfo(metadata);

      // Hide search results, show video content
      document.getElementById('video-modal-search-results-container').style.display = 'none';
      document.getElementById('video-modal-content').style.display = 'block';
      
      // ✅ DON'T AUTO-LOAD - Let user choose (like Monica.ai)
      console.log('✅ Video loaded - waiting for user to click Load Transcript');

    } catch (error) {
      alert(`Failed to load video: ${error.message}`);
      console.error('Video load error:', error);
    }
  }

  /**
   * Load transcript (MANUAL - user clicks button like Monica.ai)
   * Only tries YouTube captions - NO auto-fallback to expensive AI
   */
  async loadTranscriptManually() {
    if (!this.currentVideo) {
      alert('No video loaded');
      return;
    }

    const loadBtn = document.getElementById('video-modal-load-transcript-btn');
    const statusEl = document.getElementById('transcript-status-text');
    
    const updateStatus = (message) => {
      if (statusEl) {
        statusEl.textContent = message;
        statusEl.style.display = 'block';
      }
      if (loadBtn) {
        loadBtn.textContent = message;
      }
    };
    
    if (loadBtn) {
      loadBtn.disabled = true;
    }
    updateStatus('⏳ Loading captions...');

    try {
      // ONLY try YouTube captions - no expensive AI fallback
      const transcript = await getTranscript(this.currentVideo.videoId, 'en', {
        allowFallback: false,  // NO AI fallback
        onStatusUpdate: updateStatus
      });
      
      this.currentTranscript = transcript;

      // Display transcript
      this.displayModalTranscript(transcript);
      this.displayModalStats(transcript);

      // Update button
      if (loadBtn) {
        loadBtn.textContent = '✓ Captions Loaded';
        loadBtn.disabled = true;
      }
      
      updateStatus('✅ Captions loaded successfully!');
      
      // Show generate summary button (like Monica.ai)
      const generateBtn = document.getElementById('video-modal-generate-summary-btn');
      if (generateBtn) {
        generateBtn.style.display = 'block';
        generateBtn.disabled = false;
      }
      
      console.log('✅ Transcript loaded!');
      
    } catch (error) {
      console.error('❌ Transcript load failed:', error);
      
      // Show error and suggest AI summary instead
      if (loadBtn) {
        loadBtn.disabled = false;
        loadBtn.textContent = '📋 Load Transcript';
      }
      
      updateStatus(`❌ No captions available. Use "Generate Summary" for AI summary.`);
      
      // Still show summary button - user can generate AI summary
      const generateBtn = document.getElementById('video-modal-generate-summary-btn');
      if (generateBtn) {
        generateBtn.style.display = 'block';
        generateBtn.disabled = false;
        generateBtn.textContent = '🤖 Generate AI Summary (No Captions)';
      }
      
      // ✅ AUTO-SWITCH to Summary tab so user sees the button
      this.handleTabSwitch('summary');
    }
  }

  /**
   * Show indicator for transcript source (YouTube captions vs AI-generated)
   */
  showTranscriptSourceIndicator(transcript) {
    const container = document.getElementById('video-modal-transcript');
    if (!container) return;
    
    const source = transcript.metadata?.source;
    
    // Create or update source indicator
    let indicator = document.getElementById('transcript-source-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'transcript-source-indicator';
      indicator.className = 'transcript-source-indicator';
      container.parentNode.insertBefore(indicator, container);
    }
    
    const cost = transcript.metadata?.costEstimate || 0;
    const time = transcript.metadata?.processingTime?.toFixed(1) || '?';
    
    if (source === TRANSCRIPT_SOURCE.GEMINI_AI) {
      indicator.innerHTML = `
        <span class="source-badge gemini">🎬 Gemini AI</span>
        <span class="source-details">Generated in ${time}s • Est. cost: ~$${cost.toFixed(2)}</span>
      `;
      indicator.title = 'Transcript generated by Google Gemini AI - timestamps are approximate';
    } else if (source === TRANSCRIPT_SOURCE.WHISPER_AI) {
      indicator.innerHTML = `
        <span class="source-badge whisper">🎤 Whisper AI</span>
        <span class="source-details">Generated in ${time}s • Est. cost: $${cost.toFixed(4)}</span>
      `;
      indicator.title = 'Transcript generated by OpenAI Whisper AI';
    } else {
      indicator.innerHTML = `
        <span class="source-badge youtube">📝 YouTube Captions</span>
        <span class="source-details">Free • Built-in captions</span>
      `;
      indicator.title = 'Using YouTube\'s built-in captions';
    }
  }

  displayModalVideoInfo(metadata) {
    // Set iframe
    const iframe = document.getElementById('video-modal-iframe');
    if (iframe && metadata.videoId) {
      iframe.src = `https://www.youtube.com/embed/${metadata.videoId}`;
    }

    // Title
    const title = document.getElementById('video-modal-title');
    if (title) {
      title.textContent = metadata.title || 'Untitled Video';
    }

    // Author
    const author = document.getElementById('video-modal-author');
    if (author) {
      author.textContent = metadata.author || 'Unknown';
    }

    // Duration
    const duration = document.getElementById('video-modal-duration');
    if (duration) {
      duration.textContent = formatDuration(metadata.duration);
    }

    // Views
    const views = document.getElementById('video-modal-views');
    if (views && metadata.views) {
      views.textContent = this.formatNumber(metadata.views) + ' views';
    }

    // Activate transcript tab
    this.handleTabSwitch('transcript');
  }

  async handleModalLoadTranscript() {
    // Call the new manual load function
    await this.loadTranscriptManually();
  }

  displayModalTranscript(transcript) {
    const container = document.getElementById('video-modal-transcript');
    if (!container) return;

    container.innerHTML = '';

    if (!transcript.segments || transcript.segments.length === 0) {
      container.innerHTML = '<div class="transcript-placeholder">No transcript available</div>';
      return;
    }

    const html = transcript.segments.map(seg => `
      <div class="transcript-segment">
        <span class="timestamp" data-time="${seg.start}">${formatTimestamp(seg.start)}</span>
        <span class="text">${seg.text}</span>
      </div>
    `).join('');

    container.innerHTML = html;

    // Make timestamps clickable
    container.querySelectorAll('.timestamp').forEach(el => {
      el.addEventListener('click', () => {
        const time = parseFloat(el.dataset.time);
        this.jumpToTimestamp(formatTimestamp(time));
      });
    });
  }

  displayModalStats(transcript) {
    const container = document.getElementById('video-modal-stats');
    if (!container) return;

    // Guard against null/undefined transcript
    if (!transcript || !transcript.segments) {
      container.innerHTML = '<div class="stats-placeholder">No transcript stats available</div>';
      return;
    }

    const stats = getTranscriptStats(transcript);
    const source = transcript.metadata?.source;
    const cost = transcript.metadata?.costEstimate || 0;
    const time = transcript.metadata?.processingTime?.toFixed(1) || '?';
    
    // Build source info HTML based on transcript source
    let sourceInfo = '';
    if (source === TRANSCRIPT_SOURCE.GEMINI_AI) {
      sourceInfo = `
        <div class="stat-item source-stat gemini">
          <span class="stat-label">Transcript Source</span>
          <span class="stat-value">🎬 Gemini AI</span>
          <span class="stat-detail">Generated in ${time}s • ~$${cost.toFixed(2)}</span>
        </div>
      `;
    } else if (source === TRANSCRIPT_SOURCE.WHISPER_AI) {
      sourceInfo = `
        <div class="stat-item source-stat whisper">
          <span class="stat-label">Transcript Source</span>
          <span class="stat-value">🎤 Whisper AI</span>
          <span class="stat-detail">Generated in ${time}s • $${cost.toFixed(4)}</span>
        </div>
      `;
    } else {
      sourceInfo = `
        <div class="stat-item source-stat youtube">
          <span class="stat-label">Transcript Source</span>
          <span class="stat-value">📝 YouTube Captions</span>
          <span class="stat-detail">Free • Built-in</span>
        </div>
      `;
    }
    
    container.innerHTML = `
      <div class="stats-grid">
        ${sourceInfo}
        <div class="stat-item">
          <span class="stat-label">Total Segments</span>
          <span class="stat-value">${stats.totalSegments}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Total Words</span>
          <span class="stat-value">${stats.totalWords}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Average Segment Length</span>
          <span class="stat-value">${stats.avgSegmentLength} words</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Duration</span>
          <span class="stat-value">${formatDuration(stats.duration)}</span>
        </div>
      </div>
    `;
  }

  async handleModalGenerateSummary() {
    // ✅ ALLOW: Works with OR without transcript
    // If no transcript, Gemini AI will watch the video directly
    
    if (!this.currentVideo) {
      alert('Please load a video first');
      return;
    }

    const generateBtn = document.getElementById('video-modal-generate-summary-btn');
    const summaryContainer = document.getElementById('video-modal-summary');
    const analysisContainer = document.getElementById('video-modal-analysis');

    generateBtn.disabled = true;
    
    // Show appropriate loading message
    if (this.currentTranscript) {
      generateBtn.innerHTML = '<span class="spinner"></span> Analyzing transcript...';
    } else {
      generateBtn.innerHTML = '<span class="spinner"></span> AI watching video (60+ sec)...';
    }

    summaryContainer.innerHTML = '<div class="loading-indicator"><span class="spinner"></span> Generating AI summary...</div>';
    analysisContainer.innerHTML = '<div class="loading-indicator"><span class="spinner"></span> Multi-agent analysis in progress...</div>';

    try {
      // Call the analyzer (will use transcript if available, otherwise Gemini watches video)
      const analysis = await this.analyzer.analyzeVideo(
        {
          videoId: this.currentVideo.videoId,
          title: this.currentVideo.title,
          author: this.currentVideo.author,
          duration: this.currentVideo.duration,
          transcript: this.currentTranscript  // Can be null - analyzer will handle it
        },
        ['master-teacher', 'classical-educator', 'strategist', 'theologian']
      );

      this.currentAnalysis = analysis;

      // Display summaries
      this.displayModalSummaries(analysis.summaries);
      
      // Display agent analyses
      this.displayModalAgentAnalyses(analysis.agentAnalyses);

      generateBtn.textContent = '✓ Analysis Complete';
      
      // 📊 Track tool usage in history
      if (this.currentVideo?.videoId) {
        await videoHistory.markToolUsed(this.currentVideo.videoId, 'summary');
        await videoHistory.markToolUsed(this.currentVideo.videoId, 'analysis');
        console.log('📊 Tool usage tracked: Summary & Analysis');
      }

    } catch (error) {
      summaryContainer.innerHTML = `<div class="error-message">Failed to generate summary: ${error.message}</div>`;
      analysisContainer.innerHTML = `<div class="error-message">Failed to generate analysis: ${error.message}</div>`;
      generateBtn.disabled = false;
      generateBtn.innerHTML = '<span class="icon">✨</span> Generate Summary';
      console.error('Summary generation error:', error);
    }
  }

  displayModalSummaries(summaries) {
    console.log('📊 Displaying summaries:', summaries);
    const container = document.getElementById('video-modal-summary');
    if (!container) {
      console.error('❌ Summary container not found!');
      return;
    }

    // Clear and ensure container is visible
    container.style.display = 'block';
    container.style.overflowY = 'auto';
    container.style.height = '100%';

    let html = '<div class="summaries-content" style="padding: 20px; font-size: 14px; line-height: 1.8;">';

    // TLDR
    if (summaries.tldr) {
      html += `
        <div class="summary-section" style="margin-bottom: 30px;">
          <h3 class="summary-heading" style="color: #61dafb; margin-bottom: 10px; font-size: 18px;">⚡ TLDR</h3>
          <div class="summary-tldr" style="color: #fff; background: rgba(97,218,251,0.1); padding: 15px; border-radius: 8px; border-left: 3px solid #61dafb;">${this.formatSummaryText(summaries.tldr)}</div>
        </div>
      `;
    }

    // Abstract
    if (summaries.abstract) {
      html += `
        <div class="summary-section" style="margin-bottom: 30px;">
          <h3 class="summary-heading" style="color: #61dafb; margin-bottom: 10px; font-size: 18px;">📝 Abstract</h3>
          <div class="summary-abstract" style="color: #ddd;">${this.formatSummaryText(summaries.abstract)}</div>
        </div>
      `;
    }

    // Detailed Summary
    if (summaries.detailed) {
      html += `
        <div class="summary-section" style="margin-bottom: 30px;">
          <h3 class="summary-heading" style="color: #61dafb; margin-bottom: 10px; font-size: 18px;">📄 Detailed Summary</h3>
          <div class="summary-detailed" style="color: #ddd;">${this.formatSummaryText(summaries.detailed)}</div>
        </div>
      `;
    }

    // Key Moments
    if (summaries.keyMoments && summaries.keyMoments.length > 0) {
      html += `
        <div class="summary-section" style="margin-bottom: 30px;">
          <h3 class="summary-heading" style="color: #61dafb; margin-bottom: 10px; font-size: 18px;">⭐ Key Moments</h3>
          <ul class="key-moments-list" style="list-style: none; padding: 0; margin: 0;">
            ${summaries.keyMoments.map(moment => `
              <li class="key-moment-item" style="margin-bottom: 15px; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 8px; border-left: 3px solid #ffa500;">
                <span class="moment-timestamp" data-timestamp="${moment.timestamp}" style="color: #ffa500; font-weight: bold; cursor: pointer; display: inline-block; margin-right: 10px; text-decoration: underline;">${moment.timestamp}</span>
                <span class="moment-description" style="color: #ddd;">${moment.description}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    }

    // Export actions
    html += `
      <div class="summary-actions">
        <button id="export-summary-btn" class="secondary-button">
          <span class="icon">📥</span>
          Export Summary
        </button>
        <button id="copy-summary-btn" class="secondary-button">
          <span class="icon">📋</span>
          Copy to Clipboard
        </button>
      </div>
    `;

    html += '</div>';
    container.innerHTML = html;

    // Add event listeners for timestamps
    container.querySelectorAll('.moment-timestamp').forEach(el => {
      el.addEventListener('click', () => {
        this.jumpToTimestamp(el.dataset.timestamp);
      });
    });

    // Export buttons
    document.getElementById('export-summary-btn')?.addEventListener('click', () => {
      const markdown = this.analyzer.exportToMarkdown(this.currentAnalysis, this.currentVideo);
      this.analyzer.downloadAsFile(markdown, `${this.currentVideo.videoId}_analysis.md`, 'text/markdown');
    });

    document.getElementById('copy-summary-btn')?.addEventListener('click', async () => {
      const markdown = this.analyzer.exportToMarkdown(this.currentAnalysis, this.currentVideo);
      await this.analyzer.copyToClipboard(markdown);
      alert('Summary copied to clipboard!');
    });
  }

  displayModalAgentAnalyses(agentAnalyses) {
    console.log('🧠 Displaying agent analyses:', agentAnalyses?.length, 'agents');
    const container = document.getElementById('video-modal-analysis');
    if (!container) {
      console.error('❌ Analysis container not found!');
      return;
    }

    if (!agentAnalyses || agentAnalyses.length === 0) {
      container.innerHTML = '<div class="no-analysis" style="text-align: center; padding: 40px; color: #888;">No agent analyses available</div>';
      return;
    }

    // Ensure container is visible
    container.style.display = 'block';
    container.style.overflowY = 'auto';
    container.style.height = '100%';

    let html = '<div class="agent-analyses" style="padding: 20px; font-size: 14px; line-height: 1.8;">';
    
    agentAnalyses.forEach(agent => {
      html += `
        <div class="agent-analysis" style="margin-bottom: 30px; padding: 20px; background: rgba(255,255,255,0.02); border-radius: 8px; border-left: 3px solid #61dafb;">
          <div class="agent-header" style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <span class="agent-emoji" style="font-size: 28px;">${agent.emoji}</span>
            <span class="agent-name" style="color: #61dafb; font-size: 18px; font-weight: bold;">${agent.persona}</span>
          </div>
          <div class="agent-content" style="color: #ddd; white-space: pre-wrap;">${this.formatSummaryText(agent.analysis)}</div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
    
    console.log('✅ Analysis displayed successfully');
  }

  handleModalTranscriptSearch() {
    if (!this.currentTranscript) {
      alert('Please load a transcript first');
      return;
    }

    const query = document.getElementById('video-modal-transcript-search')?.value.trim();
    if (!query) return;

    const results = this.analyzer.searchTranscript(this.currentTranscript, query);
    const resultsContainer = document.getElementById('video-modal-transcript-search-results');

    if (!resultsContainer) return;

    if (results.length === 0) {
      resultsContainer.innerHTML = '<div class="no-results">No matches found</div>';
      return;
    }

    const html = `
      <div class="search-results-header">Found ${results.length} match${results.length !== 1 ? 'es' : ''}</div>
      ${results.map(result => `
        <div class="transcript-search-result">
          <div class="search-result-timestamp" data-time="${result.timestamp}">${result.formattedTime}</div>
          <div class="search-result-text">${result.highlightedText}</div>
        </div>
      `).join('')}
    `;

    resultsContainer.innerHTML = html;

    // Make timestamps clickable
    resultsContainer.querySelectorAll('.search-result-timestamp').forEach(el => {
      el.addEventListener('click', () => {
        this.jumpToTimestamp(el.textContent);
      });
    });
  }

  displayModalYouTubeResults(videos) {
    const resultsContainer = document.getElementById('modal-search-results');

    if (!videos || videos.length === 0) {
      resultsContainer.innerHTML = '<div class="no-results">No videos found</div>';
      return;
    }

    const html = videos.map(video => `
      <div class="search-result-item" data-video-id="${video.id}" style="margin-bottom: 10px;">
        <img src="${video.thumbnail}" alt="${video.title}" class="result-thumbnail">
        <div class="result-info">
          <h4 class="result-title">${video.title}</h4>
          <div class="result-meta">
            <span>${video.channel}</span>
            ${video.duration ? `<span class="separator">•</span><span>${video.duration}</span>` : ''}
          </div>
        </div>
      </div>
    `).join('');

    resultsContainer.innerHTML = html;

    // Add click handlers to load videos
    resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const videoId = item.dataset.videoId;
        document.getElementById('video-url-input').value = videoId;
        document.getElementById('video-search-modal').style.display = 'none';
        this.handleLoadVideo();
      });
    });
  }

  async handleYouTubeSearch() {
    const searchInput = document.getElementById('youtube-search-input');
    const query = searchInput.value.trim();

    if (!query) {
      return;
    }

    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '<div class="loading-indicator"><span class="spinner"></span> Searching...</div>';

    try {
      const response = await fetch('/api/youtube-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, maxResults: 10 })
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const results = await response.json();
      console.log(`📺 YouTube Search: Found ${results.items?.length || 0} videos`);
      this.displayYouTubeResults(results.items);

    } catch (error) {
      resultsContainer.innerHTML = `<div class="error-message">Search failed: ${error.message}</div>`;
      console.error('YouTube search error:', error);
    }
  }

  displayYouTubeResults(videos) {
    const resultsContainer = document.getElementById('search-results');

    if (!videos || videos.length === 0) {
      resultsContainer.innerHTML = '<div class="no-results">No videos found</div>';
      return;
    }

    const html = videos.map(video => `
      <div class="search-result-item" data-video-id="${video.id}">
        <img src="${video.thumbnail}" alt="${video.title}" class="result-thumbnail">
        <div class="result-info">
          <h4 class="result-title">${video.title}</h4>
          <div class="result-meta">
            <span>${video.channel}</span>
            ${video.duration ? `<span class="separator">•</span><span>${video.duration}</span>` : ''}
          </div>
        </div>
      </div>
    `).join('');

    resultsContainer.innerHTML = html;

    // Add click handlers to load videos
    resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const videoId = item.dataset.videoId;
        document.getElementById('video-url-input').value = videoId;
        this.handleLoadVideo();
        document.getElementById('youtube-search-panel').style.display = 'none';
      });
    });
  }

  async handleLoadTranscript() {
    if (!this.currentVideo) {
      this.showError('Please load a video first');
      return;
    }

    const loadBtn = document.getElementById('load-transcript-btn');
    loadBtn.disabled = true;
    loadBtn.textContent = 'Loading...';

    try {
      const transcript = await getTranscript(this.currentVideo.videoId);
      this.currentTranscript = transcript;

      this.displayTranscript(transcript);
      this.displayStats(transcript);

      loadBtn.textContent = '✓ Transcript Loaded';
      
    } catch (error) {
      this.showError(`Failed to load transcript: ${error.message}`);
      loadBtn.disabled = false;
      loadBtn.textContent = 'Load Transcript';
      console.error('Transcript load error:', error);
    }
  }

  displayVideoInfo(metadata) {
    // Show video player
    const playerSection = document.getElementById('video-player-section');
    const playerIframe = document.getElementById('video-player-iframe');
    if (playerSection && playerIframe && metadata.videoId) {
      playerIframe.src = `https://www.youtube.com/embed/${metadata.videoId}`;
      playerSection.style.display = 'block';
    }

    // Title
    const title = document.getElementById('video-title');
    if (title) {
      title.textContent = metadata.title || 'Untitled Video';
    }

    // Author
    const author = document.getElementById('video-author');
    if (author) {
      author.textContent = metadata.author || 'Unknown';
    }

    // Duration
    const duration = document.getElementById('video-duration');
    if (duration) {
      duration.textContent = formatDuration(metadata.duration);
    }

    // Views
    const views = document.getElementById('video-views');
    if (views && metadata.views) {
      views.textContent = this.formatNumber(metadata.views) + ' views';
    }
  }

  displayTranscript(transcript) {
    const container = document.getElementById('transcript-container');
    if (!container) return;

    container.innerHTML = '';

    if (!transcript.segments || transcript.segments.length === 0) {
      container.innerHTML = '<div class="transcript-placeholder">No transcript available</div>';
      return;
    }

    const transcriptList = document.createElement('div');
    transcriptList.className = 'transcript-list';

    transcript.segments.forEach((segment, index) => {
      const segmentEl = document.createElement('div');
      segmentEl.className = 'transcript-segment';
      segmentEl.dataset.start = segment.start;
      segmentEl.dataset.index = index;

      segmentEl.innerHTML = `
        <span class="timestamp">${segment.timestamp}</span>
        <span class="text">${this.escapeHtml(segment.text)}</span>
      `;

      transcriptList.appendChild(segmentEl);
    });

    container.appendChild(transcriptList);

    // Show generate summary button after transcript loads
    const summaryBtn = document.getElementById('generate-summary-btn');
    if (summaryBtn) {
      summaryBtn.style.display = 'inline-block';
    }
  }

  displayStats(transcript) {
    const statsContainer = document.getElementById('stats-container');
    if (!statsContainer) return;

    const stats = getTranscriptStats(transcript);
    if (!stats) return;

    statsContainer.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${stats.wordCount.toLocaleString()}</div>
          <div class="stat-label">Total Words</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.uniqueWordCount.toLocaleString()}</div>
          <div class="stat-label">Unique Words</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.segmentCount.toLocaleString()}</div>
          <div class="stat-label">Segments</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${Math.floor(stats.totalDuration / 60)}m ${Math.floor(stats.totalDuration % 60)}s</div>
          <div class="stat-label">Duration</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.averageWordsPerSegment.toFixed(1)}</div>
          <div class="stat-label">Words/Segment</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.estimatedReadingTime} min</div>
          <div class="stat-label">Reading Time</div>
        </div>
      </div>
      <div class="stats-details">
        <h4>Language</h4>
        <p>${stats.language}</p>
        <h4>Average Segment Duration</h4>
        <p>${stats.averageSegmentDuration.toFixed(2)} seconds</p>
      </div>
    `;
  }

  handleSearch() {
    if (!this.currentTranscript) {
      this.showError('Please load a transcript first');
      return;
    }

    const searchInput = document.getElementById('transcript-search-input');
    const query = searchInput.value.trim();

    if (!query) {
      return;
    }

    const results = searchTranscript(this.currentTranscript, query);
    this.displaySearchResults(results, query);
  }

  displaySearchResults(results, query) {
    const container = document.getElementById('search-results');
    if (!container) return;

    if (results.length === 0) {
      container.innerHTML = `<div class="no-results">No results found for "${this.escapeHtml(query)}"</div>`;
      return;
    }

    container.innerHTML = `
      <div class="search-summary">
        Found ${results.length} match${results.length !== 1 ? 'es' : ''} for "${this.escapeHtml(query)}"
      </div>
      <div class="search-results-list">
        ${results.map(result => `
          <div class="search-result-item">
            <div class="result-timestamp">${result.match.timestamp}</div>
            <div class="result-text">
              ${this.highlightMatch(result.match.text, query)}
            </div>
            ${result.context.before ? `
              <div class="result-context">
                <small>Context: ...${this.escapeHtml(result.context.before.text)}...</small>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  handleTabSwitch(tabName) {
    console.log('🔄 Switching to tab:', tabName);
    
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update tab content - hide all first
    document.querySelectorAll('.tab-content').forEach(content => {
      content.style.display = 'none';
    });

    // Show the active tab with proper flex display
    const activeTab = document.getElementById(`${tabName}-tab`);
    if (activeTab) {
      activeTab.style.display = 'flex';
      activeTab.style.flexDirection = 'column';
      activeTab.style.height = '100%';
      activeTab.style.overflow = 'hidden';
      console.log('✅ Tab now visible:', `${tabName}-tab`);
      
      // Force scroll container to be visible and scrollable
      const scrollContainers = activeTab.querySelectorAll('[style*="overflow"]');
      scrollContainers.forEach(container => {
        container.style.display = 'block';
        container.style.overflowY = 'auto';
      });
    } else {
      console.error('❌ Tab not found:', `${tabName}-tab`);
    }
  }

  handleExport() {
    if (!this.currentTranscript) {
      this.showError('Please load a transcript first');
      return;
    }

    // Show export options
    const exportMenu = confirm('Export as:\nOK = Text with timestamps\nCancel = SRT subtitle format');
    
    if (exportMenu) {
      // Export as text
      const text = this.currentTranscript.segments
        .map(seg => `[${seg.timestamp}] ${seg.text}`)
        .join('\n');
      this.analyzer.downloadAsFile(text, `transcript-${this.currentVideo.videoId}.txt`, 'text/plain');
    } else {
      // Export as SRT
      const srt = this.analyzer.exportToSRT(this.currentTranscript);
      this.analyzer.downloadAsFile(srt, `transcript-${this.currentVideo.videoId}.srt`, 'text/plain');
    }
  }

  async handleGenerateSummary() {
    if (!this.currentTranscript || !this.currentVideo) {
      this.showError('Please load a video and transcript first');
      return;
    }

    const summaryContainer = document.getElementById('summary-container');
    const analysisContainer = document.getElementById('analysis-container');
    const generateBtn = document.getElementById('generate-summary-btn');

    // Show loading state
    summaryContainer.innerHTML = '<div class="loading-indicator"><span class="spinner"></span> Generating AI summary...</div>';
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';

    try {
      // Prepare video data
      const videoData = {
        videoId: this.currentVideo.videoId,
        title: this.currentVideo.title,
        author: this.currentVideo.author,
        duration: this.currentVideo.duration,
        transcript: this.currentTranscript
      };

      // Generate analysis (multi-agent)
      const analysis = await this.analyzer.analyzeVideo(videoData);
      this.currentAnalysis = analysis;

      // Display summaries
      this.displaySummaries(analysis.summaries);

      // Display agent analyses
      this.displayAgentAnalyses(analysis.agentAnalyses);

      // Update button
      generateBtn.textContent = '✓ Summary Generated';
      setTimeout(() => {
        generateBtn.textContent = 'Regenerate Summary';
        generateBtn.disabled = false;
      }, 2000);

    } catch (error) {
      console.error('Summary generation error:', error);
      summaryContainer.innerHTML = `<div class="error-message">Failed to generate summary: ${error.message}</div>`;
      generateBtn.disabled = false;
      generateBtn.innerHTML = '<span class="icon">✨</span> Generate Summary';
    }
  }

  displaySummaries(summaries) {
    const container = document.getElementById('summary-container');
    if (!container) return;

    let html = '<div class="summaries-content">';

    // TLDR
    if (summaries.tldr) {
      html += `
        <div class="summary-section">
          <h3 class="summary-heading">🎯 TLDR</h3>
          <p class="summary-tldr">${this.escapeHtml(summaries.tldr)}</p>
        </div>
      `;
    }

    // Abstract
    if (summaries.abstract) {
      html += `
        <div class="summary-section">
          <h3 class="summary-heading">📝 Abstract</h3>
          <p class="summary-abstract">${this.escapeHtml(summaries.abstract)}</p>
        </div>
      `;
    }

    // Detailed Summary
    if (summaries.detailed) {
      html += `
        <div class="summary-section">
          <h3 class="summary-heading">📊 Detailed Summary</h3>
          <div class="summary-detailed">${this.formatSummaryText(summaries.detailed)}</div>
        </div>
      `;
    }

    // Key Moments
    if (summaries.keyMoments && summaries.keyMoments.length > 0) {
      html += `
        <div class="summary-section">
          <h3 class="summary-heading">⏱️ Key Moments</h3>
          <div class="key-moments-list">
            ${summaries.keyMoments.map(moment => `
              <div class="key-moment-item">
                <span class="moment-timestamp" data-time="${moment.timestamp}">${moment.timestamp}</span>
                <p class="moment-description">${this.escapeHtml(moment.description)}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    html += '</div>';
    
    // Add export button
    html += `
      <div class="summary-actions">
        <button id="export-summary-btn" class="secondary-button">
          <span class="icon">📥</span> Export Summary
        </button>
        <button id="copy-summary-btn" class="secondary-button">
          <span class="icon">📋</span> Copy to Clipboard
        </button>
      </div>
    `;

    container.innerHTML = html;

    // Add event listeners for timestamp clicks
    container.querySelectorAll('.moment-timestamp').forEach(el => {
      el.addEventListener('click', (e) => {
        const timestamp = e.target.dataset.time;
        this.jumpToTimestamp(timestamp);
      });
    });

    // Export and copy buttons
    document.getElementById('export-summary-btn')?.addEventListener('click', () => {
      const markdown = this.analyzer.exportToMarkdown(this.currentAnalysis, this.currentVideo);
      this.analyzer.downloadAsFile(markdown, `summary-${this.currentVideo.videoId}.md`, 'text/markdown');
    });

    document.getElementById('copy-summary-btn')?.addEventListener('click', async () => {
      const markdown = this.analyzer.exportToMarkdown(this.currentAnalysis, this.currentVideo);
      const success = await this.analyzer.copyToClipboard(markdown);
      alert(success ? 'Summary copied to clipboard!' : 'Failed to copy summary');
    });
  }

  displayAgentAnalyses(agentAnalyses) {
    const container = document.getElementById('analysis-container');
    if (!container || !agentAnalyses || agentAnalyses.length === 0) {
      container.innerHTML = '<div class="no-analysis">No agent analyses available</div>';
      return;
    }

    let html = '<div class="agent-analyses">';
    html += '<h3 class="section-heading">👥 Expert Perspectives</h3>';

    agentAnalyses.forEach(agent => {
      if (agent.error) {
        html += `
          <div class="agent-analysis error">
            <div class="agent-header">
              <span class="agent-emoji">${agent.emoji || '🤖'}</span>
              <span class="agent-name">${agent.persona}</span>
            </div>
            <div class="agent-content">
              <p class="error-message">Analysis failed: ${agent.error}</p>
            </div>
          </div>
        `;
      } else {
        html += `
          <div class="agent-analysis">
            <div class="agent-header">
              <span class="agent-emoji">${agent.emoji || '🤖'}</span>
              <span class="agent-name">${agent.persona}</span>
            </div>
            <div class="agent-content">
              ${this.formatSummaryText(agent.analysis)}
            </div>
          </div>
        `;
      }
    });

    html += '</div>';
    container.innerHTML = html;
  }

  formatSummaryText(text) {
    // Convert line breaks to paragraphs
    return text
      .split('\n\n')
      .map(para => `<p>${this.escapeHtml(para).replace(/\n/g, '<br>')}</p>`)
      .join('');
  }

  jumpToTimestamp(timestamp) {
    // Parse timestamp (MM:SS or HH:MM:SS)
    const parts = timestamp.split(':').reverse();
    const seconds = parseInt(parts[0] || 0) + 
                   parseInt(parts[1] || 0) * 60 + 
                   parseInt(parts[2] || 0) * 3600;

    // Update video player (if using iframe API)
    const iframe = document.querySelector('.video-player-container iframe');
    if (iframe) {
      const currentSrc = iframe.src;
      const baseUrl = currentSrc.split('?')[0];
      iframe.src = `${baseUrl}?autoplay=1&start=${seconds}`;
    }

    // Switch to transcript tab and scroll to segment
    this.handleTabSwitch('transcript');
    
    // TODO: Highlight the segment in transcript
    console.log(`Jumping to ${timestamp} (${seconds} seconds)`);
  }

  showLoading(show) {
    const loading = document.getElementById('video-loading');
    if (loading) {
      loading.style.display = show ? 'flex' : 'none';
    }
  }

  showError(message) {
    const error = document.getElementById('video-error');
    if (error) {
      error.textContent = message;
      error.style.display = 'block';
      setTimeout(() => {
        error.style.display = 'none';
      }, 5000);
    }
  }

  hideError() {
    const error = document.getElementById('video-error');
    if (error) {
      error.style.display = 'none';
    }
  }

  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  highlightMatch(text, query) {
    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    return this.escapeHtml(text).replace(regex, '<mark>$1</mark>');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

export default VideoUI;
