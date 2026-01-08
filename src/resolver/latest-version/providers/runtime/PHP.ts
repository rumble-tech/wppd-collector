import axios from 'axios';
import AbstractLatestRuntimeVersionProvider from 'src/resolver/latest-version/providers/runtime/AbstractLatestRuntimeVersionProvider';
import Config from 'src/services/config/Config';
import Utils from 'src/Utils';

export default class LatestPhpRuntimeVersionProvider extends AbstractLatestRuntimeVersionProvider {
    public async fetch(): Promise<void> {
        try {
            const response = await axios({
                method: 'GET',
                url: Config.get<string>('PHP_VERSION_API'),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const phpVersionData = response.data as Record<string, { version: string }>;
            const latestMajor = Object.keys(phpVersionData)
                .map((key) => parseInt(key, 10))
                .reduce((a, b) => Math.max(a, b), -Infinity)
                .toString();

            this.version = Utils.formatVersion(phpVersionData[latestMajor].version);
        } catch {
            this.version = null;
        }
    }
}
