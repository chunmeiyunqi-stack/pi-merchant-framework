export type LicenseTier = 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';

export type License = {
  id: string;
  tenantId: string;
  tier: LicenseTier;
  issuedAt: number;
  expiresAt: number;
  features: string[];
};

export function verifySignature(data: string, sig: string, secret: string) {
  const expected = require('crypto').createHmac('sha256', secret).update(data).digest('hex');
  return expected === sig;
}

export function deserializeLicense(serialized: string): License {
  try {
    const decoded = Buffer.from(serialized, 'base64').toString();
    const parsed = JSON.parse(decoded);
    if (!parsed.id || !parsed.tenantId) throw new Error('invalid');
    return parsed as License;
  } catch (e) {
    throw new Error('invalid serialized license');
  }
}

export class LicenseValidator {
  private secret: string;
  constructor(secret = process.env.LICENSE_PAYLOAD_SECRET || 'license-secret') {
    this.secret = secret;
  }

  validateLicense(license: any) {
    if (!license || !license.issuedAt || !license.expiresAt) throw new Error('invalid');
    const now = Date.now();
    if (license.issuedAt > now) return false;
    if (license.expiresAt <= now) return false;
    return true;
  }

  hasFeature(license: any, feature: string) {
    if (!this.validateLicense(license)) return false;
    return Array.isArray(license.features) && license.features.includes(feature);
  }

  getTierFeatures(tier: LicenseTier) {
    const base = ['AI_BASIC'];
    if (tier === 'BASIC') return base;
    if (tier === 'PROFESSIONAL') return [...base, 'AI_PREMIUM', 'PAYMENTS'];
    if (tier === 'ENTERPRISE')
      return [...base, 'AI_PREMIUM', 'PAYMENTS', 'MULTI_TENANT', 'ADVANCED_ANALYTICS'];
    return base;
  }

  serializeLicense(license: License) {
    return Buffer.from(JSON.stringify(license)).toString('base64');
  }

  signLicense(serialized: string) {
    return require('crypto').createHmac('sha256', this.secret).update(serialized).digest('hex');
  }
}

export default { LicenseValidator, verifySignature, deserializeLicense };
