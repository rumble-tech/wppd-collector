import axios, { AxiosRequestConfig } from 'axios';
import Config from 'src/config/Config';
import { LatestPhpOrWpVersionProviderInterface } from 'src/services/latest-version/LatestVersionProviderInterface';
import Tools from 'src/Tools';

export default class PhpLatestVersionProvider implements LatestPhpOrWpVersionProviderInterface {
    private latestVersion: string | null = null;

    public getLatestVersion(): string | null {
        return this.latestVersion;
    }

    public async fetchLatestVersion(): Promise<void> {
        try {
            const requestConfig: AxiosRequestConfig = {
                method: 'GET',
                url: Config.get<string>('PHP_VERSION_API'),
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            const response = await axios(requestConfig);
            const phpVersionData = response.data as Record<string, { version: string }>;

            const latestMajor = Object.keys(phpVersionData)
                .map((key) => parseInt(key, 10))
                .reduce((a, b) => Math.max(a, b), -Infinity)
                .toString();

            this.latestVersion = Tools.formatVersionToMMP(phpVersionData[latestMajor].version);
        } catch (_) {
            this.latestVersion = null;
        }
    }
}
