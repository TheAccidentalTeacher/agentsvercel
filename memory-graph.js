/**
 * Memory Knowledge Graph Visualization Module (Phase 10 Week 3)
 * 
 * Purpose: D3.js force-directed graph for visualizing memory connections
 * Features:
 * - Force-directed graph layout with physics simulation
 * - Color-coded nodes by content type (5 types)
 * - Link thickness based on connection strength
 * - Interactive zoom, pan, drag nodes
 * - Node click → memory details modal
 * - Hover → highlight connected nodes
 * - Filter by content type and date range
 * - Export graph (PNG, SVG, JSON)
 * - Mini-map for navigation (50+ nodes)
 * 
 * @module memory-graph
 * @requires d3.js v7+
 * @requires memory-ui.js
 */

window.MemoryGraph = (function() {
  'use strict';

  // Module state
  let state = {
    graphData: null,      // { nodes: [], links: [], stats: {} }
    simulation: null,     // D3 force simulation instance
    svg: null,            // SVG container
    g: null,              // Graph group (for zoom/pan)
    nodeElements: null,   // Node circles
    linkElements: null,   // Link lines
    labelElements: null,  // Node labels
    filters: {            // Active filters
      contentTypes: ['research', 'video', 'creative', 'conversation', 'manual'],
      dateFrom: null,
      dateTo: null
    },
    selectedNode: null,   // Currently selected node
    hoveredNode: null,    // Currently hovered node
    width: 0,             // Graph width
    height: 0             // Graph height
  };

  // Color scheme for node types
  const COLOR_MAP = {
    research: '#3b82f6',      // Blue
    video: '#ef4444',         // Red
    creative: '#a855f7',      // Purple
    conversation: '#10b981',  // Green
    manual: '#6b7280'         // Gray
  };

  // Force simulation parameters
  const FORCE_PARAMS = {
    charge: -300,           // Repulsion between nodes
    linkDistance: 100,      // Preferred distance between connected nodes
    collideRadius: 30,      // Collision detection radius
    centerStrength: 0.3,    // Strength of centering force
    alphaDecay: 0.02,       // Simulation cooling rate
    velocityDecay: 0.4      // Friction
  };

  /**
   * Initialize the knowledge graph visualization
   * @param {string} containerId - DOM element ID for graph container
   * @param {string} userId - Current user ID
   * @returns {Promise<void>}
   */
  async function init(containerId, userId) {
    console.log('[MemoryGraph] Initializing knowledge graph...');
    
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('[MemoryGraph] Container not found:', containerId);
      return;
    }

    // Set dimensions
    state.width = container.clientWidth || 800;
    state.height = container.clientHeight || 600;

    // Create SVG
    state.svg = d3.select(`#${containerId}`)
      .append('svg')
      .attr('width', state.width)
      .attr('height', state.height)
      .style('border', '1px solid #e5e7eb')
      .style('background', '#ffffff');

    // Create zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        state.g.attr('transform', event.transform);
      });
    
    state.svg.call(zoom);

    // Create main group for graph elements
    state.g = state.svg.append('g');

    // Listen for memory updates and deletions from modal
    window.addEventListener('memory-updated', (event) => {
      console.log('[MemoryGraph] Memory updated, refreshing graph...', event.detail);
      loadGraphData(userId);
    });
    
    window.addEventListener('memory-deleted', (event) => {
      console.log('[MemoryGraph] Memory deleted, refreshing graph...', event.detail);
      loadGraphData(userId);
    });

    // Load initial data
    await loadGraphData(userId);

    // Render graph
    renderGraph();

    console.log('[MemoryGraph] Initialized successfully');
  }

  /**
   * Load graph data from backend
   * @param {string} userId - Current user ID
   * @returns {Promise<void>}
   */
  async function loadGraphData(userId) {
    console.log('[MemoryGraph] Loading graph data...');

    try {
      const response = await fetch('/api/memory-graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          filters: {
            contentType: state.filters.contentTypes.length < 5 
              ? state.filters.contentTypes 
              : null,
            dateFrom: state.filters.dateFrom,
            dateTo: state.filters.dateTo
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      state.graphData = await response.json();
      console.log('[MemoryGraph] Loaded graph:', {
        nodes: state.graphData.nodes.length,
        links: state.graphData.links.length,
        stats: state.graphData.stats
      });

    } catch (error) {
      console.error('[MemoryGraph] Failed to load graph data:', error);
      throw error;
    }
  }

  /**
   * Render the force-directed graph
   */
  function renderGraph() {
    console.log('[MemoryGraph] Rendering graph...');

    if (!state.graphData || state.graphData.nodes.length === 0) {
      showEmptyState();
      return;
    }

    // Clear existing elements
    state.g.selectAll('*').remove();

    // Create links (must be added before nodes for z-index)
    state.linkElements = state.g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(state.graphData.links)
      .enter()
      .append('line')
      .attr('stroke', '#94a3b8')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => Math.sqrt(d.strength) * 2);

    // Create nodes
    state.nodeElements = state.g.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(state.graphData.nodes)
      .enter()
      .append('circle')
      .attr('r', d => d.size || 10)
      .attr('fill', d => COLOR_MAP[d.type] || COLOR_MAP.manual)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .style('cursor', 'grab')
      .call(d3.drag()
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded))
      .on('click', handleNodeClick)
      .on('dblclick', handleNodeDoubleClick)
      .on('mouseenter', handleNodeHover)
      .on('mouseleave', handleNodeUnhover);

    // Create labels
    state.labelElements = state.g.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(state.graphData.nodes)
      .enter()
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '10px')
      .attr('font-family', 'system-ui, sans-serif')
      .attr('fill', '#1f2937')
      .attr('pointer-events', 'none')
      .text(d => truncateLabel(d.label, 20));

    // Initialize force simulation
    state.simulation = d3.forceSimulation(state.graphData.nodes)
      .force('link', d3.forceLink(state.graphData.links)
        .id(d => d.id)
        .distance(FORCE_PARAMS.linkDistance))
      .force('charge', d3.forceManyBody()
        .strength(FORCE_PARAMS.charge))
      .force('center', d3.forceCenter(state.width / 2, state.height / 2)
        .strength(FORCE_PARAMS.centerStrength))
      .force('collide', d3.forceCollide()
        .radius(FORCE_PARAMS.collideRadius))
      .alphaDecay(FORCE_PARAMS.alphaDecay)
      .velocityDecay(FORCE_PARAMS.velocityDecay)
      .on('tick', ticked);

    console.log('[MemoryGraph] Graph rendered');
  }

  /**
   * Update element positions on each simulation tick
   */
  function ticked() {
    state.linkElements
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    state.nodeElements
      .attr('cx', d => d.x)
      .attr('cy', d => d.y);

    state.labelElements
      .attr('x', d => d.x)
      .attr('y', d => d.y + 20);
  }

  /**
   * Drag handlers
   */
  function dragStarted(event, d) {
    if (!event.active) state.simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
    
    // Change cursor during drag
    d3.select(event.sourceEvent.target).style('cursor', 'grabbing');
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragEnded(event, d) {
    if (!event.active) state.simulation.alphaTarget(0);
    // Keep node pinned at drag position (double-click to release)
    
    // Change cursor back
    d3.select(event.sourceEvent.target).style('cursor', 'grab');
  }
  
  /**
   * Handle double-click to unpin node
   * @param {Event} event - Double-click event
   * @param {Object} d - Node data
   */
  function handleNodeDoubleClick(event, d) {
    event.stopPropagation();
    d.fx = null;
    d.fy = null;
    state.simulation.alpha(0.3).restart();
    console.log('[MemoryGraph] Node unpinned:', d.label);
  }

  /**
   * Handle node click → show memory details modal
   * @param {Event} event - Click event
   * @param {Object} node - Node data
   */
  function handleNodeClick(event, node) {
    console.log('[MemoryGraph] Node clicked:', node.label);
    
    state.selectedNode = node;
    
    // Highlight selected node
    state.nodeElements
      .attr('stroke-width', d => d.id === node.id ? 4 : 2)
      .attr('stroke', d => d.id === node.id ? '#fbbf24' : '#ffffff');

    // TODO: Show memory details modal (Day 15-17)
    showMemoryPreview(node);
  }

  /**
   * Handle node hover → highlight connected nodes
   * @param {Event} event - Mouse enter event
   * @param {Object} node - Node data
   */
  function handleNodeHover(event, node) {
    state.hoveredNode = node;

    // Find connected node IDs
    const connectedIds = new Set([node.id]);
    state.graphData.links.forEach(link => {
      if (link.source.id === node.id) connectedIds.add(link.target.id);
      if (link.target.id === node.id) connectedIds.add(link.source.id);
    });

    // Fade unconnected nodes
    state.nodeElements
      .style('opacity', d => connectedIds.has(d.id) ? 1 : 0.2);
    
    state.labelElements
      .style('opacity', d => connectedIds.has(d.id) ? 1 : 0.2);

    // Highlight connected links
    state.linkElements
      .style('opacity', d => 
        d.source.id === node.id || d.target.id === node.id ? 1 : 0.1)
      .attr('stroke', d =>
        d.source.id === node.id || d.target.id === node.id ? '#fbbf24' : '#94a3b8');
  }

  /**
   * Handle node unhover → restore default opacity
   */
  function handleNodeUnhover() {
    state.hoveredNode = null;

    state.nodeElements.style('opacity', 1);
    state.labelElements.style('opacity', 1);
    state.linkElements
      .style('opacity', 0.6)
      .attr('stroke', '#94a3b8');
  }

  /**
   * Show empty state message
   */
  function showEmptyState() {
    state.g.append('text')
      .attr('x', state.width / 2)
      .attr('y', state.height / 2)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('fill', '#6b7280')
      .text('No memories to display. Create some memories to see connections!');
  }

  /**
   * Show memory details modal (Phase 10 Week 3 - Days 15-17)
   * @param {Object} node - Node data from graph
   */
  async function showMemoryPreview(node) {
    console.log('[MemoryGraph] Opening memory details modal for:', node.label);
    
    // Check if modal is available
    if (!window.memoryDetailsModal) {
      console.error('❌ Memory Details Modal not loaded');
      alert(`Memory: ${node.label}\n\n${node.fullContent || 'No content'}`);
      return;
    }
    
    try {
      // Convert node data to memory format expected by modal
      const memory = {
        id: node.id,
        title: node.label,
        content: node.fullContent || '',
        content_type: node.type,
        tags: node.tags || [],
        created_at: node.createdAt,
        updated_at: node.updatedAt || node.createdAt,
        source_url: node.sourceUrl,
        metadata: node.metadata
      };
      
      // Get connections for this node from graph data
      const connections = [];
      if (state.graphData && state.graphData.links) {
        state.graphData.links.forEach(link => {
          let targetNode = null;
          let strength = link.strength || 0.5;
          
          // Check if this node is source or target
          if (link.source.id === node.id) {
            targetNode = link.target;
          } else if (link.target.id === node.id) {
            targetNode = link.source;
          }
          
          if (targetNode) {
            connections.push({
              id: targetNode.id,
              title: targetNode.label,
              content: targetNode.fullContent || '',
              content_type: targetNode.type,
              created_at: targetNode.createdAt,
              connection_strength: strength
            });
          }
        });
      }
      
      // Show the modal
      window.memoryDetailsModal.show(memory, connections);
      
    } catch (err) {
      console.error('❌ Error showing memory details:', err);
      alert(`Memory: ${node.label}\n\n${node.fullContent || 'No content'}`);
    }
  }
  
  /**
   * Get connection count for a node
   * @param {Object} node - Node data
   * @returns {number} Connection count
   */
  function getConnectionCount(node) {
    if (!state.graphData || !state.graphData.links) return 0;
    return state.graphData.links.filter(link => 
      link.source.id === node.id || link.target.id === node.id
    ).length;
  }

  /**
   * Update filters and reload graph
   * @param {Object} newFilters - { contentTypes?, dateFrom?, dateTo? }
   * @param {string} userId - Current user ID
   */
  async function updateFilters(newFilters, userId) {
    console.log('[MemoryGraph] Updating filters:', newFilters);
    
    state.filters = { ...state.filters, ...newFilters };
    
    await loadGraphData(userId);
    renderGraph();
  }

  /**
   * Export graph as PNG
   */
  function exportPNG() {
    console.log('[MemoryGraph] Exporting as PNG...');
    
    const canvas = document.createElement('canvas');
    canvas.width = state.width;
    canvas.height = state.height;
    
    const ctx = canvas.getContext('2d');
    const svgData = new XMLSerializer().serializeToString(state.svg.node());
    const img = new Image();
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `memory-graph-${Date.now()}.png`;
        a.click();
      });
      URL.revokeObjectURL(url);
    };
    
    img.src = url;
  }

  /**
   * Export graph as SVG
   */
  function exportSVG() {
    console.log('[MemoryGraph] Exporting as SVG...');
    
    const svgData = new XMLSerializer().serializeToString(state.svg.node());
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `memory-graph-${Date.now()}.svg`;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  /**
   * Export graph data as JSON
   */
  function exportJSON() {
    console.log('[MemoryGraph] Exporting as JSON...');
    
    const json = JSON.stringify(state.graphData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `memory-graph-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  /**
   * Truncate label text
   * @param {string} text - Original text
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  function truncateLabel(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  /**
   * Cleanup and destroy graph
   */
  function destroy() {
    if (state.simulation) {
      state.simulation.stop();
    }
    if (state.svg) {
      state.svg.remove();
    }
    state = {
      graphData: null,
      simulation: null,
      svg: null,
      g: null,
      nodeElements: null,
      linkElements: null,
      labelElements: null,
      filters: {
        contentTypes: ['research', 'video', 'creative', 'conversation', 'manual'],
        dateFrom: null,
        dateTo: null
      },
      selectedNode: null,
      hoveredNode: null,
      width: 0,
      height: 0
    };
  }

  // Public API
  return {
    init,
    updateFilters,
    exportPNG,
    exportSVG,
    exportJSON,
    destroy
  };

})();
