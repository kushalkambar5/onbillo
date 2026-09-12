import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from '../src/app.module';

// Vercel serverless entrypoint. Vercel does NOT support long-running
// `app.listen()` — every request hits this cached Express instance instead.
// Local dev / Render / Railway still use src/main.ts (app.listen).
const expressApp = express();
let initialized = false;

// Vercel must NOT pre-parse the body: Nest needs the raw bytes
// (rawBody:true) for Clerk/Svix webhook signature verification.
export const config = {
  api: { bodyParser: false },
};

function setCorsHeaders(req: any, res: any) {
  try {
    const origin = req?.headers?.origin as string | undefined;
    // Reflect the request origin so credentialed frontend calls pass.
    // Tighten to https://onbillo.vercel.app once stable.
    res.setHeader('Access-Control-Allow-Origin', origin ?? '*');
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      (req?.headers?.['access-control-request-headers'] as string) ??
        'Content-Type, Authorization, svix-id, svix-timestamp, svix-signature',
    );
  } catch {
    // res may be a raw Node response in some runtimes — headers are
    // re-applied in the fallback path below, so never throw here.
  }
}

// Last-resort 500 that always carries CORS headers, even if the
// Vercel-style res helpers (.status/.json) are unavailable.
// TEMPORARY DIAGNOSTICS: echoes the bootstrap error message + request url so
// we can see the real crash reason in the browser/curl (remove detail later).
function sendInitError(req: any, res: any, err?: unknown) {
  try {
    setCorsHeaders(req, res);
  } catch {
    /* ignore */
  }
  const body = JSON.stringify({
    statusCode: 500,
    message:
      'Backend init failed. Check Vercel env vars (DATABASE_URL, CLERK_SECRET_KEY, CLERK_WEBHOOK_SECRET).',
    detail: String((err as any)?.message ?? err ?? 'unknown').slice(0, 500),
    seenUrl: String(req?.url ?? 'n/a').slice(0, 200),
    seenMethod: String(req?.method ?? 'n/a'),
  });
  try {
    if (!res.headersSent && typeof res.status === 'function') {
      return res.status(500).json(JSON.parse(body));
    }
  } catch {
    /* fall through to raw Node response */
  }
  try {
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(body);
      return;
    }
  } catch {
    /* nothing left we can do */
  }
}

async function bootstrap() {
  if (initialized) return expressApp;
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
    { rawBody: true },
  );
  // origin:true reflects the caller — required when credentials:true (* is rejected by browsers).
  app.enableCors({
    origin: true,
    credentials: true,
  });
  await app.init();
  initialized = true;
  return expressApp;
}

export default async function handler(req: any, res: any) {
  try {
    // Always answer CORS preflight, even if Nest/DB init is broken —
    // otherwise browsers mask the real 500 as an opaque CORS error.
    setCorsHeaders(req, res);
    // TEMPORARY PROBE: confirm rewritten requests reach this function and
    // reveal the exact url Vercel delivers (remove after diagnosis).
    if (
      typeof req?.url === 'string' &&
      req.url.includes('echo-probe')
    ) {
      // ?stage=create|init — boot a THROWAWAY Nest app (separate Express
      // instance, cached app untouched) to bisect the startup crash.
      const stageMatch = /[?&]stage=(create|init)/.exec(req.url);
      if (stageMatch) {
        const stage = stageMatch[1];
        try {
          const probeExpress = express();
          const probeApp = await NestFactory.create(
            AppModule,
            new ExpressAdapter(probeExpress),
            { rawBody: true },
          );
          if (stage === 'create') {
            return res
              .status(200)
              .json({ probe: true, stage: 'create-ok' });
          }
          probeApp.enableCors({ origin: true, credentials: true });
          await probeApp.init();
          await probeApp.close();
          return res.status(200).json({ probe: true, stage: 'init-ok' });
        } catch (e: any) {
          return res.status(200).json({
            probe: true,
            stage,
            failedAt: stage,
            detail: String(e?.message ?? e).slice(0, 1000),
          });
        }
      }
      return res.status(200).json({
        probe: true,
        url: req.url,
        method: req.method,
        hasBodyParserConfig: true,
      });
    }
    if (req?.method === 'OPTIONS') {
      try {
        return res.status(204).end();
      } catch {
        res.writeHead(204);
        return res.end();
      }
    }
    try {
      const server = await bootstrap();
      return (server as any)(req, res);
    } catch (err) {
      console.error('Vercel function init failed:', err);
      return sendInitError(req, res, err);
    }
  } catch (err) {
    console.error('Vercel handler failed before bootstrap:', err);
    return sendInitError(req, res, err);
  }
}
