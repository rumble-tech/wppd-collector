import path from 'path';
import { LoggerConfig } from 'src/config/Types';
import winston from 'winston';
import 'winston-daily-rotate-file';

export default class Logger {
    private static instance: Logger;
    private static config: LoggerConfig;

    private _app: winston.Logger;
    private _scheduler: winston.Logger;

    public static setConfig(config: LoggerConfig): void {
        Logger.config = config;
    }

    constructor() {
        this._app = winston.createLogger({
            level: Logger.config.level,
            transports: [
                new winston.transports.DailyRotateFile({
                    filename: path.join(Logger.config.directory, 'info', 'combined-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    zippedArchive: true,
                    maxSize: '20m',
                    maxFiles: '14d',
                    level: 'info',
                    format: this.getAppFileFormat(),
                }),
                new winston.transports.DailyRotateFile({
                    filename: path.join(Logger.config.directory, 'error', 'combined-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    zippedArchive: true,
                    maxSize: '20m',
                    maxFiles: '14d',
                    level: 'error',
                    format: this.getAppFileFormat(),
                }),
            ],
        });

        if (Logger.config.level === 'silly') {
            this._app.add(
                new winston.transports.Console({
                    format: this.getConsoleFormat(),
                    level: 'silly',
                })
            );
        }

        this._scheduler = winston.createLogger({
            level: 'info',
            transports: [
                new winston.transports.DailyRotateFile({
                    filename: path.join(Logger.config.directory, 'scheduler', 'scheduler-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    zippedArchive: true,
                    maxSize: '20m',
                    maxFiles: '7d',
                    format: this.getSchedulerFileFormat(),
                }),
            ],
        });
    }

    public get app(): winston.Logger {
        return this._app;
    }

    public get scheduler(): winston.Logger {
        return this._scheduler;
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

    private getAppFileFormat(): winston.Logform.Format {
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

    private getSchedulerFileFormat(): winston.Logform.Format {
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
