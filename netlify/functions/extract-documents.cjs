/**
 * Extract text from multiple documents
 * Supports PDF, DOCX, TXT, XLSX
 */

const rawPdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);

// Extraction safeguards
const OCR_PAGE_LIMIT = 20;       // Avoid unbounded OCR work on huge scans
const SCAN_THRESHOLD = 10;       // Words/page below this triggers OCR fallback

// Quick check to see if a rendered canvas is effectively blank (all white/transparent)
function isCanvasBlank(ctx, width, height) {
  const data = ctx.getImageData(0, 0, width, height).data;
  let nonBlank = 0;
  // Limit work: break early after seeing enough colored pixels
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha > 5) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r < 250 || g < 250 || b < 250) {
        nonBlank++;
        if (nonBlank > 500) break;
      }
    }
  }
  return nonBlank === 0;
}

// Resolve pdf-parse export shape across versions (function vs default vs named)
function getPdfParseFn(raw) {
  if (typeof raw === 'function') return raw;
  if (raw && typeof raw.default === 'function') return raw.default;
  if (raw && typeof raw.PDFParse === 'function') return raw.PDFParse;
  return null;
}

// OCR functionality temporarily disabled (requires tesseract.js and canvas packages)
const OCR_AVAILABLE = false;

/**
 * Extract PDF using Ghostscript + OCR (DISABLED - requires tesseract.js)
 * Falls back to basic pdf-parse
 */
async function extractPdfWithGhostscript(pdfBuffer, pageCount, filename) {
  console.log(`[extractPdfWithGhostscript] ⚠️ OCR disabled - using basic PDF extraction for ${filename}`);
  
  // OCR not available - use basic pdf-parse instead
  try {
    const data = await rawPdfParse(pdfBuffer);
    return data.text || '';
  } catch (error) {
    console.error(`[extractPdfWithGhostscript] ❌ Basic extraction failed:`, error);
    return '';
  }
}        
      } catch (pageError) {
        console.error(`[extractPdfWithGhostscript] Error processing page ${pageNum}:`, pageError.message);
      }
      
      const elapsed = ((Date.now() - ocrStartTime) / 1000).toFixed(1);
      console.log(`[extractPdfWithGhostscript] ✓ Page ${pageNum} done (${elapsed}s elapsed)`);
    }
    
    const totalTime = ((Date.now() - ocrStartTime) / 1000).toFixed(1);
    const wordCount = allText.split(/\s+/).filter(w => w.length > 0).length;
    console.log(`[extractPdfWithGhostscript] ✅ Ghostscript + OCR complete: ${wordCount} words extracted in ${totalTime}s`);
    
    return {
      text: allText.trim(),
      pageCount,
      wordCount
    };
    
  } finally {
    // Clean up temp PDF
    try {
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }
    } catch (e) {
      console.error(`[extractPdfWithGhostscript] Failed to clean up ${pdfPath}:`, e.message);
    }
  }
}

