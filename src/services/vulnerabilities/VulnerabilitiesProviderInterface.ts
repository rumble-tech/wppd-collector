import { TPlugin, TPluginVulnerability } from 'src/models/Plugin';

export interface VulnerabilitiesProviderInterface {
    getVulnerabilities(slug: TPlugin['slug']): Promise<Omit<TPluginVulnerability, 'id' | 'pluginId'>[] | null>;
}
