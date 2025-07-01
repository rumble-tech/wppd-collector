import AbstractTask from 'src/tasks/AbstractTask';
import Logger from 'src/components/Logger';
import PluginRepository from 'src/repositories/PluginRepository';
import { TaskInterface } from 'src/tasks/TaskInterface';

export default class UpdatePluginsLatestVersionTask extends AbstractTask implements TaskInterface {
    private pluginRepository: PluginRepository;

    constructor(logger: Logger, pluginRepository: PluginRepository) {
        super(logger);
        this.pluginRepository = pluginRepository;
    }

    public async run(): Promise<void> {
        try {
            this.logger.scheduler.info('Updating plugins latest version...');

            const plugins = await this.pluginRepository.findAll();

            for (const plugin of plugins) {
                const latestVersion = await this.pluginRepository.getLatestVersion(plugin.getSlug());

                const updatedPlugin = await this.pluginRepository.update({
                    id: plugin.getId(),
                    slug: plugin.getSlug(),
                    name: plugin.getName(),
                    latestVersion: latestVersion.version,
                    requiredPhpVersion: latestVersion.requiredPhpVersion,
                    requiredWpVersion: latestVersion.requiredWpVersion,
                });

                if (!updatedPlugin) {
                    this.logger.scheduler.warn(`Failed to update plugin ${plugin.getSlug()} to latest version ${latestVersion.version}`);
                    continue;
                }

                this.logger.scheduler.info(`Updated plugin ${plugin.getSlug()} to latest version ${latestVersion.version}`, {
                    pluginId: plugin.getId(),
                    latestVersion: latestVersion.version,
                    requiredPhpVersion: latestVersion.requiredPhpVersion,
                    requiredWpVersion: latestVersion.requiredWpVersion,
                });
            }
        } catch (err) {
            this.logger.scheduler.error('Error while updating plugins latest version', { error: err });
        }
    }
}
