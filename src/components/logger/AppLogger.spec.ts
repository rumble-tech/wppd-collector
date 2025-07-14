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
});
