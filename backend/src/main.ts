import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // rawBody:true is REQUIRED for Clerk/Svix webhook verification.
  // Svix signs the exact raw bytes; JSON.stringify(req.body) breaks the signature.
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.enableCors({
    // origin:true reflects the caller — required when credentials:true (* is rejected by browsers).
    origin: true,
    credentials: true,
  });
  const port = Number(process.env.PORT ?? 5000);
  await app.listen(port);
  console.log(`Backend listening on port ${port}`);
}
bootstrap();
