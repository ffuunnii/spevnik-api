import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';

const allowCors = fn => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
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
        let playlist : {name: string, date: string, user_id: number, songs_id: Array<string>} = req.body;
        console.log(playlist);
        client.query(`INSERT INTO playlists (name, date, song_ids, user_id) VALUES ('${playlist.name}', '${playlist.date}', '{${playlist.songs_id.join(',')}}', ${playlist.user_id});`)
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