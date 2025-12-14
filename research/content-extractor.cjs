/**
 * Content Extractor - Web Scraping & Content Cleaning
 * 
 * Fetches web pages and extracts main content using:
 * - Cheerio for HTML parsing
 * - Mozilla Readability for article extraction
 * - Smart content cleaning and formatting
 */

const cheerio = require('cheerio');
const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');

class ContentExtractor {
  constructor(options = {}) {
    this.timeout = options.timeout || 10000; // 10 seconds
    this.userAgent = options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
  }

  /**
   * Extract content from a single URL
   */
  async extractFromURL(url) {
    console.log(`📄 Extracting content from: ${url}`);
    
    try {
      const html = await this.fetchHTML(url);
      const content = this.extractContent(html, url);
      
      console.log(`✅ Extracted ${content.wordCount} words from ${url}`);
      
      return {
        url,
        title: content.title,
        content: content.textContent,
        excerpt: content.excerpt,
        wordCount: content.wordCount,
        author: content.author,
        publishedDate: content.publishedDate,
        extractedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`❌ Failed to extract from ${url}:`, error.message);
      return {
        url,
        error: error.message,
        extractedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Fetch HTML from URL
   */
  async fetchHTML(url) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      return html;

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Extract readable content from HTML
   */
  extractContent(html, url) {
    // Create DOM for Readability
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      // Fallback to cheerio extraction
      return this.fallbackExtraction(html);
    }

    // Clean and format content
    const cleaned = this.cleanContent(article.content);

    return {
      title: article.title || 'Untitled',
      textContent: cleaned,
      excerpt: article.excerpt || cleaned.substring(0, 200) + '...',
      wordCount: this.countWords(cleaned),
      author: article.byline || null,
      publishedDate: article.publishedTime || null
    };
  }

  /**
   * Fallback extraction using Cheerio (when Readability fails)
   */
  fallbackExtraction(html) {
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, iframe, .ad, .advertisement').remove();

    // Try to find main content
    let content = '';
    
    // Try common article selectors
    const articleSelectors = [
      'article',
      '[role="main"]',
      'main',
      '.post-content',
      '.article-content',
      '.entry-content',
      '#content'
    ];

    for (const selector of articleSelectors) {
      const element = $(selector);
      if (element.length) {
        content = element.text();
        break;
      }
    }

    // If still no content, get body text
    if (!content) {
      content = $('body').text();
    }

    const cleaned = this.cleanContent(content);

    return {
      title: $('title').text() || 'Untitled',
      textContent: cleaned,
      excerpt: cleaned.substring(0, 200) + '...',
      wordCount: this.countWords(cleaned),
      author: null,
      publishedDate: null
    };
  }

  /**
   * Clean extracted content
   */
  cleanContent(content) {
    if (!content) return '';

    // Remove HTML tags if any remain
    let cleaned = content.replace(/<[^>]*>/g, '');

    // Normalize whitespace
    cleaned = cleaned
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();

    return cleaned;
  }

  /**
   * Extract content from multiple URLs in parallel
   */
  async extractMultiple(urls, options = {}) {
    const { batchSize = 3 } = options;

    console.log(`📦 Extracting ${urls.length} URLs (batch size: ${batchSize})`);

    const results = [];

    // Process in batches to avoid overwhelming servers
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      
      console.log(`📥 Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(urls.length / batchSize)}...`);

      const batchResults = await Promise.all(
        batch.map(url => this.extractFromURL(url))
      );

      results.push(...batchResults);

      // Small delay between batches to be polite
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const successful = results.filter(r => !r.error);
    console.log(`✅ Successfully extracted ${successful.length}/${urls.length} sources`);

    return results;
  }

  /**
   * Count words in text
   */
  countWords(text) {
    if (!text) return 0;
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Get extraction statistics
   */
  getStats() {
    return {
      timeout: this.timeout,
      userAgent: this.userAgent
    };
  }
}

module.exports = { ContentExtractor };
