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
}

function handler(req: VercelRequest, res: VercelResponse) {

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
        let song : {id: number, name: string, category_id: number, content: Array<any>, subcategory_id: number} = req.body;
        console.log(song);
        client.query(`UPDATE songs SET name = '${song.name}', category_id = '${song.category_id}', content = '${JSON.stringify(song.content)}, subcategory_id = '${song.subcategory_id || null}' WHERE id = ${song.id};`)
        .then(result => { 
            console.log(result);
            return res.json(result.rows); 
        })
        .catch(e => console.error(e.stack))
        .then(() => client.end());  
    }
  })  
}

module.exports = allowCors(handler)