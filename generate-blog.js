#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════
 *  PAPERCLIP AI → BLOG → GITHUB AUTOMATION SCRIPT
 *  File: scripts/generate-blog.js
 *  Run:  node scripts/generate-blog.js
 * ═══════════════════════════════════════════════════════════
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const http = require('http');

// ──────────────────────────────────────────────────────────
// ① CONFIGURATION  ← Edit these values to match YOUR setup
// ──────────────────────────────────────────────────────────
const CONFIG = {
  // Paperclip AI local API (default port when running locally)
  paperclipAPI: 'http://localhost:11434/api/generate',
  // Which model Paperclip AI is running (e.g. "llama3", "mistral", "gemma")
  model: 'llama3',

  // Your site info
  siteName:  'AI Earner Hub',
  siteURL:   'https://yourusername.github.io',       // ← change this
  siteTagline: 'AI Tools · Automation · Earn Online',

  // Affiliate links — replace with your real links
  affiliates: [
    { label: '🚀 Try Hostinger (60% OFF)',  url: 'https://hostinger.com/?ref=YOUR_ID',   color: '#7952b3' },
    { label: '🤖 Get Jasper AI FREE Trial', url: 'https://jasper.ai/?ref=YOUR_ID',       color: '#0057b7' },
    { label: '💰 Join Fiverr Affiliate',    url: 'https://fiverr.com/affiliates/YOUR_ID', color: '#1dbf73' },
    { label: '📧 ConvertKit Free Plan',     url: 'https://convertkit.com/?ref=YOUR_ID',  color: '#fb6970' },
  ],

  // Email list form — connect to ConvertKit, MailerLite, etc.
  emailFormAction: 'https://app.convertkit.com/forms/YOUR_FORM_ID/subscriptions',

  // Topics to rotate through (one blog per run)
  topics: [
    'Top 5 AI Tools to Earn $500/Month in 2025',
    'How to Use ChatGPT to Write and Sell eBooks',
    'Beginner Guide to Affiliate Marketing with AI',
    'How to Build a Faceless YouTube Channel with AI',
    'Free AI Tools That Replace $100/Month Software',
    'How to Make Money with AI Automation in 2025',
    'Step-by-Step: Launch a Blog with AI in One Day',
    'Best Platforms to Sell AI-Generated Content',
    'How to Use Notion AI to Boost Productivity and Earn',
    'AI Side Hustles You Can Start Tonight with $0',
  ],

  // Folder paths (relative to project root)
  blogDir:   './blog',
  indexFile: './index.html',
  logFile:   './scripts/run.log',
};

// ──────────────────────────────────────────────────────────
// ② UTILITIES
// ──────────────────────────────────────────────────────────
function log(msg) {
  const ts = new Date().toLocaleString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
  fs.appendFileSync(CONFIG.logFile, line + '\n');
}

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60);
}

function today() {
  return new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
}

function pickTopic() {
  // Pick topic that hasn't been used yet, cycling through the list
  const used = fs.existsSync('./scripts/used-topics.json')
    ? JSON.parse(fs.readFileSync('./scripts/used-topics.json', 'utf8'))
    : [];
  const remaining = CONFIG.topics.filter(t => !used.includes(t));
  if (!remaining.length) {
    fs.writeFileSync('./scripts/used-topics.json', '[]');
    return CONFIG.topics[0];
  }
  const chosen = remaining[Math.floor(Math.random() * remaining.length)];
  used.push(chosen);
  fs.writeFileSync('./scripts/used-topics.json', JSON.stringify(used, null, 2));
  return chosen;
}

function randomAffiliate() {
  return CONFIG.affiliates[Math.floor(Math.random() * CONFIG.affiliates.length)];
}

