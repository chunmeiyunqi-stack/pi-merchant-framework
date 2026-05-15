module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/apps/web', '<rootDir>/packages/pi-sdk'],
  testMatch: [
    '<rootDir>/apps/web/**/__tests__/**/*.(ts|tsx)',
    '<rootDir>/packages/pi-sdk/**/__tests__/**/*.(ts|tsx)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/apps/web/src/$1',
    '^@pi-merchant/pi-sdk$': '<rootDir>/packages/pi-sdk/src/index.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  collectCoverageFrom: [
    'apps/web/**/*.{ts,tsx}',
    'packages/pi-sdk/**/*.{ts,tsx}',
    '!apps/web/**/*.d.ts',
    '!packages/pi-sdk/**/*.d.ts',
    '!apps/web/**/node_modules/**',
    '!packages/pi-sdk/**/node_modules/**',
    '!apps/web/**/.next/**',
    '!packages/pi-sdk/**/.next/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  transformIgnorePatterns: ['/node_modules/'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
        },
      },
    ],
  },
};
