# InterviewAI Pro — MERN Edition

AI mock-interview platform: **MongoDB + Express + React (Vite) + Node**, Groq (LLaMA 3.3 70B) for AI, face/voice analysis in the browser.

```
interview-ai-mern/
├── client/   → React + Vite   (Vercel par deploy)
└── server/   → Node + Express (Render par deploy)  +  MongoDB Atlas
```

## Features
| Feature | Kaise kaam karta hai |
|---|---|
| 🎙️ AI interviewer | 3D orb (three.js) sawal bolta hai (browser TTS), aap bolkar answer dete ho (browser Speech-to-Text) |
| 😊 Face analysis | `face-api` (browser me): 7 expressions, nervousness, smile, **eye-contact estimate** (head-pose + personal calibration). Video upload nahi hota |
| 🎤 Voice tone | Web Audio API: pace (WPM), pitch variation (monotone?), volume, pauses, fillers |
| 🧠 Answer evaluation | Server par **Groq**: relevance, depth, structure, clarity + **kaha galti hui** + **better answer** |
| 🏆 Score | Answers 50% + Voice 25% + Face 25% (camera/mic off ho to baaki parts ka weight auto-adjust) |
| 🏢 Companies | 10 companies × HR/Technical + 5 tech domains (MERN, Python/Django, DSA, Core CS, System Design) — 126 questions |
| 🤖 Aria mentor | Groq chat, aapki interview history ke saath, chat MongoDB me save |
| 🛡️ Admin panel | `/admin` — users, block/delete, interviews, analytics, CSV export, password change |
| 📱💻 Responsive | Mobile: bottom-nav app jaisa UI + alag interview-room layout. Laptop: top-nav + 2-column room |

---

# 🚀 DEPLOY — Step by Step (Atlas → Render → Vercel)

## STEP 0 — Groq API key (IMPORTANT)
Aapki purani `index.html` me Groq key **code ke andar likhi thi** — jo bhi us file ko dekh sakta hai wo key use kar sakta hai.
1. https://console.groq.com/keys par jao → purani key **Revoke/Delete** karo.
2. **Create API Key** → nayi key copy karke rakho (ye sirf Render me jayegi, kisi file me nahi).

## STEP 1 — Code GitHub par daalo
1. github.com → **New repository** → naam `interviewai-mern` → Create.
2. Is folder ke andar terminal kholo :
```bash
git init
git add .
git commit -m "InterviewAI MERN"
git branch -M main
git remote add origin https://github.com/<your-username>/interviewai-mern.git
git push -u origin main
```
(`.env` files `.gitignore` me hain, isliye secrets push nahi honge.)

## STEP 2 — MongoDB Atlas (Database)
1. https://cloud.mongodb.com → Sign up → **Create** → **M0 FREE** cluster (region: Mumbai `ap-south-1` best).
2. **Database Access** → *Add New Database User* → username + password (password me `@ : / ?` jaise special characters mat rakho) → *Read and write to any database*.
3. **Network Access** → *Add IP Address* → **Allow access from anywhere** (`0.0.0.0/0`) → Confirm. (Render ka IP change hota rehta hai.)
4. **Database** → **Connect** → *Drivers* → connection string copy karo:
```
mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```
`<password>` ki jagah apna password dalo aur `.net/` ke baad database naam jodo:
```
mongodb+srv://myuser:mypass@cluster0.xxxxx.mongodb.net/interviewai?retryWrites=true&w=majority
```
Collections apne aap ban jayenge, kuch manually banana nahi hai.

## STEP 3 — Render (Backend / API)
1. https://render.com → GitHub se login → **New +** → **Web Service** → apna repo select karo.
2. Settings:
   | Field | Value |
   |---|---|
   | Name | `interviewai-api` |
   | **Root Directory** | `server` |
   | Runtime | Node |
   | Build Command | `npm install` |
   | Start Command | `npm start` |
   | Instance Type | Free |
3. **Environment Variables** (Add each):
   | Key | Value |
   |---|---|
   | `MONGODB_URI` | Step 2 wali connection string |
   | `JWT_SECRET` | koi bhi 40+ random characters |
   | `GROQ_API_KEY` | Step 0 wali nayi key |
   | `GROQ_MODEL` | `llama-3.3-70b-versatile` |
   | `CLIENT_URL` | abhi `http://localhost:5173` (Step 5 me Vercel URL se badlenge) |
   | `ADMIN_EMAIL` | aapka admin email |
   | `ADMIN_PASSWORD` | strong password (8+ chars) |
   | `NODE_ENV` | `production` |
4. **Create Web Service** → 2-4 min me deploy. URL milega: `https://interviewai-api.onrender.com`
5. Check: browser me `https://interviewai-api.onrender.com/api/health` kholo → `{"ok":true,...}` aana chahiye. ✅

