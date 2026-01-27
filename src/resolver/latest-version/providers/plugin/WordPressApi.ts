import axios from 'axios';
import { TPlugin, TPluginVersion } from 'src/entities/Plugin';
import AbstractLatestPluginVersionProvider
    from 'src/resolver/latest-version/providers/plugin/AbstractLatestPluginVersionProvider';
import Config from 'src/services/config/Config';
import Utils from 'src/Utils';

export default class WordPressApiLatestPluginVersionProvider extends AbstractLatestPluginVersionProvider {
    public async fetchVersion(slug: TPlugin['slug']): Promise<TPluginVersion> {
        try {
            const response = await axios({
                method: 'GET',
                url: `${Config.get<string>('WP_PLUGIN_VERSION_API')}/plugins/${slug}.json`,
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const pluginResponseData = response.data as {
                version: string;
                requires_php: string;
                requires: string;
            };

            return {
                version: Utils.formatVersion(pluginResponseData.version),
                requiredPhpVersion: Utils.formatVersion(pluginResponseData.requires_php),
                requiredWpVersion: Utils.formatVersion(pluginResponseData.requires),
            };
        } catch {
            return {
                version: null,
                requiredPhpVersion: null,
                requiredWpVersion: null,
            };
        }
    }
}
