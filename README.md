# Bodhi

A voice-first, low-latency AI Mock Interviewer. Bodhi conducts structured mock interviews entirely by voice — you speak, it listens, responds, and adapts. No frontend required; runs from the terminal.

---

## What It Can Do Right Now

Bodhi is a fully working CLI voice interview system. Here's what happens when you run it:

1. **You launch `python -m src.main`** — Bodhi connects to NeonDB and Redis (if configured), loads any entity context for the target company, and starts the interview.
2. **Bodhi introduces itself** and asks the first behavioral question (TTS via Bulbul V3, played through your speakers).
3. **You answer by speaking** — the mic listens hands-free using VAD. No buttons, no Enter key. Talk for as long as you need (up to 2 minutes per answer). When you pause for ~1.5 seconds, recording stops automatically.
4. **Your speech is transcribed** to English text (Saaras V3 STT). Long answers (>25s) are auto-chunked to stay within API limits.
5. **Bodhi thinks and responds** — LangGraph orchestrates the interview flow. Gemini generates a context-aware follow-up, probing deeper or transitioning phases.
6. **The response is spoken aloud** (Bulbul V3 TTS) and the cycle repeats.
7. **Bodhi autonomously progresses** through interview phases: `intro → behavioral → technical → coding → wrapup`, using LangGraph tools to transition, score answers, and adjust difficulty.
8. **Session data is persisted** — transcripts, phase scores, and session records are saved to NeonDB on phase transitions and session end. Entity context is cached in Redis for sub-millisecond lookups.

### Current Limitations

- CLI only — no web frontend yet.
- English-only STT (Hinglish/Hindi planned for later).
- No code editor integration yet (Monaco planned for Phase 2).
- No resume/JD parsing yet.

---

## Tech Stack

| Layer | Technology | Role |
| --- | --- | --- |
| **Language** | Python 3.11+ | Backend runtime |
| **AI Orchestration** | LangGraph + LangChain | Stateful interview graph, tool invocation, conditional routing |
| **LLM** | Google Gemini (`gemini-3.1-flash-lite-preview`) | Conversational AI via `ChatGoogleGenerativeAI` |
| **STT** | Sarvam AI Saaras V3 | Speech-to-text (`mode="transcribe"`, `language_code="en-IN"`) |
| **TTS** | Sarvam AI Bulbul V3 | Text-to-speech (speaker `shubh`) |
| **Audio** | `sounddevice` + `webrtcvad` + `soundfile` | Mic capture, VAD, audio I/O |
| **Edge State** | LangGraph `MemorySaver` | Zero-latency in-process checkpointing |
| **Cache** | Redis (`redis-py`) | Sub-ms session snapshots and entity context |
| **Persistent Storage** | NeonDB PostgreSQL (`psycopg2`) | Sessions, transcripts, phase results, entity knowledge |

---

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `SARVAM_API_KEY` | Yes | Sarvam AI key for Saaras (STT) and Bulbul (TTS) |
| `GOOGLE_API_KEY` | Yes | Google Gemini API key |
| `DATABASE_URL` | No | NeonDB PostgreSQL connection string. If unset, persistence is skipped. |
| `REDIS_URL` | No | Redis connection (default `redis://localhost:6379`). If unreachable, caching is skipped. |
| `BODHI_VOICE_MODE` | No | `natural` (default, VAD-based) or `manual` (Enter-to-record) |
| `BODHI_INPUT_DEVICE` | No | Microphone device index. Run `list_input_devices` to find yours. |
| `BODHI_CANDIDATE` | No | Candidate name for the session |
| `BODHI_COMPANY` | No | Target company (prompted at startup if unset) |
| `BODHI_ROLE` | No | Target role (default: `Software Engineer`) |

---

## Getting Started

```bash
# 1. Clone the repo and enter the directory
cd Bodhi

# 2. Create a virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create .env with your API keys (copy from .env.example)
#    SARVAM_API_KEY=...
#    GOOGLE_API_KEY=...
#    DATABASE_URL=...          # optional (NeonDB)
#    REDIS_URL=...             # optional

# 5. (Optional) Find your microphone device index
python -c "from src.audio import list_input_devices; list_input_devices()"
# Set BODHI_INPUT_DEVICE in .env to the index of your preferred mic

# 6. Run the interview
python -m src.main
```

On startup, Bodhi connects to Redis and NeonDB (if configured), prompts for a target company, and begins the mock interview. Just speak naturally — Ctrl+C to exit.

---

## How the Voice Pipeline Works

```
Mic → VAD → Record → STT (Saaras V3) → LangGraph (Gemini) → TTS (Bulbul V3) → Speaker → Loop
```

### Recording (VAD)

