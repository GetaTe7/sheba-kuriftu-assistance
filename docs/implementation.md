# Sheba for Kuriftu — Implementation Reference

> **Living document.** Update this file as the project evolves through each phase.
> Last updated: 2026-04-04

---

## 1. Product Vision

**Sheba for Kuriftu** is a voice-first AI hospitality companion for Kuriftu guests and staff.
It helps guests communicate across languages, understand Ethiopian culture in context, and get
simple accessibility support such as scene description and obstacle hints.

**Core demo script (one hero flow):**
1. Guest says: *"Can I order coffee?"*
2. Sheba transcribes → translates → replies naturally
3. Sheba appends a cultural note about the Ethiopian coffee ceremony
4. Guest asks: *"What is in front of me?"* → accessibility mode returns a short scene description
5. Guest asks: *"What can I do at Kuriftu?"* → Sheba lists resort experiences

---

## 2. Current Codebase State (as of analysis)

### Location
```
c:\Users\hp\Desktop\AASIT_Fanos_Tech\Bahil\sheba-kuriftu-assistance\
```

### Runtime Stack (what is actually built)

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React 18 + Vite + TypeScript | Shadcn/ui, Tailwind CSS, React Router v6 |
| State | React Context (AppContext) | Global language, conversation, accessibility |
| Backend | Supabase Edge Function (Deno) | supabase/functions/sheba-chat/index.ts |
| AI | Gemini via AI Gateway | google/gemini-3-flash-preview model |
| Database | Supabase (PostgreSQL + RLS) | 5 tables, all open for MVP |
| Auth | None yet | RLS policies are open (USING true) |
| Voice Input | Mock only | Random phrase simulation, no real STT |
| Translation | Gemini prompt-based | No dedicated Translation API call |
| TTS | Mock stub | mockTextToSpeech does nothing |

### Pages / Routes

| Route | File | Status |
|---|---|---|
| / | Index.tsx → Welcome.tsx | Working — language picker |
| /assistant | Assistant.tsx | Working — chat + mock mic |
| /cultural-tips | CulturalTips.tsx | Working — static cards |
| /accessibility | Accessibility.tsx | Partial — no real scene detection |
| /experiences | Experiences.tsx | Working — static seed data |
| /history | History.tsx | Working — conversation log |
| /admin | Admin.tsx | Working — CRUD tips/FAQs from Supabase |
| * | NotFound.tsx | 404 fallback |

### Database Tables (Supabase)

| Table | Purpose |
|---|---|
| cultural_tips | Cultural context cards, admin-managed |
| resort_faqs | Resort Q&A injected into AI prompt |
| resort_experiences | Activity/experience listings |
| accessibility_cues | Scene/obstacle descriptions |
| conversations | Persisted chat history per session |

### Edge Function: sheba-chat

- **Endpoint:** POST /functions/v1/sheba-chat
- **Auth:** Supabase anon key (Bearer token)
- **AI Gateway:** https://ai.gateway.lovable.dev/v1/chat/completions (Temporary for MVP)
- **Model:** google/gemini-3-flash-preview
- **Key:** AI_GATEWAY_KEY env var set on Supabase dashboard
- **Response format:**
```json
{
  "response": "Main reply text",
  "translation": "Translated version or null",
  "culturalTip": "Short cultural note or null"
}
```

### Environment Variables (.env)
```bash
VITE_SUPABASE_PROJECT_ID=qvccjtfmullnjvauqvyf
VITE_SUPABASE_URL=https://qvccjtfmullnjvauqvyf.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon key>
```

---

## 3. Target Stack (Google Specification)

The target production architecture specified in the design document:

| Layer | Target Technology | Current | Gap |
|---|---|---|---|
| Frontend | React (web) or React Native + Expo | React + Vite | Mobile not built |
| Backend | Node.js or FastAPI on Cloud Run | Supabase Edge Functions | Must migrate backend |
| Database | Cloud Firestore | Supabase PostgreSQL | Must migrate or dual-write |
| Auth | Firebase Authentication | Supabase Auth (Email/Pass) | Fully Migrated |
| AI | Gemini on Vertex AI | Vertex AI Edge Proxy API | Fully Migrated |
| Speech-to-Text | Cloud Speech-to-Text | MediaRecorder -> Edge STT | Fully Migrated |
| Translation | Cloud Translation API | Edge Translate API | Fully Migrated |
| Text-to-Speech | Cloud Text-to-Speech | Edge TTS -> Audio Blob | Fully Migrated |
| Deployment | Cloud Run | Supabase hosted | Must add Cloud Run deploy |

