CREATE TABLE IF NOT EXISTS customers (
    customer_id BIGINT PRIMARY KEY,
    customer_name TEXT NOT NULL CHECK (btrim(customer_name) <> ''),
    customer_email TEXT NOT NULL CHECK (btrim(customer_email) <> ''),
    country TEXT NOT NULL CHECK (btrim(country) <> '')
);

CREATE TABLE IF NOT EXISTS products (
    product_id BIGINT PRIMARY KEY,
    product_name TEXT NOT NULL CHECK (btrim(product_name) <> ''),
    category TEXT NOT NULL CHECK (btrim(category) <> '')
);

CREATE TABLE IF NOT EXISTS orders (
    order_id BIGINT PRIMARY KEY,
    order_date TIMESTAMPTZ NOT NULL,
    customer_id BIGINT NOT NULL REFERENCES customers(customer_id),
    customer_name_snapshot TEXT NOT NULL CHECK (btrim(customer_name_snapshot) <> ''),
    customer_email_snapshot TEXT NOT NULL CHECK (btrim(customer_email_snapshot) <> ''),
    country_snapshot TEXT NOT NULL CHECK (btrim(country_snapshot) <> ''),
    status TEXT NOT NULL CHECK (status IN ('completed', 'pending', 'refunded', 'cancelled')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('card', 'paypal', 'bank_transfer')),
    channel TEXT NOT NULL CHECK (channel IN ('web', 'mobile'))
);

CREATE TABLE IF NOT EXISTS order_items (
    order_item_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(order_id) ON DELETE RESTRICT,
    product_id BIGINT NOT NULL REFERENCES products(product_id) ON DELETE RESTRICT,
    product_name_snapshot TEXT NOT NULL CHECK (btrim(product_name_snapshot) <> ''),
    category_snapshot TEXT NOT NULL CHECK (btrim(category_snapshot) <> ''),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    discount_pct NUMERIC(5, 2) NOT NULL CHECK (discount_pct BETWEEN 0 AND 100),
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    CHECK (
        total_amount IN (
            round(quantity * unit_price * (1 - discount_pct / 100), 2),
            round(quantity * unit_price * (1 - discount_pct / 100), 2) - 0.01
        )
    )
);

CREATE INDEX IF NOT EXISTS orders_customer_date_idx ON orders (customer_id, order_date DESC);
CREATE INDEX IF NOT EXISTS orders_date_idx ON orders (order_date);
CREATE INDEX IF NOT EXISTS orders_status_date_idx ON orders (status, order_date);
CREATE INDEX IF NOT EXISTS order_items_product_idx ON order_items (product_id);
