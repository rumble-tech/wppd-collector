import { TPlugin, TPluginVersion } from 'src/entities/Plugin';

export default abstract class AbstractLatestPluginVersionProvider {
    public abstract fetchVersion(slug: TPlugin['slug']): Promise<TPluginVersion>;
}
