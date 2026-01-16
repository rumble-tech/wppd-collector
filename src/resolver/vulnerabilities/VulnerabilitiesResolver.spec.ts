import AbstractPluginVulnerabilitiesProvider from 'src/resolver/vulnerabilities/providers/plugin/AbstractPluginVulnerabilitiesProvider';
import VulnerabilitiesResolver from 'src/resolver/vulnerabilities/VulnerabilitiesResolver';

describe('VulnerabilitiesResolver', () => {
    let pluginProviders: AbstractPluginVulnerabilitiesProvider[];
    let resolver: VulnerabilitiesResolver;

    beforeEach(() => {
        pluginProviders = [
            {
                get: jest.fn(),
            },
            {
                get: jest.fn(),
            },
        ] as unknown as AbstractPluginVulnerabilitiesProvider[];

        resolver = new VulnerabilitiesResolver(pluginProviders);
        jest.clearAllMocks();
    });

    describe('VulnerabilitiesResolver.resolvePlugin', () => {
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

        it('should return vulnerabilities from the first provider', async () => {
            (pluginProviders[0].get as jest.Mock).mockResolvedValue([vulnerabilitySample]);

            const vulnerabilities = await resolver.resolvePlugin('sample-plugin');

            expect(vulnerabilities).toEqual([vulnerabilitySample]);
            expect(pluginProviders[0].get).toHaveBeenCalledWith('sample-plugin');
            expect(pluginProviders[1].get).not.toHaveBeenCalled();
        });

        it('should return vulnerabilities from the second provider', async () => {
            (pluginProviders[0].get as jest.Mock).mockResolvedValue(null);

            (pluginProviders[1].get as jest.Mock).mockResolvedValue([]);

            const vulnerabilities = await resolver.resolvePlugin('sample-plugin');

            expect(vulnerabilities).toEqual([vulnerabilitySample]);
            expect(pluginProviders[0].get).toHaveBeenCalledWith('sample-plugin');
            expect(pluginProviders[1].get).toHaveBeenCalledWith('sample-plugin');
        });

        it('should return nul when no plugin provider got any vulnerabilities', async () => {
            (pluginProviders[0].get as jest.Mock).mockResolvedValue(null);
            (pluginProviders[1].get as jest.Mock).mockResolvedValue(null);

            const vulnerabilities = await resolver.resolvePlugin('sample-plugin');

            expect(vulnerabilities).toEqual(null);
            expect(pluginProviders[0].get).toHaveBeenCalledWith('sample-plugin');
            expect(pluginProviders[1].get).toHaveBeenCalledWith('sample-plugin');
        });
    });
});
