/** @type {import("jest").Config} **/
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testRegex: '.*\\.spec\\.ts$',
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.ts'],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        './src/index.ts',
        './src/services/config/Schema.ts',
        './src/services/database',
        './src/services/server/AbstractController.ts',
        './src/repositories/AbstractRepository.ts',
        './src/entities',
        './src/resolver/latest-version/providers/runtime/AbstractLatestRuntimeVersionProvider.ts',
    ],
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
        '^test-utils/(.*)$': '<rootDir>/test-utils/$1',
    },
    setupFiles: ['tsconfig-paths/register'],
};
