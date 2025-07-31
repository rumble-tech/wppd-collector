import AbstractLogger from 'src/components/logger/AbstractLogger';
import { LoggerConfig } from 'src/config/Types';
import winston from 'winston';
import path from 'path';
import 'winston-daily-rotate-file';

export default class AppLogger extends AbstractLogger {
    constructor(config: LoggerConfig) {
        super(config);

        this.logger = winston.createLogger({
            level: this.config.level,
            transports: [
                new winston.transports.DailyRotateFile({
                    filename: path.join(this.config.directory, 'info', 'combined-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    zippedArchive: true,
                    maxSize: '20m',
                    maxFiles: '14d',
                    level: 'info',
                    format: this.getFileFormat(),
                }),
                new winston.transports.DailyRotateFile({
                    filename: path.join(this.config.directory, 'error', 'combined-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    zippedArchive: true,
                    maxSize: '20m',
                    maxFiles: '14d',
                    level: 'error',
                    format: this.getFileFormat(),
                }),
            ],
        });

        if (this.config.level === 'silly') {
            this.logger.add(
                new winston.transports.Console({
                    format: this.getConsoleFormat(),
                    level: 'silly',
                })
            );
        }
    }

    private getConsoleFormat(): winston.Logform.Format {
        return winston.format.combine(
            winston.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss',
            }),
            winston.format.printf(
                ({ level, message, timestamp, ...meta }) =>
                    `${timestamp} [${level}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`
            ),
            winston.format.colorize({ all: true }),
            winston.format.errors({ stack: true })
        );
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
