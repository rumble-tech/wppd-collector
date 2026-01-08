import axios from 'axios';
import LatestPhpRuntimeVersionProvider from 'src/resolver/latest-version/providers/runtime/PHP';
import Config from 'src/services/config/Config';

jest.mock('axios');
jest.mock('/src/services/config/Config');

const mockedAxios = axios as jest.MockedFunction<typeof axios>;
const mockedConfigGet = Config.get as jest.MockedFunction<typeof Config.get>;

describe('LatestPhpRuntimeVersionProvider', () => {
    let provider: LatestPhpRuntimeVersionProvider;

    beforeEach(() => {
        provider = new LatestPhpRuntimeVersionProvider();
        jest.clearAllMocks();
    });

    describe('LatestPhpRuntimeVersionProvider.getVersion', () => {
        it('should return the latest version', () => {
            provider['version'] = '8.5.1';

            const version = provider.getVersion();

            expect(version).toBe('8.5.1');
        });

        it('should return null if version is not set', () => {
            provider['version'] = null;

            const version = provider.getVersion();

            expect(version).toBeNull();
        });
    });

    describe('LatestPhpRuntimeVersionProvider.fetch', () => {
        it('should set the latest PHP version on successful API call', async () => {
            const apiUrl = 'https://example.com/php-version';
            mockedConfigGet.mockReturnValue(apiUrl);

            const phpVersionApiResponse = {
                '7': {
                    version: '7.4.0',
                },
                '8': {
                    version: '8.0.0',
                },
            };

            mockedAxios.mockResolvedValue({ data: phpVersionApiResponse });

            await provider.fetch();

            expect(mockedConfigGet).toHaveBeenCalledWith('PHP_VERSION_API');
            expect(mockedAxios).toHaveBeenCalledWith({
                method: 'GET',
                url: apiUrl,
                headers: { 'Content-Type': 'application/json' },
            });
            expect(provider['version']).toBe('8.0.0');
        });

        it('should set the latest PHP to null on failed API call', async () => {
            const apiUrl = 'https://example.com/php-version';
            mockedConfigGet.mockReturnValue(apiUrl);

            mockedAxios.mockRejectedValue(new Error('Network Error'));

            await provider.fetch();

            expect(mockedConfigGet).toHaveBeenCalledWith('PHP_VERSION_API');
            expect(mockedAxios).toHaveBeenCalledWith({
                method: 'GET',
                url: apiUrl,
                headers: { 'Content-Type': 'application/json' },
            });
            expect(provider['version']).toBeNull();
        });
    });
});
