import { TPluginVulnerability } from 'src/models/Plugin';
import { VulnerabilitiesProviderInterface } from './VulnerabilitiesProviderInterface';
import VulnerabilitiesResolver from './VulnerabilitiesResolver';

describe('VulnerabilitiesResolver', () => {
    let resolver: VulnerabilitiesResolver;

    beforeEach(() => {
        resolver = new VulnerabilitiesResolver();
    });

    const createMockProvider = (
        response: Omit<TPluginVulnerability, 'id' | 'pluginId'>[] | null
    ): jest.Mocked<VulnerabilitiesProviderInterface> => {
        return {
            getVulnerabilities: jest.fn().mockResolvedValue(response),
            fetchVulnerabilities: jest.fn().mockResolvedValue(response),
        };
    };

    describe('VulnerabilitiesResolver.addProvider', () => {
        it('should add a provider to the resolver', async () => {
            const mockProvider = createMockProvider([
                { from: { version: '1.0.0', inclusive: true }, to: { version: '2.0.0', inclusive: true }, score: 5 },
            ]);

            await resolver.addProvider(mockProvider);

            expect(resolver['providers']).toContain(mockProvider);
        });
    });

    describe('VulnerabilitiesResolver.resolve', () => {
        it('should return null when no providers are set', async () => {
            const vulnerabilities = await resolver.resolve('test-plugin');
            expect(vulnerabilities).toBeNull();
        });

        it('should return null when no vulnerabilities are found', async () => {
            const mockProvider = createMockProvider(null);
            await resolver.addProvider(mockProvider);

            const vulnerabilities = await resolver.resolve('test-plugin');
            expect(vulnerabilities).toBeNull();
        });

        it('should return vulnerabilities from the first provider that returns them', async () => {
            const mockProvider1 = createMockProvider(null);
            const mockProvider2 = createMockProvider([
                { from: { version: '1.0.0', inclusive: true }, to: { version: '2.0.0', inclusive: true }, score: 5 },
            ]);

            await resolver.addProvider(mockProvider1);
            await resolver.addProvider(mockProvider2);

            const vulnerabilities = await resolver.resolve('test-plugin');
            expect(vulnerabilities).toEqual([
                { from: { version: '1.0.0', inclusive: true }, to: { version: '2.0.0', inclusive: true }, score: 5 },
            ]);
        });
    });
});
