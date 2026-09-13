import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import 'dotenv/config';

@Injectable()
export class DbService implements OnModuleInit, OnModuleDestroy {
  public db: PostgresJsDatabase<typeof schema>;
  public client: postgres.Sql;
  public initError: string | null = null;

  constructor() {
    let url = process.env.DATABASE_URL;
    if (!url) {
      this.initError = 'DATABASE_URL env var is missing or empty';
      console.error(
        'DATABASE_URL is not set — DB queries will fail. Set it in Vercel Project Settings > Environment Variables and redeploy.',
      );
      this.client = null as any;
      this.db = new Proxy({} as any, {
        get() {
          throw new Error('DATABASE_URL is not set');
        },
      });
      return;
    }

    url = url.trim().replace(/^["']|["']$/g, '');

    try {
      this.client = postgres(url, {
        ssl: { rejectUnauthorized: false },
        max: 3, // Limit connection pool for serverless — each invocation shares max 3 connections
        idle_timeout: 20,
        connect_timeout: 10,
      });
      this.db = drizzle(this.client, { schema });
    } catch (err: any) {
      this.initError = err?.message || String(err);
      console.error(
        'DATABASE_URL initialization failed (invalid URL or config):',
        err?.message || err,
      );
      this.client = null as any;
      this.db = new Proxy({} as any, {
        get() {
          throw new Error(
            `DATABASE_URL connection setup failed: ${err?.message || err}`,
          );
        },
      });
    }
  }

  onModuleInit() {
    // Connection is established lazily or on init.
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.end();
    }
  }
}
