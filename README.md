# CuraLink — AI Medical Research Assistant

Full-stack MERN application that combines PubMed, OpenAlex, and ClinicalTrials.gov
with open-source LLM reasoning to deliver structured, personalized medical research insights.

## Quick Start

### 1. Install Dependencies
```bash
npm install --prefix backend
npm install --prefix frontend
```

### 2. Configure Environment
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your settings
```

### 3. Setup LLM (choose one)

**Option A: Ollama (Recommended - Local Open-Source)**
```bash
# Install: https://ollama.com
ollama pull llama3.2
# or: ollama pull mistral
```

**Option B: HuggingFace**
```
HF_API_TOKEN=hf_your_token
HF_MODEL=mistralai/Mistral-7B-Instruct-v0.3
```

**Option C: Anthropic (Demo fallback)**
```
ANTHROPIC_API_KEY=sk-ant-your_key
```

### 4. Start
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm start
```

Open http://localhost:3000

## Architecture

```
Query → Query Expansion → Parallel Fetch (PubMed + OpenAlex + ClinicalTrials)
     → Ranking Pipeline (250-450 candidates → Top 8 each)
     → LLM Analysis (Ollama → HF → Anthropic fallback chain)
     → Structured Response with source attribution
     → MongoDB session persistence (multi-turn context)
```

## LLM Priority Chain
1. Ollama (local open-source model) — PRIMARY
2. HuggingFace Inference API — FALLBACK
3. Anthropic Claude API — DEMO BACKUP
4. Rule-based response — LAST RESORT

## API Endpoints

- `POST /api/chat` — Main research pipeline
- `GET /api/chat/history/:sessionId` — Conversation history
- `GET /api/research/publications?query=...&disease=...` — Publication search
- `GET /api/research/trials?disease=...&location=...` — Trial search
- `GET /api/health` — Health check

## Docker
```bash
docker-compose up --build -d
```

## Tech Stack
- MongoDB, Express, React, Node.js (MERN)
- Ollama / HuggingFace / Anthropic for LLM
- PubMed NCBI E-utilities API
- OpenAlex API
- ClinicalTrials.gov v2 API
