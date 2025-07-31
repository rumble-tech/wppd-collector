import { TPlugin, TPluginVersion } from 'src/models/Plugin';
import {
    LatestPluginVersionProviderInterface,
    LatestPhpOrWpVersionProviderInterface,
} from './LatestVersionProviderInterface';

export default class LatestVersionResolver {
    private providers: LatestPluginVersionProviderInterface[] = [];
    private phpVersionProvider: LatestPhpOrWpVersionProviderInterface | null = null;
    private wpVersionProvider: LatestPhpOrWpVersionProviderInterface | null = null;

    constructor() {}

    public addPluginProvider(provider: LatestPluginVersionProviderInterface): void {
        this.providers.push(provider);
    }

    public setPhpProvider(provider: LatestPhpOrWpVersionProviderInterface): void {
        this.phpVersionProvider = provider;
    }

    public setWpProvider(provider: LatestPhpOrWpVersionProviderInterface): void {
        this.wpVersionProvider = provider;
    }

    public async resolvePlugin(slug: TPlugin['slug']): Promise<TPluginVersion> {
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

    public async resolvePhp(): Promise<string | null> {
        if (!this.phpVersionProvider) {
            return null;
        }

        return await this.phpVersionProvider.getLatestVersion();
    }

    public async resolveWp(): Promise<string | null> {
        if (!this.wpVersionProvider) {
            return null;
        }

        return await this.wpVersionProvider.getLatestVersion();
    }
}
