import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';
import multiparty from "multiparty";
import * as ftp from "basic-ftp";
var crypto = require('crypto');
const path = require('path');

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



const uploadRecording = async (req: VercelRequest, res: VercelResponse) => {
  const form = new multiparty.Form();
  const data : any = await new Promise((resolve, reject) => {
    form.parse(req, function (err, fields, files) {
      if (err) reject({ err });
      resolve({ fields, files });
    });
  });

  const originalFilename = data.files.file[0]?.originalFilename;
  const filename = String(new Date()) + originalFilename;
  const localPath = data.files.file[0]?.path;
  const extension = path.extname(originalFilename);
  let hash = crypto.createHash('md5').update(filename).digest('hex');
  const remotePath = `${hash}${extension}`;
  const ftpClient = new ftp.Client()
  ftpClient.ftp.verbose = true
  try {
      await ftpClient.access({
          host: process.env.FTP_HOST,
          user: process.env.FTP_USER,
          password: process.env.FTP_PASS
      })
      await ftpClient.uploadFrom(localPath, remotePath);
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
        client.query(`INSERT INTO recordings (name, pathtofile, song_id, user_id) VALUES ('${data.fields.name}', '${process.env.RECORDING_URL + remotePath}', ${data.fields.song_id}, ${data.fields.user_id});`)
        .then(result => { 
            return res.json(({success: true}));
        })
        .catch(e => {
          console.error(e.stack);
          return res.json(({success: false, error: "Error inserting the recording into the database"}));
        })
        .then(() => client.end());  
    }
  })
};

module.exports = allowCors(uploadRecording)

export const config = {
  api: {
    bodyParser: false,
  },
};