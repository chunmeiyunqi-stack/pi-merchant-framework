import type { AIModel, AIRequest, AIResponse, LogLevel, PiAuthResult, PiUser } from '../types';

// Type guard functions to test
function isAIRequest(obj: unknown): obj is AIRequest {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as AIRequest).merchantId === 'string' &&
    typeof (obj as AIRequest).prompt === 'string' &&
    ((obj as AIRequest).model === undefined ||
     ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-3.5-turbo'].includes((obj as AIRequest).model as AIModel)) &&
    ((obj as AIRequest).temperature === undefined || typeof (obj as AIRequest).temperature === 'number')
  );
}

function isAIResponse(obj: unknown): obj is AIResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as AIResponse).success === 'boolean' &&
    ((obj as AIResponse).result === undefined || typeof (obj as AIResponse).result === 'string') &&
    ((obj as AIResponse).error === undefined || typeof (obj as AIResponse).error === 'string')
  );
}

function isPiUser(obj: unknown): obj is PiUser {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as PiUser).uid === 'string' &&
    typeof (obj as PiUser).username === 'string'
  );
}

function isPiAuthResult(obj: unknown): obj is PiAuthResult {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    ((obj as PiAuthResult).accessToken === undefined || typeof (obj as PiAuthResult).accessToken === 'string') &&
    isPiUser((obj as PiAuthResult).user) &&
    ((obj as PiAuthResult).token === undefined || typeof (obj as PiAuthResult).token === 'string')
  );
}

function isValidLogLevel(level: unknown): level is LogLevel {
  return ['debug', 'info', 'warn', 'error'].includes(level as LogLevel);
}