> **For hackathon MVP:** the current Supabase + AI gateway is functional and good for a fast demo.
> Migration to the full Google stack is Phase 2-3 work. Do not block the demo on this migration.

---

## 4. User Roles

| Role | Access | Notes |
|---|---|---|
| Guest | Translation, cultural tips, accessibility, experiences | No login required |
| Front Desk Staff | Quick translation for guest communication | Future: staff-specific view |
| Resort Admin | CRUD tips, FAQs, cues, experiences | Currently unprotected — add Firebase Auth |
| Accessibility Tester | Scene description and obstacle hints | Accessibility tab |

---

## 5. Core Modules

### 5.1 Voice Translation Engine
**What it should do:** Record speech → transcribe (Cloud STT) → translate (Cloud Translation) → voice output (Cloud TTS)

**Current state:**
- Recording: mock (random phrase, no real audio capture)
- Transcription: simulated
- Translation: Gemini generates translation as part of the response JSON
- TTS: stub only

**What to build:**
- Integrate browser MediaRecorder API to capture real audio
- Call Cloud Speech-to-Text (or Web Speech API for demo speed)
- Call Cloud Translation for explicit source to target translation
- Implement Cloud TTS playback via AudioContext

### 5.2 Cultural Intelligence Engine
**What it should do:** Inject short culturally-relevant tips when context matches

**Current state:** Working — Gemini generates a culturalTip field; admin controls the tip library

**Improvement:** Add contextKey matching (check-in, coffee, spa, greeting) for more reliable triggering

### 5.3 Accessibility Super Mode
**What it should do:** Accept camera or text input → return short audio cue about surroundings

**Current state:** Partial — scene/obstacle cards exist but no real camera or detection

**What to build:**
- Camera input via browser getUserMedia or file input with capture attribute
- Image sent to Gemini Vision (Vertex AI multimodal) for scene description
- Short audio description via TTS

### 5.4 Human Personality Layer
**What it should do:** Sheba sounds warm, local, and like a Kuriftu host

**Current state:** Implemented in system prompt in sheba-chat/index.ts

**Note:** Keep system prompt pinned to resort identity. Never let Sheba sound generic.

### 5.5 Admin Content Layer
**What it should do:** Manage FAQs, tips, cues, experiences

**Current state:** Working in Admin dashboard — Supabase CRUD

**Gap:** No authentication; anyone can access /admin and modify content

---

## 6. System Architecture

### Current Architecture
```
Client (React + Vite SPA)
  |
  +--> Welcome, Assistant, Admin, Cultural Tips, Experiences, Accessibility, History
  |
  v
Supabase Edge Function: /functions/v1/sheba-chat
  - Receives text + language pair + mode
  - Injects FAQs + tips from DB as context
  - Calls Gemini AI gateway
  - Returns response + translation + culturalTip
  |
  +--> Supabase PostgreSQL
       cultural_tips, resort_faqs, resort_experiences, accessibility_cues, conversations
  |
  +--> Gemini via AI Gateway (google/gemini-3-flash-preview)
```

### Target Architecture (Google Stack)
```
Client (React SPA / React Native + Expo)
  |
  v
Cloud Run (Node.js / FastAPI backend)
  - POST /api/voice/transcribe  ->  Cloud Speech-to-Text
  - POST /api/translate         ->  Cloud Translation
  - POST /api/respond           ->  Vertex AI Gemini
  - GET  /api/cultural-tips     ->  Cloud Firestore
  - GET  /api/faqs              ->  Cloud Firestore
  - Admin routes (protected)    ->  Firebase Auth
  |
  +--> Cloud Firestore (realtime + offline support)
  +--> Firebase Authentication
  +--> Cloud Text-to-Speech (voice output)
```

---

## 7. Data Models

