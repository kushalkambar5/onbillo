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

function setCorsHeaders(req: any, res: any) {
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
  // Always answer CORS preflight, even if Nest/DB init is broken —
  // otherwise browsers mask the real 500 as an opaque CORS error.
  setCorsHeaders(req, res);
  if (req?.method === 'OPTIONS') {
    return res.status(204).end();
  }
  try {
    const server = await bootstrap();
    return (server as any)(req, res);
  } catch (err) {
    console.error('Vercel function init failed:', err);
    if (!res.headersSent) {
      return res.status(500).json({
        statusCode: 500,
        message:
          'Backend init failed. Check Vercel env vars (DATABASE_URL, CLERK_SECRET_KEY, CLERK_WEBHOOK_SECRET).',
      });
    }
  }
}
