import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';
import multiparty from "multiparty";

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

export default uploadRecording;
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