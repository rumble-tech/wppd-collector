import PluginRepository from 'src/repositories/PluginRepository';
import PluginVulnerabilityRepository from 'src/repositories/PluginVulnerabilityRepository';
import VulnerabilitiesResolver from 'src/resolver/vulnerabilities/VulnerabilitiesResolver';
import Logger from 'src/services/logger/Logger';
import AbstractTask from 'src/services/scheduler/AbstractTask';

export default class UpdatePluginVulnerabilitiesTask extends AbstractTask {
    private readonly pluginRepository: PluginRepository;
    private readonly pluginVulnerabilityRepository: PluginVulnerabilityRepository;
    private readonly resolver: VulnerabilitiesResolver;

    constructor(
        logger: Logger,
        pluginRepository: PluginRepository,
        pluginVulnerabilityRepository: PluginVulnerabilityRepository,
        resolver: VulnerabilitiesResolver
    ) {
        super(logger);

        this.pluginRepository = pluginRepository;
        this.pluginVulnerabilityRepository = pluginVulnerabilityRepository;
        this.resolver = resolver;
    }

    public async run(): Promise<void> {
        try {
            this.logger.info('Updating plugin vulnerabilities...');

            const plugins = await this.pluginRepository.findAll();

            for (const plugin of plugins) {
                const vulnerabilities = this.resolver.resolvePlugin(plugin.getSlug());

                if (!vulnerabilities || !Array.isArray(vulnerabilities)) {
                    this.logger.error('Failed to fetch vulnerabilities for plugin', {
                        slug: plugin.getSlug(),
                    });
                } else {
                    await this.pluginVulnerabilityRepository.deleteAllByPluginId(plugin.getId());

                    for (const vulnerability of vulnerabilities) {
                        if (
                            !(await this.pluginVulnerabilityRepository.insert({
                                pluginId: plugin.getId(),
                                description: vulnerability.description,
                                publishedAt: vulnerability.publishedAt,
                                severity: vulnerability.severity,
                                references: vulnerability.references,
                                fromVersion: vulnerability.fromVersion,
                                toVersion: vulnerability.toVersion,
                            }))
                        ) {
                            this.logger.error('Failed to insert plugin vulnerability', {
                                slug: plugin.getSlug(),
                                vulnerability,
                            });
                        } else {
                            this.logger.info('Successfully inserted plugin vulnerability', {
                                slug: plugin.getSlug(),
                                vulnerability,
                            });
                        }
                    }
                }
            }
        } catch (e) {
            this.logger.error('Failed to update plugin vulnerabilities', {
                err: e,
            });
        }
    }
}
