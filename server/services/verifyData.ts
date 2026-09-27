import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { pool } from '../db/pool';
import { sourceRecordSchema } from './csvSchema';

export async function getVerificationSummary() {
  const result = await pool.query(`
    SELECT
      (SELECT COUNT(*)::int FROM customers) AS customers,
      (SELECT COUNT(*)::int FROM products) AS products,
      (SELECT COUNT(*)::int FROM orders) AS orders,
      (SELECT COUNT(*)::int FROM order_items) AS order_items,
      (SELECT COUNT(*)::int FROM orders WHERE status = 'completed') AS completed_orders,
      (SELECT COALESCE(SUM(oi.total_amount), 0)::numeric FROM orders o JOIN order_items oi ON oi.order_id = o.order_id WHERE o.status = 'completed') AS completed_sales
  `);
  const rows = parse(await readFile(path.resolve(process.cwd(), 'assigment-docs/sales_data.csv')), { columns: true, skip_empty_lines: true, bom: true }) as Record<string, string>[];
  const sourceRecords = rows.map((row) => sourceRecordSchema.parse(row));
  const source = {
    customers: new Set(sourceRecords.map((record) => record.customer_id)).size,
    products: new Set(sourceRecords.map((record) => record.product_id)).size,
    orders: sourceRecords.length,
    order_items: sourceRecords.length,
    completed_orders: sourceRecords.filter((record) => record.status === 'completed').length,
    completed_sales: Number(sourceRecords.filter((record) => record.status === 'completed').reduce((total, record) => total + record.total_amount, 0).toFixed(2))
  };
  const database = result.rows[0];
  const matchesSource = Object.keys(source).every((key) => Number(database[key]) === source[key as keyof typeof source]);
  return { ...database, source, matchesSource };
}

export async function verifyDatabase() {
  const summary = await getVerificationSummary();
  const expected = { customers: 20, products: 12, orders: 1200, order_items: 1200 };
  const matchesExpectedCounts = Object.entries(expected).every(([key, value]) => Number(summary[key]) === value);
  return { ...summary, expected, matchesExpectedCounts };
}

if (require.main === module) {
  verifyDatabase()
    .then((summary) => console.log(JSON.stringify(summary, null, 2)))
    .catch((error: unknown) => {
      console.error('Verification failed:', error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
