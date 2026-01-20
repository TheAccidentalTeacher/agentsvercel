/**
 * Vercel API Route: Document Process
 * Extracts text from uploaded documents (PDF, DOCX, TXT, XLSX)
 */

import { createClient } from '@supabase/supabase-js';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import XLSX from 'xlsx';

export const config = {
  maxDuration: 60,
  api: {
    bodyParser: {
      sizeLimit: '50mb'
    }
  }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { documentId, fileData, fileType, userId } = req.body;

    if (!documentId || !fileData) {
      return res.status(400).json({ 
        error: 'documentId and fileData are required' 
      });
    }

    console.log(`[Document Process] Processing document: ${documentId}`);

    // Decode base64 file data
    const buffer = Buffer.from(fileData, 'base64');
    
    // Extract text based on file type
    const extracted = await extractText(buffer, fileType);

    console.log(`[Document Process] Extracted ${extracted.wordCount} words from ${documentId}`);

    // Update document in database
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        extracted_text: extracted.text,
        word_count: extracted.wordCount,
        page_count: extracted.pageCount,
        status: 'processed',
        processed_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('[Document Process] DB update error:', updateError);
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    return res.status(200).json({
      success: true,
      documentId,
      wordCount: extracted.wordCount,
      pageCount: extracted.pageCount,
      textPreview: extracted.text.substring(0, 500)
    });

  } catch (error) {
    console.error('[Document Process] Error:', error);
    return res.status(500).json({
      error: 'Document processing failed',
      details: error.message
    });
  }
}

async function extractText(buffer, fileType) {
  const type = (fileType || '').toLowerCase();

  if (type.includes('pdf')) {
    const data = await pdfParse(buffer);
    return {
      text: data.text,
      pageCount: data.numpages,
      wordCount: data.text.split(/\s+/).filter(w => w.length > 0).length
    };
  }

  if (type.includes('word') || type.includes('docx')) {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;
    return {
      text,
      pageCount: Math.ceil(text.length / 3000),
      wordCount: text.split(/\s+/).filter(w => w.length > 0).length
    };
  }

  if (type.includes('spreadsheet') || type.includes('xlsx') || type.includes('xls')) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    let text = '';
    
    workbook.SheetNames.forEach(sheetName => {
      text += `Sheet: ${sheetName}\n\n`;
      const sheet = workbook.Sheets[sheetName];
      text += XLSX.utils.sheet_to_csv(sheet) + '\n\n';
    });
    
    return {
      text: text.trim(),
      pageCount: workbook.SheetNames.length,
      wordCount: text.split(/\s+/).filter(w => w.length > 0).length
    };
  }

  if (type.includes('text') || type.includes('txt')) {
    const text = buffer.toString('utf-8');
    return {
      text,
      pageCount: Math.ceil(text.length / 3000),
      wordCount: text.split(/\s+/).filter(w => w.length > 0).length
    };
  }

  throw new Error(`Unsupported file type: ${fileType}`);
}
