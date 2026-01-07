import Config from 'src/services/config/Config';
import { TConfigSchema } from 'src/services/config/Types';

describe('Config', () => {
    const originalEnvironment = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnvironment };
    });

    afterAll(() => {
        process.env = originalEnvironment;
    });

    describe('Config.load', () => {
        it('should load environment variables with their correct types based on the schema', () => {
            process.env.STRING_REQUIRED = 'testString';
            process.env.NUMBER_REQUIRED = '42';
            process.env.BOOLEAN_REQUIRED = 'true';
            process.env.STRING_OPTIONAL_SET = 'optionalString';
            process.env.STRING_OPTIONAL_UNSET = undefined;

            const schema: TConfigSchema = {
                STRING_REQUIRED: { type: 'string', required: true },
                NUMBER_REQUIRED: { type: 'number', required: true },
                BOOLEAN_REQUIRED: { type: 'boolean', required: true },
                STRING_OPTIONAL_SET: { type: 'string', required: false, defaultValue: 'defaultString' },
                STRING_OPTIONAL_UNSET: { type: 'string', required: false, defaultValue: 'defaultString' },
            };

            expect(() => Config.load(schema)).not.toThrow();
            expect(Config.get<string>('STRING_REQUIRED')).toBe('testString');
            expect(Config.get<number>('NUMBER_REQUIRED')).toBe(42);
            expect(Config.get<boolean>('BOOLEAN_REQUIRED')).toBe(true);
            expect(Config.get<string>('STRING_OPTIONAL_SET')).toBe('optionalString');
            expect(Config.get<string>('STRING_OPTIONAL_UNSET')).toBe('defaultString');
        });

        it('should throw an error for missing required environment variables', () => {
            const schema: TConfigSchema = {
                STRING_REQUIRED: { type: 'string', required: true },
            };

            expect(() => Config.load(schema)).toThrow('missing required environment variable: STRING_REQUIRED');
        });

        it('should throw an error for invalid type - expected: number', () => {
            process.env.NUMBER_REQUIRED = 'not_a_number';

            const schema: TConfigSchema = {
                NUMBER_REQUIRED: { type: 'number', required: true },
            };

            expect(() => Config.load(schema)).toThrow(
                'invalid value for environment variable: NUMBER_REQUIRED - expected: number'
            );
        });

        it('should throw an error for invalid type - expected: boolean', () => {
            process.env.BOOLEAN_REQUIRED = 'not_a_boolean';

            const schema: TConfigSchema = {
                BOOLEAN_REQUIRED: { type: 'boolean', required: true },
            };

            expect(() => Config.load(schema)).toThrow(
                'invalid value for environment variable: BOOLEAN_REQUIRED - expected: boolean'
            );
        });

        it('should throw an error for invalid type - unknown', () => {
            process.env.INVALID_TYPE = 'value';

            const schema = {
                INVALID_TYPE: {
                    type: 'invalid_type',
                    required: true,
                },
            } as never;

            expect(() => Config.load(schema)).toThrow('Unknown type for environment variable: INVALID_TYPE');
        });
    });

    describe('Config.get', () => {
        it('should throw an error for missing requested environment variable', () => {
            expect(() => Config.get('MISSING_VARIABLE')).toThrow(
                'missing requested environment variable: MISSING_VARIABLE'
            );
        });
    });

    describe('Config.getLoggerConfig', () => {
        it('should return the correct logger config', () => {
            process.env.LOG_LEVEL = 'info';

            const schema: TConfigSchema = {
                LOG_LEVEL: { type: 'string', required: true },
            };

            expect(() => Config.load(schema)).not.toThrow();
            expect(Config.getLoggerConfig()).toEqual({
                level: 'info',
                directory: '/app/logs',
            });
        });
    });
});
