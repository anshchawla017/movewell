# Move Well — AI Physiotherapy Assistant

A simple web app that gives AI-powered physiotherapy guidance (chatbot, symptom analyzer, BMI insights), backed by a free [Groq](https://console.groq.com) API key.

## Files

| File          | Purpose                                   |
|---------------|--------------------------------------------|
| `server.js`   | Express backend, talks to the Groq AI API |
| `index.html`  | Main website                              |
| `login.html`  | User profile / details page               |
| `.env.example`| Template for your API key (copy to `.env`)|
| `vercel.json` | Config so this deploys correctly on Vercel|

## Run it locally

1. Install [Node.js](https://nodejs.org) (LTS version)
2. Clone this repo and open a terminal in the folder
3. Copy `.env.example` to `.env` and paste in your own Groq API key:
   ```
   GROQ_API_KEY=your_key_here
   ```
   Get a free key at https://console.groq.com → API Keys → Create Key
4. Install dependencies:
   ```
   npm install
   ```
5. Start the server:
   ```
   node server.js
   ```
6. Open http://localhost:3000/login.html

## Deploy on Vercel

1. Push this repo to GitHub (see steps below)
2. Go to https://vercel.com → **Add New Project** → import your GitHub repo
3. In the project's **Settings → Environment Variables**, add:
   - `GROQ_API_KEY` = your Groq key
4. Deploy — Vercel will give you a live URL like `move-well.vercel.app`

**Never commit your real `.env` file.** It's already excluded via `.gitignore`.

## Features

- 🤖 Floating chatbot for physio questions
- 🔍 Symptom analyzer → AI exercise plan
- 📊 Smart BMI insight with personalized AI advice

## Troubleshooting

- `"GROQ_API_KEY not set"` → check your `.env` file (local) or Vercel env variables (deployed)
- `Cannot GET /` → open `/login.html`, not just `/`
- Port 3000 busy locally → add `PORT=3001` to your `.env`
