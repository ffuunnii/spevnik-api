import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';

const allowCors = (fn) => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  return await fn(req, res);
};

async function handler(req: VercelRequest, res: VercelResponse) {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
  });

  await client.connect();

  try {
    const song: { id: number; name?: string; category_id?: number; content?: Array<any> | null; subcategory_id?: number } = req.body;

    if (!song.id) {
      return res.status(400).json({ error: 'Song ID is required' });
    }

    let updateFields : any[] = [];
    let values : any[] = [];
    let paramIndex = 1;

    if (song.name) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(song.name);
    }
    if (song.category_id !== undefined) {
      updateFields.push(`category_id = $${paramIndex++}`);
      values.push(song.category_id);
    }
    if (song.content !== undefined) {
      updateFields.push(`content = $${paramIndex++}`);
      values.push(JSON.stringify(song.content));
    }
    if (song.subcategory_id !== undefined) {
      updateFields.push(`subcategory_id = $${paramIndex++}`);
      values.push(song.subcategory_id || null);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields provided for update' });
    }

    // Add the song ID as the last parameter for the WHERE clause
    values.push(song.id);
    const query = `UPDATE songs SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;
    
    const result = await client.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error(error.stack);
    res.status(500).json({ error: 'An error occurred' });
  } finally {
    client.end();
  }
}

module.exports = allowCors(handler);