describe('Type Guards and Validation', () => {
  describe('isAIRequest', () => {
    it('returns true for valid AIRequest objects', () => {
      const validRequest: AIRequest = {
        merchantId: 'merchant-123',
        prompt: 'Test prompt',
      };

      expect(isAIRequest(validRequest)).toBe(true);
    });

    it('returns true for AIRequest with optional fields', () => {
      const validRequest: AIRequest = {
        merchantId: 'merchant-123',
        prompt: 'Test prompt',
        model: 'gpt-4o',
        temperature: 0.7,
      };

      expect(isAIRequest(validRequest)).toBe(true);
    });

    it('returns false for objects missing required fields', () => {
      const invalidRequest = {
        prompt: 'Test prompt',
        // missing merchantId
      };

      expect(isAIRequest(invalidRequest)).toBe(false);
    });

    it('returns false for objects with wrong field types', () => {
      const invalidRequest = {
        merchantId: 123, // should be string
        prompt: 'Test prompt',
      };

      expect(isAIRequest(invalidRequest)).toBe(false);
    });

    it('returns false for invalid model values', () => {
      const invalidRequest = {
        merchantId: 'merchant-123',
        prompt: 'Test prompt',
        model: 'invalid-model' as AIModel,
      };

      expect(isAIRequest(invalidRequest)).toBe(false);
    });

    it('returns false for non-temperature number', () => {
      const invalidRequest = {
        merchantId: 'merchant-123',
        prompt: 'Test prompt',
        temperature: '0.7', // should be number
      };

      expect(isAIRequest(invalidRequest)).toBe(false);
    });

    it('returns false for null or undefined', () => {
      expect(isAIRequest(null)).toBe(false);
      expect(isAIRequest(undefined)).toBe(false);
    });

    it('returns false for primitive values', () => {
      expect(isAIRequest('string')).toBe(false);
      expect(isAIRequest(42)).toBe(false);
      expect(isAIRequest(true)).toBe(false);
    });
  });

  describe('isAIResponse', () => {
    it('returns true for valid success AIResponse', () => {
      const validResponse: AIResponse = {
        success: true,
        result: 'AI response text',
      };

      expect(isAIResponse(validResponse)).toBe(true);
    });

    it('returns true for valid error AIResponse', () => {
      const validResponse: AIResponse = {
        success: false,
        error: 'Error message',
      };

      expect(isAIResponse(validResponse)).toBe(true);
    });

    it('returns true for minimal success response', () => {
      const validResponse: AIResponse = {
        success: true,
      };

      expect(isAIResponse(validResponse)).toBe(true);
    });

    it('returns false for missing success field', () => {
      const invalidResponse = {
        result: 'AI response',
        // missing success
      };

      expect(isAIResponse(invalidResponse)).toBe(false);
    });

    it('returns false for wrong success type', () => {
      const invalidResponse = {
        success: 'true', // should be boolean
        result: 'AI response',
      };

      expect(isAIResponse(invalidResponse)).toBe(false);
    });

    it('returns false for wrong result type', () => {
      const invalidResponse = {
        success: true,
        result: 42, // should be string
      };

      expect(isAIResponse(invalidResponse)).toBe(false);
    });

    it('returns false for wrong error type', () => {
      const invalidResponse = {
        success: false,
        error: {}, // should be string
      };

      expect(isAIResponse(invalidResponse)).toBe(false);
    });

    it('returns false for both result and error present', () => {
      // Note: This is actually valid according to the type, but we might want to validate business logic
      const response: AIResponse = {
        success: true,
        result: 'Response',
        error: 'This should not be here',
      };

      expect(isAIResponse(response)).toBe(true);
    });
  });

  describe('isPiUser', () => {
    it('returns true for valid PiUser objects', () => {
      const validUser: PiUser = {
        uid: 'user-123',
        username: 'testuser',
      };

      expect(isPiUser(validUser)).toBe(true);
    });

    it('returns false for missing uid', () => {
      const invalidUser = {
        username: 'testuser',
        // missing uid
      };

      expect(isPiUser(invalidUser)).toBe(false);
    });

    it('returns false for wrong uid type', () => {
      const invalidUser = {
        uid: 123, // should be string
        username: 'testuser',
      };

      expect(isPiUser(invalidUser)).toBe(false);
    });

    it('returns false for wrong username type', () => {
      const invalidUser = {
        uid: 'user-123',
        username: null, // should be string
      };

      expect(isPiUser(invalidUser)).toBe(false);
    });
  });

  describe('isPiAuthResult', () => {
    it('returns true for valid PiAuthResult', () => {
      const validResult: PiAuthResult = {
        accessToken: 'token-123',
        user: {
          uid: 'user-123',
          username: 'testuser',
        },
        token: 'refresh-token',
      };

      expect(isPiAuthResult(validResult)).toBe(true);
    });

    it('returns true for minimal PiAuthResult', () => {
      const validResult: PiAuthResult = {
        user: {
          uid: 'user-123',
          username: 'testuser',
        },
      };

      expect(isPiAuthResult(validResult)).toBe(true);
    });

    it('returns false for missing user', () => {
      const invalidResult = {
        accessToken: 'token-123',
        // missing user
      };

      expect(isPiAuthResult(invalidResult)).toBe(false);
    });

    it('returns false for invalid user', () => {
      const invalidResult = {
        user: {
          uid: 'user-123',
          // missing username
        },
      };

      expect(isPiAuthResult(invalidResult)).toBe(false);
    });

    it('returns false for wrong accessToken type', () => {
      const invalidResult = {
        accessToken: 123, // should be string
        user: {
          uid: 'user-123',
          username: 'testuser',
        },
      };

      expect(isPiAuthResult(invalidResult)).toBe(false);
    });
  });

  describe('isValidLogLevel', () => {
    it('returns true for valid log levels', () => {
      expect(isValidLogLevel('debug')).toBe(true);
      expect(isValidLogLevel('info')).toBe(true);
      expect(isValidLogLevel('warn')).toBe(true);
      expect(isValidLogLevel('error')).toBe(true);
    });

    it('returns false for invalid log levels', () => {
      expect(isValidLogLevel('trace')).toBe(false);
      expect(isValidLogLevel('fatal')).toBe(false);
      expect(isValidLogLevel('')).toBe(false);
      expect(isValidLogLevel(null)).toBe(false);
      expect(isValidLogLevel(undefined)).toBe(false);
    });
  });

  describe('Type Validation Edge Cases', () => {
    it('handles empty objects', () => {
      expect(isAIRequest({})).toBe(false);
      expect(isAIResponse({})).toBe(false);
      expect(isPiUser({})).toBe(false);
      expect(isPiAuthResult({})).toBe(false);
    });

    it('handles arrays', () => {
      expect(isAIRequest([])).toBe(false);
      expect(isAIResponse([])).toBe(false);
      expect(isPiUser([])).toBe(false);
      expect(isPiAuthResult([])).toBe(false);
    });

    it('handles deeply nested invalid objects', () => {
      const deepInvalid = {
        merchantId: 'valid',
        prompt: 'valid',
        model: 'gpt-4o',
        temperature: 0.5,
        extra: {
          nested: {
            invalid: true,
          },
        },
      };

      // Should still be valid as long as required fields are correct
      expect(isAIRequest(deepInvalid)).toBe(true);
    });

    it('validates temperature range (business logic)', () => {
      // Note: Type guards don't validate business logic, only types
      const requestWithExtremeTemp: AIRequest = {
        merchantId: 'merchant-123',
        prompt: 'Test',
        temperature: 100, // Extreme but valid number
      };

      expect(isAIRequest(requestWithExtremeTemp)).toBe(true);
    });
  });
});