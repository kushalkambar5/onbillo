import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import 'dotenv/config';

export function cleanDatabaseUrl(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  let url = raw.trim().replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
  // Strip export DATABASE_URL=, DATABASE_URL=, DATABASE_URL:
  url = url.replace(/^(?:export\s+)?DATABASE_URL\s*[:=]\s*/i, '');
  // Strip psql CLI prefix (e.g. psql "postgresql://...")
  url = url.replace(/^psql\s+/i, '');
  // Strip surrounding quotes or backticks (repeated in case of multiple)
  while (/^[`"']/.test(url) && /[`"']$/.test(url)) {
    url = url.slice(1, -1).trim();
  }
  // Trim trailing semicolons or whitespace
  url = url.replace(/;+$/, '').trim();
  return url;
}

@Injectable()
export class DbService implements OnModuleInit, OnModuleDestroy {
  public db: PostgresJsDatabase<typeof schema>;
  public client: postgres.Sql;
  public initError: string | null = null;

  constructor() {
    let rawUrl = process.env.DATABASE_URL;
    const url = cleanDatabaseUrl(rawUrl);
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