- **Persistent `sounddevice.InputStream`** streams 20ms audio frames (16kHz, mono, 16-bit).
- **`webrtcvad`** (aggressiveness 3) classifies each frame as speech or silence.
- **Energy gate**: Frames with RMS amplitude below threshold (80) are forced to "not speech" regardless of VAD — prevents microphone noise floor from being classified as speech.
- **Speech confirmation**: 5 consecutive speech-positive frames (~100ms) required before recording starts. Isolated noise is ignored.
- **Pre-buffer** (600ms): Captures audio just before speech onset so the beginning of your sentence is never lost.
- **Silence cutoff**: Recording stops after 1.5 seconds of continuous silence.
- **Max duration**: 120 seconds (2 minutes) safety cap per utterance.
- **Manual fallback**: Set `BODHI_VOICE_MODE=manual` to use Enter-to-record if your environment is too noisy.

### STT (Auto-Chunking)

Sarvam's API has a 30-second limit per request. For long answers, the audio is automatically split into <=25-second chunks, each transcribed separately, and results joined.

### Error Recovery

- **3 consecutive mic errors** → app exits with a message to check device connection.
- **Ctrl+C** → session data is flushed to NeonDB/Redis before exiting.
- **Redis/NeonDB unavailable** → system continues with in-memory state only.

---

## Interview Orchestration (LangGraph)

The interview is modeled as a **LangGraph StateGraph** with the following structure:

### Phases

`intro` → `behavioral` → `technical` → `coding` → `wrapup`

The LLM decides when to transition phases using LangGraph tools.

### Tools Available to the LLM

| Tool | What It Does |
| --- | --- |
| `transition_phase` | Move to the next interview phase |
| `score_answer` | Score the candidate's answer (1-10) with reasoning |
| `adjust_difficulty` | Raise or lower question difficulty (1-5 scale) |
| `end_interview` | Conclude the interview and trigger session flush |

### State Management

- **`InterviewState`** (TypedDict): Tracks messages, session ID, candidate info, current phase, difficulty level, phase scores, entity context, and end flag.
- **`MemorySaver`**: In-process checkpointing — zero I/O on the voice loop hot path.
- **Phase-aware system prompts**: The HR persona ("Bodhi") adapts behavior per phase — STAR-method probing in behavioral, difficulty scaling in technical, hints-not-answers in coding.

### Three-Tier Storage

| Tier | Technology | Latency | Purpose |
| --- | --- | --- | --- |
| **Edge** | `MemorySaver` | 0ms | Full state in RAM during session |
| **Cache** | Redis | <1ms | Session snapshots, entity context |
| **Persistent** | NeonDB PostgreSQL | ~50ms | Sessions, transcripts, phase results, entity knowledge base |

Data flows down: edge → cache → DB. Written asynchronously on phase transitions and session end.

---

## Project Structure

```
Bodhi/
├── src/
│   ├── __init__.py
│   ├── main.py            # Entry point — session lifecycle, graph invocation
│   ├── audio.py           # Mic recording (VAD), playback
│   ├── state.py           # InterviewState TypedDict, phase definitions
│   ├── prompts.py         # Phase-aware HR interviewer system prompts
│   ├── tools.py           # LangGraph tools (transition, score, difficulty, end)
│   ├── graph.py           # StateGraph construction and compilation
│   ├── cache.py           # Redis cache layer (BodhiCache)
│   ├── storage.py         # NeonDB persistence layer (BodhiStorage)
│   └── services/
│       ├── llm.py         # Gemini LLM setup via LangChain
│       ├── stt.py         # Saaras V3 STT (with auto-chunking)
│       └── tts.py         # Bulbul V3 TTS
├── requirements.txt
├── .env.example
├── .gitignore
├── TECHNICAL.md           # Internal architecture docs (gitignored)
└── README.md
```

---

## Roadmap

### Done

- [x] Phase 0: CLI voice loop (mic → STT → LLM → TTS → speaker)
- [x] VAD-based hands-free recording with energy gating and auto-chunking
- [x] Phase 1: LangGraph interview orchestration (phases, tools, scoring)
- [x] Three-tier storage (MemorySaver + Redis + NeonDB)
- [x] HR persona with phase-aware system prompts
- [x] Graceful degradation (Redis/NeonDB optional)
- [x] Error recovery (consecutive mic failures, Ctrl+C flush)

### Next

- [ ] Phase 2: FastAPI server + WebSocket streaming for real-time STT/TTS
- [ ] Monaco code editor integration for coding rounds
- [ ] RAG pipeline with vector search for entity knowledge
- [ ] Resume/JD parsing and gap analysis ("Question Doctor")
- [ ] Hinglish/Hindi language support (STT + TTS)
- [ ] Post-interview analytics and performance heatmap
- [ ] Frontend UI

---

> Internal architecture details are documented in `TECHNICAL.md` (gitignored, local only).
