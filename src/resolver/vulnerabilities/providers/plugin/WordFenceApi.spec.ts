import axios from 'axios';
import WordFenceApiPluginVulnerabilitiesProvider from 'src/resolver/vulnerabilities/providers/plugin/WordFenceApi';

jest.mock('axios');
const mockedAxios = axios as jest.MockedFunction<typeof axios>;

describe('WordFenceApiPluginVulnerabilitiesProvider', () => {
    let provider: WordFenceApiPluginVulnerabilitiesProvider;
    const apiUrl = 'https://example.com/vulnerabilities';

    beforeEach(() => {
        provider = new WordFenceApiPluginVulnerabilitiesProvider();
        (provider as unknown as { apiUrl: string }).apiUrl = apiUrl;

        jest.clearAllMocks();
    });

    describe('WordFenceApiPluginVulnerabilitiesProvider.get', () => {
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

    describe('WordFenceApiPluginVulnerabilitiesProvider.fetch', () => {
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
            mockedAxios.mockRejectedValue(new Error('Network Error'));

            await provider.fetch();

            expect(mockedAxios).toHaveBeenCalledWith({
                method: 'GET',
                url: apiUrl,
                headers: { 'Content-Type': 'application/json' },
            });
            expect(provider['vulnerabilities']).toStrictEqual({});
        });
    });
});
