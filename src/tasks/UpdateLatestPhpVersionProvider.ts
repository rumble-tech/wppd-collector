import { LoggerInterface } from 'src/components/logger/LoggerInterface';
import { LatestPhpOrWpVersionProviderInterface } from 'src/services/latest-version/LatestVersionProviderInterface';
import AbstractTask from 'src/tasks/AbstractTask';
import { TaskInterface } from 'src/tasks/TaskInterface';

export default class UpdateLatestPhpVersionProviderTask extends AbstractTask implements TaskInterface {
    private phpLatestVersionProvider: LatestPhpOrWpVersionProviderInterface;

    constructor(logger: LoggerInterface, phpLatestVersionProvider: LatestPhpOrWpVersionProviderInterface) {
        super(logger);
        this.phpLatestVersionProvider = phpLatestVersionProvider;
    }

    public async run(): Promise<void> {
        try {
            await this.phpLatestVersionProvider.fetchLatestVersion();
            this.logger.info('Latest PHP version updated successfully.');
        } catch (err) {
            this.logger.error('Failed to update latest PHP version:', { err });
        }
    }
}
