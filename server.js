const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(cors());

// PASTE YOUR SUPABASE URL HERE (Select "Transaction Pooler" / Port 6543)
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

// Database Init
const initDB = async () => {
try {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, email TEXT UNIQUE, password TEXT);
    CREATE TABLE IF NOT EXISTS products (id SERIAL PRIMARY KEY, name TEXT, price NUMERIC, description TEXT);
    INSERT INTO users (email, password) VALUES ('test@bid.ai', 'password123') ON CONFLICT DO NOTHING;
    `);
    console.log("✅ Database Connected!");
} catch (err) { console.error("❌ Error:", err.message); }
};
initDB();

// API Endpoints
app.post('/auth/login', async (req, res) => {
const { email, password } = req.body;
const result = await pool.query('SELECT * FROM users WHERE email=$1 AND password=$2', [email, password]);
result.rows.length > 0 ? res.json({ success: true, user: result.rows[0] }) : res.status(401).json({ success: false });
});

app.get('/products', async (req, res) => {
const result = await pool.query('SELECT * FROM products ORDER BY id DESC');
res.json(result.rows);
});

app.post('/products', async (req, res) => {
const { name, price, description } = req.body;
const result = await pool.query('INSERT INTO products (name, price, description) VALUES ($1, $2, $3) RETURNING *', [name, price, description]);
res.json({ success: true, product: result.rows[0] });
});

// --- ADD THIS NEW SIGNUP API ---
app.post('/auth/signup', async (req, res) => {
const { email, password } = req.body;
try {
    // 1. Check if user exists
    const check = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (check.rows.length > 0) {
    return res.status(400).json({ success: false, message: "User already exists" });
    }
    // 2. Insert new user
    const result = await pool.query(
    'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *',
    [email, password]
    );
    res.json({ success: true, user: result.rows[0] });
} catch (err) {
    res.status(500).json({ error: err.message });
}
});

app.listen(3000, '0.0.0.0', () => console.log(`🚀 Server running on port 3000`));