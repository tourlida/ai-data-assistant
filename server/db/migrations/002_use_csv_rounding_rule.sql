ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_total_amount_check;

ALTER TABLE order_items
ADD CONSTRAINT order_items_total_amount_check CHECK (
    total_amount = (
        CASE
            WHEN (quantity * unit_price * (1 - discount_pct / 100) * 100) - trunc(quantity * unit_price * (1 - discount_pct / 100) * 100) > 0.5
                THEN trunc(quantity * unit_price * (1 - discount_pct / 100) * 100) + 1
            WHEN (quantity * unit_price * (1 - discount_pct / 100) * 100) - trunc(quantity * unit_price * (1 - discount_pct / 100) * 100) < 0.5
                THEN trunc(quantity * unit_price * (1 - discount_pct / 100) * 100)
            WHEN mod(trunc(quantity * unit_price * (1 - discount_pct / 100) * 100), 2) = 0
                THEN trunc(quantity * unit_price * (1 - discount_pct / 100) * 100)
            ELSE trunc(quantity * unit_price * (1 - discount_pct / 100) * 100) + 1
        END
    ) / 100
);
