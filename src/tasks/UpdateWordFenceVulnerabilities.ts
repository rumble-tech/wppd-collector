import WordFenceApiVulnerabilitiesProvider from 'src/resolver/vulnerabilities/providers/plugin/WordFenceApi';
import Logger from 'src/services/logger/Logger';
import AbstractTask from 'src/services/scheduler/AbstractTask';

export default class UpdateWordFenceVulnerabilitiesTask extends AbstractTask {
    private readonly provider: WordFenceApiVulnerabilitiesProvider;

    constructor(logger: Logger, provider: WordFenceApiVulnerabilitiesProvider) {
        super(logger);

        this.provider = provider;
    }

    public async run(): Promise<void> {
        try {
            this.logger.info('Updating WordFence vulnerabilities...');
            await this.provider.fetch();

            this.logger.info('Successfully updated WordFence vulnerabilities');
        } catch (e) {
            this.logger.error('Failed to update WordFence vulnerabilities', {
                err: e,
            });
        }
    }
}