## STEP 4 — Vercel (Frontend)
1. https://vercel.com → GitHub se login → **Add New → Project** → apna repo **Import**.
2. Settings:
   | Field | Value |
   |---|---|
   | **Root Directory** | `client` (Edit → client select) |
   | Framework Preset | Vite (auto) |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |
3. **Environment Variables**: `VITE_API_URL` = `https://interviewai-api.onrender.com` (Render ka URL, **end me `/` nahi**).
4. **Deploy**. URL milega: `https://interviewai-mern.vercel.app`

## STEP 5 — Dono ko jodo (CORS)
Render → apni service → **Environment** → `CLIENT_URL` ko Vercel URL se badlo:
```
https://interviewai-mern.vercel.app
```
(Custom domain ya multiple URL ho to comma se alag: `https://a.com,https://b.vercel.app`). Save → Render auto-redeploy karega.

## STEP 6 — Test
1. Vercel URL kholo → **Register** → login.
2. **Practice** → company chuno → Continue → **Allow Camera & Mic** → Start.
3. Admin: `https://<vercel-url>/admin` → `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

## STEP 7 (recommended) — Render free server ko jagaye rakho
Render Free service 15 min inactivity ke baad so jati hai (pehli request 30-50 sec leti hai). https://uptimerobot.com par free monitor banao: URL = `https://interviewai-api.onrender.com/api/health`, interval 5 min.

> Code change karke `git push` karoge to Render aur Vercel dono **auto-deploy** ho jayenge.

---

# 💻 Local par chalana
```bash
# Terminal 1 — backend
cd server
npm install
cp .env.example .env      # .env me MONGODB_URI, JWT_SECRET, GROQ_API_KEY bharo
npm run dev               # http://localhost:5000

# Terminal 2 — frontend
cd client
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:5000
npm run dev               # http://localhost:5173
```

---

# 🧠 Score kaise banta hai
```
Final = 0.50 × Answer score + 0.25 × Voice score + 0.25 × Face score
```
- **Answer** (Groq): `0.35 relevance + 0.25 depth + 0.20 structure + 0.20 clarity` (skip = 0, 10 words se kam = max 35)
- **Voice**: volume 20% • tone/pitch variation 30% • pace 25% (ideal 120-160 WPM) • fluency (pauses + fillers) 25%
- **Face**: eye contact 35% • composure (nervous expressions kam) 30% • warmth/smile 20% • face visible 15%
- Camera ya mic off ho to wo part score me count nahi hota, baaki ka weight automatically badh jata hai.

⚠️ Face aur voice analysis **estimates** hain (camera/mic quality, light, accent par depend). Practice feedback ke liye hain, final judgement ke liye nahi.

# 🛠️ Troubleshooting
| Problem | Solution |
|---|---|
| Login/Register par "Network Error" | Vercel me `VITE_API_URL` sahi hai? Render me `CLIENT_URL` = exact Vercel URL? (Env badalne ke baad Vercel me **Redeploy** karo) |
| Pehli request bahut slow | Render free server so raha tha — Step 7 follow karo |
| Camera/mic nahi chal raha | Sirf **HTTPS** (Vercel) ya `localhost` par chalta hai. Browser me site permission Allow karo |
| Speech-to-text "not supported" | **Chrome / Edge** use karo (laptop ya Android). iPhone Safari me answers type karne padenge |
| Voice score "not available" | Kuch phones par speech-recognition mic le leta hai. Is case me score answer + face se banta hai |
| Atlas connect error | Network Access me `0.0.0.0/0` hai? Password me special character to nahi? |
| Admin login nahi ho raha | Admin pehli baar server start par `ADMIN_EMAIL/ADMIN_PASSWORD` se banta hai. Baad me env badalne se password nahi badalta — Admin → Settings se badlo |
| Groq error / rate limit | AI fail hone par app rule-based scoring par fallback karta hai (report phir bhi banta hai) |

# 📁 Structure
```
server/
  server.js              Express app, CORS, rate-limit, admin seed
  config/db.js           MongoDB connect
  models/                User, Interview, Chat, Admin
  routes/                auth, companies, interviews (scoring pipeline), mentor, admin
  services/groq.js       Groq API wrapper (key sirf yaha use hoti hai)
  services/evaluator.js  Groq answer evaluation prompt (JSON mode)
  services/scoring.js    Face + voice + overall scoring, delivery feedback
  services/heuristics.js Fallback rule-based answer analysis
  data/                  companies.js, questions.js (126 questions)
client/
  public/models/         face-api model files (tiny detector + landmarks + expressions)
  src/lib/               faceAnalyzer, voiceAnalyzer, speech
  src/components/        3D orb scenes, charts, layout, UI kit
  src/pages/             Landing, Auth, Dashboard, Setup, Room, Results, History, Companies, Mentor, Admin
  src/styles/global.css  design system (responsive: desktop / tablet / mobile)
```
