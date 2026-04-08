# 🤖 Paperclip AI → Blog → GitHub Pages → Earn 💰
### Full Automation System — Beginner Friendly Guide

---

## 📁 FOLDER STRUCTURE

```
your-github-pages-repo/
│
├── index.html                  ← Homepage (auto-rebuilt after each post)
├── robots.txt                  ← SEO: tells Google to index your site
├── package.json                ← Node.js project config
├── .gitignore                  ← Keeps junk out of GitHub
│
├── blog/                       ← All generated blog posts live here
│   ├── top-5-ai-tools-to-earn-500-month.html
│   ├── how-to-use-chatgpt-to-sell-ebooks.html
│   └── ... (auto-generated)
│
├── scripts/
│   ├── generate-blog.js        ← MAIN SCRIPT (runs everything)
│   ├── setup.js                ← Run once to initialize
│   ├── test-ai-connection.js   ← Verify Paperclip AI is working
│   ├── cron-runner.sh          ← Shell script for cron/scheduler
│   ├── used-topics.json        ← Tracks which topics were used (auto-created)
│   └── run.log                 ← Daily log file (auto-created)
│
└── templates/
    └── example-blog-post.html  ← Example of what generated posts look like
```

---

## 🛠️ PREREQUISITES

Before starting, make sure you have these installed:

| Tool | How to Check | Install Link |
|------|-------------|--------------|
| Node.js (v16+) | `node --version` | https://nodejs.org |
| Git | `git --version` | https://git-scm.com |
| Paperclip AI / Ollama | `ollama --version` | https://ollama.ai |

---

## 🚀 STEP-BY-STEP SETUP (Do this once)

### STEP 1 — Clone or create your GitHub Pages repo

If you don't have a GitHub Pages repo yet:
1. Go to github.com → New Repository
2. Name it: `yourusername.github.io`
3. Make it **Public**
4. Check "Add README"
5. Click Create

Then clone it locally:
```bash
git clone https://github.com/yourusername/yourusername.github.io.git
cd yourusername.github.io
```

---

### STEP 2 — Copy the automation files

Copy these files into your repo folder:
```
package.json
scripts/generate-blog.js
scripts/setup.js
scripts/test-ai-connection.js
scripts/cron-runner.sh
templates/example-blog-post.html
```

---

### STEP 3 — Configure your settings

Open `scripts/generate-blog.js` and edit the CONFIG section at the top:

```javascript
const CONFIG = {
  // ① Your site URL (replace with your GitHub Pages URL)
  siteURL: 'https://yourusername.github.io',

  // ② Your site name
  siteName: 'AI Earner Hub',

  // ③ Your affiliate links (sign up and get your links)
  affiliates: [
    { label: '🚀 Try Hostinger',  url: 'YOUR_HOSTINGER_LINK',  color: '#7952b3' },
    { label: '🤖 Jasper AI',      url: 'YOUR_JASPER_LINK',     color: '#0057b7' },
    // Add/remove as needed
  ],

  // ④ Email form (get from ConvertKit, MailerLite, etc.)
  emailFormAction: 'YOUR_EMAIL_FORM_URL',

  // ⑤ Your AI model name (check with: ollama list)
  model: 'llama3',
};
```

---

### STEP 4 — Run one-time setup

```bash
node scripts/setup.js
```

This creates the /blog folder, log files, robots.txt, and .gitignore.

---

### STEP 5 — Make sure Paperclip AI is running

```bash
# Start Paperclip AI (Ollama)
ollama serve

# In another terminal, test it:
node scripts/test-ai-connection.js
```

You should see: ✅ SUCCESS! Paperclip AI responded

---

### STEP 6 — Generate your first blog post!

```bash
node scripts/generate-blog.js
```

Watch the terminal — it will:
1. Pick a topic from your list
2. Call Paperclip AI to write the content
3. Save a new HTML file in /blog
4. Rebuild index.html with the new link
5. Push everything to GitHub

Your first post will be live at:
`https://yourusername.github.io/blog/your-post-title.html`

*(GitHub Pages takes 1–2 minutes to deploy after push)*

---

## ⏰ SETTING UP DAILY AUTOMATION

### On Mac / Linux (Cron Job)

```bash
# Make the script executable
chmod +x scripts/cron-runner.sh

# Edit crontab
crontab -e

# Add this line (runs every day at 9:00 AM):
0 9 * * * /path/to/your/repo/scripts/cron-runner.sh

# To find your full path:
pwd
```

**Cron schedule explained:**
```
0 9 * * *   → 9:00 AM every day
0 */6 * * * → Every 6 hours
0 9 * * 1   → Every Monday at 9 AM
```

---

### On Windows (Task Scheduler)

1. Open "Task Scheduler" (search in Start menu)
2. Click "Create Basic Task"
3. Name: "AI Blog Generator"
4. Trigger: Daily at 9:00 AM
5. Action: Start a program
6. Program: `node`
7. Arguments: `C:\path\to\your\repo\scripts\generate-blog.js`
8. Start in: `C:\path\to\your\repo\`
9. Click Finish

---

### On GitHub Actions (Cloud — No local machine needed!)

Create this file: `.github/workflows/daily-blog.yml`

```yaml
name: Daily AI Blog Post

