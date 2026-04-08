#!/usr/bin/env node
/**
 * TEST SCRIPT — Run this first to verify Paperclip AI is working
 * Usage: node scripts/test-ai-connection.js
 */

const http = require('http');

console.log('\n🔍 Testing Paperclip AI connection...\n');

const body = JSON.stringify({
  model: 'llama3',         // Change to your model name
  prompt: 'Say "AI connection successful!" and nothing else.',
  stream: false,
});

const req = http.request({
  hostname: 'localhost',
  port:     11434,
  path:     '/api/generate',
  method:   'POST',
  headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('✅ SUCCESS! Paperclip AI responded:');
      console.log('   ' + (json.response || 'No response field'));
      console.log('\n🚀 You\'re ready to run: npm run generate\n');
    } catch {
      console.log('⚠️  Got response but could not parse JSON:');
      console.log('   ' + data.substring(0, 300));
    }
  });
});

req.on('error', err => {
  console.log('❌ FAILED to connect to Paperclip AI');
  console.log('   Error: ' + err.message);
  console.log('\n📋 Checklist:');
  console.log('   1. Is Paperclip AI (Ollama) running? Try: ollama serve');
  console.log('   2. Is it on port 11434? (default)');
  console.log('   3. Have you pulled a model? Try: ollama pull llama3');
  console.log('   4. If different port, update CONFIG.paperclipAPI in generate-blog.js\n');
});

req.setTimeout(10000, () => {
  console.log('❌ Timeout — Paperclip AI did not respond in 10 seconds');
  req.destroy();
});

req.write(body);
req.end();
