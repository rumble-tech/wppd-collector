import { createDefaultPreset } from 'ts-jest';

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
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
        './src/config/Schema.ts',
    ],
    coverageReporters: ['text', 'cobertura'],
    coverageDirectory: './coverage',
    transform: {
        ...tsJestTransformCfg,
    },
};
