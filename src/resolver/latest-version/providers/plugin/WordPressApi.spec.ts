import axios from 'axios';
import LatestWordPressApiPluginVersionProvider from 'src/resolver/latest-version/providers/plugin/WordPressApi';
import Config from 'src/services/config/Config';

jest.mock('axios');
jest.mock('/src/services/config/Config');

const mockedAxios = axios as jest.MockedFunction<typeof axios>;
const mockedConfigGet = Config.get as jest.MockedFunction<typeof Config.get>;

describe('LatestWordPressApiPluginVersionProvider', () => {
    let provider: LatestWordPressApiPluginVersionProvider;

    beforeEach(() => {
        provider = new LatestWordPressApiPluginVersionProvider();
        jest.clearAllMocks();
    });

    describe('LatestWordPressApiPluginVersionProvider.fetchVersion', () => {
        it('should return the latest plugin version on successful API call', async () => {
            const apiUrl = 'https://example.com/plugin-version';
            mockedConfigGet.mockReturnValue(apiUrl);

            const pluginVersionApiResponse = {
                version: '1.0.0',
                requires_php: '8.5.1',
                requires: '6.9.0',
            };

            mockedAxios.mockResolvedValue({ data: pluginVersionApiResponse });

            const latestPluginVersion = await provider.fetchVersion('plugin-slug');

            expect(mockedConfigGet).toHaveBeenCalledWith('WP_PLUGIN_VERSION_API');
            expect(mockedAxios).toHaveBeenCalledWith({
                method: 'GET',
                url: `${apiUrl}/plugins/plugin-slug.json`,
                headers: { 'Content-Type': 'application/json' },
            });
            expect(latestPluginVersion).toStrictEqual({
                version: '1.0.0',
                requiredPhpVersion: '8.5.1',
                requiredWpVersion: '6.9.0',
            });
        });

        it('should return null values on failed API call', async () => {
            const apiUrl = 'https://example.com/plugin-version';
            mockedConfigGet.mockReturnValue(apiUrl);

            mockedAxios.mockRejectedValue(new Error('Network Error'));

            const latestPluginVersion = await provider.fetchVersion('plugin-slug');

            expect(mockedConfigGet).toHaveBeenCalledWith('WP_PLUGIN_VERSION_API');
            expect(mockedAxios).toHaveBeenCalledWith({
                method: 'GET',
                url: `${apiUrl}/plugins/plugin-slug.json`,
                headers: { 'Content-Type': 'application/json' },
            });
            expect(latestPluginVersion).toStrictEqual({
                version: null,
                requiredPhpVersion: null,
                requiredWpVersion: null,
            });
        });
    });
});
