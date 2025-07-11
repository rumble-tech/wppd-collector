import axios, { AxiosRequestConfig } from 'axios';
import Config from 'src/config/Config';
import { LatestPhpOrWpVersionProviderInterface } from 'src/services/latest-version/LatestVersionProviderInterface';
import Tools from 'src/Tools';

export default class WordPressLatestVersionProvider implements LatestPhpOrWpVersionProviderInterface {
    private latestVersion: string | null = null;

    public getLatestVersion(): string | null {
        return this.latestVersion;
    }

    public async fetchLatestVersion(): Promise<void> {
        try {
            const requestConfig: AxiosRequestConfig = {
                method: 'GET',
                url: Config.get<string>('WP_VERSION_API'),
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            const response = await axios(requestConfig);
            const wpVersionData = response.data as {
                offers: { version: string }[];
            };

            this.latestVersion = Tools.formatVersionToMMP(wpVersionData.offers[0].version);
        } catch (_) {
            this.latestVersion = null;
        }
    }
}
