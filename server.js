// Local development entry point: `node server.js`
// (On Vercel, api/index.js is used instead — see that file.)
const app = require('./app');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('\n🚀 Move Well AI server running!');
  console.log('   Website  → http://localhost:' + PORT + '/login.html');
  console.log('   Test API → http://localhost:' + PORT + '/api/test\n');
});
