require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const GROQ_KEY = process.env.GROQ_API_KEY;
const KEY_MISSING = !GROQ_KEY || GROQ_KEY === 'your_groq_api_key_here';

// ── startup check ──────────────────────────────────────────
// NOTE: we only log here, we never process.exit(). On Vercel, exiting kills
// the whole serverless function and the platform returns an HTML error page
// instead of JSON — which breaks the frontend with a confusing parse error.
// Each route checks KEY_MISSING itself and returns a clean JSON error instead.
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
          model: 'llama-3.1-8b-instant',
          messages: groqMessages,
          max_tokens: 800,
          temperature: 0.7
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

const PORT = process.env.PORT || 3000;

// Only start a listening server when running locally (e.g. `node server.js`).
// On Vercel, the app is exported and run as a serverless function instead.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('\n🚀 Move Well AI server running!');
    console.log('   Website  → http://localhost:' + PORT + '/login.html');
    console.log('   Test API → http://localhost:' + PORT + '/api/test\n');
  });
}

module.exports = app;
