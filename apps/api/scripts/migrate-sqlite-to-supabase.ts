import 'dotenv/config';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { Pool, type PoolClient } from 'pg';

const TABLES = [
  'User',
  'Category',
  'Product',
  'ProductVariant',
  'MediaAsset',
  'ProductMedia',
  'StoreSettings',
  'Cart',
  'CartItem',
  'Campaign',
  'Coupon',
  'ContentPage',
  'Order',
  'Payment',
  'PaymentEvent',
  'OrderItem',
  'ProductKey',
  'WishlistItem',
  'Review',
  'PublicationRevision',
  'AuditLog',
] as const;

const BOOLEAN_COLUMNS = new Set([
  'visible',
  'featured',
  'weeklyDeal',
  'hot',
  'isNew',
  'active',
  'isGift',
  'giftDelivered',
]);

const JSON_COLUMNS = new Set(['rawPayload', 'payload', 'snapshot', 'metadata']);

function quote(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function normalizeValue(table: string, column: string, value: unknown) {
  if (table === 'User' && column === 'passwordHash') return null;
  if (
    (column === 'imageUrl' || column === 'ogImageUrl') &&
    typeof value === 'string' &&
    value.includes('images.unsplash.com')
  ) {
    return '';
  }
  if (value == null) return null;
  if (BOOLEAN_COLUMNS.has(column)) {
    return value === true || value === 1 || value === '1';
  }
  if (JSON_COLUMNS.has(column) && typeof value === 'string') {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return value;
    }
  }
  if (column.endsWith('At') && value) {
    const date = new Date(value as string | number);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return value;
}

async function targetColumns(client: PoolClient, table: string) {
  const result = await client.query<{ column_name: string }>(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`,
    [table],
  );
  return new Set(result.rows.map((row) => row.column_name));
}

async function assertEmptyTarget(client: PoolClient) {
  if (process.env.MIGRATION_ALLOW_NONEMPTY === 'true') return;
  for (const table of ['User', 'Category', 'Product', 'Order']) {
    const result = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM ${quote(table)}`,
    );
    if (Number(result.rows[0]?.count || 0) > 0) {
      throw new Error(
        `Target table ${table} is not empty. Refusing to merge data. Set MIGRATION_ALLOW_NONEMPTY=true only after taking a backup.`,
      );
    }
  }
}

async function main() {
  if (process.env.MIGRATE_TO_SUPABASE !== 'true') {
    throw new Error(
      'Set MIGRATE_TO_SUPABASE=true to confirm the SQLite → Supabase migration.',
    );
  }

  const sourcePath = resolve(
    process.env.SQLITE_SOURCE || resolve(process.cwd(), 'prisma/dev.db'),
  );
  if (!existsSync(sourcePath)) {
    throw new Error(`SQLite source not found: ${sourcePath}`);
  }

  const connectionString = process.env.DIRECT_URL;
  if (!connectionString) throw new Error('DIRECT_URL is required');

  const sqlite = new DatabaseSync(sourcePath, { readOnly: true });
  const pool = new Pool({ connectionString, max: 1 });
  const client = await pool.connect();
  const deferredProductKeys: Array<{ id: string; orderItemId: string }> = [];

  try {
    await client.query('BEGIN');
    await assertEmptyTarget(client);

    const sourceTables = new Set(
      (
        sqlite
          .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
          .all() as Array<{ name: string }>
      ).map((row) => row.name),
    );

    for (const table of TABLES) {
      if (!sourceTables.has(table)) continue;
      const destination = await targetColumns(client, table);
      if (destination.size === 0) continue;

      const rows = sqlite.prepare(`SELECT * FROM ${quote(table)}`).all() as Array<
        Record<string, unknown>
      >;
      let copied = 0;

      for (const sourceRow of rows) {
        const row = { ...sourceRow };
        if (
          table === 'ProductKey' &&
          typeof row.id === 'string' &&
          typeof row.orderItemId === 'string'
        ) {
          deferredProductKeys.push({
            id: row.id,
            orderItemId: row.orderItemId,
          });
          row.orderItemId = null;
        }

        const columns = Object.keys(row).filter((column) => destination.has(column));
        if (columns.length === 0) continue;
        const values = columns.map((column) =>
          normalizeValue(table, column, row[column]),
        );
        const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
        const conflictColumn = columns.includes('id') ? 'id' : columns[0];

        await client.query(
          `INSERT INTO ${quote(table)} (${columns.map(quote).join(', ')}) VALUES (${placeholders}) ON CONFLICT (${quote(conflictColumn)}) DO NOTHING`,
          values,
        );
        copied += 1;
      }

      console.log(`${table}: ${copied} row(s)`);
    }

    for (const key of deferredProductKeys) {
      await client.query(
        `UPDATE "ProductKey" SET "orderItemId" = $1 WHERE "id" = $2`,
        [key.orderItemId, key.id],
      );
    }

    await client.query('COMMIT');
    console.log('SQLite data migrated to Supabase Postgres successfully.');
    console.log(
      'Legacy users will be linked to Supabase Auth by email on their first sign-in.',
    );
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    sqlite.close();
    client.release();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
