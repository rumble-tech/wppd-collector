import { TPlugin, TPluginVersion } from 'src/models/Plugin';

export interface LatestPhpOrWpVersionProviderInterface {
    getLatestVersion(): string | null;
    fetchLatestVersion(): Promise<void>;
}

export interface LatestPluginVersionProviderInterface {
    getLatestVersion(slug: TPlugin['slug']): Promise<TPluginVersion>;
}