on:
  schedule:
    - cron: '0 9 * * *'   # 9 AM UTC every day
  workflow_dispatch:        # Also allow manual trigger

jobs:
  generate-post:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Ollama
        run: |
          curl -fsSL https://ollama.ai/install.sh | sh
          ollama serve &
          sleep 5
          ollama pull llama3

      - name: Generate Blog Post
        run: node scripts/generate-blog.js

      - name: Commit and push
        run: |
          git config --global user.name "AI Blog Bot"
          git config --global user.email "bot@example.com"
          git add .
          git commit -m "🤖 Daily AI blog post"
          git push
```

This runs FREE in the cloud — no need to keep your computer on!

---

## 💰 HOW TO EARN MONEY

### Revenue Stream 1: Affiliate Marketing

Sign up for these FREE affiliate programs:

| Program | Commission | Sign Up |
|---------|-----------|---------|
| Hostinger | 60% per sale | hostinger.com/affiliates |
| Jasper AI | 30% recurring | jasper.ai/affiliate |
| Fiverr | $15–$150/signup | fiverr.com/affiliates |
| ConvertKit | 30% recurring | partners.convertkit.com |
| Canva Pro | $36 per signup | canva.com/affiliates |
| SEMrush | 40% recurring | semrush.com/partners |

Replace `YOUR_ID` in CONFIG.affiliates with your actual affiliate links.

---

### Revenue Stream 2: Email List

Every blog post has a signup form. Build your list:
- 100 subscribers → Sell a $10 digital guide → $1,000
- 1,000 subscribers → Promote affiliate products → $200–$500/month
- 5,000 subscribers → Sell a course → $5,000–$10,000

**Free email platforms:**
- ConvertKit: https://convertkit.com (free up to 1,000 subscribers)
- MailerLite: https://mailerlite.com (free up to 1,000 subscribers)
- Brevo: https://brevo.com (free up to 300 emails/day)

---

### Revenue Stream 3: Google AdSense

Once you have 20+ posts and some traffic:
1. Apply at: https://adsense.google.com
2. Once approved, add this to every blog post `<head>`:
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_ID" crossorigin="anonymous"></script>
```

---

### Revenue Stream 4: Digital Products

Use your AI system to create:
- PDF eBooks ($9–$29) → Sell on Gumroad.com
- AI Prompt Packs ($5–$19) → Sell on Etsy or Gumroad
- Templates → Sell on Creative Market

---

## 🔍 SEO BUILT INTO EVERY POST

Each generated blog post automatically includes:
- ✅ `<title>` tag with keyword
- ✅ `<meta name="description">` (155 chars max)
- ✅ `<meta name="keywords">` (AI-generated)
- ✅ `<link rel="canonical">` (no duplicate content)
- ✅ Open Graph tags (Facebook/LinkedIn sharing)
- ✅ Twitter Card tags
- ✅ Schema.org BlogPosting (rich snippets in Google)
- ✅ `robots.txt` (tells Google to index)
- ✅ Internal links to related posts (auto-generated)
- ✅ H1, H2, H3 heading structure
- ✅ Mobile-responsive layout

---

## 🐛 TROUBLESHOOTING

**"Cannot connect to Paperclip AI"**
```bash
# Make sure Ollama is running:
ollama serve
# Pull a model if not done:
ollama pull llama3
# Test:
node scripts/test-ai-connection.js
```

**"Git push failed"**
```bash
# Set up your GitHub credentials:
git config --global user.name "Your Name"
git config --global user.email "you@email.com"
# If using HTTPS, use a personal access token:
# GitHub → Settings → Developer Settings → Personal Access Tokens
```

**"Blog post has no content"**
- The AI may have returned empty. Check `scripts/run.log`
- Try a different model: change `model: 'llama3'` to `'mistral'` or `'gemma'`

**"GitHub Pages not updating"**
- Pages can take 1–3 minutes to deploy
- Check: github.com/yourusername/yourusername.github.io → Actions tab

---

## 📊 EXPECTED RESULTS TIMELINE

| Week | Goal | Action |
|------|------|--------|
| 1 | Setup complete, 7 posts live | Run daily, share on social media |
| 2–4 | 20–30 posts | Let SEO work, submit to Google Search Console |
| Month 2 | First affiliate clicks | Optimize top posts, add more affiliate links |
| Month 3 | First earnings ($10–$50) | Apply for AdSense, grow email list |
| Month 6 | $100–$500/month | Scale topics, promote posts on Reddit/Twitter |
| Year 1 | $500–$2,000/month | Launch a digital product to your email list |

---

## 🆓 FREE TOOLS USED

| Tool | Purpose | Free Tier |
|------|---------|-----------|
| GitHub Pages | Hosting | Forever free |
| Paperclip AI / Ollama | AI content | Free (local) |
| ConvertKit | Email list | Free to 1,000 subs |
| Google Search Console | SEO monitoring | Free |
| Google Analytics | Traffic tracking | Free |
| Canva | Graphics | Free tier |

**Total monthly cost: $0** ← You keep all the revenue.

---

*Built with ❤️ using Paperclip AI automation*
