import axios from 'axios';
import Config from 'src/config/Config';
import PHPLatestVersionProvider from './PHP';

jest.mock('axios');
jest.mock('src/config/Config');

const mockedAxios = axios as jest.MockedFunction<typeof axios>;
const mockedConfigGet = Config.get as jest.MockedFunction<typeof Config.get>;

describe('PHP', () => {
    let provider: PHPLatestVersionProvider;

    beforeEach(() => {
        provider = new PHPLatestVersionProvider();
        jest.clearAllMocks();
    });

    describe('PHP.getLatestVersion', () => {
        it('should return the latest PHP version', () => {
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

    describe('PHP.fetchLatestVersion', () => {
        it('should set the latest PHP version when API call is successful', async () => {
            const apiUrl = 'https://example.com/php-version';
            mockedConfigGet.mockReturnValue(apiUrl);

            const phpVersionApiResponse = {
                data: {
                    '8.0': { name: '8.0' },
                },
            };

            mockedAxios.mockResolvedValue({ data: phpVersionApiResponse });

            await provider.fetchLatestVersion();

            expect(mockedConfigGet).toHaveBeenCalledWith('PHP_VERSION_API');
            expect(mockedAxios).toHaveBeenCalledWith({
                method: 'GET',
                url: apiUrl,
                headers: { 'Content-Type': 'application/json' },
            });
            expect(provider['latestVersion']).toBe('8.0.0');
        });

        it('should set latestVersion to null when API call fails', async () => {
            const apiUrl = 'https://example.com/php-version';
            mockedConfigGet.mockReturnValue(apiUrl);

            mockedAxios.mockRejectedValue(new Error('Network Error'));

            await provider.fetchLatestVersion();

            expect(mockedConfigGet).toHaveBeenCalledWith('PHP_VERSION_API');
            expect(mockedAxios).toHaveBeenCalledWith({
                method: 'GET',
                url: apiUrl,
                headers: { 'Content-Type': 'application/json' },
            });
            expect(provider['latestVersion']).toBeNull();
        });
    });
});
