import { LoggerInterface } from 'src/components/logger/LoggerInterface';
import { VulnerabilitiesProviderInterface } from 'src/services/vulnerabilities/VulnerabilitiesProviderInterface';
import AbstractTask from 'src/tasks/AbstractTask';
import { TaskInterface } from 'src/tasks/TaskInterface';

export default class UpdateWordFenceVulnerabilitiesProviderTask extends AbstractTask implements TaskInterface {
    private wordfenceVulnerabilitiesProvider: VulnerabilitiesProviderInterface;

    constructor(logger: LoggerInterface, wordfenceVulnerabilitiesProvider: VulnerabilitiesProviderInterface) {
        super(logger);
        this.wordfenceVulnerabilitiesProvider = wordfenceVulnerabilitiesProvider;
    }

    public async run(): Promise<void> {
        try {
            await this.wordfenceVulnerabilitiesProvider.fetchVulnerabilities();
            this.logger.info('WordFence vulnerabilities updated successfully.');
        } catch (err) {
            this.logger.error('Failed to update WordFence vulnerabilities:', { err });
        }
    }
}