function getAllBlogs() {
  if (!fs.existsSync(CONFIG.blogDir)) return [];
  return fs.readdirSync(CONFIG.blogDir)
    .filter(f => f.endsWith('.html'))
    .map(f => {
      const content = fs.readFileSync(path.join(CONFIG.blogDir, f), 'utf8');
      const titleMatch = content.match(/<title>(.*?)<\/title>/);
      const descMatch  = content.match(/<meta name="description" content="(.*?)"/);
      const dateMatch  = content.match(/data-date="(.*?)"/);
      return {
        file:  f,
        title: titleMatch ? titleMatch[1].replace(` | ${CONFIG.siteName}`, '') : f,
        desc:  descMatch  ? descMatch[1]  : '',
        date:  dateMatch  ? dateMatch[1]  : '',
        url:   `blog/${f}`,
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

// ──────────────────────────────────────────────────────────
// ③ CALL PAPERCLIP AI (Ollama-compatible local API)
// ──────────────────────────────────────────────────────────
function callPaperclipAI(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model:  CONFIG.model,
      prompt: prompt,
      stream: false,
    });

    const options = {
      hostname: 'localhost',
      port:     11434,
      path:     '/api/generate',
      method:   'POST',
      headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    };

    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.response || '');
        } catch (e) {
          reject(new Error('Invalid JSON from AI: ' + data.substring(0, 200)));
        }
      });
    });

    req.on('error', e => reject(new Error(`Cannot connect to Paperclip AI: ${e.message}\nMake sure Paperclip AI is running!`)));
    req.setTimeout(120000, () => { req.destroy(); reject(new Error('AI request timed out after 2 minutes')); });
    req.write(body);
    req.end();
  });
}

