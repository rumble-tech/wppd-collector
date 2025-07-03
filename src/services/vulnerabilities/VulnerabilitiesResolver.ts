import { TPlugin, TPluginVulnerability } from 'src/models/Plugin';
import { VulnerabilitiesProviderInterface } from './VulnerabilitiesProviderInterface';

export default class VulnerabilitiesVersionResolver {
    private providers: VulnerabilitiesProviderInterface[] = [];

    constructor() {}

    public async addProvider(provider: VulnerabilitiesProviderInterface): Promise<void> {
        this.providers.push(provider);
    }

    public async resolve(slug: TPlugin['slug']): Promise<Omit<TPluginVulnerability, 'id' | 'pluginId'>[] | null> {
        for (const provider of this.providers) {
            const vulnerabilities = await provider.getVulnerabilities(slug);

            if (vulnerabilities !== null) {
                return vulnerabilities;
            }
        }

        return null;
    }
}
