import { Router } from 'express';
import { z } from 'zod';
import { pool, checkDatabaseConnection } from '../db/pool';
import { getVerificationSummary } from '../services/verifyData';
import { answerDataQuestion } from '../services/aiService';
import { chatRequestSchema, chatResponseSchema, customerSchema, databaseHealthResponseSchema, healthResponseSchema, orderResponseSchema, paginatedResponseSchema, productSchema, verificationSummarySchema } from './schemas';

const router = Router();
const idSchema = z.coerce.number().int().positive();
const listQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(100).default(20), offset: z.coerce.number().int().min(0).default(0) });
const chatRateWindow = new Map<string, { startedAt: number; count: number }>();

router.get('/health', (_request, response) => response.json(healthResponseSchema.parse({ status: 'ok' })));

router.get('/health/db', async (_request, response, next) => {
  try {
    await checkDatabaseConnection();
    response.json(databaseHealthResponseSchema.parse({ status: 'ok', database: 'reachable' }));
  } catch (error) {
    next(error);
  }
});

router.get('/customers', async (request, response, next) => {
  try {
    const query = listQuerySchema.parse(request.query);
    const result = await pool.query('SELECT customer_id, customer_name, customer_email, country FROM customers ORDER BY customer_id LIMIT $1 OFFSET $2', [query.limit, query.offset]);
    response.json(paginatedResponseSchema(customerSchema).parse({ data: result.rows, limit: query.limit, offset: query.offset }));
  } catch (error) {
    next(error);
  }
});

router.get('/products', async (request, response, next) => {
  try {
    const query = listQuerySchema.parse(request.query);
    const result = await pool.query('SELECT product_id, product_name, category FROM products ORDER BY product_id LIMIT $1 OFFSET $2', [query.limit, query.offset]);
    response.json(paginatedResponseSchema(productSchema).parse({ data: result.rows, limit: query.limit, offset: query.offset }));
  } catch (error) {
    next(error);
  }
});

router.get('/orders/:id', async (request, response, next) => {
  try {
    const orderId = idSchema.parse(request.params.id);
    const result = await pool.query(`
      SELECT o.order_id, o.order_date, o.customer_id, o.status, o.payment_method, o.channel,
             json_build_object('order_item_id', oi.order_item_id, 'product_id', oi.product_id, 'product_name', oi.product_name_snapshot, 'category', oi.category_snapshot, 'quantity', oi.quantity, 'unit_price', oi.unit_price, 'discount_pct', oi.discount_pct, 'total_amount', oi.total_amount) AS item
      FROM orders o JOIN order_items oi ON oi.order_id = o.order_id WHERE o.order_id = $1 ORDER BY oi.order_item_id
    `, [orderId]);
    if (!result.rowCount) return response.status(404).json({ error: 'Order not found' });
    const first = result.rows[0];
    response.json(orderResponseSchema.parse({ order_id: first.order_id, order_date: first.order_date, customer_id: first.customer_id, status: first.status, payment_method: first.payment_method, channel: first.channel, items: result.rows.map((row) => row.item) }));
  } catch (error) {
    next(error);
  }
});

router.get('/verification/summary', async (_request, response, next) => {
  try {
    response.json(verificationSummarySchema.parse(await getVerificationSummary()));
  } catch (error) {
    next(error);
  }
});

router.post('/chat', async (request, response, next) => {
  try {
    const clientKey = request.ip ?? 'unknown';
    const now = Date.now();
    const current = chatRateWindow.get(clientKey);
    if (!current || now - current.startedAt > 60_000) chatRateWindow.set(clientKey, { startedAt: now, count: 1 });
    else if (current.count >= 20) return response.status(429).json({ error: 'Too many questions. Please wait a minute and try again.' });
    else current.count += 1;
    const body = chatRequestSchema.parse(request.body);
    response.json(chatResponseSchema.parse(await answerDataQuestion(body.question)));
  } catch (error) {
    next(error);
  }
});

export default router;
