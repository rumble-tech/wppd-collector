import { TPlugin } from 'src/entities/Plugin';
import { TPluginVulnerability } from 'src/entities/PluginVulnerability';
import AbstractPluginVulnerabilitiesProvider from 'src/resolver/vulnerabilities/providers/plugin/AbstractPluginVulnerabilitiesProvider';

export default class VulnerabilitiesResolver {
    private readonly pluginProviders: AbstractPluginVulnerabilitiesProvider[];

    constructor(pluginProviders: AbstractPluginVulnerabilitiesProvider[]) {
        this.pluginProviders = pluginProviders;
    }

    public resolvePlugin(slug: TPlugin['slug']): Omit<TPluginVulnerability, 'id' | 'createdAt' | 'pluginId'>[] | null {
        for (const provider of this.pluginProviders) {
            const vulnerabilitiesData = provider.get(slug);

            if (vulnerabilitiesData) {
                return vulnerabilitiesData;
            }
        }

        return null;
    }
}
