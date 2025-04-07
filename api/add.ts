import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';
import multiparty from "multiparty";
import * as ftp from "basic-ftp";
import crypto from "crypto";
import path from "path";

const allowCors = fn => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  return await fn(req, res);
};

const connectClient = () => {
  return new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
  });
};

async function handler(req: VercelRequest, res: VercelResponse) {
  const type = req.query.type;

  if (type === 'recording') {
    return handleRecordingUpload(req, res);
  }

  const client = connectClient();
  await client.connect();

  try {
    if (type === 'playlist') {
      const { name, date, user_id, songs_id } = req.body;
      const query = `
        INSERT INTO playlists (name, date, song_ids, user_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *`;
      const result = await client.query(query, [name, date, songs_id, user_id]);
      return res.json(result.rows);
    }

    if (type === 'song') {
      const { name, category_id, content, subcategory_id } = req.body;
      const query = `
        INSERT INTO songs (category_id, name, content, subcategory_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *`;
      const result = await client.query(query, [
        category_id,
        name,
        JSON.stringify(content),
        subcategory_id || null
      ]);
      return res.json(result.rows);
    }

    return res.status(400).json({ error: 'Invalid type' });
  } catch (error) {
    console.error(error.stack);
    return res.status(500).json({ error: 'Database error' });
  } finally {
    client.end();
  }
}

// special handler for recording (with file)
async function handleRecordingUpload(req: VercelRequest, res: VercelResponse) {
  const form = new multiparty.Form();
  const data: any = await new Promise((resolve, reject) => {
    form.parse(req, function (err, fields, files) {
      if (err) reject({ err });
      resolve({ fields, files });
    });
  });

  const originalFilename = data.files.file[0]?.originalFilename;
  const localPath = data.files.file[0]?.path;
  const extension = path.extname(originalFilename);
  const hash = crypto.createHash('md5').update(String(new Date()) + originalFilename).digest('hex');
  const remotePath = `${hash}${extension}`;

  const ftpClient = new ftp.Client();
  ftpClient.ftp.verbose = true;

  try {
    await ftpClient.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASS,
    });
    await ftpClient.uploadFrom(localPath, remotePath);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'FTP upload failed' });
  } finally {
    ftpClient.close();
  }

  const client = connectClient();
  await client.connect();

  try {
    const query = `
      INSERT INTO recordings (name, pathtofile, song_id, user_id, recording_order)
      VALUES ($1, $2, $3, $4, $5)`;
    await client.query(query, [
      data.fields.name[0],
      `${process.env.RECORDING_URL}${remotePath}`,
      data.fields.song_id[0],
      data.fields.user_id[0],
      data.fields.recording_order[0],
    ]);
    return res.json({ success: true });
  } catch (err) {
    console.error(err.stack);
    return res.status(500).json({ success: false, error: 'DB insert failed' });
  } finally {
    client.end();
  }
}

module.exports = allowCors(handler);

export const config = {
  api: {
    bodyParser: false,
  },
};
