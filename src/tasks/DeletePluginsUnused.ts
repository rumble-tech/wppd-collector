import AbstractTask from 'src/tasks/AbstractTask';
import Logger from 'src/components/Logger';
import PluginRepository from 'src/repositories/PluginRepository';
import { TaskInterface } from 'src/tasks/TaskInterface';

export default class DeletePluginsUnusedTask extends AbstractTask implements TaskInterface {
    private pluginRepository: PluginRepository;

    constructor(logger: Logger, pluginRepository: PluginRepository) {
        super(logger);
        this.pluginRepository = pluginRepository;
    }

    public async run(): Promise<void> {
        try {
            const success = await this.pluginRepository.deleteUnused();

            if (success) {
                this.logger.scheduler.info('Deleted unused plugins successfully');
            } else {
                this.logger.scheduler.warn('No unused plugins found or deletion failed');
            }
        } catch (err) {
            this.logger.scheduler.error('Error while deleting unused plugins', { error: err });
        }
    }
}
