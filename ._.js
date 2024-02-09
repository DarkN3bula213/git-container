// jest.config.js
const { compilerOptions } = require('./tsconfig.json');
const { pathsToModuleNameMapper } = require('ts-jest');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths || {}, { prefix: '<rootDir>/' }),
  setupFiles: ['<rootDir>/tests/setup.ts'],
    setupFilesAfterEnv: [
      "<rootDir>/tests/setup.ts"
    ]
};