// ──────────────────────────────────────────────────────────
// ④ BUILD THE SEO-OPTIMIZED BLOG HTML
// ──────────────────────────────────────────────────────────
function buildBlogHTML({ topic, slug, content, metaDesc, keywords, allBlogs, affiliate, dateStr }) {
  // Pick 3 related blogs for internal linking (not current post)
  const related = allBlogs.filter(b => b.file !== `${slug}.html`).slice(0, 3);

  const relatedLinks = related.length
    ? related.map(b => `
        <a href="../${b.url}" class="related-link">
          <span class="related-arrow">→</span> ${b.title}
        </a>`).join('')
    : '<p style="color:#aaa">More posts coming soon!</p>';

  const affiliateButtons = CONFIG.affiliates.map(a => `
      <a href="${a.url}" target="_blank" rel="noopener sponsored" class="aff-btn" style="background:${a.color}">
        ${a.label}
      </a>`).join('');

  // Clean and format AI content into sections
  const sections = content.split(/\n{2,}/).filter(s => s.trim().length > 30);
  const formattedContent = sections.map((para, i) => {
    const trimmed = para.trim();
    // Detect if it looks like a heading
    if (trimmed.length < 80 && (trimmed.startsWith('#') || /^[A-Z][^.]{10,60}$/.test(trimmed))) {
      const headText = trimmed.replace(/^#+\s*/, '');
      return i === 0
        ? `<h2>${headText}</h2>`
        : `<h3>${headText}</h3>`;
    }
    // Detect numbered lists
    if (/^\d+\.\s/.test(trimmed)) {
      const items = trimmed.split(/\n/).filter(l => l.trim());
      return '<ol>' + items.map(l => `<li>${l.replace(/^\d+\.\s*/, '')}</li>`).join('') + '</ol>';
    }
    // Detect bullet lists
    if (/^[-*•]\s/.test(trimmed)) {
      const items = trimmed.split(/\n/).filter(l => l.trim());
      return '<ul>' + items.map(l => `<li>${l.replace(/^[-*•]\s*/, '')}</li>`).join('') + '</ul>';
    }
    return `<p>${trimmed}</p>`;
  }).join('\n\n      ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <!-- ═══ SEO META TAGS ═══════════════════════════════════ -->
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${topic} | ${CONFIG.siteName}</title>
  <meta name="description" content="${metaDesc}" />
  <meta name="keywords" content="${keywords}" />
  <meta name="author" content="${CONFIG.siteName}" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${CONFIG.siteURL}/blog/${slug}.html" />

  <!-- Open Graph (Facebook/LinkedIn sharing) -->
  <meta property="og:title"       content="${topic}" />
  <meta property="og:description" content="${metaDesc}" />
  <meta property="og:url"         content="${CONFIG.siteURL}/blog/${slug}.html" />
  <meta property="og:type"        content="article" />
  <meta property="og:site_name"   content="${CONFIG.siteName}" />

  <!-- Twitter Card -->
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="${topic}" />
  <meta name="twitter:description" content="${metaDesc}" />

  <!-- Schema.org Article markup for Google -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "${topic}",
    "description": "${metaDesc}",
    "datePublished": "${dateStr}",
    "author": { "@type": "Organization", "name": "${CONFIG.siteName}" },
    "publisher": {
      "@type": "Organization",
      "name": "${CONFIG.siteName}",
      "url": "${CONFIG.siteURL}"
    }
  }
  </script>

  <!-- Hidden date for index builder -->
  <span data-date="${dateStr}" style="display:none"></span>

  <style>
    /* ── RESET & TOKENS ─────────────────────────────────── */
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{
      --blue:#0057b7;--blue-dk:#003f8a;--blue-lt:#e8f1fc;
      --green:#1dbf73;--accent:#f4a519;
      --text:#1a1a2e;--muted:#5a6472;--bg:#f7f9fc;--white:#fff;
      --border:#dde4ef;--radius:12px;
      --font-head:'Georgia',serif;--font-body:'Segoe UI',system-ui,sans-serif;
    }
    body{font-family:var(--font-body);color:var(--text);background:var(--bg);line-height:1.7}
    a{color:var(--blue);text-decoration:none}
    a:hover{text-decoration:underline}
    img{max-width:100%;display:block}

    /* ── SITE HEADER ───────────────────────────────────── */
    .site-header{
      background:var(--blue-dk);color:#fff;
      padding:1rem 1.5rem;display:flex;align-items:center;
      justify-content:space-between;flex-wrap:wrap;gap:.5rem;
    }
    .site-header a{color:#fff;font-weight:700;font-size:1.1rem}
    .site-header nav a{font-size:.88rem;margin-left:1rem;opacity:.8;font-weight:400}
    .site-header nav a:hover{opacity:1}

    /* ── LAYOUT ────────────────────────────────────────── */
    .page-wrap{max-width:1100px;margin:0 auto;padding:2.5rem 1.5rem;display:grid;grid-template-columns:1fr 300px;gap:2.5rem}
    @media(max-width:760px){.page-wrap{grid-template-columns:1fr}}

    /* ── ARTICLE ───────────────────────────────────────── */
    article{background:var(--white);border-radius:var(--radius);padding:2.5rem;box-shadow:0 2px 20px rgba(0,87,183,.08)}
    .post-meta{display:flex;gap:1rem;font-size:.8rem;color:var(--muted);margin-bottom:1.5rem;flex-wrap:wrap}
    .post-tag{background:var(--blue-lt);color:var(--blue);padding:.2rem .7rem;border-radius:99px;font-weight:600}
    h1.post-title{font-family:var(--font-head);font-size:clamp(1.6rem,4vw,2.4rem);line-height:1.25;margin-bottom:1.2rem;color:var(--text)}
    .post-intro{font-size:1.08rem;color:var(--muted);border-left:4px solid var(--blue);padding-left:1rem;margin-bottom:2rem}
    .post-body h2{font-family:var(--font-head);font-size:1.5rem;margin:2rem 0 .75rem;color:var(--blue-dk)}
    .post-body h3{font-size:1.15rem;font-weight:700;margin:1.5rem 0 .5rem}
    .post-body p{margin-bottom:1rem}
    .post-body ul,.post-body ol{padding-left:1.5rem;margin-bottom:1rem}
    .post-body li{margin-bottom:.4rem}
    .divider{border:none;border-top:2px solid var(--border);margin:2rem 0}

    /* ── AFFILIATE BOX ─────────────────────────────────── */
    .aff-box{background:linear-gradient(135deg,#0f2044,var(--blue-dk));border-radius:var(--radius);padding:2rem;margin:2rem 0;text-align:center}
    .aff-box h3{color:#fff;font-family:var(--font-head);font-size:1.3rem;margin-bottom:.5rem}
    .aff-box p{color:rgba(255,255,255,.75);font-size:.9rem;margin-bottom:1.25rem}
    .aff-grid{display:flex;flex-wrap:wrap;gap:.65rem;justify-content:center}
    .aff-btn{display:inline-block;color:#fff;padding:.6rem 1.2rem;border-radius:8px;font-weight:700;font-size:.85rem;transition:opacity .2s;text-decoration:none}
    .aff-btn:hover{opacity:.88;text-decoration:none}

    /* ── EMAIL CAPTURE ─────────────────────────────────── */
    .email-box{background:linear-gradient(135deg,#1dbf73,#0fa85e);border-radius:var(--radius);padding:2rem;margin:2rem 0;text-align:center}
    .email-box h3{color:#fff;font-size:1.2rem;margin-bottom:.4rem}
    .email-box p{color:rgba(255,255,255,.85);font-size:.88rem;margin-bottom:1.1rem}
    .email-form{display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap}
    .email-form input{flex:1;min-width:200px;padding:.65rem 1rem;border:none;border-radius:8px;font-size:.92rem}
    .email-form button{background:#fff;color:#0fa85e;border:none;padding:.65rem 1.4rem;border-radius:8px;font-weight:700;cursor:pointer;font-size:.92rem;transition:background .2s}
    .email-form button:hover{background:#f0fff8}

    /* ── SIDEBAR ───────────────────────────────────────── */
    .sidebar{display:flex;flex-direction:column;gap:1.5rem}
    .widget{background:var(--white);border-radius:var(--radius);padding:1.5rem;box-shadow:0 2px 16px rgba(0,87,183,.07)}
    .widget h4{font-family:var(--font-head);font-size:1rem;margin-bottom:1rem;padding-bottom:.5rem;border-bottom:2px solid var(--blue-lt);color:var(--blue-dk)}
    .related-link{display:block;font-size:.88rem;padding:.4rem 0;border-bottom:1px solid var(--border);color:var(--text)}
    .related-link:last-child{border:none}
    .related-link:hover{color:var(--blue)}
    .related-arrow{color:var(--blue);font-weight:700}
    .sidebar-aff-btn{display:block;text-align:center;padding:.65rem;border-radius:8px;color:#fff;font-weight:700;font-size:.85rem;margin-bottom:.5rem;transition:opacity .2s}
    .sidebar-aff-btn:hover{opacity:.88;text-decoration:none;color:#fff}

    /* ── FOOTER ────────────────────────────────────────── */
    .site-footer{background:var(--blue-dk);color:rgba(255,255,255,.6);text-align:center;padding:1.5rem;font-size:.82rem;margin-top:3rem}
    .site-footer a{color:rgba(255,255,255,.8)}
  </style>
</head>
<body>

<header class="site-header">
  <a href="../index.html">🤖 ${CONFIG.siteName}</a>
  <nav>
    <a href="../index.html">Home</a>
    <a href="../index.html#tools">Tools</a>
    <a href="../index.html#earn">Earn</a>
  </nav>
</header>

<div class="page-wrap">

  <!-- ═══ MAIN ARTICLE ═══════════════════════════════════ -->
  <main>
    <article itemscope itemtype="https://schema.org/BlogPosting">

      <div class="post-meta">
        <span class="post-tag">AI &amp; Earning</span>
        <span>📅 ${dateStr}</span>
        <span>⏱ ~5 min read</span>
        <span>🤖 AI-Assisted</span>
      </div>

      <h1 class="post-title" itemprop="headline">${topic}</h1>

      <p class="post-intro" itemprop="description">${metaDesc}</p>

      <!-- ── AI-GENERATED CONTENT ───────────────────────── -->
      <div class="post-body" itemprop="articleBody">
        ${formattedContent}
      </div>

      <hr class="divider" />

      <!-- ── AFFILIATE CTA BOX ──────────────────────────── -->
      <div class="aff-box">
        <h3>🔥 Recommended Tools to Get Started</h3>
        <p>These are the exact tools used to automate and earn online. Trusted by thousands of creators.</p>
        <div class="aff-grid">
          ${affiliateButtons}
        </div>
        <p style="color:rgba(255,255,255,.4);font-size:.72rem;margin-top:.75rem">*Affiliate links — I may earn a commission at no cost to you</p>
      </div>

      <hr class="divider" />

      <!-- ── EMAIL CAPTURE FORM ─────────────────────────── -->
      <div class="email-box">
        <h3>📬 Get Weekly AI Earning Tips — Free!</h3>
        <p>Join 5,000+ readers who get our best AI tools, strategies, and income ideas every week.</p>
        <form class="email-form" action="${CONFIG.emailFormAction}" method="POST" target="_blank">
          <input type="email" name="email_address" placeholder="Enter your email address" required />
          <input type="hidden" name="tags[]" value="blog-subscriber" />
          <button type="submit">Subscribe Free →</button>
        </form>
        <p style="color:rgba(255,255,255,.6);font-size:.75rem;margin-top:.5rem">No spam. Unsubscribe anytime. 100% free.</p>
      </div>

    </article>
  </main>

  <!-- ═══ SIDEBAR ════════════════════════════════════════ -->
  <aside class="sidebar">

    <!-- Quick Affiliate Links -->
    <div class="widget">
      <h4>⚡ Top Tools</h4>
      ${CONFIG.affiliates.map(a => `
      <a href="${a.url}" target="_blank" rel="noopener sponsored" class="sidebar-aff-btn" style="background:${a.color}">${a.label}</a>`).join('')}
    </div>

    <!-- Related Posts (Internal Linking) -->
    <div class="widget">
      <h4>📖 Related Posts</h4>
      ${relatedLinks}
    </div>

    <!-- Mini Email Box -->
    <div class="widget" style="background:var(--blue-lt)">
      <h4>📬 Free Newsletter</h4>
      <p style="font-size:.85rem;color:var(--muted);margin-bottom:.75rem">Weekly AI earning tips, straight to your inbox.</p>
      <form action="${CONFIG.emailFormAction}" method="POST" target="_blank" style="display:flex;flex-direction:column;gap:.5rem">
        <input type="email" name="email_address" placeholder="your@email.com" required style="padding:.55rem .85rem;border:1.5px solid var(--border);border-radius:7px;font-size:.88rem" />
        <button type="submit" style="background:var(--blue);color:#fff;border:none;padding:.55rem;border-radius:7px;font-weight:700;cursor:pointer">Get Free Tips →</button>
      </form>
    </div>

  </aside>

</div><!-- /page-wrap -->

<footer class="site-footer">
  <p>&copy; ${new Date().getFullYear()} <a href="../index.html">${CONFIG.siteName}</a> · Built with AI automation · <a href="../index.html">Back to Home</a></p>
</footer>

</body>
</html>`;
}

// ──────────────────────────────────────────────────────────
// ⑤ BUILD / REBUILD index.html
// ──────────────────────────────────────────────────────────
function buildIndex(blogs) {
  const cards = blogs.map(b => `
      <article class="blog-card">
        <div class="card-tag">AI &amp; Earning</div>
        <h3><a href="${b.url}">${b.title}</a></h3>
        <p class="card-desc">${b.desc}</p>
        <div class="card-footer">
          <span class="card-date">📅 ${b.date}</span>
          <a href="${b.url}" class="card-link">Read More →</a>
        </div>
      </article>`).join('');

  const affiliateBar = CONFIG.affiliates.map(a =>
    `<a href="${a.url}" target="_blank" rel="noopener sponsored" class="top-aff" style="background:${a.color}">${a.label}</a>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${CONFIG.siteName} | AI Tools, Automation &amp; Earn Online</title>
  <meta name="description" content="Discover the best AI tools, automation strategies, and proven ways to earn money online. Updated daily with AI-generated insights." />
  <meta name="keywords" content="AI tools, earn online, make money AI, automation, ChatGPT, passive income" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${CONFIG.siteURL}" />
  <meta property="og:title"       content="${CONFIG.siteName}" />
  <meta property="og:description" content="AI Tools · Earn Online · Automation Tips" />
  <meta property="og:url"         content="${CONFIG.siteURL}" />
  <meta property="og:type"        content="website" />
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{
      --blue:#0057b7;--blue-dk:#003f8a;--blue-lt:#e8f1fc;
      --green:#1dbf73;--accent:#f4a519;
      --text:#1a1a2e;--muted:#5a6472;--bg:#f7f9fc;--white:#fff;
      --border:#dde4ef;--radius:12px;
    }
    body{font-family:'Segoe UI',system-ui,sans-serif;color:var(--text);background:var(--bg);line-height:1.65}
    a{color:var(--blue);text-decoration:none}
    a:hover{text-decoration:underline}

    /* HEADER */
    .site-header{background:var(--blue-dk);color:#fff;padding:1.2rem 1.5rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.5rem}
    .site-header .brand{font-size:1.4rem;font-weight:700;color:#fff}
    .site-header nav a{color:rgba(255,255,255,.8);margin-left:1rem;font-size:.9rem}
    .site-header nav a:hover{color:#fff}

    /* HERO */
    .hero{background:linear-gradient(135deg,var(--blue-dk) 0%,var(--blue) 100%);color:#fff;padding:4rem 1.5rem;text-align:center}
    .hero h1{font-size:clamp(1.8rem,5vw,3rem);font-family:Georgia,serif;margin-bottom:.75rem}
    .hero h1 em{color:var(--accent);font-style:normal}
    .hero p{font-size:1.1rem;color:rgba(255,255,255,.8);max-width:560px;margin:0 auto 2rem}
    .hero-cta{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap}
    .btn{display:inline-block;padding:.75rem 1.85rem;border-radius:9px;font-weight:700;font-size:.95rem;transition:all .2s}
    .btn-white{background:#fff;color:var(--blue)}
    .btn-white:hover{background:var(--blue-lt);text-decoration:none}
    .btn-green{background:var(--green);color:#fff;box-shadow:0 4px 16px rgba(29,191,115,.35)}
    .btn-green:hover{background:#0fa85e;text-decoration:none}

    /* AFFILIATE BAR */
    .aff-bar{background:linear-gradient(135deg,#0f2044,var(--blue-dk));padding:1.25rem 1.5rem;display:flex;gap:.65rem;justify-content:center;flex-wrap:wrap}
    .top-aff{color:#fff;padding:.5rem 1.1rem;border-radius:8px;font-weight:700;font-size:.82rem;text-decoration:none;transition:opacity .2s}
    .top-aff:hover{opacity:.85;text-decoration:none;color:#fff}

    /* MAIN LAYOUT */
    .main-wrap{max-width:1100px;margin:0 auto;padding:3rem 1.5rem}

    /* BLOG GRID */
    .section-title{font-family:Georgia,serif;font-size:1.6rem;margin-bottom:1.75rem;display:flex;align-items:center;gap:.5rem}
    .blog-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.5rem}
    .blog-card{background:var(--white);border-radius:var(--radius);padding:1.5rem;border:1px solid var(--border);transition:transform .25s,box-shadow .25s}
    .blog-card:hover{transform:translateY(-5px);box-shadow:0 12px 40px rgba(0,87,183,.13)}
    .card-tag{font-size:.7rem;font-weight:700;color:var(--blue);background:var(--blue-lt);padding:.18rem .6rem;border-radius:99px;display:inline-block;margin-bottom:.7rem;text-transform:uppercase;letter-spacing:.06em}
    .blog-card h3{font-family:Georgia,serif;font-size:1.1rem;margin-bottom:.5rem;line-height:1.35}
    .blog-card h3 a{color:var(--text)}
    .blog-card h3 a:hover{color:var(--blue)}
    .card-desc{font-size:.88rem;color:var(--muted);margin-bottom:1rem;line-height:1.6}
    .card-footer{display:flex;align-items:center;justify-content:space-between}
    .card-date{font-size:.78rem;color:var(--muted)}
    .card-link{font-size:.85rem;font-weight:700;color:var(--blue)}

    /* EMAIL SECTION */
    .email-section{background:linear-gradient(135deg,var(--green),#0fa85e);border-radius:var(--radius);padding:2.5rem;text-align:center;margin:3rem 0;color:#fff}
    .email-section h2{font-family:Georgia,serif;font-size:1.6rem;margin-bottom:.5rem}
    .email-section p{opacity:.85;margin-bottom:1.25rem}
    .email-form{display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap;max-width:460px;margin:0 auto}
    .email-form input{flex:1;min-width:200px;padding:.7rem 1rem;border:none;border-radius:8px;font-size:.92rem}
    .email-form button{background:#fff;color:var(--green);border:none;padding:.7rem 1.5rem;border-radius:8px;font-weight:700;cursor:pointer;font-size:.92rem}

    /* FOOTER */
    footer{background:var(--blue-dk);color:rgba(255,255,255,.5);text-align:center;padding:1.5rem;font-size:.82rem}
    footer a{color:rgba(255,255,255,.7)}

    .empty-state{text-align:center;padding:3rem;color:var(--muted);background:var(--white);border-radius:var(--radius);border:2px dashed var(--border)}
    .empty-state h3{font-size:1.2rem;margin-bottom:.5rem}
  </style>
</head>
<body>

<header class="site-header">
  <span class="brand">🤖 ${CONFIG.siteName}</span>
  <nav>
    <a href="#blog" id="blog">Blog</a>
    <a href="#tools">Tools</a>
    <a href="#earn">Earn</a>
  </nav>
</header>

<!-- HERO -->
<section class="hero">
  <h1>Earn Online with <em>AI Tools</em> &amp; Automation</h1>
  <p>${CONFIG.siteTagline} — practical guides updated daily.</p>
  <div class="hero-cta">
    <a href="#blog" class="btn btn-white">📖 Read Latest Posts</a>
    <a href="#subscribe" class="btn btn-green">📬 Get Free Tips</a>
  </div>
</section>

<!-- AFFILIATE BAR -->
<div class="aff-bar" id="tools">
  ${affiliateBar}
</div>

<!-- BLOG GRID -->
<main class="main-wrap" id="earn">
  <h2 class="section-title">📰 Latest Posts</h2>
  ${blogs.length
    ? `<div class="blog-grid">${cards}</div>`
    : `<div class="empty-state"><h3>🚀 First post coming soon!</h3><p>Run the script to generate your first AI blog post.</p></div>`
  }

  <!-- EMAIL CAPTURE -->
  <div class="email-section" id="subscribe">
    <h2>📬 Free Weekly AI Earning Tips</h2>
    <p>Join 5,000+ readers. Get the best AI tools and income strategies every week.</p>
    <form class="email-form" action="${CONFIG.emailFormAction}" method="POST" target="_blank">
      <input type="email" name="email_address" placeholder="Enter your email" required />
      <input type="hidden" name="tags[]" value="homepage-subscriber" />
      <button type="submit">Subscribe Free →</button>
    </form>
    <p style="font-size:.75rem;opacity:.6;margin-top:.5rem">No spam. Unsubscribe anytime.</p>
  </div>
</main>

<footer>
  <p>&copy; ${new Date().getFullYear()} ${CONFIG.siteName} · AI-powered content · 
     <a href="https://github.com/yourusername/yourusername.github.io" target="_blank">GitHub</a>
  </p>
</footer>

</body>
</html>`;
}

// ──────────────────────────────────────────────────────────
// ⑥ GIT PUSH
// ──────────────────────────────────────────────────────────
function gitPush(topic) {
  try {
    log('Running git add...');
    execSync('git add .', { stdio: 'inherit' });
    log('Running git commit...');
    execSync(`git commit -m "🤖 Auto-post: ${topic.substring(0, 50)}"`, { stdio: 'inherit' });
    log('Running git push...');
    execSync('git push origin main', { stdio: 'inherit' });
    log('✅ Pushed to GitHub successfully!');
    return true;
  } catch (err) {
    log('⚠️  Git push failed: ' + err.message);
    log('   Tip: Make sure git remote is set up and you have push access.');
    return false;
  }
}

// ──────────────────────────────────────────────────────────
// ⑦ MAIN ORCHESTRATOR
// ──────────────────────────────────────────────────────────
async function main() {
  log('═══════════════════════════════════════════');
  log('  PAPERCLIP AI BLOG AUTOMATION — STARTING');
  log('═══════════════════════════════════════════');

  // Ensure blog folder exists
  if (!fs.existsSync(CONFIG.blogDir)) {
    fs.mkdirSync(CONFIG.blogDir, { recursive: true });
    log('Created /blog folder');
  }

  // Pick a topic
  const topic = pickTopic();
  const slug  = slugify(topic);
  const dateStr = today();
  log(`Topic chosen: "${topic}"`);
  log(`Slug: ${slug}`);

  // ── Ask AI to generate blog content ──────────────────
  log('Calling Paperclip AI...');
  const prompt = `Write a comprehensive, SEO-optimized blog post about: "${topic}"

Requirements:
- Write for beginners who want to earn money online using AI
- Minimum 800 words
- Include: introduction, 5-7 main sections with headings, practical tips, and conclusion
- Use simple, conversational language
- Include specific tools, steps, and actionable advice
- Each section should have 2-3 solid paragraphs
- Format: use clear headings (##) and paragraphs
- Mention real tools people can use (ChatGPT, Jasper, Fiverr, Upwork, etc.)
- End with a motivating call to action

Do not include HTML tags. Write plain text with ## for headings.`;

  let aiContent;
  try {
    aiContent = await callPaperclipAI(prompt);
    log(`AI responded with ${aiContent.length} characters`);
  } catch (err) {
    log('❌ AI Error: ' + err.message);
    log('   Using fallback content for testing...');
    aiContent = `## Introduction\n\nThis is a sample blog post about "${topic}". The AI could not be reached, so this is placeholder content.\n\n## Getting Started\n\nTo begin earning with AI tools, you need to first understand what tools are available and how they can help you automate your workflow.\n\n## Top Tools to Use\n\nChatGPT is one of the best tools for content creation. Jasper AI helps with marketing copy. Fiverr and Upwork let you sell AI services to clients.\n\n## Conclusion\n\nStart small, experiment, and scale what works. The opportunities with AI are enormous right now.`;
  }

  // ── Generate meta description with AI ────────────────
  let metaDesc, keywords;
  try {
    const metaPrompt = `Write a single SEO meta description (max 155 characters, no quotes) for a blog post titled: "${topic}". Make it compelling and include the main keyword.`;
    metaDesc = (await callPaperclipAI(metaPrompt)).trim().substring(0, 155);
    log('Meta description generated');
  } catch {
    metaDesc = `Learn about ${topic.toLowerCase()} with practical tips and strategies to start earning online with AI tools today.`.substring(0, 155);
  }

  try {
    const kwPrompt = `List 8 SEO keywords (comma-separated, no explanation) for a blog post titled: "${topic}". Focus on terms people search when wanting to earn online with AI.`;
    keywords = (await callPaperclipAI(kwPrompt)).trim().replace(/\n/g, ', ');
    log('Keywords generated');
  } catch {
    keywords = 'AI tools, earn online, make money AI, automation, passive income, ChatGPT, work from home';
  }

  // ── Get existing blogs for internal linking ───────────
  const allBlogs = getAllBlogs();
  const affiliate = randomAffiliate();

  // ── Build & save the blog HTML ────────────────────────
  const blogHTML = buildBlogHTML({ topic, slug, content: aiContent, metaDesc, keywords, allBlogs, affiliate, dateStr });
  const blogPath = path.join(CONFIG.blogDir, `${slug}.html`);
  fs.writeFileSync(blogPath, blogHTML, 'utf8');
  log(`✅ Blog saved: ${blogPath}`);

  // ── Rebuild index.html ────────────────────────────────
  const updatedBlogs = getAllBlogs();
  const indexHTML = buildIndex(updatedBlogs);
  fs.writeFileSync(CONFIG.indexFile, indexHTML, 'utf8');
  log(`✅ index.html updated with ${updatedBlogs.length} posts`);

  // ── Push to GitHub ────────────────────────────────────
  const pushed = gitPush(topic);

  log('═══════════════════════════════════════════');
  log(`  DONE! Post: "${topic}"`);
  log(`  URL: ${CONFIG.siteURL}/blog/${slug}.html`);
  log(`  Git push: ${pushed ? 'SUCCESS' : 'SKIPPED (see above)'}`);
  log('═══════════════════════════════════════════');
}

// Run it!
main().catch(err => {
  log('❌ FATAL ERROR: ' + err.message);
  process.exit(1);
});
