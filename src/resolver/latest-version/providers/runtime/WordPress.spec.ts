import axios from 'axios';
import LatestWordPressRuntimeVersionProvider from 'src/resolver/latest-version/providers/runtime/WordPress';

jest.mock('axios');
const mockedAxios = axios as jest.MockedFunction<typeof axios>;

describe('LatestWordPressRuntimeVersionProvider', () => {
    let provider: LatestWordPressRuntimeVersionProvider;
    const apiUrl = 'https://example.com/wp-version';

    beforeEach(() => {
        provider = new LatestWordPressRuntimeVersionProvider();
        (provider as unknown as { apiUrl: string }).apiUrl = apiUrl;

        jest.clearAllMocks();
    });

    describe('LatestWordPressRuntimeVersionProvider.getVersion', () => {
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

    describe('LatestWordPressRuntimeVersionProvider.fetch', () => {
        it('should set the latest WordPress version on successful API call', async () => {
            const wordPressVersionApiResponse = {
                offers: [{ version: '8.0' }],
            };

            mockedAxios.mockResolvedValue({ data: wordPressVersionApiResponse });

            await provider.fetch();

            expect(mockedAxios).toHaveBeenCalledWith({
                method: 'GET',
                url: apiUrl,
                headers: { 'Content-Type': 'application/json' },
            });
            expect(provider['version']).toBe('8.0.0');
        });

        it('should set the latest WordPress to null on failed API call', async () => {
            mockedAxios.mockRejectedValue(new Error('Network Error'));

            await provider.fetch();

            expect(mockedAxios).toHaveBeenCalledWith({
                method: 'GET',
                url: apiUrl,
                headers: { 'Content-Type': 'application/json' },
            });
            expect(provider['version']).toBeNull();
        });
    });
});
