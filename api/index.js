// Vercel serverless function entry point.
// This only ever handles requests to /api/* (see vercel.json rewrite).
// Your HTML pages (index.html, login.html) are served directly by Vercel,
// not through this function.
const app = require('../app');

module.exports = app;
