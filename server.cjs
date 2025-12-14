/**
 * Local Development Server
 * Mimics Netlify Functions for local testing
 * Serves static files and handles API endpoints
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const PORT = 8888;

// Import the chat function handler
const chatFunction = require('./netlify/functions/chat.cjs');

// Import the multi-agent function handler
const multiAgentFunction = require('./netlify/functions/multi-agent.cjs');

// Import the research function handler
const researchFunction = require('./netlify/functions/research.cjs');

// MIME types for static files
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

console.log('\n' + '='.repeat(80));
console.log('🚀 Starting Local Development Server');
console.log('='.repeat(80));
console.log('[Server] Port:', PORT);
console.log('[Server] Environment variables loaded:', Object.keys(process.env).filter(k => k.includes('API')).length, 'API keys');
console.log('[Server] ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? '✓ Loaded' : '❌ Missing');
console.log('='.repeat(80) + '\n');

const server = http.createServer(async (req, res) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  
  console.log(`\n📨 [${requestId}] ${req.method} ${req.url}`);
  console.log(`[${requestId}] Headers:`, JSON.stringify(req.headers, null, 2));

  // Handle API endpoints (Netlify Functions)
  if (req.url.startsWith('/.netlify/functions/') || req.url.startsWith('/api/')) {
    console.log(`[${requestId}] 🔧 API endpoint detected`);
    
    // Extract function name
    const functionPath = req.url.replace('/.netlify/functions/', '').replace('/api/', '').split('?')[0];
    console.log(`[${requestId}] Function path:`, functionPath);
    
    if (functionPath === 'chat') {
      console.log(`[${requestId}] 💬 Routing to chat function`);
      
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
        console.log(`[${requestId}] Received ${chunk.length} bytes`);
      });
      
      req.on('end', async () => {
        console.log(`[${requestId}] ✓ Request body complete (${body.length} bytes)`);
        
        try {
          // Create Netlify-compatible event object
          const event = {
            httpMethod: req.method,
            headers: req.headers,
            body: body,
            path: req.url,
            queryStringParameters: {}
          };
          
          const context = {};
          
          console.log(`[${requestId}] 📤 Calling chat function handler...`);
          const result = await chatFunction.handler(event, context);
          
          const duration = Date.now() - startTime;
          console.log(`[${requestId}] ✅ Function completed in ${duration}ms`);
          console.log(`[${requestId}] Status:`, result.statusCode);
          console.log(`[${requestId}] Response body length:`, result.body?.length || 0);
          
          // Send response
          res.writeHead(result.statusCode, result.headers || {});
          res.end(result.body);
          
        } catch (error) {
          const duration = Date.now() - startTime;
          console.error(`[${requestId}] ❌ Function error after ${duration}ms:`, error);
          console.error(`[${requestId}] Error stack:`, error.stack);
          
          res.writeHead(500, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify({
            error: 'Internal server error',
            message: error.message,
            requestId: requestId
          }));
        }
      });
      
      return;
    }

    // Multi-Agent endpoint
    if (functionPath === 'multi-agent') {
      console.log(`[${requestId}] 🤖 Routing to multi-agent function`);
      
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
        console.log(`[${requestId}] Received ${chunk.length} bytes`);
      });
      
      req.on('end', async () => {
        console.log(`[${requestId}] ✓ Request body complete (${body.length} bytes)`);
        
        try {
          // Create Netlify-compatible event object
          const event = {
            httpMethod: req.method,
            headers: req.headers,
            body: body,
            path: req.url,
            queryStringParameters: {}
          };
          
          const context = {};
          
          console.log(`[${requestId}] 📤 Calling multi-agent function handler...`);
          const result = await multiAgentFunction.handler(event, context);
          
          const duration = Date.now() - startTime;
          console.log(`[${requestId}] ✅ Function completed in ${duration}ms`);
          console.log(`[${requestId}] Status:`, result.statusCode);
          console.log(`[${requestId}] Response body length:`, result.body?.length || 0);
          
          // Send response
          res.writeHead(result.statusCode, result.headers || {});
          res.end(result.body);
          
        } catch (error) {
          const duration = Date.now() - startTime;
          console.error(`[${requestId}] ❌ Function error after ${duration}ms:`, error);
          console.error(`[${requestId}] Error stack:`, error.stack);
          
          res.writeHead(500, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify({
            error: 'Internal server error',
            message: error.message,
            requestId: requestId
          }));
        }
      });
      
      return;
    }

    // Research endpoint
    if (functionPath === 'research') {
      console.log(`[${requestId}] 🔍 Routing to research function`);
      
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
        console.log(`[${requestId}] Received ${chunk.length} bytes`);
      });
      
      req.on('end', async () => {
        console.log(`[${requestId}] ✓ Request body complete (${body.length} bytes)`);
        
        try {
          // Create Netlify-compatible event object
          const event = {
            httpMethod: req.method,
            headers: req.headers,
            body: body,
            path: req.url,
            queryStringParameters: {}
          };
          
          const context = {};
          
          console.log(`[${requestId}] 📤 Calling research function handler...`);
          const result = await researchFunction.handler(event, context);
          
          const duration = Date.now() - startTime;
          console.log(`[${requestId}] ✅ Function completed in ${duration}ms`);
          console.log(`[${requestId}] Status:`, result.statusCode);
          console.log(`[${requestId}] Response body length:`, result.body?.length || 0);
          
          // Send response
          res.writeHead(result.statusCode, result.headers || {});
          res.end(result.body);
          
        } catch (error) {
          const duration = Date.now() - startTime;
          console.error(`[${requestId}] ❌ Function error after ${duration}ms:`, error);
          console.error(`[${requestId}] Error stack:`, error.stack);
          
          res.writeHead(500, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify({
            error: 'Internal server error',
            message: error.message,
            requestId: requestId
          }));
        }
      });
      
      return;
    }
  }

  // Serve static files
  console.log(`[${requestId}] 📄 Serving static file`);
  
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        console.log(`[${requestId}] ⚠️ File not found:`, filePath);
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        console.error(`[${requestId}] ❌ Server error:`, error);
        res.writeHead(500);
        res.end('Server Error: ' + error.code);
      }
    } else {
      const duration = Date.now() - startTime;
      console.log(`[${requestId}] ✓ Served ${filePath} (${content.length} bytes) in ${duration}ms`);
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log('\n' + '='.repeat(80));
  console.log('✅ Server Running!');
  console.log('='.repeat(80));
  console.log(`🌐 Local:            http://localhost:${PORT}`);
  console.log(`🌐 Network:         http://127.0.0.1:${PORT}`);
  console.log('');
  console.log('📁 Serving static files from current directory');
  console.log('🔧 API endpoint:     /.netlify/functions/chat');
  console.log('🔧 API endpoint:     /api/chat');
  console.log('🔧 API endpoint:     /.netlify/functions/multi-agent');
  console.log('🔧 API endpoint:     /api/multi-agent');
  console.log('🔧 API endpoint:     /.netlify/functions/research');
  console.log('🔧 API endpoint:     /api/research');
  console.log('');
  console.log('Press Ctrl+C to stop');
  console.log('='.repeat(80) + '\n');
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use!`);
    console.error('Kill the process using that port and try again.');
    console.error(`Run: Get-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess | Stop-Process -Force\n`);
  } else {
    console.error('\n❌ Server error:', error);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
