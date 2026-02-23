import axios from 'axios';
import AbstractLatestRuntimeVersionProvider from 'src/resolver/latest-version/providers/runtime/AbstractLatestRuntimeVersionProvider';
import Utils from 'src/Utils';

export default class LatestWordPressRuntimeVersionProvider extends AbstractLatestRuntimeVersionProvider {
    private readonly apiUrl = 'https://api.wordpress.org/core/version-check/1.7/';

    public async fetch(): Promise<void> {
        try {
            const response = await axios({
                method: 'GET',
                url: this.apiUrl,
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
