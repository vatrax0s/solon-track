/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { querySolonTrack } from './src/solonService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // CORS support for external PWA scanners (like pwabuilder.com)
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Explicit PWA manifest routing with standard MIME type and CORS
  app.get(['/manifest.json', '/manifest.webmanifest'], (req, res) => {
    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    const jsonPath = path.resolve(__dirname, 'public/manifest.json');
    if (fs.existsSync(jsonPath)) {
      return res.sendFile(jsonPath);
    }
    res.sendFile(path.resolve(__dirname, 'public/manifest.webmanifest'));
  });

  // Explicit API manifest endpoint returning application/json for external generators
  app.get('/api/manifest', (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');
    const jsonPath = path.resolve(__dirname, 'public/manifest.json');
    if (fs.existsSync(jsonPath)) {
      return res.sendFile(jsonPath);
    }
    res.sendFile(path.resolve(__dirname, 'public/manifest.webmanifest'));
  });

  // Explicit Digital Asset Links routing for Android TWA (removes top URL bar)
  app.get('/.well-known/assetlinks.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const assetlinksPath = path.resolve(__dirname, 'public/.well-known/assetlinks.json');
    if (fs.existsSync(assetlinksPath)) {
      return res.sendFile(assetlinksPath);
    }
    res.json([]);
  });

  // Explicit Service Worker routing with standard headers
  app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Service-Worker-Allowed', '/');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.resolve(__dirname, 'public/sw.js'));
  });

  // Explicit Icon routing for mobile launchers, PWA crawlers, and browsers
  app.get(['/icon-192.png', '/icon-512.png', '/apple-touch-icon.png', '/favicon.ico', '/icon.svg'], (req, res) => {
    const filename = req.path.replace(/^\//, '');
    const filePath = path.resolve(__dirname, 'public', filename);
    if (fs.existsSync(filePath)) {
      if (filename.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      } else if (filename.endsWith('.svg')) {
        res.setHeader('Content-Type', 'image/svg+xml');
      } else if (filename.endsWith('.ico')) {
        res.setHeader('Content-Type', 'image/x-icon');
      }
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.sendFile(filePath);
    }
    res.sendStatus(404);
  });

  // Load courts data
  let courts: Array<{ value: string; name: string }> = [];
  try {
    const courtsPath = path.resolve(__dirname, 'src/data/courts.json');
    if (fs.existsSync(courtsPath)) {
      courts = JSON.parse(fs.readFileSync(courtsPath, 'utf-8'));
    }
  } catch (e) {
    console.error('Failed to load courts.json:', e);
  }

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  app.get('/api/courts', (req, res) => {
    res.json(courts);
  });

  app.post('/api/solon/track', async (req, res) => {
    try {
      const { courtOfficeOC, searchType, number, year } = req.body;

      if (!courtOfficeOC || !number || !year) {
        return res.status(400).json({
          success: false,
          error: 'Παρακαλώ συμπληρώστε όλα τα απαιτούμενα πεδία (Δικαστήριο, Αριθμός, Έτος).'
        });
      }

      const courtObj = courts.find((c) => c.value === String(courtOfficeOC));
      const courtName = courtObj ? courtObj.name : `Δικαστήριο #${courtOfficeOC}`;

      const result = await querySolonTrack({
        courtOfficeOC: String(courtOfficeOC),
        courtName,
        searchType: searchType === 'EAK' ? 'EAK' : 'GAK',
        number: String(number).trim(),
        year: String(year).trim()
      });

      res.json(result);
    } catch (err: any) {
      console.error('Error handling /api/solon/track:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Εσωτερικό σφάλμα διακομιστή κατά την επικοινωνία με το ΣΟΛΩΝ.'
      });
    }
  });

  // Vite middleware in dev or static files in production
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Server running on port ${port} in ${isProd ? 'production' : 'development'} mode`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
