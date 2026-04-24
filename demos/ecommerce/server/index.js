require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('..'));

let pool;

async function initDB() {
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sallys_shop',
    waitForConnections: true,
    connectionLimit: 10,
    connectTimeout: 30000,
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      category VARCHAR(100)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      total DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  const [rows] = await pool.query('SELECT COUNT(*) as count FROM products');
  if (rows[0].count === 0) {
    await pool.query(`
      INSERT INTO products (name, description, price, category) VALUES
      ('Cloud Architecture Handbook', 'Enterprise patterns for AWS and Azure, 400 pages', 49.99, 'Books'),
      ('Mechanical Keyboard TKL', 'Tactile switches, aluminum frame, RGB backlit', 129.99, 'Keyboards'),
      ('7-Port USB-C Hub', 'USB-C, HDMI 4K, SD card, Ethernet — all in one', 39.99, 'Accessories'),
      ('Ergonomic Laptop Stand', 'Adjustable aluminum stand, reduces neck strain', 59.99, 'Accessories'),
      ('Raspberry Pi 4 (4GB)', 'Quad-core 64-bit, WiFi, Bluetooth, 4GB RAM', 75.00, 'Hardware'),
      ('Dev Sticker Pack', '50 premium vinyl stickers — cloud, OSS, memes', 12.99, 'Accessories')
    `);
  }
}

app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/orders', async (req, res) => {
  const { customer_name, email, items } = req.body;
  if (!customer_name || !email || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'customer_name, email, and items are required' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let total = 0;
    const priceMap = {};
    for (const item of items) {
      const [rows] = await conn.query('SELECT price FROM products WHERE id = ?', [item.product_id]);
      if (rows.length === 0) throw new Error(`Product ${item.product_id} not found`);
      priceMap[item.product_id] = parseFloat(rows[0].price);
      total += priceMap[item.product_id] * item.quantity;
    }

    const [result] = await conn.query(
      'INSERT INTO orders (customer_name, email, total) VALUES (?, ?, ?)',
      [customer_name, email, total]
    );
    const orderId = result.insertId;

    for (const item of items) {
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, priceMap[item.product_id]]
      );
    }

    await conn.commit();
    res.json({ order_id: orderId, total: total.toFixed(2) });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;

async function start() {
  let retries = 10;
  while (retries > 0) {
    try {
      await initDB();
      break;
    } catch (err) {
      retries--;
      console.log(`DB not ready, retrying in 6s… (${retries} left): ${err.message}`);
      if (retries === 0) { console.error('Could not connect to DB'); process.exit(1); }
      await new Promise(r => setTimeout(r, 6000));
    }
  }
  app.listen(PORT, () => console.log(`Sally's Shop API running on port ${PORT}`));
}

start();
