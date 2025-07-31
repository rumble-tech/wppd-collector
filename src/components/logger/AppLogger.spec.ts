import { LoggerConfig } from 'src/config/Types';
import AppLogger from './AppLogger';
import winston from 'winston';
import path from 'path';
import DailyRotateFile from 'winston-daily-rotate-file';

describe('AppLogger', () => {
    const baseDir = '/rumble-wppd';

    describe('AppLogger.constructor', () => {
        it('should register two DailyRotateFile transports when level is not silly', () => {
            const config: LoggerConfig = { directory: baseDir, level: 'debug' };
            const appLogger = new AppLogger(config);
            const winstonLogger = appLogger['logger'] as winston.Logger;

            const [infoTransport, errorTransport] = winstonLogger.transports as DailyRotateFile[];

            expect(infoTransport).toBeInstanceOf(winston.transports.DailyRotateFile);
            expect(infoTransport.level).toBe('info');
            expect(infoTransport.filename).toBe('combined-%DATE%.log');
            expect(infoTransport.dirname).toBe(path.join(baseDir, 'info'));

            expect(errorTransport).toBeInstanceOf(winston.transports.DailyRotateFile);
            expect(errorTransport.level).toBe('error');
            expect(errorTransport.filename).toBe('combined-%DATE%.log');
            expect(errorTransport.dirname).toBe(path.join(baseDir, 'error'));
        });

        it('should add a Console transport when level is silly', () => {
            const config: LoggerConfig = { directory: baseDir, level: 'silly' };
            const appLogger = new AppLogger(config);
            const winstonLogger = appLogger['logger'] as winston.Logger;

            const transports = winstonLogger.transports;
            const consoleTransport = transports.filter((t) => t instanceof winston.transports.Console)[0];

            expect(transports).toHaveLength(3);
            expect(consoleTransport).toBeDefined();
            expect(consoleTransport.level).toBe('silly');
            expect(consoleTransport.format).toBeDefined();
        });
    });

    describe('AppLogger.logger.fileFormat', () => {
        beforeAll(() => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date('2025-01-01:00:00:00Z'));
        });
        afterAll(() => {
            jest.useRealTimers();
        });

        it('should format the log message without meta', () => {
            const config: LoggerConfig = { directory: baseDir, level: 'info' };
            const appLogger = new AppLogger(config);
            const winstonLogger = appLogger['logger'] as winston.Logger;
            const [infoTransport, errorTransport] = winstonLogger.transports as DailyRotateFile[];

            const transformedInfo = infoTransport.format?.transform({
                level: 'info',
                message: 'Test message',
            }) as winston.Logform.TransformableInfo;

            const transformedError = errorTransport.format?.transform({
                level: 'error',
                message: 'Test message',
            }) as winston.Logform.TransformableInfo;

            const outputInfo = transformedInfo[Symbol.for('message')] as string;
            const outputError = transformedError[Symbol.for('message')] as string;

            expect(outputInfo).toBe('2025-01-01 00:00:00 [info] Test message ');
            expect(outputError).toBe('2025-01-01 00:00:00 [error] Test message ');
        });

        it('should format the log message with meta', () => {
            const config: LoggerConfig = { directory: baseDir, level: 'info' };
            const appLogger = new AppLogger(config);
            const winstonLogger = appLogger['logger'] as winston.Logger;
            const [infoTransport, errorTransport] = winstonLogger.transports as DailyRotateFile[];

            const transformedInfo = infoTransport.format?.transform({
                level: 'info',
                message: 'Test message',
                timestamp: '2025-01-01 00:00:00', // gets overtaken by jest.setSystemTime
                key: 'value',
            }) as winston.Logform.TransformableInfo;

            const transformedError = errorTransport.format?.transform({
                level: 'error',
                message: 'Test message',
                timestamp: '2025-01-01 00:00:00', // gets overtaken by jest.setSystemTime
                key: 'value',
            }) as winston.Logform.TransformableInfo;

            const outputInfo = transformedInfo[Symbol.for('message')] as string;
            const outputError = transformedError[Symbol.for('message')] as string;

            expect(outputInfo).toBe('2025-01-01 00:00:00 [info] Test message {"key":"value"}');
            expect(outputError).toBe('2025-01-01 00:00:00 [error] Test message {"key":"value"}');
        });
    });

    describe('AppLogger.logger.consoleFormat', () => {
        beforeAll(() => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date('2025-01-01:00:00:00Z'));

            const colorizer = winston.format.colorize({ all: true });
            colorizer.transform = (info) => info;
            jest.spyOn(winston.format, 'colorize').mockReturnValue(colorizer);
        });
        afterAll(() => {
            jest.useRealTimers();
            jest.resetAllMocks();
        });

        it('should format the log message without meta', () => {
            const config: LoggerConfig = { directory: baseDir, level: 'silly' };
            const appLogger = new AppLogger(config);
            const winstonLogger = appLogger['logger'] as winston.Logger;
            const transports = winstonLogger.transports;
            const consoleTransport = transports.filter((t) => t instanceof winston.transports.Console)[0];

            const transformed = consoleTransport.format?.transform({
                level: 'info',
                message: 'Test message',
            }) as winston.Logform.TransformableInfo;

            const output = transformed[Symbol.for('message')] as string;
            expect(output).toBe('2025-01-01 00:00:00 [info] Test message ');
        });

        it('should format the log message with meta', () => {
            const config: LoggerConfig = { directory: baseDir, level: 'silly' };
            const appLogger = new AppLogger(config);
            const winstonLogger = appLogger['logger'] as winston.Logger;
            const transports = winstonLogger.transports;
            const consoleTransport = transports.filter((t) => t instanceof winston.transports.Console)[0];

            const transformed = consoleTransport.format?.transform({
                level: 'info',
                message: 'Test message',
                timestamp: '2025-01-01 00:00:00', // gets overtaken by jest.setSystemTime
                key: 'value',
            }) as winston.Logform.TransformableInfo;

            const output = transformed[Symbol.for('message')] as string;
            expect(output).toBe('2025-01-01 00:00:00 [info] Test message {"key":"value"}');
        });
    });
});
