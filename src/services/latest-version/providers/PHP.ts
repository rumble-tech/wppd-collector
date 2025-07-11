import axios, { AxiosRequestConfig } from 'axios';
import Config from 'src/config/Config';
import { LatestPhpOrWpVersionProviderInterface } from 'src/services/latest-version/LatestVersionProviderInterface';

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
            const phpVersionData = response.data as {
                data: Record<string, { name: string }>;
            };

            this.latestVersion = Object.values(phpVersionData.data)[0].name;
        } catch (_) {
            this.latestVersion = null;
        }
    }
}
