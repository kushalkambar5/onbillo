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

async function bootstrap() {
  if (initialized) return expressApp;
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
    { rawBody: true },
  );
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true);
      if (
        origin === 'https://onbillo.vercel.app' ||
        /\.vercel\.app$/.test(origin) ||
        /^http:\/\/localhost:\d+$/.test(origin) ||
        (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL)
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  });
  await app.init();
  initialized = true;
  return expressApp;
}

export default async function handler(req: any, res: any) {
  const server = await bootstrap();
  return (server as any)(req, res);
}
