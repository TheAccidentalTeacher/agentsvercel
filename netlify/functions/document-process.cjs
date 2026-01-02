// Phase 11 Week 2: Document Processing (Text Extraction)
// Extracts text from uploaded documents (PDF, DOCX, TXT, XLSX)

const { createClient } = require('@supabase/supabase-js');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const XLSX = require('xlsx');

// Initialize Supabase client with service role key (bypasses RLS)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Extract text from PDF document
 */
async function extractPdfText(buffer) {
  try {
    const data = await pdfParse(buffer);
    return {
      text: data.text,
      pageCount: data.numpages,
      wordCount: data.text.split(/\s+/).filter(w => w.length > 0).length
    };
  } catch (error) {
    throw new Error(`PDF extraction failed: ${error.message}`);
  }
}

/**
 * Extract text from DOCX document
 */
async function extractDocxText(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;
    return {
      text,
      pageCount: Math.ceil(text.length / 3000), // Rough estimate: 3000 chars per page
      wordCount: text.split(/\s+/).filter(w => w.length > 0).length
    };
  } catch (error) {
    throw new Error(`DOCX extraction failed: ${error.message}`);
  }
}

/**
 * Extract text from TXT document
 */
async function extractTxtText(buffer) {
  try {
    const text = buffer.toString('utf-8');
    return {
      text,
      pageCount: Math.ceil(text.length / 3000),
      wordCount: text.split(/\s+/).filter(w => w.length > 0).length
    };
  } catch (error) {
    throw new Error(`TXT extraction failed: ${error.message}`);
  }
}

/**
 * Extract text from EPUB document
 */
async function extractEpubText(buffer) {
  try {
    const epub = await epubParser.parse(buffer);
    let text = '';
    
    // Extract text from all chapters
    if (epub.structure && epub.structure.length > 0) {
      for (const chapter of epub.structure) {
        if (chapter.content) {
          // Strip HTML tags
          const cleanText = chapter.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
          text += cleanText + '\n\n';
        }
      }
    }
    
    return {
      text: text.trim(),
      pageCount: Math.ceil(text.length / 3000),
      wordCount: text.split(/\s+/).filter(w => w.length > 0).length
    };
  } catch (error) {
    throw new Error(`EPUB extraction failed: ${error.message}`);
  }
}

/**
 * Extract text from XLSX/XLS document
 */
async function extractXlsxText(buffer) {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    let text = '';
    
    // Extract text from all sheets
    workbook.SheetNames.forEach(sheetName => {
      text += `Sheet: ${sheetName}\n\n`;
      const sheet = workbook.Sheets[sheetName];
      const csvText = XLSX.utils.sheet_to_csv(sheet);
      text += csvText + '\n\n';
    });
    
    return {
      text: text.trim(),
      pageCount: workbook.SheetNames.length, // Use sheet count as "page" count
      wordCount: text.split(/\s+/).filter(w => w.length > 0).length
    };
  } catch (error) {
    throw new Error(`XLSX extraction failed: ${error.message}`);
  }
}

/**
 * Extract text from images using OCR
 */
async function extractImageText(buffer, mimeType) {
  try {
    const { data: { text } } = await Tesseract.recognize(buffer, 'eng', {
      logger: m => console.log('[OCR]', m)
    });
    
    return {
      text: text.trim(),
      pageCount: 1,
      wordCount: text.split(/\s+/).filter(w => w.length > 0).length
    };
  } catch (error) {
    throw new Error(`Image OCR failed: ${error.message}`);
  }
}

/**
 * Extract text based on file type
 */
async function extractText(buffer, fileType) {
  const type = fileType.toLowerCase();
  
  if (type === 'application/pdf' || type.includes('pdf')) {
    return await extractPdfText(buffer);
  } else if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || type.includes('word') || type.includes('docx')) {
    return await extractDocxText(buffer);
  } else if (type === 'text/plain' || type.includes('txt')) {
    return await extractTxtText(buffer);
  } else if (type === 'application/epub+zip' || type.includes('epub')) {
    return await extractEpubText(buffer);
  } else if (type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || type === 'application/vnd.ms-excel' || type.includes('xls')) {
    return await extractXlsxText(buffer);
  } else if (type.startsWith('image/')) {
    return await extractImageText(buffer, fileType);
  } else {
    throw new Error(`Unsupported file type: ${fileType}`);
  }
}

/**
 * Main handler for document processing
 */
exports.handler = async (event) => {
  const startTime = Date.now();
  console.log('\n📄 [Process] Document processing request received');

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Parse request body (outside try block so catch can access it)
  let documentId;
  try {
    const body = JSON.parse(event.body || '{}');
    documentId = body.documentId;

    if (!documentId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Document ID is required' })
      };
    }

    console.log(`📄 [Process] Processing document: ${documentId}`);

    // Step 1: Get document metadata from database
    const { data: document, error: fetchError } = await supabase
      .from('user_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError || !document) {
      console.error('❌ [Process] Document not found:', fetchError);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Document not found' })
      };
    }

    console.log(`📄 [Process] Document found: ${document.filename} (${document.file_type})`);

    // Step 2: Update status to processing
    await supabase
      .from('user_documents')
      .update({ processing_status: 'processing' })
      .eq('id', documentId);

    // Step 3: Download file from Supabase Storage
    console.log(`📥 [Process] Downloading from: ${document.storage_path}`);
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('Documents')
      .download(document.storage_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message || 'Unknown error'}`);
    }

    // Step 4: Convert blob to buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`📥 [Process] Downloaded ${buffer.length} bytes`);

    // Step 5: Extract text
    console.log(`🔍 [Process] Extracting text from ${document.file_type}...`);
    const { text, pageCount, wordCount } = await extractText(buffer, document.file_type);
    
    console.log(`✅ [Process] Extracted ${wordCount} words from ${pageCount} pages`);

    // Step 6: Update document with extracted text and metadata
    const { error: updateError } = await supabase
      .from('user_documents')
      .update({
        extracted_text: text,
        page_count: pageCount,
        word_count: wordCount,
        processing_status: 'completed',
        error_message: null
      })
      .eq('id', documentId);

    if (updateError) {
      throw new Error(`Failed to update document: ${updateError.message}`);
    }

    const duration = Date.now() - startTime;
    console.log(`✅ [Process] Document processing completed in ${duration}ms`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        documentId,
        pageCount,
        wordCount,
        processingTime: duration
      })
    };

  } catch (error) {
    console.error('❌ [Process] Error:', error);

    // Try to update document status to error
    if (documentId) {
      try {
        await supabase
          .from('user_documents')
          .update({
            processing_status: 'error',
            error_message: error.message
          })
          .eq('id', documentId);
      } catch (updateError) {
        console.error('❌ [Process] Failed to update error status:', updateError);
      }
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Document processing failed',
        details: error.message
      })
    };
  }
};
