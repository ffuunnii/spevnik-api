import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';
import * as ftp from "basic-ftp";

const allowCors = fn => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  return await fn(req, res)
}



const deleteRecording = async (req: VercelRequest, res: VercelResponse) => {
  let recording : {id: number, name: string, pathtofile: string, song_id: number, user_id: number} = req.body;

  const ftpClient = new ftp.Client()
  ftpClient.ftp.verbose = true
  try {
      await ftpClient.access({
          host: process.env.FTP_HOST,
          user: process.env.FTP_USER,
          password: process.env.FTP_PASS
      })
      await ftpClient.remove(recording.pathtofile);
  }
  catch(err) {
      console.log(err)
  }
  ftpClient.close()

  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
  });

  client.connect((err) => {
    if (err) {
      console.error('connection error', err.stack);
      return res.json(({success: false, error: "Error connecting to the database"}));
    } else {
        client.query(`DELETE FROM recordings WHERE id = ${recording.id};`)
        .then(result => { 
            return res.json(({success: true}));
        })
        .catch(e => {
          console.error(e.stack);
          return res.json(({success: false, error: "Error delete the recording from the database"}));
        })
        .then(() => client.end());  
    }
  })
};

module.exports = allowCors(deleteRecording)

export const config = {
  api: {
    bodyParser: false,
  },
};