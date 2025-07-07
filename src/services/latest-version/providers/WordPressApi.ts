import axios, { AxiosRequestConfig } from 'axios';
import Config from 'src/config/Config';
import { TPlugin, TPluginVersion } from 'src/models/Plugin';
import { LatestVersionProviderInterface } from 'src/services/latest-version/LatestVersionProviderInterface';
import Tools from 'src/Tools';

export default class WordPressApiLatestVersionProvider implements LatestVersionProviderInterface {
    public async getLatestVersion(slug: TPlugin['slug']): Promise<TPluginVersion> {
        try {
            const requestConfig: AxiosRequestConfig = {
                method: 'GET',
                url: `${Config.get('WP_PLUGIN_API_URL')}/plugins/${slug}.json`,
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            const response = await axios(requestConfig);

            const pluginVersionData = response.data as {
                version: string;
                requires_php: string;
                requires: string;
            };

            return {
                version: Tools.formatVersionToMMP(pluginVersionData.version),
                requiredPhpVersion: Tools.formatVersionToMMP(pluginVersionData.requires_php),
                requiredWpVersion: Tools.formatVersionToMMP(pluginVersionData.requires),
            };
        } catch (_) {
            return {
                version: null,
                requiredPhpVersion: null,
                requiredWpVersion: null,
            };
        }
    }
}
