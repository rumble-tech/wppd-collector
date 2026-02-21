import WordFenceApiPluginVulnerabilitiesProvider from 'src/resolver/vulnerabilities/providers/plugin/WordFenceApi';
import Logger from 'src/services/logger/Logger';
import AbstractTask from 'src/services/scheduler/AbstractTask';

export default class UpdateWordFencePluginVulnerabilitiesTask extends AbstractTask {
    private readonly provider: WordFenceApiPluginVulnerabilitiesProvider;

    constructor(logger: Logger, provider: WordFenceApiPluginVulnerabilitiesProvider) {
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
