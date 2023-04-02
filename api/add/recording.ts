import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';
import multiparty from "multiparty";

const allowCors = fn => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
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

const handler = (req, res) => {
  const d = new Date()
  res.end(d.toString())
}


const uploadRecording = async (req: VercelRequest, res: VercelResponse) => {
  const form = new multiparty.Form();
  const data : any = await new Promise((resolve, reject) => {
    form.parse(req, function (err, fields, files) {
      if (err) reject({ err });
      resolve({ fields, files });
    });
  });
  console.log(`data: `, JSON.stringify(data.files));

  res.status(200).json({ success: true });
};

module.exports = allowCors(uploadRecording)

export const config = {
  api: {
    bodyParser: false,
  },
};

/*export default function handler(req: VercelRequest, res: VercelResponse) {

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
      console.log(req.body);
      console.log(req.query);
      
      client.query('SELECT * from recordings') // your query string here
        .then(result => { return res.json(result.rows); })
        .catch(e => console.error(e.stack)) // your callback here
        .then(() => client.end());  
    }
  })

  
}*/