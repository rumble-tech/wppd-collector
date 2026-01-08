import LatestPhpRuntimeVersionProvider from 'src/resolver/latest-version/providers/runtime/PHP';
import Logger from 'src/services/logger/Logger';
import AbstractTask from 'src/services/scheduler/AbstractTask';

export default class UpdateLatestPhpVersionTask extends AbstractTask {
    private provider: LatestPhpRuntimeVersionProvider;

    constructor(logger: Logger, provider: LatestPhpRuntimeVersionProvider) {
        super(logger);

        this.provider = provider;
    }

    public async run(): Promise<void> {
        try {
            this.logger.info('Updating latest PHP version...');
            await this.provider.fetch();

            this.logger.info('Successfully updated latest PHP version');
        } catch (e) {
            this.logger.error('Failed to update latest PHP version', {
                err: e,
            });
        }
    }
}
