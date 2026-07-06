module.exports = {
  projects: [
    {
      displayName: 'root-and-packages',
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>/src', '<rootDir>/packages'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.spec.ts',
        '<rootDir>/packages/**/__tests__/**/*.test.ts',
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@pi-merchant/pi-sdk/(.*)$': '<rootDir>/packages/pi-sdk/src/$1',
        '^@pi-merchant/pi-sdk$': '<rootDir>/packages/pi-sdk/src/index.ts',
        '^@pi-merchant/types/(.*)$': '<rootDir>/packages/types/src/$1',
        '^@pi-merchant/types$': '<rootDir>/packages/types/src/index.ts',
        '^@pi-merchant/config/(.*)$': '<rootDir>/packages/config/src/$1',
        '^@pi-merchant/config$': '<rootDir>/packages/config/src/index.ts',
        '^@pi-merchant/ui/(.*)$': '<rootDir>/packages/ui/src/$1',
        '^@pi-merchant/ui$': '<rootDir>/packages/ui/src/index.ts',
      },
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
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
    },
    {
      displayName: 'web-app',
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>/apps/web/src'],
      testMatch: [
        '<rootDir>/apps/web/src/**/__tests__/**/*.test.ts',
        '<rootDir>/apps/web/src/**/__tests__/**/*.spec.ts',
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/apps/web/src/$1',
        '^@pi-merchant/pi-sdk/(.*)$': '<rootDir>/packages/pi-sdk/src/$1',
        '^@pi-merchant/pi-sdk$': '<rootDir>/packages/pi-sdk/src/index.ts',
        '^@pi-merchant/types/(.*)$': '<rootDir>/packages/types/src/$1',
        '^@pi-merchant/types$': '<rootDir>/packages/types/src/index.ts',
        '^@pi-merchant/config/(.*)$': '<rootDir>/packages/config/src/$1',
        '^@pi-merchant/config$': '<rootDir>/packages/config/src/index.ts',
        '^@pi-merchant/ui/(.*)$': '<rootDir>/packages/ui/src/$1',
        '^@pi-merchant/ui$': '<rootDir>/packages/ui/src/index.ts',
      },
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
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
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'packages/**/*.{ts,tsx}',
    'apps/web/src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!packages/**/*.d.ts',
    '!apps/web/src/**/*.d.ts',
    '!src/**/node_modules/**',
    '!packages/**/node_modules/**',
    '!apps/web/src/**/node_modules/**',
    '!src/**/__tests__/**',
    '!packages/**/__tests__/**',
    '!apps/web/src/**/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 10000,
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/coverage/'],
};
