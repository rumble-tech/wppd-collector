import AbstractTask from 'src/tasks/AbstractTask';
import Logger from 'src/components/Logger';
import PluginRepository from 'src/repositories/PluginRepository';
import { TaskInterface } from 'src/tasks/TaskInterface';

export default class UpdatePluginsVulnerabilitiesTask extends AbstractTask implements TaskInterface {
    private pluginRepository: PluginRepository;

    constructor(logger: Logger, pluginRepository: PluginRepository) {
        super(logger);
        this.pluginRepository = pluginRepository;
    }

    public async run(): Promise<void> {
        try {
            this.logger.scheduler.info('Updating plugins vulnerabilities...');

            const plugins = await this.pluginRepository.findAll();

            for (const plugin of plugins) {
                const vulnerabilities = await this.pluginRepository.getVulnerabilities(plugin.getSlug());

                if (!vulnerabilities || !Array.isArray(vulnerabilities)) {
                    this.logger.app.error('Failed to fetch vulnerabilities for plugin', { id: plugin.getId(), slug: plugin.getSlug() });
                    continue;
                }

                this.logger.app.info(`Found ${vulnerabilities.length} vulnerabilities for plugin. Clearing existing vulnerabilities and inserting new ones`, { id: plugin.getId(), slug: plugin.getSlug() });

                await this.pluginRepository.deleteAllVulnerabilitiesForPlugin(plugin.getId());

                this.logger.app.info('Inserting vulnerabilities for plugin', { plugin: { id: plugin.getId(), slug: plugin.getSlug() } });

                for (const vulnerability of vulnerabilities) {
                    await this.pluginRepository.createVulnerability({
                        pluginId: plugin.getId(),
                        ...vulnerability,
                    });

                    this.logger.app.info('Vulnerability created successfully', { plugin: { id: plugin.getId(), slug: plugin.getSlug() }, vulnerability });
                }
            }
        } catch (err) {
            this.logger.scheduler.error('Error while updating plugins vulnerabilities', { error: err });
        }
    }
}
