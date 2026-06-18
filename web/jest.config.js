/** @type {import('jest').Config} */
const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

const customJestConfig = {
  setupFilesAfterSetup: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@components/(.*)$': '<rootDir>/components/$1',
    '^@lib/(.*)$': '<rootDir>/lib/$1',
    '^@utils/(.*)$': '<rootDir>/utils/$1',
    '^@hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@store/(.*)$': '<rootDir>/store/$1',
  },
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 40,
      lines: 40,
      statements: 40,
    },
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  transformIgnorePatterns: ['/node_modules/(?!(@ant-design|antd)/)'],
};

module.exports = createJestConfig(customJestConfig);
