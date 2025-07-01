import { TPlugin, TPluginVersion } from 'src/models/Plugin';
import { LatestVersionProviderInterface } from './LatestVersionProviderInterface';

export default class LatestVersionResolver {
    private providers: LatestVersionProviderInterface[] = [];

    constructor() {}

    public async addProvider(provider: LatestVersionProviderInterface): Promise<void> {
        this.providers.push(provider);
    }

    public async resolve(slug: TPlugin['slug']): Promise<TPluginVersion> {
        for (const provider of this.providers) {
            const version = await provider.getLatestVersion(slug);

            if (version.version) {
                return version;
            }
        }

        return {
            version: null,
            requiredPhpVersion: null,
            requiredWpVersion: null,
        };
    }
}
