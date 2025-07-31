import { LoggerInterface } from 'src/components/logger/LoggerInterface';
import PluginRepository from 'src/repositories/PluginRepository';
import AbstractTask from 'src/tasks/AbstractTask';
import { TaskInterface } from 'src/tasks/TaskInterface';

export default class DeletePluginsUnusedTask extends AbstractTask implements TaskInterface {
    private pluginRepository: PluginRepository;

    constructor(logger: LoggerInterface, pluginRepository: PluginRepository) {
        super(logger);
        this.pluginRepository = pluginRepository;
    }

    public async run(): Promise<void> {
        try {
            this.logger.info('Deleting unused plugins...');

            const success = await this.pluginRepository.deleteUnused();

            if (success) {
                this.logger.info('Deleted unused plugins successfully');
            } else {
                this.logger.warn('No unused plugins found or deletion failed');
            }
        } catch (err) {
            this.logger.error('Error while deleting unused plugins', { error: err });
        }
    }
}
