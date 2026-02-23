import { TPlugin } from 'src/entities/Plugin';
import { TPluginVulnerability } from 'src/entities/PluginVulnerability';

export default abstract class AbstractPluginVulnerabilitiesProvider {
    public abstract get(slug: TPlugin['slug']): Omit<TPluginVulnerability, 'id' | 'createdAt' | 'pluginId'>[] | null;
    public abstract fetch(): Promise<void>;
}
