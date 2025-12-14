/**
 * Content Chunker - Smart Text Splitting for LLM Processing
 * 
 * Intelligently splits long content into chunks that:
 * - Fit within LLM context windows
 * - Preserve semantic meaning
 * - Include overlap for continuity
 * - Respect natural boundaries (paragraphs, sections)
 */

class ContentChunker {
  constructor(options = {}) {
    this.maxChunkSize = options.maxChunkSize || 4000; // ~4000 tokens
    this.minChunkSize = options.minChunkSize || 1000; // ~1000 tokens
    this.overlapSize = options.overlapSize || 200;    // ~200 tokens overlap
    this.charsPerToken = 4; // Rough estimate: 1 token ≈ 4 chars
  }

  /**
   * Chunk content by sections with smart splitting
   */
  chunkContent(content, metadata = {}) {
    console.log(`📚 Chunking content (${content.length} chars, ~${this.estimateTokens(content)} tokens)`);

    // Split into paragraphs first
    const paragraphs = this.splitIntoParagraphs(content);
    
    const chunks = [];
    let currentChunk = '';
    let currentTokens = 0;

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];
      const paragraphTokens = this.estimateTokens(paragraph);

      // If single paragraph exceeds max size, split it further
      if (paragraphTokens > this.maxChunkSize) {
        // Save current chunk if it exists
        if (currentChunk) {
          chunks.push(this.createChunk(currentChunk, chunks.length, metadata));
          currentChunk = '';
          currentTokens = 0;
        }

        // Split large paragraph by sentences
        const subChunks = this.chunkLargeParagraph(paragraph, metadata, chunks.length);
        chunks.push(...subChunks);
        continue;
      }

      // Check if adding this paragraph would exceed max size
      if (currentTokens + paragraphTokens > this.maxChunkSize && currentChunk) {
        // Save current chunk
        chunks.push(this.createChunk(currentChunk, chunks.length, metadata));

        // Start new chunk with overlap from previous
        const overlap = this.getOverlap(currentChunk);
        currentChunk = overlap + '\n\n' + paragraph;
        currentTokens = this.estimateTokens(currentChunk);
      } else {
        // Add paragraph to current chunk
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        currentTokens += paragraphTokens;
      }
    }

    // Add final chunk
    if (currentChunk && currentTokens > this.minChunkSize / 2) {
      chunks.push(this.createChunk(currentChunk, chunks.length, metadata));
    }

    console.log(`✅ Created ${chunks.length} chunks`);
    return chunks;
  }

  /**
   * Split text into paragraphs
   */
  splitIntoParagraphs(text) {
    return text
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }

  /**
   * Split a large paragraph into smaller chunks by sentences
   */
  chunkLargeParagraph(paragraph, metadata, startIndex) {
    const sentences = this.splitIntoSentences(paragraph);
    const chunks = [];
    
    let currentChunk = '';
    let currentTokens = 0;

    for (const sentence of sentences) {
      const sentenceTokens = this.estimateTokens(sentence);

      if (currentTokens + sentenceTokens > this.maxChunkSize && currentChunk) {
        chunks.push(this.createChunk(currentChunk, startIndex + chunks.length, metadata));
        
        const overlap = this.getOverlap(currentChunk);
        currentChunk = overlap + ' ' + sentence;
        currentTokens = this.estimateTokens(currentChunk);
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
        currentTokens += sentenceTokens;
      }
    }

    if (currentChunk) {
      chunks.push(this.createChunk(currentChunk, startIndex + chunks.length, metadata));
    }

    return chunks;
  }

  /**
   * Split text into sentences
   */
  splitIntoSentences(text) {
    // Simple sentence splitting (can be improved with NLP)
    return text
      .split(/[.!?]+\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * Create a chunk object
   */
  createChunk(content, index, metadata) {
    const tokenEstimate = this.estimateTokens(content);
    
    return {
      index,
      content: content.trim(),
      tokenEstimate,
      charCount: content.length,
      wordCount: this.countWords(content),
      ...metadata
    };
  }

  /**
   * Get overlap text from end of chunk
   */
  getOverlap(text) {
    const words = text.split(/\s+/);
    const overlapWords = Math.min(
      Math.floor(this.overlapSize / this.charsPerToken),
      words.length
    );
    
    return words.slice(-overlapWords).join(' ');
  }

  /**
   * Estimate token count from text
   */
  estimateTokens(text) {
    if (!text) return 0;
    return Math.ceil(text.length / this.charsPerToken);
  }

  /**
   * Count words in text
   */
  countWords(text) {
    if (!text) return 0;
    return text.split(/\s+/).filter(w => w.length > 0).length;
  }

  /**
   * Chunk multiple documents
   */
  chunkMultiple(documents) {
    console.log(`📚 Chunking ${documents.length} documents`);
    
    const allChunks = [];
    
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      
      if (doc.error) {
        console.log(`⚠️ Skipping document ${i + 1} (error: ${doc.error})`);
        continue;
      }

      const metadata = {
        sourceUrl: doc.url,
        sourceTitle: doc.title,
        sourceIndex: i,
        author: doc.author,
        publishedDate: doc.publishedDate
      };

      const chunks = this.chunkContent(doc.content, metadata);
      allChunks.push(...chunks);
    }

    console.log(`✅ Total chunks created: ${allChunks.length}`);
    return allChunks;
  }

  /**
   * Get chunking statistics
   */
  getStats() {
    return {
      maxChunkSize: this.maxChunkSize,
      minChunkSize: this.minChunkSize,
      overlapSize: this.overlapSize,
      charsPerToken: this.charsPerToken
    };
  }
}

module.exports = { ContentChunker };
