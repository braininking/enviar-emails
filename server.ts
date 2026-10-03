import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { jobsRouter } from './server/routes/jobsRouter.ts';
import { gmailRouter } from './server/routes/gmailRouter.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();

  // Parse port from CLI args if provided (e.g. --port 3000)
  const portArgIndex = process.argv.indexOf('--port');
  const cliPort =
    portArgIndex !== -1 && process.argv[portArgIndex + 1]
      ? parseInt(process.argv[portArgIndex + 1], 10)
      : null;

  const distPath = path.resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(path.resolve(distPath, 'index.html'));

  // In production (Cloud Run), process.env.PORT is 8080 and dist/ is built.
  // In development, AI Studio dev server runs on port 3000 with vite.middlewares.
  const isDevCommand = process.env.npm_lifecycle_event === 'dev';
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    (!isDevCommand && (hasDist || process.env.PORT === '8080'));

  // If in production, bind to process.env.PORT (e.g. 8080 on Cloud Run)
  // If in development, bind to port 3000 as required by AI Studio
  const PORT = cliPort || (isProduction ? parseInt(process.env.PORT || '8080', 10) : 3000);

  // MIME messages can contain PDF attachments, so allow payloads close to Gmail's 25 MB limit.\n  app.use(express.json({ limit: '40mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Vagas Email Finder',
      mode: isProduction ? 'production' : 'development',
      port: PORT,
      timestamp: Date.now(),
    });
  });

  // API router for job extraction & search
  app.use('/api/jobs', jobsRouter);

  if (isProduction && hasDist) {
    // Serve production static build
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // Mount Vite dev server middlewares with HMR explicitly disabled
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `[Vagas Email Finder] Servidor iniciado na porta ${PORT} (${isProduction ? 'produção' : 'desenvolvimento'})`
    );
  });
}

startServer().catch((err) => {
  console.error('[Vagas Email Finder] Falha ao iniciar servidor:', err);
  process.exit(1);
});
