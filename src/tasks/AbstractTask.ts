import Logger from 'src/components/Logger';

export default abstract class AbstractTask {
    protected logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    protected abstract run(): Promise<void>;
}
