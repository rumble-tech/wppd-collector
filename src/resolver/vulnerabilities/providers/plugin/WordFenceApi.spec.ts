import axios from 'axios';
import WordFenceApiVulnerabilitiesProvider from 'src/resolver/vulnerabilities/providers/plugin/WordFenceApi';
import Config from 'src/services/config/Config';

jest.mock('axios');
jest.mock('/src/services/config/Config');

const mockedAxios = axios as jest.MockedFunction<typeof axios>;
const mockedConfigGet = Config.get as jest.MockedFunction<typeof Config.get>;

describe('WordFenceApiVulnerabilitiesProvider', () => {
    let provider: WordFenceApiVulnerabilitiesProvider;

    beforeEach(() => {
        provider = new WordFenceApiVulnerabilitiesProvider();
        jest.clearAllMocks();
    });

    describe('WordFenceApiVulnerabilitiesProvider.get', () => {
        const vulnerabilitySample = {
            description: 'sample-description',
            publishedAt: new Date('2026-01-01T00:00:00Z'),
            severity: 5,
            references: 'https://example.com/vulnerabilities/sample-plugin/1',
            fromVersion: {
                version: '1.0.0',
                inclusive: true,
            },
            toVersion: {
                version: '2.0.0',
                inclusive: false,
            },
        } as const;

        it('should return vulnerabilities', () => {
            provider['vulnerabilities'] = {
                'sample-plugin': [vulnerabilitySample],
            };

            const vulnerabilities = provider.get('sample-plugin');

            expect(vulnerabilities).toStrictEqual([vulnerabilitySample]);
        });

        it('should return null if no vulnerabilities are set', () => {
            provider['vulnerabilities'] = {
                'sample-plugin': null,
            };

            const vulnerabilities = provider.get('sample-plugin');

            expect(vulnerabilities).toBeNull();
        });
    });

    describe('WordFenceApiVulnerabilitiesProvider.fetch', () => {
        const vulnerabilitiesSample = [
            {
                description: 'sample-description',
                publishedAt: new Date('2026-01-01T00:00:00Z'),
                severity: 5,
                references:
                    'https://example1.com/vulnerabilities/sample-plugin/1|https://example2.com/vulnerabilities/sample-plugin/1',
                fromVersion: {
                    version: '1.0.0',
                    inclusive: true,
                },
                toVersion: {
                    version: '2.0.0',
                    inclusive: false,
                },
            },
            {
                description: 'sample-description',
                publishedAt: new Date('2026-01-01T00:00:00Z'),
                severity: 5,
                references:
                    'https://example1.com/vulnerabilities/sample-plugin/1|https://example2.com/vulnerabilities/sample-plugin/1',
                fromVersion: {
                    version: '1.0.0',
                    inclusive: true,
                },
                toVersion: {
                    version: '2.0.0',
                    inclusive: false,
                },
            },
            {
                description: 'sample-description',
                publishedAt: new Date('2026-01-01T00:00:00Z'),
                severity: 5,
                references:
                    'https://example1.com/vulnerabilities/sample-plugin/1|https://example2.com/vulnerabilities/sample-plugin/1',
                fromVersion: {
                    version: '*',
                    inclusive: true,
                },
                toVersion: {
                    version: '2.0.0',
                    inclusive: false,
                },
            },
            {
                description: 'sample-description',
                publishedAt: new Date('2026-01-01T00:00:00Z'),
                severity: 5,
                references:
                    'https://example1.com/vulnerabilities/sample-plugin/1|https://example2.com/vulnerabilities/sample-plugin/1',
                fromVersion: {
                    version: '1.0.0',
                    inclusive: true,
                },
                toVersion: {
                    version: '*',
                    inclusive: false,
                },
            },
            {
                description: 'sample-description',
                publishedAt: new Date('2026-01-01T00:00:00Z'),
                severity: 5,
                references: null,
                fromVersion: {
                    version: '1.0.0',
                    inclusive: true,
                },
                toVersion: {
                    version: '2.0.0',
                    inclusive: true,
                },
            },
        ] as const;

        it('should set the vulnerabilities on successful API call', async () => {
            const apiUrl = 'https://example.com/vulnerabilities';
            mockedConfigGet.mockReturnValue(apiUrl);

            const wordFenceApiResponse = {
                'vulnerability-1': {
                    description: 'sample-description',
                    published: '2026-01-01T00:00:00Z',
                    references: [
                        'https://example1.com/vulnerabilities/sample-plugin/1',
                        'https://example2.com/vulnerabilities/sample-plugin/1',
                    ],
                    software: [
                        {
                            type: 'plugin',
                            slug: 'sample-plugin',
                            affected_versions: {
                                '1.0.0-2.0.0': {
                                    from_version: '1.0.0',
                                    from_inclusive: true,
                                    to_version: '2.0.0',
                                    to_inclusive: false,
                                },
                            },
                        },
                        {
                            type: 'plugin',
                            slug: 'sample-plugin',
                            affected_versions: {
                                '1.0-2.0': {
                                    from_version: '1.0',
                                    from_inclusive: true,
                                    to_version: '2.0',
                                    to_inclusive: false,
                                },
                            },
                        },
                        {
                            type: 'plugin',
                            slug: 'sample-plugin',
                            affected_versions: {
                                '*-2.0.0': {
                                    from_version: '*',
                                    from_inclusive: true,
                                    to_version: '2.0.0',
                                    to_inclusive: false,
                                },
                            },
                        },
                        {
                            type: 'plugin',
                            slug: 'sample-plugin',
                            affected_versions: {
                                '1.0.0-*': {
                                    from_version: '1.0.0',
                                    from_inclusive: true,
                                    to_version: '*',
                                    to_inclusive: false,
                                },
                            },
                        },
                        {
                            type: 'mobile-app',
                            slug: 'sample-mobile-app',
                            affected_versions: {
                                '1.0.0-2.0.0': {
                                    from_version: '1.0.0',
                                    from_inclusive: true,
                                    to_version: '2.0.0',
                                    to_inclusive: false,
                                },
                            },
                        },
                    ],
                    cvss: {
                        score: 5,
                    },
                },
                'vulnerability-2': {
                    description: 'sample-description',
                    published: '2026-01-01T00:00:00Z',
                    references: [],
                    software: [
                        {
                            type: 'plugin',
                            slug: 'sample-plugin',
                            affected_versions: {
                                '1.0.0-2.0.0': {
                                    from_version: '1.0.0',
                                    from_inclusive: true,
                                    to_version: '2.0.0',
                                    to_inclusive: true,
                                },
                            },
                        },
                    ],
                    cvss: {
                        score: 5,
                    },
                },
            };

            mockedAxios.mockResolvedValue({ data: wordFenceApiResponse });

            await provider.fetch();

            expect(mockedConfigGet).toHaveBeenCalledWith('WORDFENCE_VULNERABILITIES_API');
            expect(mockedAxios).toHaveBeenCalledWith({
                method: 'GET',
                url: apiUrl,
                headers: { 'Content-Type': 'application/json' },
            });
            expect(provider['vulnerabilities']).toStrictEqual({
                'sample-plugin': vulnerabilitiesSample,
            });
        });

        it('should set the vulnerabilities to an empty object on failed API call', async () => {
            const apiUrl = 'https://example.com/vulnerabilities';
            mockedConfigGet.mockReturnValue(apiUrl);

            mockedAxios.mockRejectedValue(new Error('Network Error'));

            await provider.fetch();

            expect(mockedConfigGet).toHaveBeenCalledWith('WORDFENCE_VULNERABILITIES_API');
            expect(mockedAxios).toHaveBeenCalledWith({
                method: 'GET',
                url: apiUrl,
                headers: { 'Content-Type': 'application/json' },
            });
            expect(provider['vulnerabilities']).toStrictEqual({});
        });
    });
});
