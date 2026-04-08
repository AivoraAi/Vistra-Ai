#!/usr/bin/env node
/**
 * SETUP SCRIPT — Run once to initialize your project
 * Usage: node scripts/setup.js
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n🚀 PAPERCLIP AI BLOG SYSTEM — SETUP\n');
console.log('══════════════════════════════════════\n');

// 1. Create required folders
const folders = ['./blog', './scripts'];
folders.forEach(folder => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
    console.log(`✅ Created folder: ${folder}`);
  } else {
    console.log(`ℹ️  Folder exists: ${folder}`);
  }
});

// 2. Create log file
if (!fs.existsSync('./scripts/run.log')) {
  fs.writeFileSync('./scripts/run.log', `=== AI Blog Automation Log ===\n`, 'utf8');
  console.log('✅ Created log file: scripts/run.log');
}

// 3. Create used-topics tracker
if (!fs.existsSync('./scripts/used-topics.json')) {
  fs.writeFileSync('./scripts/used-topics.json', '[]', 'utf8');
  console.log('✅ Created topic tracker: scripts/used-topics.json');
}

// 4. Create .gitignore
const gitignore = `# Node
node_modules/
npm-debug.log

# Logs
*.log

# OS
.DS_Store
Thumbs.db
`;
fs.writeFileSync('./.gitignore', gitignore);
console.log('✅ Created .gitignore');

// 5. Create robots.txt for SEO
const robots = `User-agent: *
Allow: /

Sitemap: https://yourusername.github.io/sitemap.xml
`;
fs.writeFileSync('./robots.txt', robots);
console.log('✅ Created robots.txt');

// 6. Check git
try {
  const gitStatus = execSync('git status', { encoding: 'utf8', stdio: 'pipe' });
  console.log('✅ Git repository detected');
} catch {
  console.log('⚠️  No git repo found. Run: git init');
}

console.log('\n══════════════════════════════════════');
console.log('✅ SETUP COMPLETE!\n');
console.log('📋 NEXT STEPS:');
console.log('   1. Edit CONFIG in scripts/generate-blog.js');
console.log('      → Set your siteURL, affiliates, email form');
console.log('   2. Test AI connection:');
console.log('      → node scripts/test-ai-connection.js');
console.log('   3. Generate your first post:');
console.log('      → node scripts/generate-blog.js');
console.log('   4. Set up daily automation (see README.md)');
console.log('══════════════════════════════════════\n');
