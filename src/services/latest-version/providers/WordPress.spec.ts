import axios from 'axios';
import Config from 'src/config/Config';
import WordPressLatestVersionProvider from './WordPress';

jest.mock('axios');
jest.mock('src/config/Config');

const mockedAxios = axios as jest.MockedFunction<typeof axios>;
const mockedConfigGet = Config.get as jest.MockedFunction<typeof Config.get>;

describe('WordPress', () => {
    let provider: WordPressLatestVersionProvider;

    beforeEach(() => {
        provider = new WordPressLatestVersionProvider();
        jest.clearAllMocks();
    });

    describe('WP.getLatestVersion', () => {
        it('should return the latest WP version', () => {
            provider['latestVersion'] = '8.0.0';
            const latestVersion = provider.getLatestVersion();
            expect(latestVersion).toBe('8.0.0');
        });

        it('should return null if latestVersion is not set', () => {
            provider['latestVersion'] = null;
            const latestVersion = provider.getLatestVersion();
            expect(latestVersion).toBeNull();
        });
    });

    describe('WP.fetchLatestVersion', () => {
        it('should set the latest WP version when API call is successful', async () => {
            const apiUrl = 'https://example.com/wp-version';
            mockedConfigGet.mockReturnValue(apiUrl);

            const wpVersionApiResponse = {
                offers: [{ version: '8.0' }],
            };

            mockedAxios.mockResolvedValue({ data: wpVersionApiResponse });

            await provider.fetchLatestVersion();

            expect(mockedConfigGet).toHaveBeenCalledWith('WP_VERSION_API');
            expect(mockedAxios).toHaveBeenCalledWith({
                method: 'GET',
                url: apiUrl,
                headers: { 'Content-Type': 'application/json' },
            });
            expect(provider['latestVersion']).toBe('8.0.0');
        });

        it('should set latestVersion to null when API call fails', async () => {
            const apiUrl = 'https://example.com/wp-version';
            mockedConfigGet.mockReturnValue(apiUrl);

            mockedAxios.mockRejectedValue(new Error('Network Error'));

            await provider.fetchLatestVersion();

            expect(mockedConfigGet).toHaveBeenCalledWith('WP_VERSION_API');
            expect(mockedAxios).toHaveBeenCalledWith({
                method: 'GET',
                url: apiUrl,
                headers: { 'Content-Type': 'application/json' },
            });
            expect(provider['latestVersion']).toBeNull();
        });
    });
});
