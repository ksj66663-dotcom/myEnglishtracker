# IELTS Tracker

Personal 120-day IELTS reading study tracker. Three-notebook desk interface: daily task log, seven-pass reading workflow, vocabulary sync to Eudic Dictionary.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Turso** (libSQL cloud database)
- **Vercel** (deployment)

## Local Setup

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/ielts-tracker.git
cd ielts-tracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a Turso database

Install the Turso CLI first: https://docs.turso.tech/cli/installation

```bash
turso auth login
turso db create ielts-tracker
turso db show ielts-tracker           # copy the URL
turso db tokens create ielts-tracker  # copy the token
```

### 4. Set environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
TURSO_DATABASE_URL=libsql://ielts-tracker-<your-org>.turso.io
TURSO_AUTH_TOKEN=<your-token>
```

> For local-only development without Turso, you can use a local SQLite file:
> `TURSO_DATABASE_URL=file:./data/ielts.db` (no auth token needed)

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/ielts-tracker.git
git push -u origin main
```

### 2. Import on Vercel

Go to https://vercel.com/new and import your GitHub repository.

### 3. Add environment variables

In the Vercel project dashboard → Settings → Environment Variables, add:

| Name | Value |
|---|---|
| `TURSO_DATABASE_URL` | `libsql://ielts-tracker-<org>.turso.io` |
| `TURSO_AUTH_TOKEN` | `<your token>` |

### 4. Deploy

Vercel deploys automatically on every push to `main`.

## Eudic Integration

Open the app → gear icon (bottom right) → paste your Eudic OpenAPI token. The token is stored in the Turso database and uses `NIS` authorization. Obtain your token at https://my.eudic.net/OpenAPI.

## Project Structure

```
app/
  api/
    article/      # Reading log data (article text, vocab, grammar, pass state)
    records/      # Daily task records (tasks done, notes)
    settings/     # App settings (Eudic token)
    eudic/
      sync/       # Sync vocab words to Eudic study list
      test/       # Test Eudic API connection
components/
  DeskView.tsx        # Three-notebook desk scene
  TaskNotebook.tsx    # Task log interior (9 tasks, progress grid, notes)
  ReadingNotebook.tsx # Seven-pass reading workflow
  VocabNotebook.tsx   # Vocabulary list + Eudic sync panel
  SettingsModal.tsx   # API token configuration
lib/
  db.ts           # Turso/libSQL client + all database operations
  eudic.ts        # Eudic API helpers
  dateUtils.ts    # Date math (120-day plan from 2026-05-08)
  tasks.ts        # 9 daily task definitions
```
