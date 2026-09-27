import { z } from 'zod';

export const healthResponseSchema = z.object({ status: z.literal('ok') });
export const databaseHealthResponseSchema = z.object({ status: z.literal('ok'), database: z.literal('reachable') });
export const customerSchema = z.object({ customer_id: z.coerce.number(), customer_name: z.string(), customer_email: z.string().email(), country: z.string() });
export const productSchema = z.object({ product_id: z.coerce.number(), product_name: z.string(), category: z.string() });
export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) => z.object({ data: z.array(itemSchema), limit: z.number(), offset: z.number() });
export const orderItemSchema = z.object({ order_item_id: z.coerce.number(), product_id: z.coerce.number(), product_name: z.string(), category: z.string(), quantity: z.coerce.number(), unit_price: z.coerce.number(), discount_pct: z.coerce.number(), total_amount: z.coerce.number() });
export const orderResponseSchema = z.object({ order_id: z.coerce.number(), order_date: z.coerce.date(), customer_id: z.coerce.number(), status: z.string(), payment_method: z.string(), channel: z.string(), items: z.array(orderItemSchema) });
const verificationCountsSchema = z.object({ customers: z.coerce.number(), products: z.coerce.number(), orders: z.coerce.number(), order_items: z.coerce.number(), completed_orders: z.coerce.number(), completed_sales: z.coerce.number() });
export const verificationSummarySchema = verificationCountsSchema.extend({ source: verificationCountsSchema, matchesSource: z.boolean() });
export const chatRequestSchema = z.object({ question: z.string().trim().min(1).max(1000) });
export const chatResponseSchema = z.object({ answer: z.string(), status: z.enum(['answered', 'cannot_answer']), reason: z.string().optional(), metrics: z.array(z.object({ label: z.string(), value: z.union([z.string(), z.number()]) })) });
