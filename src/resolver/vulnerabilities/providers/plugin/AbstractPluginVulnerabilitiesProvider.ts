import { TPlugin } from 'src/entities/Plugin';
import { TPluginVulnerability } from 'src/entities/PluginVulnerability';
import Logger from 'src/services/logger/Logger';

export default abstract class AbstractPluginVulnerabilitiesProvider {
    protected logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    public abstract get(slug: TPlugin['slug']): Omit<TPluginVulnerability, 'id' | 'createdAt' | 'pluginId'>[] | null;
    public abstract fetch(): Promise<void>;
}
