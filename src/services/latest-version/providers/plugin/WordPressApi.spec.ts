import axios from 'axios';
import Config from 'src/config/Config';
import WordPressApiLatestVersionProvider from './WordPressApi';

jest.mock('axios');
jest.mock('src/config/Config');

const mockedAxios = axios as jest.MockedFunction<typeof axios>;
const mockedConfigGet = Config.get as jest.MockedFunction<typeof Config.get>;

describe('WordPressApi', () => {
    let provider: WordPressApiLatestVersionProvider;

    beforeEach(() => {
        provider = new WordPressApiLatestVersionProvider();
        jest.clearAllMocks();
    });

    describe('WordPressApi.getLatestVersion', () => {
        it('should return plugin version data when API call is successful', async () => {
            const slug = 'test-plugin';
            const apiUrl = 'https://example.com/plugins';
            mockedConfigGet.mockReturnValue(apiUrl);

            const pluginVersionApiResponse = {
                version: '1.0.0',
                requires_php: '7.4',
                requires: '5.8',
            };

            mockedAxios.mockResolvedValue({ data: pluginVersionApiResponse });

            const result = await provider.getLatestVersion(slug);

            expect(mockedConfigGet).toHaveBeenCalledWith('WP_PLUGIN_API_URL');
            expect(mockedAxios).toHaveBeenCalledWith({
                method: 'GET',
                url: `${apiUrl}/plugins/${slug}.json`,
                headers: { 'Content-Type': 'application/json' },
            });
            expect(result).toEqual({
                version: '1.0.0',
                requiredPhpVersion: '7.4.0',
                requiredWpVersion: '5.8.0',
            });
        });

        it('should return invalid-version-format, when API call succeeds, but version format is invalid', async () => {
            const slug = 'test-plugin';
            const apiUrl = 'https://example.com/plugins';
            mockedConfigGet.mockReturnValue(apiUrl);

            const pluginVersionApiResponse = {
                version: 'abc',
                requires_php: '7.4',
                requires: '5.8',
            };

            mockedAxios.mockResolvedValue({ data: pluginVersionApiResponse });

            const result = await provider.getLatestVersion(slug);

            expect(mockedConfigGet).toHaveBeenCalledWith('WP_PLUGIN_API_URL');
            expect(mockedAxios).toHaveBeenCalledWith({
                method: 'GET',
                url: `${apiUrl}/plugins/${slug}.json`,
                headers: { 'Content-Type': 'application/json' },
            });
            expect(result).toEqual({
                version: 'invalid-version-format',
                requiredPhpVersion: '7.4.0',
                requiredWpVersion: '5.8.0',
            });
        });

        it('should return default null object when API call fails', async () => {
            const slug = 'test-plugin';
            const apiUrl = 'https://invalid';
            mockedConfigGet.mockReturnValue(apiUrl);

            mockedAxios.mockRejectedValue(new Error('Network Error'));

            const result = await provider.getLatestVersion(slug);
            expect(mockedConfigGet).toHaveBeenCalledWith('WP_PLUGIN_API_URL');
            expect(mockedAxios).toHaveBeenCalledWith({
                method: 'GET',
                url: `${apiUrl}/plugins/${slug}.json`,
                headers: { 'Content-Type': 'application/json' },
            });
            expect(result).toEqual({
                version: null,
                requiredPhpVersion: null,
                requiredWpVersion: null,
            });
        });
    });
});
