import { TPlugin, TPluginVersion } from 'src/models/Plugin';

export interface LatestVersionProviderInterface {
    getLatestVersion(slug: TPlugin['slug']): Promise<TPluginVersion>;
}
