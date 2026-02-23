import Logger from 'src/services/logger/Logger';

export default abstract class AbstractTask {
    protected logger: Logger;

    protected constructor(logger: Logger) {
        this.logger = logger;
    }

    protected abstract run(): Promise<void>;
}
