import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';
const client = new Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
})
 
client.connect((err) => {
  if (err) {
    console.error('connection error', err.stack)
  } else {
    console.log('connected')
  }
})
 
client.query('SELECT * from songs', (err, res) => {
  console.log(err ? err.stack : res.rows.length);
  client.end();
})

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { name = 'World' } = req.query;
  console.log(JSON.stringify(req.query));
  return res.json({
    message: `Hello ${name}!`,
  })
}