exports.handler = async (event) => {
  console.log('[extract-documents] Request received');
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse multipart form data
    const contentType = event.headers['content-type'] || event.headers['Content-Type'];
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Content-Type must be multipart/form-data' })
      };
    }

    const files = await parseMultipartFormData(event);
    console.log('[extract-documents] Received', files.length, 'files');

    const results = [];

    for (const file of files) {
      console.log('[extract-documents] Processing:', file.filename, 'Type:', file.contentType);
      
      try {
        const extracted = await extractText(file.data, file.contentType, file.filename);
        
        results.push({
          filename: file.filename,
          contentType: file.contentType,
          size: file.data.length,
          text: extracted.text,
          wordCount: extracted.wordCount,
          pageCount: extracted.pageCount,
          success: true
        });
        
        console.log('[extract-documents] ✓', file.filename, '-', extracted.wordCount, 'words');
      } catch (error) {
        console.error('[extract-documents] ✗', file.filename, 'Error:', error.message);
        results.push({
          filename: file.filename,
          contentType: file.contentType,
          size: file.data.length,
          error: error.message,
          success: false
        });
      }
    }

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ files: results })
    };

  } catch (error) {
    console.error('[extract-documents] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

/**
 * Extract text from file buffer
 */
async function extractText(buffer, contentType, filename) {
  const type = contentType.toLowerCase();
  const ext = filename.split('.').pop().toLowerCase();

  // PDF
  if (type.includes('pdf') || ext === 'pdf') {
    console.log(`[extract-documents] Extracting PDF: ${filename}, buffer size: ${buffer.length} bytes`);
    
    // Handle pdf-parse variations (function vs class) across versions
    let parsed;
    const pdfParseFn = getPdfParseFn(rawPdfParse);
    if (!pdfParseFn) {
      throw new Error('pdf-parse parser function not found');
    }
    try {
      parsed = await pdfParseFn(buffer);
    } catch (err) {
      if (err && err.message && err.message.includes("Class constructors cannot be invoked without 'new'")) {
        // pdf-parse might be exported as a class in this build; try with new
        parsed = await (new pdfParseFn(buffer));
      } else {
        throw err;
      }
    }
    let text = parsed.text || '';
    let pageCount = parsed.numpages || parsed.total || 0;
    
    console.log(`[extract-documents] PDF extracted: ${pageCount} pages, ${text.length} chars`);
    console.log(`[extract-documents] First 500 chars: ${text.substring(0, 500)}`);
    console.log(`[extract-documents] Last 300 chars: ${text.substring(Math.max(0, text.length - 300))}`);
    
    // Count actual words in the full extracted text
    let wordsFound = text.split(/\s+/).filter(w => w.length > 0).length;
    let wordsPerPage = pageCount ? wordsFound / Math.max(pageCount, 1) : 0;
    console.log(`[extract-documents] Total words found: ${wordsFound}`);

    // Fallback if pdf-parse returns nothing
    if (wordsFound === 0 || wordsPerPage < SCAN_THRESHOLD) {
      console.log('[extract-documents] Empty result from pdf-parse; falling back to pdfjs-dist extraction');
      const pdfJsResult = await extractPdfWithPdfJs(buffer, filename);
      text = pdfJsResult.text;
      pageCount = pdfJsResult.pageCount;
      wordsFound = pdfJsResult.wordCount;
      wordsPerPage = pageCount ? wordsFound / Math.max(pageCount, 1) : 0;
      console.log(`[extract-documents] Fallback pdfjs-dist extracted: ${pageCount} pages, ${wordsFound} words`);
      console.log(`[extract-documents] Fallback First 500 chars: ${text.substring(0, 500)}`);
      console.log(`[extract-documents] Fallback Last 300 chars: ${text.substring(Math.max(0, text.length - 300))}`);

      // If pdfjs-dist also returns nothing (likely damaged text streams), fall back to Ghostscript + OCR
      if (wordsFound === 0) {
        console.log('[extract-documents] pdfjs-dist returned no text; starting Ghostscript + OCR fallback');
        try {
          const ghostscriptResult = await extractPdfWithGhostscript(buffer, pageCount || parsed.numpages || 0, filename);
          text = ghostscriptResult.text;
          pageCount = ghostscriptResult.pageCount;
          wordsFound = ghostscriptResult.wordCount;
          wordsPerPage = pageCount ? wordsFound / Math.max(pageCount, 1) : 0;
          console.log(`[extract-documents] Ghostscript + OCR fallback extracted: ${pageCount} pages, ${wordsFound} words`);
        } catch (gsErr) {
          console.error('[extract-documents] Ghostscript + OCR fallback failed:', gsErr.message);
        }
      }
    }

    // If words/page are still low, assume scanned PDF and run controlled OCR pass
    if (wordsPerPage < SCAN_THRESHOLD) {
      console.log(`[extract-documents] Detected scanned/low-text PDF (${wordsPerPage.toFixed(2)} words/page) — starting OCR fallback with limit ${OCR_PAGE_LIMIT}`);
      try {
        const ocrResult = await extractTextWithOCR(buffer, pageCount || parsed.numpages || 0, filename);
        text = ocrResult.text;
        pageCount = ocrResult.pageCount;
        wordsFound = ocrResult.wordCount;
        return {
          text,
          pageCount,
          wordCount: wordsFound,
          ocrLimited: ocrResult.ocrLimited,
          ocrPagesProcessed: ocrResult.ocrPagesProcessed,
          ocrTotalPages: ocrResult.ocrTotalPages
        };
      } catch (ocrErr) {
        console.error('[extract-documents] OCR fallback failed:', ocrErr.message);
      }
    }
    
    return {
      text,
      pageCount,
      wordCount: wordsFound
    };
  }

  // Word documents
  if (type.includes('word') || type.includes('docx') || ext === 'docx' || ext === 'doc') {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;
    return {
      text,
      pageCount: Math.ceil(text.length / 3000),
      wordCount: text.split(/\s+/).filter(w => w.length > 0).length
    };
  }

  // Excel files
  if (type.includes('spreadsheet') || type.includes('excel') || ext === 'xlsx' || ext === 'xls') {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    let text = '';
    
    workbook.SheetNames.forEach(sheetName => {
      text += `Sheet: ${sheetName}\n\n`;
      const sheet = workbook.Sheets[sheetName];
      const csvText = XLSX.utils.sheet_to_csv(sheet);
      text += csvText + '\n\n';
    });
    
    return {
      text: text.trim(),
      pageCount: workbook.SheetNames.length,
      wordCount: text.split(/\s+/).filter(w => w.length > 0).length
    };
  }

  // Images (OCR)
  if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
    const { data: { text } } = await Tesseract.recognize(buffer, 'eng', {
      logger: m => console.log('[OCR]', m)
    });
    
    return {
      text: text.trim(),
      pageCount: 1,
      wordCount: text.split(/\s+/).filter(w => w.length > 0).length
    };
  }

  // Plain text
  if (type.includes('text') || ext === 'txt') {
    const text = buffer.toString('utf-8');
    return {
      text,
      pageCount: Math.ceil(text.split(/\s+/).length / 500),
      wordCount: text.split(/\s+/).filter(w => w.length > 0).length
    };
  }

  throw new Error(`Unsupported file type: ${contentType} (.${ext})`);
}

// Fallback PDF extraction using pdfjs-dist when pdf-parse yields empty text
async function extractPdfWithPdfJs(buffer, filename) {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer), useSystemFonts: true });
  const pdfDoc = await loadingTask.promise;
  const pageCount = pdfDoc.numPages;
  let allText = '';

  console.log(`[extractPdfWithPdfJs] Processing ${pageCount} pages...`);

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    console.log(`[extractPdfWithPdfJs] Page ${pageNum}: textContent.items.length = ${textContent.items.length}`);
    
    if (textContent.items.length > 0) {
      console.log(`[extractPdfWithPdfJs] Page ${pageNum} first 3 items:`, textContent.items.slice(0, 3).map(i => ({ str: i.str, hasEOL: i.hasEOL })));
    }
    
    const pageText = textContent.items.map(item => item.str).join(' ');
    console.log(`[extractPdfWithPdfJs] Page ${pageNum}: extracted ${pageText.length} chars`);
    
    if (pageText.trim()) {
      allText += `\n\n--- Page ${pageNum} ---\n\n${pageText.trim()}`;
    }
  }

  const wordCount = allText.split(/\s+/).filter(w => w.length > 0).length;
  console.log(`[extractPdfWithPdfJs] Total text length: ${allText.length}, word count: ${wordCount}`);
  
  return {
    text: allText.trim(),
    pageCount,
    wordCount
  };
}

