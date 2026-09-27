ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_total_amount_check;

ALTER TABLE order_items
ADD CONSTRAINT order_items_total_amount_check CHECK (
    total_amount IN (
        round(quantity * unit_price * (1 - discount_pct / 100), 2),
        round(quantity * unit_price * (1 - discount_pct / 100), 2) - 0.01
    )
);
