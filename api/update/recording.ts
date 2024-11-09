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
        let recording : {id: number, name: string, pathtofile: string, song_id: number, user_id: number, recording_order: number} = req.body;
        console.log(recording);
        client.query(`UPDATE recordings SET name = '${recording.name}', pathtofile = '${recording.pathtofile}', song_id = '${recording.song_id}', user_id = '${recording.user_id}', recording_order = '${recording.recording_order}' WHERE id = ${recording.id};`)
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