import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';

const allowCors = fn => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  return await fn(req, res)
};

const allowedTables = ['songs', 'recordings', 'playlists', 'users', 'categories', 'subcategories', 'sheets'];

async function handler(req: VercelRequest, res: VercelResponse) {
  const { tablename } = req.query;

  if (!tablename || typeof tablename !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid tablename' });
  }

  if (!allowedTables.includes(tablename)) {
    return res.status(403).json({ error: 'Access to this table is not allowed' });
  }

  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
  });

  try {
    await client.connect();
    const result = await client.query(`SELECT * FROM ${tablename}`);
    res.json(result.rows);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: 'Database query failed' });
  } finally {
    client.end();
  }
}

module.exports = allowCors(handler);
