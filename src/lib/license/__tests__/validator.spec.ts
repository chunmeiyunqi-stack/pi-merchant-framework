import {
  LicenseValidator,
  verifySignature,
  deserializeLicense,
  License,
  LicenseTier,
} from '@/lib/license/validator';
import * as crypto from 'crypto';

describe('License Validator (validator.ts)', () => {
  let validator: LicenseValidator;
  const testSecret = 'test-secret-key-for-license-signing';

  beforeEach(() => {
    validator = new LicenseValidator(testSecret);
  });

  describe('verifySignature()', () => {
    it('应该验证有效的签名', () => {
      const data = 'license-data-123';
      const signature = crypto.createHmac('sha256', testSecret).update(data).digest('hex');

      const isValid = verifySignature(data, signature, testSecret);
      expect(isValid).toBe(true);
    });

    it('应该拒绝篡改的签名', () => {
      const data = 'license-data-123';
      const validSignature = crypto.createHmac('sha256', testSecret).update(data).digest('hex');

      const tamperedSignature = validSignature.slice(0, -2) + '00';
      const isValid = verifySignature(data, tamperedSignature, testSecret);

      expect(isValid).toBe(false);
    });

    it('应该拒绝使用错误密钥生成的签名', () => {
      const data = 'license-data-123';
      const wrongKey = 'wrong-secret';
      const signature = crypto.createHmac('sha256', wrongKey).update(data).digest('hex');

      const isValid = verifySignature(data, signature, testSecret);
      expect(isValid).toBe(false);
    });
  });

  describe('deserializeLicense()', () => {
    it('应该正确解析序列化的 License', () => {
      const licenseData: License = {
        id: 'lic-001',
        tenantId: 'tenant-123',
        tier: 'ENTERPRISE' as LicenseTier,
        issuedAt: Date.now(),
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 年后
        features: ['AI_PREMIUM', 'PAYMENTS', 'MULTI_TENANT'],
      };

      const serialized = Buffer.from(JSON.stringify(licenseData)).toString('base64');
      const deserialized = deserializeLicense(serialized);

      expect(deserialized.id).toBe(licenseData.id);
      expect(deserialized.tenantId).toBe(licenseData.tenantId);
      expect(deserialized.tier).toBe(licenseData.tier);
      expect(deserialized.features).toEqual(licenseData.features);
    });

    it('应该处理无效的 Base64 数据', () => {
      expect(() => {
        deserializeLicense('invalid-base64!!!');
      }).toThrow();
    });

    it('应该处理无效的 JSON', () => {
      const invalidJson = Buffer.from('not valid json').toString('base64');
      expect(() => {
        deserializeLicense(invalidJson);
      }).toThrow();
    });
  });

  describe('validateLicense()', () => {
    it('应该验证未过期的有效 License', () => {
      const license: License = {
        id: 'lic-002',
        tenantId: 'tenant-123',
        tier: 'PROFESSIONAL',
        issuedAt: Date.now() - 24 * 60 * 60 * 1000, // 1 天前
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 年后
        features: ['AI_PREMIUM', 'PAYMENTS'],
      };

      const isValid = validator.validateLicense(license);
      expect(isValid).toBe(true);
    });

    it('应该拒绝过期的 License', () => {
      const expiredLicense: License = {
        id: 'lic-003',
        tenantId: 'tenant-123',
        tier: 'BASIC',
        issuedAt: Date.now() - 730 * 24 * 60 * 60 * 1000, // 2 年前
        expiresAt: Date.now() - 24 * 60 * 60 * 1000, // 已过期 1 天
        features: ['AI_BASIC'],
      };

      const isValid = validator.validateLicense(expiredLicense);
      expect(isValid).toBe(false);
    });

    it('应该拒绝尚未生效的 License', () => {
      const futureLicense: License = {
        id: 'lic-004',
        tenantId: 'tenant-123',
        tier: 'PROFESSIONAL',
        issuedAt: Date.now() + 24 * 60 * 60 * 1000, // 1 天后
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
        features: ['AI_PREMIUM'],
      };

      const isValid = validator.validateLicense(futureLicense);
      expect(isValid).toBe(false);
    });

    it('应该验证 License 的必需字段', () => {
      const incompleteLicense = {
        id: 'lic-005',
        tenantId: 'tenant-123',
        tier: 'PROFESSIONAL',
        // 缺少 issuedAt 和 expiresAt
      };

      expect(() => {
        validator.validateLicense(incompleteLicense as any);
      }).toThrow();
    });
  });

  describe('hasFeature()', () => {
    it('应该检查 License 中是否包含某个功能', () => {
      const license: License = {
        id: 'lic-006',
        tenantId: 'tenant-123',
        tier: 'ENTERPRISE',
        issuedAt: Date.now(),
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
        features: ['AI_PREMIUM', 'PAYMENTS', 'MULTI_TENANT'],
      };

      expect(validator.hasFeature(license, 'AI_PREMIUM')).toBe(true);
      expect(validator.hasFeature(license, 'PAYMENTS')).toBe(true);
      expect(validator.hasFeature(license, 'ADVANCED_ANALYTICS')).toBe(false);
    });

    it('应该在 License 过期后返回 false', () => {
      const expiredLicense: License = {
        id: 'lic-007',
        tenantId: 'tenant-123',
        tier: 'PROFESSIONAL',
        issuedAt: Date.now() - 730 * 24 * 60 * 60 * 1000,
        expiresAt: Date.now() - 24 * 60 * 60 * 1000,
        features: ['AI_PREMIUM', 'PAYMENTS'],
      };

      expect(validator.hasFeature(expiredLicense, 'AI_PREMIUM')).toBe(false);
    });
  });

  describe('Tier 功能映射', () => {
    it('BASIC Tier 应该有基础功能', () => {
      const basicLicense: License = {
        id: 'lic-008',
        tenantId: 'tenant-123',
        tier: 'BASIC',
        issuedAt: Date.now(),
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
        features: validator.getTierFeatures('BASIC'),
      };

      expect(basicLicense.features).toContain('AI_BASIC');
      expect(basicLicense.features).not.toContain('MULTI_TENANT');
    });

    it('PROFESSIONAL Tier 应该有中等功能', () => {
      const professionalLicense: License = {
        id: 'lic-009',
        tenantId: 'tenant-123',
        tier: 'PROFESSIONAL',
        issuedAt: Date.now(),
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
        features: validator.getTierFeatures('PROFESSIONAL'),
      };

      expect(professionalLicense.features).toContain('AI_PREMIUM');
      expect(professionalLicense.features).toContain('PAYMENTS');
      expect(professionalLicense.features).not.toContain('MULTI_TENANT');
    });

    it('ENTERPRISE Tier 应该有全部功能', () => {
      const enterpriseLicense: License = {
        id: 'lic-010',
        tenantId: 'tenant-123',
        tier: 'ENTERPRISE',
        issuedAt: Date.now(),
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
        features: validator.getTierFeatures('ENTERPRISE'),
      };

      expect(enterpriseLicense.features).toContain('AI_PREMIUM');
      expect(enterpriseLicense.features).toContain('PAYMENTS');
      expect(enterpriseLicense.features).toContain('MULTI_TENANT');
      expect(enterpriseLicense.features).toContain('ADVANCED_ANALYTICS');
    });

    it('应该验证功能层级递进关系', () => {
      const basicFeatures = validator.getTierFeatures('BASIC');
      const professionalFeatures = validator.getTierFeatures('PROFESSIONAL');
      const enterpriseFeatures = validator.getTierFeatures('ENTERPRISE');

      // Professional 应该包含 Basic 的所有功能
      for (const feature of basicFeatures) {
        expect(professionalFeatures).toContain(feature);
      }

      // Enterprise 应该包含 Professional 的所有功能
      for (const feature of professionalFeatures) {
        expect(enterpriseFeatures).toContain(feature);
      }
    });
  });

  describe('License 生成和验证流程', () => {
    it('应该生成和验证有效的 License', () => {
      const licenseData: License = {
        id: 'lic-011',
        tenantId: 'tenant-456',
        tier: 'PROFESSIONAL',
        issuedAt: Date.now(),
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
        features: ['AI_PREMIUM', 'PAYMENTS'],
      };

      // 生成 License
      const serialized = validator.serializeLicense(licenseData);
      const signature = validator.signLicense(serialized);

      // 验证 License
      const isSignatureValid = verifySignature(serialized, signature, testSecret);
      expect(isSignatureValid).toBe(true);

      // 反序列化并验证
      const deserialized = deserializeLicense(serialized);
      expect(validator.validateLicense(deserialized)).toBe(true);
    });
  });
});
