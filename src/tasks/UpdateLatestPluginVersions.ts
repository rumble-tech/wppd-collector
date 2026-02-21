import PluginRepository from 'src/repositories/PluginRepository';
import LatestVersionResolver from 'src/resolver/latest-version/LatestVersionResolver';
import Logger from 'src/services/logger/Logger';
import AbstractTask from 'src/services/scheduler/AbstractTask';

export default class UpdateLatestPluginVersionsTask extends AbstractTask {
    private readonly pluginRepository: PluginRepository;
    private readonly resolver: LatestVersionResolver;

    constructor(logger: Logger, pluginRepository: PluginRepository, resolver: LatestVersionResolver) {
        super(logger);

        this.pluginRepository = pluginRepository;
        this.resolver = resolver;
    }

    public async run(): Promise<void> {
        try {
            this.logger.info('Updating latest plugin versions...');

            const plugins = await this.pluginRepository.findAll();

            for (const plugin of plugins) {
                const latestVersion = await this.resolver.resolvePlugin(plugin.getSlug());

                if (
                    !(await this.pluginRepository.update({
                        id: plugin.getId(),
                        slug: plugin.getSlug(),
                        name: plugin.getName(),
                        latestVersion: latestVersion.version,
                        requiredPhpVersion: latestVersion.requiredPhpVersion,
                        requiredWpVersion: latestVersion.requiredWpVersion,
                    }))
                ) {
                    this.logger.warn(`Failed to update latest plugin version`, {
                        plugin: plugin.getSlug(),
                    });

                    continue;
                }

                this.logger.info('Successfully updated latest plugin version', {
                    plugin: plugin.getSlug(),
                    version: latestVersion.version,
                    requiredPhpVersion: latestVersion.requiredPhpVersion,
                    requiredWpVersion: latestVersion.requiredWpVersion,
                });
            }
        } catch (e) {
            this.logger.error('Failed to update latest plugin versions', {
                err: e,
            });
        }
    }
}
