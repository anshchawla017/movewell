require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Serve the static HTML/CSS/JS files from the project root.
// (Only used for local `node server.js` — on Vercel these files are served
// directly by the platform, this function only ever receives /api/* traffic.)
app.use(express.static(path.join(__dirname)));

// Send visitors straight to the login page when they open the bare domain.
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

const GROQ_KEY = process.env.GROQ_API_KEY;
const KEY_MISSING = !GROQ_KEY || GROQ_KEY === 'your_groq_api_key_here';

if (KEY_MISSING) {
  console.error('\n❌ WARNING: GROQ_API_KEY not set!');
  console.error('   Local: add it to your .env file.');
  console.error('   Vercel: Project Settings → Environment Variables, then redeploy.\n');
} else {
  console.log('✅ Groq API key found:', GROQ_KEY.substring(0, 8) + '...');
}

app.get('/api/test', (req, res) => {
  res.json({ status: 'Server is working!', keyLoaded: !KEY_MISSING });
});

app.post('/api/claude', async (req, res) => {
  if (KEY_MISSING) {
    return res.status(500).json({
      error: 'GROQ_API_KEY is not configured on the server. Add it in your .env (local) or Vercel project → Settings → Environment Variables, then redeploy.'
    });
  }

  try {
    const { system, messages } = req.body || {};

    const groqMessages = [];
    if (system) groqMessages.push({ role: 'system', content: system });
    if (messages && messages.length > 0) {
      messages.slice(-6).forEach(m => groqMessages.push(m));
    }

    if (groqMessages.length === 0) {
      return res.status(400).json({ error: 'No message content was sent to the AI.' });
    }

    console.log('\n📤 Sending to Groq...');

    let response;
    try {
      response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + GROQ_KEY
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-20b',
          messages: groqMessages,
          max_tokens: 1200,
          temperature: 0.7,
          reasoning_effort: 'low'
        })
      });
    } catch (networkErr) {
      console.error('❌ Could not reach Groq:', networkErr.message);
      return res.status(502).json({ error: 'Could not reach the AI service. Please try again in a moment.' });
    }

    let data;
    try {
      data = await response.json();
    } catch (parseErr) {
      console.error('❌ Groq returned a non-JSON response, status:', response.status);
      return res.status(502).json({ error: 'The AI service returned an unexpected response. Please try again.' });
    }

    if (!response.ok || data.error) {
      console.error('❌ Groq error:', data.error || data);
      return res.status(400).json({ error: 'Groq said: ' + (data.error?.message || 'request failed') });
    }

    const text = data?.choices?.[0]?.message?.content;
    if (!text) {
      console.error('❌ Unexpected Groq response shape:', JSON.stringify(data).slice(0, 300));
      return res.status(502).json({ error: 'AI response was empty or malformed. Please try again.' });
    }

    console.log('✅ Got reply (' + text.length + ' chars)');
    res.json({ text });

  } catch (err) {
    console.error('❌ Server crash:', err.message);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// Catch-all error handler — guarantees JSON is always returned, never an HTML
// error page, even if something above throws unexpectedly.
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Unexpected server error. Please try again.' });
});

module.exports = app;
