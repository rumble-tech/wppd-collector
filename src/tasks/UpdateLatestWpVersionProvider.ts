import { LoggerInterface } from 'src/components/logger/LoggerInterface';
import { LatestPhpOrWpVersionProviderInterface } from 'src/services/latest-version/LatestVersionProviderInterface';
import AbstractTask from 'src/tasks/AbstractTask';
import { TaskInterface } from 'src/tasks/TaskInterface';

export default class UpdateLatestWpVersionProviderTask extends AbstractTask implements TaskInterface {
    private wpLatestVersionProvider: LatestPhpOrWpVersionProviderInterface;

    constructor(logger: LoggerInterface, wpLatestVersionProvider: LatestPhpOrWpVersionProviderInterface) {
        super(logger);
        this.wpLatestVersionProvider = wpLatestVersionProvider;
    }

    public async run(): Promise<void> {
        try {
            this.logger.info('Updating latest WordPress version...');

            await this.wpLatestVersionProvider.fetchLatestVersion();
            this.logger.info('Latest WP version updated successfully.');
        } catch (err) {
            this.logger.error('Failed to update latest WP version:', { err });
        }
    }
}
