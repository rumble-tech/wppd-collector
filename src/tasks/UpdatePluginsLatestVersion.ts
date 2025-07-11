import { LoggerInterface } from 'src/components/logger/LoggerInterface';
import PluginRepository from 'src/repositories/PluginRepository';
import LatestVersionResolver from 'src/services/latest-version/LatestVersionResolver';
import AbstractTask from 'src/tasks/AbstractTask';
import { TaskInterface } from 'src/tasks/TaskInterface';

export default class UpdatePluginsLatestVersionTask extends AbstractTask implements TaskInterface {
    private pluginRepository: PluginRepository;
    private latestVersionResolver: LatestVersionResolver;

    constructor(
        logger: LoggerInterface,
        pluginRepository: PluginRepository,
        latestVersionResolver: LatestVersionResolver
    ) {
        super(logger);
        this.pluginRepository = pluginRepository;
        this.latestVersionResolver = latestVersionResolver;
    }

    public async run(): Promise<void> {
        try {
            this.logger.info('Updating plugins latest version...');

            const plugins = await this.pluginRepository.findAll();

            for (const plugin of plugins) {
                const latestVersion = await this.latestVersionResolver.resolvePlugin(plugin.getSlug());

                const updatedPlugin = await this.pluginRepository.update({
                    id: plugin.getId(),
                    slug: plugin.getSlug(),
                    name: plugin.getName(),
                    latestVersion: latestVersion.version,
                    requiredPhpVersion: latestVersion.requiredPhpVersion,
                    requiredWpVersion: latestVersion.requiredWpVersion,
                });

                if (!updatedPlugin) {
                    this.logger.warn(
                        `Failed to update plugin ${plugin.getSlug()} to latest version ${latestVersion.version}`
                    );
                    continue;
                }

                this.logger.info(`Updated plugin ${plugin.getSlug()} to latest version ${latestVersion.version}`, {
                    pluginId: plugin.getId(),
                    latestVersion: latestVersion.version,
                    requiredPhpVersion: latestVersion.requiredPhpVersion,
                    requiredWpVersion: latestVersion.requiredWpVersion,
                });
            }
        } catch (err) {
            this.logger.error('Error while updating plugins latest version', { error: err });
        }
    }
}
