ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_total_amount_check;

ALTER TABLE order_items
ADD CONSTRAINT order_items_total_amount_check CHECK (
    total_amount = round(((quantity * unit_price * (1 - discount_pct / 100))::double precision * 100)::numeric, 0) / 100
);