### Current (Supabase schema)
```sql
cultural_tips     (id, title, description, category, language, created_at, updated_at)
resort_faqs       (id, question, answer, category, created_at, updated_at)
resort_experiences(id, title, description, category, duration, icon, created_at, updated_at)
accessibility_cues(id, scene, description, obstacles[], created_at, updated_at)
conversations     (id, session_id, role, original_text, translated_text, language, cultural_tip, created_at)
```

### Target additions (aligned to spec)
```typescript
// Add resortProperty to session tracking
UserSession {
  id: string
  guestName?: string
  preferredLanguage: string
  accessibilityMode: boolean
  resortProperty: string    // 'bishoftu' | 'bahirdar' | 'adama' | 'entoto'
  createdAt: Timestamp
  lastActiveAt: Timestamp
}

// Add contextKey to cultural_tips
CulturalTip {
  contextKey: string        // 'coffee' | 'greeting' | 'spa' | 'checkin' | 'tour' | 'family'
  active: boolean
}

// Add sceneType and severity to accessibility_cues
AccessibilityCue {
  sceneType: string
  severity: 'low' | 'medium' | 'high'
  active: boolean
}
```

---

## 8. API Design

### Currently Implemented (Supabase Edge Functions)

| Method | Path | Handler |
|---|---|---|
| POST | /functions/v1/sheba-chat | AI chat with context injection |

### Supabase Auto-REST (via supabase-js client)

| Operation | Table |
|---|---|
| GET all | cultural_tips, resort_faqs, resort_experiences, accessibility_cues |
| INSERT | cultural_tips, resort_faqs, conversations |
| DELETE | cultural_tips, resort_faqs |

### Target Cloud Run API (when migrating to Google stack)

```
POST /api/voice/transcribe          Cloud Speech-to-Text
POST /api/translate                 Cloud Translation
POST /api/respond                   Gemini on Vertex AI
GET  /api/cultural-tips             Firestore
GET  /api/faqs                      Firestore
GET  /api/experiences               Firestore
POST /api/admin/cultural-tips       Firestore (admin auth required)
POST /api/admin/faqs                Firestore (admin auth required)
POST /api/admin/accessibility-cues  Firestore (admin auth required)
GET  /api/sessions/:id              Firestore
GET  /api/conversations/:sessionId  Firestore
```

### Standard AI Response Format
```json
{
  "replyText": "Translated or helpful response",
  "replyLanguage": "am",
  "cultureTip": "Short optional tip",
  "accessibilityCue": "Short optional cue",
  "confidence": 0.92,
  "followUpSuggestion": "Optional next help"
}
```

---

## 9. Prompt Strategy (Gemini)

### System prompt principles (implemented in sheba-chat/index.ts)
- You are Sheba, a warm Kuriftu hospitality host
- Keep responses 2-3 sentences max
- Always return valid JSON: { response, translation, culturalTip }
- Only include a cultural tip when directly relevant
- Never invent resort facts not in the provided FAQ
- If accessibilityMode is true, add accessibility notes where relevant

### Context injected in every request
- Up to 10 curated FAQs
- Up to 10 cultural tips
- Source language + target language labels

### Improvements to add
- resortProperty field to tailor content per Kuriftu location
- Intent classification: greeting | food | spa | navigation | culture
- Fallback script when AI confidence is low or FAQs do not match

---

## 10. UI Screens

### Welcome Screen (/)
- Sheba logo with "S" avatar
- Language selector: English / Amharic / Afaan Oromoo
- Continue button → /assistant

### Main Assistant Screen (/assistant)
- Language bar: Source (left) | Swap button | Target (right)
- Conversation thread: user messages right, Sheba messages left
- Large mic button with pulse animation when recording
- Keyboard toggle for text input fallback
- Status text: Listening / Thinking / Ready
- Accessibility mode indicator when active

### Cultural Tips Screen (/cultural-tips)
- Cards grouped by category: Greetings, Dining, Etiquette, Culture

### Accessibility Screen (/accessibility)
- Scene description cards with obstacle warnings
- TODO: Add camera input → Gemini Vision scene description → TTS audio output

### Experiences Screen (/experiences)
- Cards: Coffee Ceremony, Lake Tana Boat Tour, Ethiopian Cooking Class, Spa & Wellness, Bird Watching, Sunset Meditation

### Admin Dashboard (/admin)
- Tabs: Cultural Tips | FAQs | Accessibility Cues
- Add and delete items per tab
- TODO: Protect this route with Firebase Auth or Supabase role check

