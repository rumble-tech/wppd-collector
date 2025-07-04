/** @type {import("jest").Config} **/
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testRegex: '.*\\.spec\\.ts$',
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.ts'],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        './src/@types',
        './src/components/database',
        './src/entities',
        './src/models',
        './src/controllers/AbstractController.ts',
        './src/tasks/AbstractTask.ts',
        './src/components/logger/AbstractLogger.ts',
        './src/config/Schema.ts',
    ],
    coverageReporters: ['text', 'cobertura'],
    coverageDirectory: './coverage',
    transform: {
        '^.+\\.tsx?$': [
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
