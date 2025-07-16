import { LoggerConfig } from 'src/config/Types';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import SchedulerLogger from './SchedulerLogger';

describe('SchedulerLogger', () => {
    const baseDir = '/rumble-wppd';

    describe('SchedulerLogger.constructor', () => {
        it('should register one DailyRotateFile transport', () => {
            const config: LoggerConfig = { directory: baseDir, level: 'info' };
            const schedulerLogger = new SchedulerLogger(config);
            const winstonLogger = schedulerLogger['logger'] as winston.Logger;

            const [transport] = winstonLogger.transports as DailyRotateFile[];

            expect(transport).toBeInstanceOf(winston.transports.DailyRotateFile);
            expect(transport.filename).toBe('scheduler-%DATE%.log');
            expect(transport.dirname).toBe(baseDir);
        });
    });

    describe('SchedulerLogger.logger.fileFormat', () => {
        beforeAll(() => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date('2025-01-01:00:00:00Z'));
        });
        afterAll(() => {
            jest.useRealTimers();
        });

        it('should format the log message without meta', () => {
            const config: LoggerConfig = { directory: baseDir, level: 'info' };
            const schedulerLogger = new SchedulerLogger(config);
            const winstonLogger = schedulerLogger['logger'] as winston.Logger;
            const [transport] = winstonLogger.transports as DailyRotateFile[];

            const transformed = transport.format?.transform({
                level: 'info',
                message: 'Test message',
            }) as winston.Logform.TransformableInfo;

            const output = transformed[Symbol.for('message')] as string;
            expect(output).toBe('2025-01-01 00:00:00 [info] Test message ');
        });

        it('should format the log message with meta', () => {
            const config: LoggerConfig = { directory: baseDir, level: 'info' };
            const schedulerLogger = new SchedulerLogger(config);
            const winstonLogger = schedulerLogger['logger'] as winston.Logger;
            const [transport] = winstonLogger.transports as DailyRotateFile[];

            const transformed = transport.format?.transform({
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
