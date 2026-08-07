import fs from 'node:fs/promises';
import path from 'node:path';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

export const initStorage = async () => {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  console.log(`[Storage] Local upload directory ready: ${UPLOAD_DIR}`);
};

export const saveFile = async (buffer, relativePath) => {
  const fullPath = path.join(UPLOAD_DIR, relativePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, buffer);
  return fullPath;
};

export const getFilePath = (relativePath) => {
  return path.join(UPLOAD_DIR, relativePath);
};