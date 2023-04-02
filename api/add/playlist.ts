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
        let playlist : {name: string, date: string, user_id: number, songs_id: Array<string>} = req.body;
        console.log(playlist);
        client.query(`INSERT INTO playlists (name, date, song_ids, user_id) VALUES ('${playlist.name}', '${playlist.date}', '{${playlist.songs_id.join(',')}}', ${playlist.user_id});`)
        .then(result => { 
            console.log(result);
            return res.json(result.rows); 
        })
        .catch(e => console.error(e.stack)) // your callback here
        .then(() => client.end());  
    }
  })  
}