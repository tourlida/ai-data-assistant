import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { pool } from '../db/pool';
import { expectedCsvHeaders, sourceRecordSchema, type SourceRecord } from './csvSchema';

const csvPath = path.resolve(process.cwd(), 'assigment-docs/sales_data.csv');

function parseSourceCsv(contents: string): SourceRecord[] {
  const rows = parse(contents, { columns: true, skip_empty_lines: true, bom: true }) as Record<string, string>[];
  if (!rows.length) throw new Error('CSV contains no data rows');

  const actualHeaders = Object.keys(rows[0]);
  if (actualHeaders.length !== expectedCsvHeaders.length || actualHeaders.some((header, index) => header !== expectedCsvHeaders[index])) {
    throw new Error(`CSV header must be exactly: ${expectedCsvHeaders.join(',')}`);
  }

  const seenOrderIds = new Set<number>();
  return rows.map((row, index) => {
    const result = sourceRecordSchema.safeParse(row);
    if (!result.success) {
      throw new Error(`CSV row ${index + 2} is invalid: ${result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`);
    }
    if (seenOrderIds.has(result.data.order_id)) throw new Error(`Duplicate order_id ${result.data.order_id}`);
    seenOrderIds.add(result.data.order_id);
    return result.data;
  });
}

async function importCsv(): Promise<void> {
  const records = parseSourceCsv(await readFile(csvPath, 'utf8'));
  const customers = new Map<number, SourceRecord>();
  const products = new Map<number, SourceRecord>();
  for (const record of records) {
    const existingCustomer = customers.get(record.customer_id);
    if (existingCustomer && (existingCustomer.customer_name !== record.customer_name || existingCustomer.customer_email !== record.customer_email || existingCustomer.country !== record.country)) {
      throw new Error(`Conflicting customer data for customer_id ${record.customer_id}`);
    }
    const existingProduct = products.get(record.product_id);
    if (existingProduct && (existingProduct.product_name !== record.product_name || existingProduct.category !== record.category)) {
      throw new Error(`Conflicting product data for product_id ${record.product_id}`);
    }
    customers.set(record.customer_id, record);
    products.set(record.product_id, record);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const record of customers.values()) {
      await client.query(`
        INSERT INTO customers (customer_id, customer_name, customer_email, country)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (customer_id) DO UPDATE SET customer_name = EXCLUDED.customer_name, customer_email = EXCLUDED.customer_email, country = EXCLUDED.country
      `, [record.customer_id, record.customer_name, record.customer_email, record.country]);
    }
    for (const record of products.values()) {
      await client.query(`
        INSERT INTO products (product_id, product_name, category)
        VALUES ($1, $2, $3)
        ON CONFLICT (product_id) DO UPDATE SET product_name = EXCLUDED.product_name, category = EXCLUDED.category
      `, [record.product_id, record.product_name, record.category]);
    }
    for (const record of records) {
      await client.query(`
        INSERT INTO orders (order_id, order_date, customer_id, customer_name_snapshot, customer_email_snapshot, country_snapshot, status, payment_method, channel)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (order_id) DO UPDATE SET order_date = EXCLUDED.order_date, customer_id = EXCLUDED.customer_id, customer_name_snapshot = EXCLUDED.customer_name_snapshot, customer_email_snapshot = EXCLUDED.customer_email_snapshot, country_snapshot = EXCLUDED.country_snapshot, status = EXCLUDED.status, payment_method = EXCLUDED.payment_method, channel = EXCLUDED.channel
      `, [record.order_id, record.order_date, record.customer_id, record.customer_name, record.customer_email, record.country, record.status, record.payment_method, record.channel]);
      await client.query('DELETE FROM order_items WHERE order_id = $1', [record.order_id]);
      await client.query(`
        INSERT INTO order_items (order_id, product_id, product_name_snapshot, category_snapshot, quantity, unit_price, discount_pct, total_amount)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [record.order_id, record.product_id, record.product_name, record.category, record.quantity, record.unit_price, record.discount_pct, record.total_amount]);
    }
    await client.query('COMMIT');
    console.log(`Imported ${records.length} orders, ${customers.size} customers, ${products.size} products, and ${records.length} order items`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

importCsv().catch((error: unknown) => {
  console.error('CSV import failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
