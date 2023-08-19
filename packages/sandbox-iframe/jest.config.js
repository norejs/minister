
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    testMatch: ['**/*.test.ts'],
    collectCoverage: false,
    collectCoverageFrom: ['src/**/*.ts'],
};