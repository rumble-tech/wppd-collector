import { LoggerConfig } from 'src/config/Types';
import winston from 'winston';

export default abstract class AbstractLogger {
    protected config: LoggerConfig;
    protected logger: winston.Logger;

    constructor(config: LoggerConfig) {
        this.config = config;
    }

    public info(message: string, meta?: Record<string, unknown>): void {
        this.logger.info(message, meta);
    }
    public error(message: string, meta?: Record<string, unknown>): void {
        this.logger.error(message, meta);
    }
    public warn(message: string, meta?: Record<string, unknown>): void {
        this.logger.warn(message, meta);
    }
    public debug(message: string, meta?: Record<string, unknown>): void {
        this.logger.debug(message, meta);
    }
    public silly(message: string, meta?: Record<string, unknown>): void {
        this.logger.silly(message, meta);
    }
}
