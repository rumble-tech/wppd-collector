import { TPlugin, TPluginVulnerability } from 'src/models/Plugin';

export interface VulnerabilitiesProviderInterface {
    getVulnerabilities(slug: TPlugin['slug']): Omit<TPluginVulnerability, 'id' | 'pluginId'>[] | null;
    fetchVulnerabilities(): Promise<void>;
}