/**
 * Parse multipart/form-data
 */
async function parseMultipartFormData(event) {
  const contentType = event.headers['content-type'] || event.headers['Content-Type'];
  const boundary = contentType.split('boundary=')[1];
  
  if (!boundary) {
    throw new Error('No boundary found in Content-Type');
  }

  const body = event.isBase64Encoded 
    ? Buffer.from(event.body, 'base64')
    : Buffer.from(event.body, 'binary');

  const parts = [];
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const endBoundary = Buffer.from(`--${boundary}--`);

  let position = 0;

  while (position < body.length) {
    // Find next boundary
    const boundaryIndex = body.indexOf(boundaryBuffer, position);
    if (boundaryIndex === -1) break;

    // Skip boundary
    position = boundaryIndex + boundaryBuffer.length;

    // Skip CRLF after boundary
    if (body[position] === 13 && body[position + 1] === 10) {
      position += 2;
    }

    // Check for end boundary
    if (body.slice(position - 2, position).toString() === '--') break;

    // Find headers end (double CRLF)
    const headersEnd = body.indexOf(Buffer.from('\r\n\r\n'), position);
    if (headersEnd === -1) break;

    const headers = body.slice(position, headersEnd).toString();
    position = headersEnd + 4;

    // Find next boundary
    const nextBoundary = body.indexOf(boundaryBuffer, position);
    if (nextBoundary === -1) break;

    // Extract file data (remove trailing CRLF)
    const fileData = body.slice(position, nextBoundary - 2);

    // Parse headers
    const filenameMatch = headers.match(/filename="([^"]+)"/);
    const contentTypeMatch = headers.match(/Content-Type:\s*([^\r\n]+)/i);

    if (filenameMatch) {
      parts.push({
        filename: filenameMatch[1],
        contentType: contentTypeMatch ? contentTypeMatch[1].trim() : 'application/octet-stream',
        data: fileData
      });
    }

    position = nextBoundary;
  }

  return parts;
}

/**
 * Extract text from scanned PDF using OCR
 */
