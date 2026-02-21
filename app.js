// Passenger/LiteSpeed app.js for Hostinger
// This file is required by Phusion Passenger to start the Node.js app

const path = require('path');
const fs = require('fs');

// Set environment
process.env.NODE_ENV = 'production';

// Load .env file manually
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const eqIdx = line.indexOf('=');
      if (eqIdx > 0) {
        const key = line.substring(0, eqIdx).trim();
        let val = line.substring(eqIdx + 1).trim();
        // Remove surrounding quotes
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
  console.log('> .env loaded');
}

// Detect if running under Passenger
if (typeof(PhusionPassenger) !== 'undefined') {
  PhusionPassenger.configure({ autoInstall: false });
}

// Start Next.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = false;
const hostname = '0.0.0.0';
// Passenger sets its own port via 'passenger' event
const port = (typeof(PhusionPassenger) !== 'undefined') ? 'passenger' : (parseInt(process.env.PORT, 10) || 3000);

const app = next({ dev, hostname, port: typeof port === 'number' ? port : 3000, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  if (typeof(PhusionPassenger) !== 'undefined') {
    server.listen('passenger', () => {
      console.log('> Hunter ready (Passenger mode)');
    });
  } else {
    server.listen(port, () => {
      console.log(`> Hunter ready on http://${hostname}:${port}`);
    });
  }
});
