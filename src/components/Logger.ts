import path from 'path';
import { LoggerConfig } from 'src/config/Types';
import winston from 'winston';
import 'winston-daily-rotate-file';

export default class Logger {
    private static config: LoggerConfig;

    private static _app: winston.Logger;
    private static _scheduler: winston.Logger;

    public static setConfig(config: LoggerConfig): void {
        Logger.config = config;
    }

    public static init(): void {
        Logger._app = winston.createLogger({
            level: Logger.config.level,
            transports: [
                new winston.transports.DailyRotateFile({
                    filename: path.join(Logger.config.directory, 'info', 'combined-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    zippedArchive: true,
                    maxSize: '20m',
                    maxFiles: '14d',
                    level: 'info',
                    format: Logger.getAppFileFormat(),
                }),
                new winston.transports.DailyRotateFile({
                    filename: path.join(Logger.config.directory, 'error', 'combined-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    zippedArchive: true,
                    maxSize: '20m',
                    maxFiles: '14d',
                    level: 'error',
                    format: Logger.getAppFileFormat(),
                }),
            ],
        });

        if (Logger.config.level === 'silly') {
            Logger._app.add(
                new winston.transports.Console({
                    format: Logger.getConsoleFormat(),
                    level: 'silly',
                })
            );
        }

        Logger._scheduler = winston.createLogger({
            level: 'info',
            transports: [
                new winston.transports.DailyRotateFile({
                    filename: path.join(Logger.config.directory, 'scheduler', 'scheduler-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    zippedArchive: true,
                    maxSize: '20m',
                    maxFiles: '7d',
                    format: Logger.getSchedulerFileFormat(),
                }),
            ],
        });
    }

    public static get app(): winston.Logger {
        return Logger._app;
    }

    public static get scheduler(): winston.Logger {
        return Logger._scheduler;
    }

    private static getConsoleFormat(): winston.Logform.Format {
        return winston.format.combine(
            winston.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss',
            }),
            winston.format.printf(({ level, message, timestamp, ...meta }) => `${timestamp} [${level}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`),
            winston.format.colorize({ all: true }),
            winston.format.errors({ stack: true })
        );
    }

    private static getAppFileFormat(): winston.Logform.Format {
        return winston.format.combine(
            winston.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss',
            }),
            winston.format.printf(({ level, message, timestamp, ...meta }) => `${timestamp} [${level}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`),
            winston.format.errors({ stack: true })
        );
    }

    private static getSchedulerFileFormat(): winston.Logform.Format {
        return winston.format.combine(
            winston.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss',
            }),
            winston.format.printf(({ level, message, timestamp, ...meta }) => `${timestamp} [${level}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`),
            winston.format.errors({ stack: true })
        );
    }
}