---

## 11. Language Support

| Language | Code | STT Support | Translation | TTS | MVP Status |
|---|---|---|---|---|---|
| English | en | Cloud STT: en-US | Cloud Translation | Cloud TTS | Primary |
| Amharic | am | Cloud STT: am-ET | Cloud Translation | Cloud TTS | Primary |
| Afaan Oromo | om | Unverified | Unverified | Unverified | Phase 2 |

> IMPORTANT: Verify Afaan Oromo (om) support via the Cloud Translation supported-languages endpoint
> before including it in a demo promise. Mock phrases exist in mockServices.ts but real API
> support has not been confirmed. Treat Oromo as a Phase 2 validation item.

---

## 12. Folder Structure

### Current
```
sheba-kuriftu-assistance/
  src/
    pages/           All screen components
    components/      Layout, NavLink, shadcn ui components
    contexts/        AppContext (global state management)
    services/        api.ts (Supabase calls), mockServices.ts
    data/            seedData.ts (TypeScript types + seed content)
    hooks/           use-mobile, use-toast
    lib/             shadcn utils (cn helper)
    integrations/    supabase client configuration
  supabase/
    functions/
      sheba-chat/    Edge function — AI backend
    migrations/      Database schema SQL
  public/
  docs/
    implementation.md  This file
```

### Target (Google stack expansion)
```
sheba-kuriftu-assistance/
  src/                         Keep as-is (React frontend)
  backend/                     NEW: Cloud Run Node.js or FastAPI service
    src/
      controllers/
      services/
        speechService.ts       Cloud STT integration
        translationService.ts  Cloud Translation integration
        ttsService.ts          Cloud TTS integration
        geminiService.ts       Vertex AI Gemini integration
      routes/
      prompts/
      utils/
  shared/
    types/                     Shared TypeScript types for both frontend and backend
    constants/                 Language codes, resort property keys
  firestore/
    seed-data.json             Firestore seed content for migration
  docs/
    implementation.md          This file
```

---

## 13. Environment Variables

### Current frontend (.env)
```bash
VITE_SUPABASE_PROJECT_ID=
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

### Supabase Dashboard (server-side secrets for edge function)
```bash
AI_GATEWAY_KEY=       # AI gateway key for sheba-chat function
```

### Target Google Stack (.env)
```bash
# Google Cloud
GOOGLE_CLOUD_PROJECT=
GOOGLE_APPLICATION_CREDENTIALS=
VERTEX_AI_LOCATION=us-central1
GEMINI_MODEL=gemini-1.5-flash

# Firestore
FIRESTORE_COLLECTION_PREFIX=sheba

# Speech and Translation
STT_LANGUAGE_DEFAULT=am-ET
TRANSLATION_TARGETS=en,am
TTS_VOICE_NAME=

# Firebase Auth
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
```

---

## 14. Implementation Phases

### Phase 1: Working Demo (current state — mostly complete)
- [x] React SPA with all screens and navigation
- [x] Supabase PostgreSQL with 5 tables
- [x] Gemini AI chat via Supabase edge function
- [x] Cultural tips and FAQs injected into AI prompt
- [x] Admin dashboard with CRUD operations
- [x] Mock voice input (random phrase simulation)
- [x] Session and conversation persistence
- [ ] Real audio capture via MediaRecorder or Web Speech API
- [ ] Cloud TTS or browser SpeechSynthesis voice output
- [ ] Admin route protection

### Phase 2: Content Expansion + Real Voice
- [ ] Integrate Cloud Speech-to-Text for am-ET and en-US
- [ ] Integrate Cloud Translation API for explicit translation calls
- [ ] Implement Cloud Text-to-Speech or browser SpeechSynthesis playback
- [ ] Property-specific tips per Kuriftu location (bishoftu, bahirdar, adama, entoto)
- [ ] Expand FAQs to 20+ entries, add more experiences
- [ ] Verify and add Afaan Oromo API support
- [ ] Staff assist mode (quick translation view for front desk)
- [ ] Admin authentication (Firebase Auth or Supabase Auth)

### Phase 3: Camera Accessibility + Pilot Readiness
- [ ] Camera input → Gemini Vision multimodal scene description
- [ ] Conversation analytics and session review
- [ ] Improved fallback handling for AI uncertainty
- [ ] Expanded accessibility cue library
- [ ] Multi-property support with resortProperty field
- [ ] Secure login for staff and admin roles

### Phase 4: Google Stack Migration + Production Hardening
- [ ] Migrate backend to Cloud Run (Node.js or FastAPI)
- [ ] Migrate database to Cloud Firestore with offline persistence
- [ ] Firebase Authentication for all protected routes
- [ ] Cloud Monitoring and alerting
- [ ] Rate limiting and audit logs
- [ ] Strict RLS and admin permission scoping

---

## 15. Deployment Plan

### Current (Supabase-hosted)
```bash
# Local development
npm run dev                              # starts at localhost:5173

