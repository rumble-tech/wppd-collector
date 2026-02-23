import axios from 'axios';
import WordPressApiLatestPluginVersionProvider from 'src/resolver/latest-version/providers/plugin/WordPressApi';

jest.mock('axios');
const mockedAxios = axios as jest.MockedFunction<typeof axios>;

describe('WordPressApiLatestPluginVersionProvider', () => {
    let provider: WordPressApiLatestPluginVersionProvider;
    const apiUrl = 'https://example.com/plugin-version';

    beforeEach(() => {
        provider = new WordPressApiLatestPluginVersionProvider();
        (provider as unknown as { apiUrl: string }).apiUrl = apiUrl;

        jest.clearAllMocks();
    });

    describe('WordPressApiLatestPluginVersionProvider.get', () => {
        it('should return the latest plugin version on successful API call', async () => {
            const pluginVersionApiResponse = {
                version: '1.0.0',
                requires_php: '8.5.1',
                requires: '6.9.0',
            };

            mockedAxios.mockResolvedValue({ data: pluginVersionApiResponse });

            const latestPluginVersion = await provider.get('plugin-slug');

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
            mockedAxios.mockRejectedValue(new Error('Network Error'));

            const latestPluginVersion = await provider.get('plugin-slug');

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