async function extractTextWithOCR(pdfBuffer, pageCount, filename) {
  console.log(`[extract-documents] 🚀 Starting OCR extraction for ${filename} (${pageCount} pages)`);
  
  const startTime = Date.now();
  let allText = '';
  
  try {
    // Initialize Tesseract worker
    const { createWorker } = require('tesseract.js');
    const worker = await createWorker('eng', 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`[extract-documents] OCR progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
    
    // Load PDF with pdfjs-dist
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
      // CRITICAL: Enable maximum error recovery
      stopAtErrors: false,
      disableFontFace: false,
      // Continue rendering even if individual objects fail
      ignoreErrors: true,
      verbosity: pdfjsLib.VerbosityLevel.WARNINGS
    });
    const pdfDoc = await loadingTask.promise;
    
    const totalPages = pdfDoc.numPages;
    const pagesToProcess = Math.min(totalPages, OCR_PAGE_LIMIT);
    console.log(`[extract-documents] PDF loaded, processing ${pagesToProcess}/${totalPages} pages with OCR (limit=${OCR_PAGE_LIMIT})...`);
    
    // Process each page (with cap)
    for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
      console.log(`[extract-documents] 📄 OCR Page ${pageNum}/${pdfDoc.numPages}...`);
      
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 }); // Higher scale = better OCR quality
      
      // Create canvas and render PDF page to it
      // Critical: Provide explicit canvas dimensions and context options
      const canvas = createCanvas(Math.floor(viewport.width), Math.floor(viewport.height));
      const context = canvas.getContext('2d', {
        alpha: false,  // No transparency - solid white background
        willReadFrequently: true  // Optimize for getImageData calls
      });
      
      // Fill with white background BEFORE rendering
      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Render PDF page with error handling
      try {
        await page.render({
          canvasContext: context,
          viewport: viewport,
          intent: 'print',  // Use 'print' intent for higher quality
          renderInteractiveForms: false,
          annotationMode: 0  // Disable annotations
        }).promise;
      } catch (renderErr) {
        console.warn(`[extract-documents] Render error on page ${pageNum}:`, renderErr.message);
        // Continue anyway - we'll check if canvas is blank below
      }
      
      const isBlank = isCanvasBlank(context, canvas.width, canvas.height);

      // Convert canvas to image buffer for Tesseract
      const imageData = canvas.toDataURL();

      // Debug: persist rendered page image to temp so we can inspect what OCR sees
      try {
        const pngBuffer = canvas.toBuffer('image/png');
        const debugPath = path.join(os.tmpdir(), `ocr-debug-${Date.now()}-p${pageNum}.png`);
        fs.writeFileSync(debugPath, pngBuffer);
        console.log(`[extract-documents] Saved OCR debug image: ${debugPath} (${pngBuffer.length} bytes)`);
      } catch (writeErr) {
        console.warn('[extract-documents] Could not write OCR debug image:', writeErr.message);
      }

      if (isBlank) {
        console.warn(`[extract-documents] Page ${pageNum} render appears blank (likely unreadable stream); skipping OCR for this page.`);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[extract-documents] ✓ Page ${pageNum} done (${elapsed}s elapsed)`);
        continue;
      }
      
      // Run OCR on the page
      const { data: { text } } = await worker.recognize(imageData);
      
      if (text.trim()) {
        allText += `\n\n--- Page ${pageNum} ---\n\n${text.trim()}`;
      }
      
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[extract-documents] ✓ Page ${pageNum} done (${elapsed}s elapsed)`);
    }
    
    // Cleanup
    await worker.terminate();
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    const wordCount = allText.split(/\s+/).filter(w => w.length > 0).length;
    
    console.log(`[extract-documents] ✅ OCR complete: ${wordCount} words extracted in ${totalTime}s`);

    const truncatedNotice = totalPages > OCR_PAGE_LIMIT
      ? `[Note: This ${totalPages}-page PDF was OCR-scanned. Showing first ${OCR_PAGE_LIMIT} pages only for performance reasons.]\n\n`
      : '';
    
    return {
      text: `${truncatedNotice}${allText.trim()}`,
      pageCount: totalPages,
      wordCount: wordCount,
      extractionMethod: 'OCR',
      extractionTime: parseFloat(totalTime),
      ocrLimited: totalPages > OCR_PAGE_LIMIT,
      ocrPagesProcessed: pagesToProcess,
      ocrTotalPages: totalPages
    };
    
  } catch (error) {
    console.error(`[extract-documents] ❌ OCR extraction failed:`, error);
    throw new Error(`OCR extraction failed: ${error.message}`);
  }
}
