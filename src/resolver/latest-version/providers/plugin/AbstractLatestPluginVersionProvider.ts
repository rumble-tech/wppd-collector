import { TPlugin, TPluginVersion } from 'src/entities/Plugin';

export default abstract class AbstractLatestPluginVersionProvider {
    public abstract get(slug: TPlugin['slug']): Promise<TPluginVersion>;
}
