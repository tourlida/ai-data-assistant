export const databaseMetadata = {
  purpose: 'Answer questions about anonymous sales aggregates.',
  tables: {
    orders: ['order_date', 'status', 'payment_method', 'channel'],
    order_items: ['quantity', 'unit_price', 'discount_pct', 'total_amount', 'product_id'],
    products: ['product_id', 'product_name', 'category'],
    customers: ['customer_id', 'country']
  },
  policies: [
    'Never return customer names, emails, customer IDs, or individual order details.',
    'Use completed orders for recognized sales unless the user explicitly asks for a status breakdown.',
    'Only answer through the server-provided aggregate tools.',
    'If the question is unsupported or unclear, say that it cannot be answered from the available data.'
  ],
  tools: ['sales_summary', 'sales_by_product', 'sales_by_category', 'sales_by_time', 'status_breakdown', 'channel_breakdown', 'payment_breakdown', 'country_breakdown']
} as const;
