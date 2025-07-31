import { TPluginVersion } from 'src/models/Plugin';
import LatestVersionResolver from './LatestVersionResolver';
import {
    LatestPhpOrWpVersionProviderInterface,
    LatestPluginVersionProviderInterface,
} from './LatestVersionProviderInterface';

describe('LatestVersionResolver', () => {
    let resolver = new LatestVersionResolver();

    beforeEach(() => {
        resolver = new LatestVersionResolver();
    });

    const createMockPluginProvider = (response: TPluginVersion): jest.Mocked<LatestPluginVersionProviderInterface> => {
        return {
            getLatestVersion: jest.fn().mockResolvedValue(response),
        };
    };

    const createMockPhpOrWpProvider = (): jest.Mocked<LatestPhpOrWpVersionProviderInterface> => {
        return {
            getLatestVersion: jest.fn().mockReturnValue('1.0.0'),
            fetchLatestVersion: jest.fn().mockResolvedValue('1.0.0'),
        };
    };

    describe('LatestVersionResolver.addPluginProvider', () => {
        it('should add a plugin provider to the resolver', async () => {
            const mockProvider = createMockPluginProvider({
                version: '1.0.0',
                requiredPhpVersion: '7.4',
                requiredWpVersion: '5.8',
            });

            await resolver.addPluginProvider(mockProvider);

            expect(resolver['providers']).toContain(mockProvider);
        });
    });

    describe('LatestVersionResolver.setPhpProvider', () => {
        it('should set the PHP provider', () => {
            const mockProvider = createMockPhpOrWpProvider();
            resolver.setPhpProvider(mockProvider);

            expect(resolver['phpVersionProvider']).toBe(mockProvider);
        });
    });

    describe('LatestVersionResolver.setWpProvider', () => {
        it('should set the WordPress provider', () => {
            const mockProvider = createMockPhpOrWpProvider();
            resolver.setWpProvider(mockProvider);

            expect(resolver['wpVersionProvider']).toBe(mockProvider);
        });
    });

    describe('LatestVersionResolver.resolvePlugin', () => {
        it('should return default null object when no providers are set', async () => {
            const result = await resolver.resolvePlugin('test-plugin');

            expect(result).toEqual({
                version: null,
                requiredPhpVersion: null,
                requiredWpVersion: null,
            });
        });

        it('should return default null object when no provider returns a version', async () => {
            const mockProvider1 = createMockPluginProvider({
                version: null,
                requiredPhpVersion: null,
                requiredWpVersion: null,
            });

            const mockProvider2 = createMockPluginProvider({
                version: null,
                requiredPhpVersion: null,
                requiredWpVersion: null,
            });

            await resolver.addPluginProvider(mockProvider1);
            await resolver.addPluginProvider(mockProvider2);

            const result = await resolver.resolvePlugin('test-plugin');
            expect(result).toEqual({
                version: null,
                requiredPhpVersion: null,
                requiredWpVersion: null,
            });
        });

        it('should return the first valid version from providers', async () => {
            const mockProvider1 = createMockPluginProvider({
                version: null,
                requiredPhpVersion: null,
                requiredWpVersion: null,
            });

            const mockProvider2 = createMockPluginProvider({
                version: '1.0.0',
                requiredPhpVersion: '7.4',
                requiredWpVersion: '5.8',
            });

            const mockProvider3 = createMockPluginProvider({
                version: '2.0.0',
                requiredPhpVersion: '8.0',
                requiredWpVersion: '6.0',
            });

            await resolver.addPluginProvider(mockProvider1);
            await resolver.addPluginProvider(mockProvider2);
            await resolver.addPluginProvider(mockProvider3);

            const result = await resolver.resolvePlugin('test-plugin');

            expect(result).toEqual({
                version: '1.0.0',
                requiredPhpVersion: '7.4',
                requiredWpVersion: '5.8',
            });
        });
    });

    describe('LatestVersionResolver.resolvePhp', () => {
        it('should return null if no PHP provider is set', async () => {
            const version = await resolver.resolvePhp();
            expect(version).toBeNull();
        });

        it('should return the latest PHP version from the provider', async () => {
            const mockProvider = createMockPhpOrWpProvider();
            resolver.setPhpProvider(mockProvider);

            const version = await resolver.resolvePhp();
            expect(version).toBe('1.0.0');
            expect(mockProvider.getLatestVersion).toHaveBeenCalled();
        });
    });

    describe('LatestVersionResolver.resolveWp', () => {
        it('should return null if no WP provider is set', async () => {
            const version = await resolver.resolveWp();
            expect(version).toBeNull();
        });

        it('should return the latest WP version from the provider', async () => {
            const mockProvider = createMockPhpOrWpProvider();
            resolver.setWpProvider(mockProvider);

            const version = await resolver.resolveWp();
            expect(version).toBe('1.0.0');
            expect(mockProvider.getLatestVersion).toHaveBeenCalled();
        });
    });
});
