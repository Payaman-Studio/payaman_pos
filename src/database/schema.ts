export const CREATE_TABLES = `
  CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) PRIMARY KEY NOT NULL,
    barcode VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    cost_price INTEGER NOT NULL,
    selling_price INTEGER NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS commodities (
    id VARCHAR(36) PRIMARY KEY NOT NULL,
    name VARCHAR(255) NOT NULL,
    default_price INTEGER NOT NULL,
    stock DECIMAL(10,2) NOT NULL DEFAULT 0.00
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(36) PRIMARY KEY NOT NULL,
    total_sales INTEGER NOT NULL DEFAULT 0,
    total_purchases INTEGER NOT NULL DEFAULT 0,
    net_amount INTEGER NOT NULL,
    total_paid INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transaction_details (
    id VARCHAR(36) PRIMARY KEY NOT NULL,
    transaction_id VARCHAR(36) NOT NULL,
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('PRODUCT', 'COMMODITY')),
    item_id VARCHAR(36) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    price_at_sale INTEGER NOT NULL,
    flow_direction VARCHAR(10) NOT NULL CHECK (flow_direction IN ('OUT', 'IN')),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
  );
`;
