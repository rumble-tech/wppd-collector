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
});
