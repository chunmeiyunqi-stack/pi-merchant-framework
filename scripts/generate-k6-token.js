const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Try to load .env if present
const dotenvPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(dotenvPath)) {
  const env = fs.readFileSync(dotenvPath, 'utf8');
  env.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) {
      const key = m[1];
      let val = m[2];
      // remove optional surrounding quotes
      if (
        (val.startsWith("\'") && val.endsWith("\'")) ||
        (val.startsWith('"') && val.endsWith('"'))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  });
}

const SECRET_KEY = process.env.PI_SESSION_SECRET || 'dev_fallback_secret_for_pi_hmac_2026';

function signSessionToken(piUid, ttlSeconds = 60 * 60) {
  const exp = Math.floor(Date.now() / 1000) + Math.max(0, Math.floor(ttlSeconds));
  const payloadObj = { uid: piUid, exp };
  const payloadJson = JSON.stringify(payloadObj);
  const payload = Buffer.from(payloadJson).toString('base64url');

  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(payload);
  const signature = hmac.digest('base64url');

  return `${payload}.${signature}`;
}

if (require.main === module) {
  const ttlDays = 30;
  const ttlSeconds = ttlDays * 24 * 60 * 60;
  const token = signSessionToken('k6_load_test_user', ttlSeconds);
  console.log(token);
}

module.exports = { signSessionToken };
