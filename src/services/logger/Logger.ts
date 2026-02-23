import path from 'path';
import { TLoggerConfig } from 'src/services/config/Types';
import winston from 'winston';
import 'winston-daily-rotate-file';

export default class Logger {
    private config: TLoggerConfig;
    protected logger: winston.Logger;

    constructor(config: TLoggerConfig) {
        this.config = config;

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

    /* istanbul ignore next */
    public info(message: string, meta?: Record<string, unknown>): void {
        this.logger.info(message, meta);
    }

    /* istanbul ignore next */
    public error(message: string, meta?: Record<string, unknown>): void {
        this.logger.error(message, meta);
    }

    /* istanbul ignore next */
    public warn(message: string, meta?: Record<string, unknown>): void {
        this.logger.warn(message, meta);
    }

    /* istanbul ignore next */
    public debug(message: string, meta?: Record<string, unknown>): void {
        this.logger.debug(message, meta);
    }

    /* istanbul ignore next */
    public silly(message: string, meta?: Record<string, unknown>): void {
        this.logger.silly(message, meta);
    }

    private getConsoleFormat(): winston.Logform.Format {
        return winston.format.combine(
            winston.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss',
            }),
            winston.format.printf(
                ({ level, message, timestamp, ...meta }) =>
                    `${timestamp} [${level}] ${message}${Object.keys(meta).length ? ' ' + JSON.stringify(meta) : ''}`
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
                    `${timestamp} [${level}] ${message}${Object.keys(meta).length ? ' ' + JSON.stringify(meta) : ''}`
            ),
            winston.format.errors({ stack: true })
        );
    }
}
