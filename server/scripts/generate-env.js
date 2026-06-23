import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const examplePath = path.resolve(process.cwd(), '.env.example');
const outPath = path.resolve(process.cwd(), '.env');

if (!fs.existsSync(examplePath)) {
  console.error('.env.example not found in', process.cwd());
  process.exit(1);
}

let content = fs.readFileSync(examplePath, 'utf8');

// Replace placeholder secrets with generated values if they still look generic
content = content.replace(/ACCESS_TOKEN_SECRET=change_me_access_secret/, `ACCESS_TOKEN_SECRET=${crypto.randomBytes(32).toString('hex')}`);
content = content.replace(/REFRESH_TOKEN_SECRET=change_me_refresh_secret/, `REFRESH_TOKEN_SECRET=${crypto.randomBytes(32).toString('hex')}`);

fs.writeFileSync(outPath, content);
console.log('Wrote', outPath);
