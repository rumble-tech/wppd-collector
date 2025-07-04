import Config from './Config';
import { ConfigSchema } from './Types';

describe('Config', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    describe('Config.load', () => {
        it('should load environment variables with correct types based on schema', () => {
            process.env.STRING_REQUIRED = 'test';
            process.env.NUMBER_REQUIRED = '123';
            process.env.BOOLEAN_REQUIRED = 'true';
            process.env.STRING_OPTIONAL_SET = 'optional';
            process.env.NUMBER_OPTIONAL_UNSET = undefined;

            const schema: ConfigSchema = {
                STRING_REQUIRED: { type: 'string', required: true },
                NUMBER_REQUIRED: { type: 'number', required: true },
                BOOLEAN_REQUIRED: { type: 'boolean', required: true },
                STRING_OPTIONAL_SET: { type: 'string', required: false, defaultValue: 'default' },
                NUMBER_OPTIONAL_UNSET: { type: 'string', required: false, defaultValue: 'default' },
            };

            expect(() => Config.load(schema)).not.toThrow();
            expect(Config.get<string>('STRING_REQUIRED')).toBe('test');
            expect(Config.get<number>('NUMBER_REQUIRED')).toBe(123);
            expect(Config.get<boolean>('BOOLEAN_REQUIRED')).toBe(true);
            expect(Config.get<string>('STRING_OPTIONAL_SET')).toBe('optional');
            expect(Config.get<string>('NUMBER_OPTIONAL_UNSET')).toBe('default');
        });

        it('should throw an error missing required environment variable', () => {
            const schema: ConfigSchema = {
                STRING_REQUIRED: { type: 'string', required: true },
            };

            expect(() => Config.load(schema)).toThrow('missing required environment variable: STRING_REQUIRED');
        });

        it('should throw an error for invalid type - expected: number', () => {
            process.env.NUMBER_REQUIRED = 'not_a_number';

            const schema: ConfigSchema = {
                NUMBER_REQUIRED: { type: 'number', required: true },
            };

            expect(() => Config.load(schema)).toThrow(
                'invalid value for environment variable: NUMBER_REQUIRED - expected: number'
            );
        });

        it('should throw an error for invalid type - expected: boolean', () => {
            process.env.BOOLEAN_REQUIRED = 'not_a_boolean';

            const schema: ConfigSchema = {
                BOOLEAN_REQUIRED: { type: 'boolean', required: true },
            };

            expect(() => Config.load(schema)).toThrow(
                'invalid value for environment variable: BOOLEAN_REQUIRED - expected: boolean'
            );
        });

        it('should throw error for invalid type - unknown', () => {
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

    describe('Config.getAppLoggerConfig', () => {
        it('should return the correct app logger configuration', () => {
            process.env.LOG_LEVEL = 'info';
            process.env.LOG_DIRECTORY = '/var/logs';

            const schema: ConfigSchema = {
                LOG_LEVEL: { type: 'string', required: true },
                LOG_DIRECTORY: { type: 'string', required: true },
            };

            expect(() => Config.load(schema)).not.toThrow();
            expect(Config.getAppLoggerConfig()).toEqual({
                level: 'info',
                directory: '/var/logs/app',
            });
        });
    });

    describe('Config.getSchedulerLoggerConfig', () => {
        process.env.LOG_DIRECTORY = '/var/logs';

        const schema: ConfigSchema = {
            LOG_DIRECTORY: { type: 'string', required: true },
        };

        expect(() => Config.load(schema)).not.toThrow();
        expect(Config.getSchedulerLoggerConfig()).toEqual({
            level: 'info',
            directory: '/var/logs/scheduler',
        });
    });

    describe('Config.getServerConfig', () => {
        it('should return the correct server configuration', () => {
            process.env.CORS_WHITELIST = 'http://example1.com,http://example2.com';

            const schema: ConfigSchema = {
                CORS_WHITELIST: { type: 'string', required: true },
            };

            expect(() => Config.load(schema)).not.toThrow();
            const serverConfig = Config.getServerConfig();
            expect(serverConfig.port).toBe(80);
            expect(serverConfig.corsOptions).toBeInstanceOf(Object);

            const origin = serverConfig.corsOptions.origin;

            if (typeof origin === 'function') {
                const allowedCallback = jest.fn();
                origin('http://example1.com', allowedCallback);
                expect(allowedCallback).toHaveBeenCalledWith(null, true);

                const disallowedCallback = jest.fn();
                origin('http://notallowed.com', disallowedCallback);
                expect(disallowedCallback).toHaveBeenCalledWith(expect.any(Error), false);

                const missingCallback = jest.fn();
                origin(undefined, missingCallback);
                expect(missingCallback).toHaveBeenCalledWith(null, true);
            } else {
                throw new Error('Expected corsOptions.origin to be a function');
            }
        });
    });

    describe('Config.getMailingSESConfig', () => {
        it('should return the correct SES mailer configuration', () => {
            process.env.MAILING_SES_REGION = 'ses-region';
            process.env.MAILING_SES_ACCESS_KEY_ID = 'ses-access-key-id';
            process.env.MAILING_SES_SECRET_ACCESS_KEY = 'ses-secret-access-key';

            const schema: ConfigSchema = {
                MAILING_SES_REGION: { type: 'string', required: true },
                MAILING_SES_ACCESS_KEY_ID: { type: 'string', required: true },
                MAILING_SES_SECRET_ACCESS_KEY: { type: 'string', required: true },
            };

            expect(() => Config.load(schema)).not.toThrow();
            expect(Config.getMailingSESConfig()).toEqual({
                region: 'ses-region',
                accessKeyId: 'ses-access-key-id',
                secretAccessKey: 'ses-secret-access-key',
            });
        });
    });
});
