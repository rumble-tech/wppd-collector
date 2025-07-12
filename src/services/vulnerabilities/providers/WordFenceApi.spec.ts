import axios from 'axios';
import Config from 'src/config/Config';
import WordFenceApiVulnerabilitiesProvider from './WordFenceApi';

jest.mock('axios');
jest.mock('src/config/Config');

const mockedAxios = axios as jest.MockedFunction<typeof axios>;
const mockedConfigGet = Config.get as jest.MockedFunction<typeof Config.get>;

describe('WordFenceApi', () => {
    let provider: WordFenceApiVulnerabilitiesProvider;

    beforeEach(() => {
        provider = new WordFenceApiVulnerabilitiesProvider();
        jest.clearAllMocks();
    });

    describe('WordFenceApi.getVulnerabilities', () => {
        it('should return vulnerabilities for a plugin slug', () => {
            provider['vulnerabilities'] = {
                'test-plugin': [
                    {
                        from: { version: '1.0.0', inclusive: true },
                        to: { version: '2.0.0', inclusive: true },
                        score: 5,
                    },
                ],
            };

            const vulnerabilities = provider.getVulnerabilities('test-plugin');
            expect(vulnerabilities).toEqual([
                { from: { version: '1.0.0', inclusive: true }, to: { version: '2.0.0', inclusive: true }, score: 5 },
            ]);
        });

        it('should return null if no vulnerabilities are found for a plugin slug', () => {
            provider['vulnerabilities'] = {};

            const vulnerabilities = provider.getVulnerabilities('non-existent-plugin');
            expect(vulnerabilities).toBeNull();
        });
    });

    describe('WordFenceApi.fetchVulnerabilities', () => {
        it('should set the vulnerabilities when API call is successful', async () => {
            const apiUrl = 'https://example.com/wordfence-api';
            mockedConfigGet.mockReturnValue(apiUrl);

            const apiResponse = {
                'test-plugin': {
                    software: [
                        {
                            type: 'plugin',
                            name: 'Test Plugin',
                            slug: 'test-plugin',
                            affected_versions: {
                                '1.0.0': {
                                    from_version: '1.0.0',
                                    from_inclusive: true,
                                    to_version: '2.0.0',
                                    to_inclusive: true,
                                },
                            },
                        },
                    ],
                    cvss: { score: 5 },
                },
            };

            mockedAxios.mockResolvedValue({ data: apiResponse });

            await provider.fetchVulnerabilities();

            expect(mockedConfigGet).toHaveBeenCalledWith('WORDFENCE_API_URL');
            expect(mockedAxios).toHaveBeenCalledWith({
                method: 'GET',
                url: apiUrl,
                headers: { 'Content-Type': 'application/json' },
            });
            expect(provider['vulnerabilities']).toEqual({
                'test-plugin': [
                    {
                        from: { version: '1.0.0', inclusive: true },
                        to: { version: '2.0.0', inclusive: true },
                        score: 5,
                    },
                ],
            });
        });

        it('should set the vulnerabilities to an empty object when API call fails', async () => {
            const apiUrl = 'https://example.com/wordfence-api';
            mockedConfigGet.mockReturnValue(apiUrl);

            mockedAxios.mockRejectedValue(new Error('Network Error'));

            await provider.fetchVulnerabilities();

            expect(mockedConfigGet).toHaveBeenCalledWith('WORDFENCE_API_URL');
            expect(mockedAxios).toHaveBeenCalledWith({
                method: 'GET',
                url: apiUrl,
                headers: { 'Content-Type': 'application/json' },
            });
            expect(provider['vulnerabilities']).toEqual({});
        });
    });
});
