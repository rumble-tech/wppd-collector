/** @type {import("jest").Config} **/
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testRegex: '.*\\.spec\\.ts$',
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.ts'],
    coveragePathIgnorePatterns: ['/node_modules/', './src/index.ts'],
    coverageReporters: ['text', 'cobertura'],
    coverageDirectory: './coverage',
    transform: {
        '^.+\\.ts$': [
            'ts-jest',
            {
                tsconfig: 'tsconfig.json',
            },
        ],
    },
    moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/src/$1',
    },
    setupFiles: ['tsconfig-paths/register'],
};
