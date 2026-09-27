import { z } from 'zod';

export const expectedCsvHeaders = [
  'order_id', 'order_date', 'customer_id', 'customer_name', 'customer_email',
  'country', 'product_id', 'product_name', 'category', 'quantity', 'unit_price',
  'discount_pct', 'total_amount', 'status', 'payment_method', 'channel'
] as const;

export const sourceRecordSchema = z.object({
  order_id: z.coerce.number().int().positive(),
  order_date: z.string().datetime({ offset: true }),
  customer_id: z.coerce.number().int().positive(),
  customer_name: z.string().min(1),
  customer_email: z.string().email(),
  country: z.string().min(1),
  product_id: z.coerce.number().int().positive(),
  product_name: z.string().min(1),
  category: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  unit_price: z.coerce.number().nonnegative(),
  discount_pct: z.coerce.number().min(0).max(100),
  total_amount: z.coerce.number().nonnegative(),
  status: z.enum(['completed', 'pending', 'refunded', 'cancelled']),
  payment_method: z.enum(['card', 'paypal', 'bank_transfer']),
  channel: z.enum(['web', 'mobile'])
}).superRefine((record, context) => {
  const expected = Number((record.quantity * record.unit_price * (1 - record.discount_pct / 100)).toFixed(2));
  if (Math.abs(record.total_amount - expected) > 0.001) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['total_amount'], message: `Expected ${expected.toFixed(2)}` });
  }
});

export type SourceRecord = z.infer<typeof sourceRecordSchema>;
