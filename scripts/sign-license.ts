// scripts/sign-license.ts
// ============================================================
// Pioneer AI Framework — Developer License Signer Utility
// Usage: npx tsx scripts/sign-license.ts [license-template.json]
// ============================================================

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { buildSignablePayload } from '../packages/pi-sdk/src/license/validator';
import type { SerializedLicense } from '../packages/pi-sdk/src/license/types';

// Default mock target template
const DEFAULT_TEMPLATE: Omit<SerializedLicense, 'signature' | 'timestamp' | 'nonce'> = {
  id: 'merchant-lic-prod-001',
  issuedTo: 'Pioneer Production Merchant',
  merchantId: process.env.NEXT_PUBLIC_MERCHANT_ID || 'merchant-demo-001',
  issuedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(), // 1 year validity
  tier: 'enterprise',
  features: [
    'ai_routing',
    'streaming',
    'multi_tenant',
    'usage_tracking',
    'webhook_monitoring',
    'advanced_analytics',
  ],
};

async function main() {
  console.log('🏁 Starting License Signer Utility...');

  // 1. Resolve paths & keys
  const privateKeyPath =
    process.env.RSA_PRIVATE_KEY_PATH || path.join(__dirname, '../keys/private_key.pem');
  const hmacSecret = process.env.LICENSE_PAYLOAD_SECRET || 'license-secret';

  let hasRsaKey = false;
  let privateKeyContent = '';

  if (fs.existsSync(privateKeyPath)) {
    try {
      privateKeyContent = fs.readFileSync(privateKeyPath, 'utf8');
      if (
        privateKeyContent.includes('-----BEGIN RSA PRIVATE KEY-----') ||
        privateKeyContent.includes('-----BEGIN PRIVATE KEY-----')
      ) {
        hasRsaKey = true;
        console.log(`🔑 RSA Private Key loaded successfully from: ${privateKeyPath}`);
      }
    } catch (err) {
      console.warn(
        `⚠️ Failed to read RSA private key from ${privateKeyPath}. Falling back to HMAC.`
      );
    }
  } else {
    console.log(`ℹ️ RSA Private Key not found at ${privateKeyPath}. Falling back to HMAC signer.`);
  }

  // 2. Load license template
  let baseTemplate = { ...DEFAULT_TEMPLATE };
  const argFile = process.argv[2];
  if (argFile) {
    const templatePath = path.resolve(argFile);
    if (fs.existsSync(templatePath)) {
      try {
        const customTemplate = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
        baseTemplate = { ...baseTemplate, ...customTemplate };
        console.log(`📄 Loaded custom license template from: ${templatePath}`);
      } catch (err) {
        console.error(`❌ Error parsing custom template file: ${(err as Error).message}`);
        process.exit(1);
      }
    } else {
      console.error(`❌ Template file not found: ${templatePath}`);
      process.exit(1);
    }
  } else {
    console.log('ℹ️ No template file specified. Using default enterprise license template.');
  }

  // 3. Populate dynamic verification properties
  const licenseToSign: SerializedLicense = {
    ...baseTemplate,
    timestamp: Date.now(),
    nonce: crypto.randomBytes(16).toString('hex'),
    signature: '', // Temporarily empty for payload compilation
  };

  // Compile signable canonical string
  const canonicalPayload = buildSignablePayload(licenseToSign);

  // 4. Calculate Signature
  let signatureBase64 = '';
  if (hasRsaKey) {
    console.log('🔒 Signing license payload with RSA-SHA256...');
    const signer = crypto.createSign('SHA256');
    signer.update(canonicalPayload);
    signer.end();
    signatureBase64 = signer.sign(privateKeyContent, 'base64');
  } else {
    console.log('🔒 Signing license payload with HMAC-SHA256...');
    // Decode base64 secret or convert raw string to base64 if not already encoded
    let secretKey: Buffer;
    try {
      // Check if it's base64 encoded
      const isBase64 = /^[A-Za-z0-9+/=]+$/.test(hmacSecret) && hmacSecret.length % 4 === 0;
      secretKey = isBase64 ? Buffer.from(hmacSecret, 'base64') : Buffer.from(hmacSecret, 'utf-8');
    } catch {
      secretKey = Buffer.from(hmacSecret, 'utf-8');
    }
    signatureBase64 = crypto
      .createHmac('sha256', secretKey)
      .update(canonicalPayload)
      .digest('base64');
  }

  // Assign signature
  licenseToSign.signature = signatureBase64;

  // 5. Serialize full license object to Base64 (LICENSE_PAYLOAD)
  const fullJsonString = JSON.stringify(licenseToSign, null, 2);
  const licensePayloadBase64 = Buffer.from(fullJsonString, 'utf-8').toString('base64');

  // Outputs
  const outputDir = path.dirname(privateKeyPath);
  const outPayloadPath = path.join(outputDir, 'license_payload.txt');
  fs.writeFileSync(outPayloadPath, licensePayloadBase64);

  console.log('\n============================================================');
  console.log('🚀 License signed successfully!');
  console.log('============================================================');
  console.log(`Signature (Base64):     ${signatureBase64}`);
  console.log(`Saved LICENSE_PAYLOAD:  ${outPayloadPath}`);
  console.log('============================================================');
  console.log('Copy the base64 payload below to set your LICENSE_PAYLOAD environment variable:');
  console.log('------------------------------------------------------------');
  console.log(licensePayloadBase64);
  console.log('------------------------------------------------------------\n');
}

main().catch((err) => {
  console.error('❌ Signer failed with error:', err);
  process.exit(1);
});
