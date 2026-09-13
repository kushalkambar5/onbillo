import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // rawBody:true is REQUIRED for Clerk/Svix webhook verification.
  // Svix signs the exact raw bytes; JSON.stringify(req.body) breaks the signature.
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server) or any web origin
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'svix-id',
      'svix-timestamp',
      'svix-signature',
      'ngrok-skip-browser-warning',
    ],
    exposedHeaders: ['*'],
  });
  const port = Number(process.env.PORT ?? 5000);
  await app.listen(port);
  console.log(`Backend listening on port ${port}`);
}
bootstrap();