# Supabase edge function deploy
npx supabase functions deploy sheba-chat

# Apply DB migrations
npx supabase db push
```

### Target (Google Cloud)
1. Create Google Cloud project
2. Enable APIs: Cloud STT, Cloud Translation, Cloud TTS, Vertex AI, Firestore, Cloud Run, Firebase Auth
3. Build Node.js or FastAPI backend in /backend
4. Containerize and deploy to Cloud Run: gcloud run deploy
5. Build React frontend and point API URLs to Cloud Run
6. Seed Firestore with Kuriftu FAQs and culture content
7. Set up Firebase Auth for admin and staff routes
8. Test end-to-end with the one hero demo flow

---

## 16. Testing Checklist

- [ ] Text input to Gemini response works end-to-end
- [ ] Cultural tip shown only when context matches (not on every reply)
- [ ] Mic button captures real audio (Web Speech API or Cloud STT)
- [ ] Translation produces short, natural replies in Amharic
- [ ] TTS voice output plays on assistant response
- [ ] Accessibility mode returns concise scene and obstacle cues
- [ ] Admin dashboard allows add and delete of tips and FAQs
- [ ] Admin dashboard is protected from public access
- [ ] Fallback message shown when AI is uncertain
- [ ] App handles offline or weak connection gracefully
- [ ] Amharic transcription round-trip verified

---

## 17. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Scope too broad for hackathon | One locked hero flow: voice → translate → reply + cultural tip |
| Oromo STT and TTS not supported | Verify via API supported-languages endpoint; treat as Phase 2 |
| AI generating hallucinated resort facts | Only inject curated DB content into Gemini prompt |
| Admin content exposed with no auth | Add Firebase Auth or Supabase Auth before any public launch |
| AI gateway credits exhausted during demo | Handle 402 error gracefully (already coded in edge function) |
| Demo instability | Preload FAQs and tips; have fallback text responses ready offline |
| Real mic failing on device | Keyboard input toggle is already implemented as backup |
| Accessibility overclaim | Present scene hints as assistive guidance, not full navigation |

---

## 18. Priority Gap Closure Plan

Ordered by impact for the MVP demo:

| Priority | Gap | Where to fix | Notes |
|---|---|---|---|
| High | Real voice input | src/pages/Assistant.tsx | Use MediaRecorder + Web Speech API |
| High | Real TTS playback | src/services/tts.ts (create new) | Use browser SpeechSynthesis API first |
| Medium | Admin route protection | src/App.tsx + Admin.tsx | Add a simple auth guard |
| Medium | Camera → scene description | src/pages/Accessibility.tsx | File input with capture + Gemini Vision |
| Medium | contextKey tip matching | supabase/functions/sheba-chat/index.ts | More reliable cultural tip triggering |
| Low | Firestore migration | All services | Phase 3-4 |
| Low | Cloud Run migration | Backend folder (new) | Phase 4 |
| Low | Firebase Authentication | Auth layer (new) | Phase 3 |

---

## 19. Quick Reference Commands

```bash
# Start local development
cd sheba-kuriftu-assistance
npm run dev

# Run unit tests
npm test

# Run linter
npm run lint

# Deploy Supabase edge function
npx supabase functions deploy sheba-chat

# Apply database migrations
npx supabase db push

# Build production bundle
npm run build
```

---

*This document is the authoritative implementation reference for Sheba for Kuriftu.*
*Read it at every development session before writing new code.*
*Update it whenever architecture or phase decisions change.*
