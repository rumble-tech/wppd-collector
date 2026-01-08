import axios from 'axios';
import AbstractLatestRuntimeVersionProvider from 'src/resolver/latest-version/providers/runtime/AbstractLatestRuntimeVersionProvider';
import Config from 'src/services/config/Config';
import Utils from 'src/Utils';

export default class LatestWordPressRuntimeVersionProvider extends AbstractLatestRuntimeVersionProvider {
    public async fetch(): Promise<void> {
        try {
            const response = await axios({
                method: 'GET',
                url: Config.get<string>('WP_VERSION_API'),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const wpVersionData = response.data as {
                offers: { version: string }[];
            };

            this.version = Utils.formatVersion(wpVersionData.offers[0].version);
        } catch {
            this.version = null;
        }
    }
}
