/**
 * Vercel API Route: Extract Documents
 * Supports PDF, DOCX, TXT, XLSX
 */

import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import XLSX from 'xlsx';

export const config = {
  maxDuration: 60,
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Content-Type must be multipart/form-data' });
    }

    const files = await parseMultipartFormData(req);
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

    return res.status(200).json({ files: results });

  } catch (error) {
    console.error('[extract-documents] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function extractText(buffer, contentType, filename) {
  const type = contentType.toLowerCase();
  const ext = filename.split('.').pop().toLowerCase();

  if (type.includes('pdf') || ext === 'pdf') {
    const data = await pdfParse(buffer);
    return {
      text: data.text || '',
      pageCount: data.numpages || 1,
      wordCount: (data.text || '').split(/\s+/).filter(w => w.length > 0).length
    };
  }

  if (type.includes('wordprocessingml') || type.includes('msword') || ext === 'docx' || ext === 'doc') {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;
    return {
      text,
      pageCount: Math.ceil(text.length / 3000),
      wordCount: text.split(/\s+/).filter(w => w.length > 0).length
    };
  }

  if (type.includes('spreadsheet') || ext === 'xlsx' || ext === 'xls') {
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

  if (type.includes('text') || ext === 'txt') {
    const text = buffer.toString('utf-8');
    return {
      text,
      pageCount: Math.ceil(text.length / 3000),
      wordCount: text.split(/\s+/).filter(w => w.length > 0).length
    };
  }

  throw new Error(`Unsupported file type: ${contentType}`);
}

async function parseMultipartFormData(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        const contentType = req.headers['content-type'];
        const boundary = contentType.split('boundary=')[1];
        
        if (!boundary) {
          reject(new Error('No boundary in content-type'));
          return;
        }

        const files = [];
        const parts = buffer.toString('binary').split('--' + boundary);
        
        for (const part of parts) {
          if (part.includes('filename=')) {
            const filenameMatch = part.match(/filename="([^"]+)"/);
            const contentTypeMatch = part.match(/Content-Type:\s*([^\r\n]+)/);
            
            if (filenameMatch) {
              const headerEnd = part.indexOf('\r\n\r\n');
              const content = part.slice(headerEnd + 4);
              const cleanContent = content.replace(/\r\n--$/, '').replace(/--$/, '');
              
              files.push({
                filename: filenameMatch[1],
                contentType: contentTypeMatch ? contentTypeMatch[1].trim() : 'application/octet-stream',
                data: Buffer.from(cleanContent, 'binary')
              });
            }
          }
        }
        
        resolve(files);
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}
