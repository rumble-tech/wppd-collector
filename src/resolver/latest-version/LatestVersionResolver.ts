import { TPlugin, TPluginVersion } from 'src/entities/Plugin';
import AbstractLatestPluginVersionProvider from 'src/resolver/latest-version/providers/plugin/AbstractLatestPluginVersionProvider';
import AbstractLatestRuntimeVersionProvider from 'src/resolver/latest-version/providers/runtime/AbstractLatestRuntimeVersionProvider';

export default class LatestVersionResolver {
    private readonly phpProvider: AbstractLatestRuntimeVersionProvider;
    private readonly wordPressProvider: AbstractLatestRuntimeVersionProvider;
    private readonly pluginProviders: AbstractLatestPluginVersionProvider[];

    constructor(
        phpProvider: AbstractLatestRuntimeVersionProvider,
        wordPressProvider: AbstractLatestRuntimeVersionProvider,
        pluginProviders: AbstractLatestPluginVersionProvider[]
    ) {
        this.phpProvider = phpProvider;
        this.wordPressProvider = wordPressProvider;
        this.pluginProviders = pluginProviders;
    }

    public resolvePhp(): string | null {
        return this.phpProvider.getVersion();
    }

    public resolveWordPress(): string | null {
        return this.wordPressProvider.getVersion();
    }

    public async resolvePlugin(slug: TPlugin['slug']): Promise<TPluginVersion> {
        for (const provider of this.pluginProviders) {
            const versionData = await provider.fetchVersion(slug);

            if (versionData.version) {
                return versionData;
            }
        }

        return {
            version: null,
            requiredPhpVersion: null,
            requiredWpVersion: null,
        };
    }
}
