import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import 'dotenv/config';

@Injectable()
export class DbService implements OnModuleInit, OnModuleDestroy {
  public db: PostgresJsDatabase<typeof schema>;
  private client: postgres.Sql;

  constructor() {
    this.client = postgres(process.env.DATABASE_URL as string);
    this.db = drizzle(this.client, { schema });
  }

  onModuleInit() {
    // Connection is established lazily or on init.
  }

  async onModuleDestroy() {
    await this.client.end();
  }
}
