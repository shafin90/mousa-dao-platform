module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  roots: ['<rootDir>'],
  modulePaths: ['<rootDir>/../backend/node_modules'],
  moduleDirectories: ['node_modules', '<rootDir>/../backend/node_modules'],
  setupFilesAfterEnv: ['<rootDir>/setup/setup.js'],
  globalTeardown: '<rootDir>/setup/teardown.js',
  collectCoverage: false,
  testMatch: ['**/tests/sockets/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/'],
};
