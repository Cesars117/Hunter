// Production server for Hostinger deployment
// This is the entry point that Hostinger's Node.js app will run

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');
const fs = require('fs');

const dev = false;
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT, 10) || 3000;

// ─── AUTO-SETUP ────────────────────────────────────
// Ensure .env exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  const envProductionPath = path.join(__dirname, '.env.production');
  if (fs.existsSync(envProductionPath)) {
    fs.copyFileSync(envProductionPath, envPath);
    console.log('> Created .env from .env.production');
  } else {
    // Create minimal .env
    const crypto = require('crypto');
    const jwtSecret = crypto.randomBytes(32).toString('hex');
    const envContent = [
      '# Hunter - Auto-generated',
      'DATABASE_URL="file:./prisma/prod.db"',
      `JWT_SECRET="${jwtSecret}"`,
      'NODE_ENV="production"',
      `PORT=${port}`,
    ].join('\n');
    fs.writeFileSync(envPath, envContent);
    console.log('> Created .env with auto-generated JWT_SECRET');
  }
}

// Ensure database exists
const dbPath = path.join(__dirname, 'prisma', 'prod.db');
if (!fs.existsSync(dbPath)) {
  console.log('> ⚠️ Database not found at', dbPath);
  console.log('> Visit /api/setup after the app starts to initialize');
} else {
  console.log('> ✅ Database found at', dbPath);
}

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Hunter ready on http://${hostname}:${port}`);
    });
});
