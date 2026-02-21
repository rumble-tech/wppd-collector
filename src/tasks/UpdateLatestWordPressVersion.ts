import LatestWordPressRuntimeVersionProvider from 'src/resolver/latest-version/providers/runtime/WordPress';
import Logger from 'src/services/logger/Logger';
import AbstractTask from 'src/services/scheduler/AbstractTask';

export default class UpdateLatestWordPressVersionTask extends AbstractTask {
    private provider: LatestWordPressRuntimeVersionProvider;

    constructor(logger: Logger, provider: LatestWordPressRuntimeVersionProvider) {
        super(logger);

        this.provider = provider;
    }

    public async run(): Promise<void> {
        try {
            this.logger.info('Updating latest WordPress version...');
            await this.provider.fetch();

            this.logger.info('Successfully updated latest WordPress version');
        } catch (e) {
            this.logger.error('Failed to update latest WordPress version', {
                err: e,
            });
        }
    }
}
