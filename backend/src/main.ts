import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

export function getCorsOrigins(): (string | RegExp)[] {
  const origins = [
    'http://localhost:3000',
    'http://localhost:5000',
    'https://onbillo.vercel.app',
  ];
  // Allow preview deployments + custom frontend URL via env
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
  }
  return origins;
}

async function bootstrap() {
  // rawBody:true is REQUIRED for Clerk/Svix webhook verification.
  // Svix signs the exact raw bytes; JSON.stringify(req.body) breaks the signature.
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.enableCors({
    origin: (origin, callback) => {
      // Allow server-to-server / curl / Clerk webhooks with no Origin header
      if (!origin) return callback(null, true);
      const allowed = getCorsOrigins();
      if (
        allowed.includes(origin) ||
        /\.vercel\.app$/.test(origin) ||
        /^http:\/\/localhost:\d+$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, true); // permissive for now; tighten after deploy is stable
    },
    credentials: true,
  });
  const port = Number(process.env.PORT ?? 5000);
  await app.listen(port);
  console.log(`Backend listening on port ${port}`);
}
bootstrap();
