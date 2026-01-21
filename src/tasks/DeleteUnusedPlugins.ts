import PluginRepository from 'src/repositories/PluginRepository';
import SitePluginRepository from 'src/repositories/SitePluginRepository';
import Logger from 'src/services/logger/Logger';
import AbstractTask from 'src/services/scheduler/AbstractTask';

export default class DeleteUnusedPluginsTask extends AbstractTask {
    private readonly pluginRepository: PluginRepository;
    private readonly sitePluginRepository: SitePluginRepository;

    constructor(logger: Logger, pluginRepository: PluginRepository, sitePluginRepository: SitePluginRepository) {
        super(logger);

        this.pluginRepository = pluginRepository;
        this.sitePluginRepository = sitePluginRepository;
    }

    public async run(): Promise<void> {
        try {
            this.logger.info('Deleting unused plugins...');

            const allSitePlugins = await this.sitePluginRepository.findAll();
            const uniqueUsedPluginIds = allSitePlugins
                .map((sitePlugin) => sitePlugin.getPluginId())
                .filter((id, index, arr) => arr.indexOf(id) === index);

            const allPlugins = await this.pluginRepository.findAll();

            for (const plugin of allPlugins) {
                if (!uniqueUsedPluginIds.includes(plugin.getId())) {
                    this.logger.info('Deleting unused plugin', {
                        pluginId: plugin.getId(),
                    });

                    if (!(await this.pluginRepository.delete(plugin.getId()))) {
                        this.logger.error('Failed to delete plugin', {
                            pluginId: plugin.getId(),
                        });

                        continue;
                    }
                    this.logger.info(`Successfully deleted plugin`, {
                        pluginId: plugin.getId(),
                    });
                }
            }
        } catch (e) {
            this.logger.error('Failed to delete unused plugins', {
                err: e,
            });
        }
    }
}
