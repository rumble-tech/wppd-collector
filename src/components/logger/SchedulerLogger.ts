import path from 'path';
import AbstractLogger from 'src/components/logger/AbstractLogger';
import { LoggerConfig } from 'src/config/Types';
import winston from 'winston';
import 'winston-daily-rotate-file';

export default class SchedulerLogger extends AbstractLogger {
    constructor(config: LoggerConfig) {
        super(config);

        this.logger = winston.createLogger({
            level: this.config.level,
            transports: [
                new winston.transports.DailyRotateFile({
                    filename: path.join(this.config.directory, 'scheduler-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    zippedArchive: true,
                    maxSize: '20m',
                    maxFiles: '7d',
                    format: this.getFileFormat(),
                }),
            ],
        });
    }

    private getFileFormat(): winston.Logform.Format {
        return winston.format.combine(
            winston.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss',
            }),
            winston.format.printf(
                ({ level, message, timestamp, ...meta }) =>
                    `${timestamp} [${level}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`
            ),
            winston.format.errors({ stack: true })
        );
    }
}
