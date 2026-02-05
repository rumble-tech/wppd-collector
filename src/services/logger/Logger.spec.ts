import path from 'path';
import { TLoggerConfig } from 'src/services/config/Types';
import Logger from 'src/services/logger/Logger';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

describe('Logger', () => {
    const baseDirectory = '/logger';

    describe('Logger.constructor', () => {
        it('should create two DailyRotateFile transports when the log level is not silly', () => {
            const loggerConfig: TLoggerConfig = {
                level: 'info',
                directory: baseDirectory,
            };

            const logger = new Logger(loggerConfig);
            const winstonLogger = logger['logger'] as winston.Logger;

            const [infoTransport, errorTransport] = winstonLogger.transports as DailyRotateFile[];

            expect(infoTransport).toBeInstanceOf(winston.transports.DailyRotateFile);
            expect(infoTransport.level).toBe('info');
            expect(infoTransport.filename).toBe('combined-%DATE%.log');
            expect(infoTransport.dirname).toBe(path.join(baseDirectory, 'info'));

            expect(errorTransport).toBeInstanceOf(winston.transports.DailyRotateFile);
            expect(errorTransport.level).toBe('error');
            expect(errorTransport.filename).toBe('combined-%DATE%.log');
            expect(errorTransport.dirname).toBe(path.join(baseDirectory, 'error'));
        });

        it('should add a console transport when the log level is silly', () => {
            const loggerConfig: TLoggerConfig = {
                level: 'silly',
                directory: baseDirectory,
            };

            const logger = new Logger(loggerConfig);
            const winstonLogger = logger['logger'] as winston.Logger;

            const transports = winstonLogger.transports;
            const consoleTransport = transports.filter((t) => t instanceof winston.transports.Console)[0];

            expect(transports).toHaveLength(3);
            expect(consoleTransport).toBeDefined();
            expect(consoleTransport.level).toBe('silly');
            expect(consoleTransport.format).toBeDefined();
        });
    });

    describe('Logger.logger.fileFormat', () => {
        beforeAll(() => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date('2026-01-01:00:00:00Z'));
        });

        afterAll(() => {
            jest.useRealTimers();
        });

        it('should format the log message without meta information', () => {
            const loggerConfig: TLoggerConfig = {
                level: 'info',
                directory: baseDirectory,
            };

            const logger = new Logger(loggerConfig);
            const winstonLogger = logger['logger'] as winston.Logger;
            const [infoTransport, errorTransport] = winstonLogger.transports as DailyRotateFile[];

            const transformedInfo = infoTransport.format?.transform({
                level: 'info',
                message: 'Test info message',
            }) as winston.Logform.TransformableInfo;

            const transformedError = errorTransport.format?.transform({
                level: 'error',
                message: 'Test error message',
            }) as winston.Logform.TransformableInfo;

            const outputInfo = transformedInfo[Symbol.for('message')] as string;
            const outputError = transformedError[Symbol.for('message')] as string;

            expect(outputInfo).toBe('2026-01-01 00:00:00 [info] Test info message');
            expect(outputError).toBe('2026-01-01 00:00:00 [error] Test error message');
        });

        it('should format the log message with meta information', () => {
            const loggerConfig: TLoggerConfig = {
                level: 'info',
                directory: baseDirectory,
            };

            const logger = new Logger(loggerConfig);
            const winstonLogger = logger['logger'] as winston.Logger;
            const [infoTransport, errorTransport] = winstonLogger.transports as DailyRotateFile[];

            const transformedInfo = infoTransport.format?.transform({
                level: 'info',
                message: 'Test info message',
                timestamp: '2026-01-01 00:00:00', // gets overtaken by jest.setSystemTime
                key: 'value',
            }) as winston.Logform.TransformableInfo;

            const transformedError = errorTransport.format?.transform({
                level: 'error',
                message: 'Test error message',
                timestamp: '2026-01-01 00:00:00', // gets overtaken by jest.setSystemTime
                key: 'value',
            }) as winston.Logform.TransformableInfo;

            const outputInfo = transformedInfo[Symbol.for('message')] as string;
            const outputError = transformedError[Symbol.for('message')] as string;

            expect(outputInfo).toBe('2026-01-01 00:00:00 [info] Test info message {"key":"value"}');
            expect(outputError).toBe('2026-01-01 00:00:00 [error] Test error message {"key":"value"}');
        });
    });

    describe('Logger.logger.consoleFormat', () => {
        beforeAll(() => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date('2026-01-01:00:00:00Z'));

            const colorizer = winston.format.colorize({ all: true });
            colorizer.transform = (info) => info;
            jest.spyOn(winston.format, 'colorize').mockReturnValue(colorizer);
        });

        afterAll(() => {
            jest.useRealTimers();
            jest.resetAllMocks();
        });

        it('should format the log message without meta information', () => {
            const loggerConfig: TLoggerConfig = {
                level: 'silly',
                directory: baseDirectory,
            };

            const logger = new Logger(loggerConfig);
            const winstonLogger = logger['logger'] as winston.Logger;
            const transports = winstonLogger.transports;
            const consoleTransport = transports.filter((t) => t instanceof winston.transports.Console)[0];

            const transformed = consoleTransport.format?.transform({
                level: 'info',
                message: 'Test info message',
            }) as winston.Logform.TransformableInfo;

            const output = transformed[Symbol.for('message')] as string;
            expect(output).toBe('2026-01-01 00:00:00 [info] Test info message');
        });

        it('should format the log message with meta information', () => {
            const loggerConfig: TLoggerConfig = {
                level: 'silly',
                directory: baseDirectory,
            };

            const logger = new Logger(loggerConfig);
            const winstonLogger = logger['logger'] as winston.Logger;
            const transports = winstonLogger.transports;
            const consoleTransport = transports.filter((t) => t instanceof winston.transports.Console)[0];

            const transformed = consoleTransport.format?.transform({
                level: 'info',
                message: 'Test info message',
                timestamp: '2026-01-01 00:00:00', // gets overtaken by jest.setSystemTime
                key: 'value',
            }) as winston.Logform.TransformableInfo;

            const output = transformed[Symbol.for('message')] as string;
            expect(output).toBe('2026-01-01 00:00:00 [info] Test info message {"key":"value"}');
        });
    });
});
