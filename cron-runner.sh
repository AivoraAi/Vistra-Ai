#!/bin/bash
# ════════════════════════════════════════════════════════
#  DAILY CRON RUNNER — cron-runner.sh
#  This script is called by cron/Task Scheduler daily
# ════════════════════════════════════════════════════════

# ── CONFIGURE THESE ──────────────────────────────────────
PROJECT_DIR="$HOME/ai-blog-system"   # ← Full path to your project
LOG_FILE="$PROJECT_DIR/scripts/run.log"
NODE_PATH=$(which node)               # Auto-detect node path

# ── TIMESTAMP ────────────────────────────────────────────
echo "" >> "$LOG_FILE"
echo "══════════════════════════════" >> "$LOG_FILE"
echo "CRON RUN: $(date)" >> "$LOG_FILE"
echo "══════════════════════════════" >> "$LOG_FILE"

# ── CHANGE TO PROJECT DIRECTORY ──────────────────────────
cd "$PROJECT_DIR" || {
  echo "ERROR: Cannot cd to $PROJECT_DIR" >> "$LOG_FILE"
  exit 1
}

# ── MAKE SURE PAPERCLIP AI IS RUNNING ────────────────────
# Uncomment below if you want to auto-start Ollama:
# ollama serve &
# sleep 5

# ── RUN THE SCRIPT ───────────────────────────────────────
"$NODE_PATH" scripts/generate-blog.js >> "$LOG_FILE" 2>&1

# ── LOG RESULT ───────────────────────────────────────────
echo "Cron job finished: $(date)" >> "$LOG_FILE"
