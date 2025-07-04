import { LoggerInterface } from 'src/components/logger/LoggerInterface';

export default abstract class AbstractTask {
    protected logger: LoggerInterface;

    constructor(logger: LoggerInterface) {
        this.logger = logger;
    }

    protected abstract run(): Promise<void>;
}
