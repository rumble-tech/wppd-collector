import { TPluginVersion } from 'src/models/Plugin';
import LatestVersionResolver from './LatestVersionResolver';
import { LatestVersionProviderInterface } from './LatestVersionProviderInterface';

describe('LatestVersionResolver', () => {
    let resolver = new LatestVersionResolver();

    beforeEach(() => {
        resolver = new LatestVersionResolver();
    });

    const createMockProvider = (response: TPluginVersion): jest.Mocked<LatestVersionProviderInterface> => {
        return {
            getLatestVersion: jest.fn().mockResolvedValue(response),
        };
    };

    describe('LatestVersionResolver.addProvider', () => {
        it('should add a provider to the resolver', async () => {
            const mockProvider = createMockProvider({
                version: '1.0.0',
                requiredPhpVersion: '7.4',
                requiredWpVersion: '5.8',
            });

            await resolver.addProvider(mockProvider);

            expect(resolver['providers']).toContain(mockProvider);
        });
    });

    describe('LatestVersionResolver.resolve', () => {
        it('should return default null object when no providers are set', async () => {
            const result = await resolver.resolve('test-plugin');

            expect(result).toEqual({
                version: null,
                requiredPhpVersion: null,
                requiredWpVersion: null,
            });
        });

        it('should return default null object when no provider returns a version', async () => {
            const mockProvider1 = createMockProvider({
                version: null,
                requiredPhpVersion: null,
                requiredWpVersion: null,
            });

            const mockProvider2 = createMockProvider({
                version: null,
                requiredPhpVersion: null,
                requiredWpVersion: null,
            });

            await resolver.addProvider(mockProvider1);
            await resolver.addProvider(mockProvider2);

            const result = await resolver.resolve('test-plugin');
            expect(result).toEqual({
                version: null,
                requiredPhpVersion: null,
                requiredWpVersion: null,
            });
        });

        it('should return the first valid version from providers', async () => {
            const mockProvider1 = createMockProvider({
                version: null,
                requiredPhpVersion: null,
                requiredWpVersion: null,
            });

            const mockProvider2 = createMockProvider({
                version: '1.0.0',
                requiredPhpVersion: '7.4',
                requiredWpVersion: '5.8',
            });

            const mockProvider3 = createMockProvider({
                version: '2.0.0',
                requiredPhpVersion: '8.0',
                requiredWpVersion: '6.0',
            });

            await resolver.addProvider(mockProvider1);
            await resolver.addProvider(mockProvider2);
            await resolver.addProvider(mockProvider3);

            const result = await resolver.resolve('test-plugin');

            expect(result).toEqual({
                version: '1.0.0',
                requiredPhpVersion: '7.4',
                requiredWpVersion: '5.8',
            });
        });
    });
});
