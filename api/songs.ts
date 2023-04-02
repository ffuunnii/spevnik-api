import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';

export default function handler(req: VercelRequest, res: VercelResponse) {

  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
  });
   
  client.connect((err) => {
    if (err) {
      console.error('connection error', err.stack)
    } else {
      console.log('connected')
    }
  })
  
  client.query('SELECT * from songs') // your query string here
    .then(result => { return res.json(result.rows); })
    .catch(e => console.error(e.stack)) // your callback here
    .then(() => client.end());  
}