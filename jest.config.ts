import { createDefaultPreset } from 'ts-jest';

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
    testEnvironment: 'node',
    testRegex: '.*\\.spec\\.ts$',
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.ts', '!src/**/*.spec.ts', '!src/**/*.d.ts'],
    coverageReporters: ['text', 'cobertura'],
    coverageDirectory: './coverage',
    transform: {
        ...tsJestTransformCfg,
    },
};
