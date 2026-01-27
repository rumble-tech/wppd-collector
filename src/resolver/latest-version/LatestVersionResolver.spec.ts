import LatestVersionResolver from 'src/resolver/latest-version/LatestVersionResolver';
import AbstractLatestPluginVersionProvider from 'src/resolver/latest-version/providers/plugin/AbstractLatestPluginVersionProvider';
import LatestPhpRuntimeVersionProvider from 'src/resolver/latest-version/providers/runtime/PHP';
import LatestWordPressRuntimeVersionProvider from 'src/resolver/latest-version/providers/runtime/WordPress';

describe('LatestVersionResolver', () => {
    let phpProvider: LatestPhpRuntimeVersionProvider;
    let wordPressProvider: LatestWordPressRuntimeVersionProvider;
    let pluginProviders: AbstractLatestPluginVersionProvider[];
    let resolver: LatestVersionResolver;

    beforeEach(() => {
        phpProvider = {
            getVersion: jest.fn(),
            fetch: jest.fn(),
        } as unknown as LatestPhpRuntimeVersionProvider;

        wordPressProvider = {
            getVersion: jest.fn(),
            fetch: jest.fn(),
        } as unknown as LatestWordPressRuntimeVersionProvider;

        pluginProviders = [
            {
                get: jest.fn(),
            },
            {
                get: jest.fn(),
            },
        ] as unknown as AbstractLatestPluginVersionProvider[];

        resolver = new LatestVersionResolver(phpProvider, wordPressProvider, pluginProviders);
        jest.clearAllMocks();
    });

    describe('LatestVersionResolver.resolvePhp', () => {
        it('should return version when the PHP version is set', () => {
            (phpProvider.getVersion as jest.Mock).mockReturnValue('8.5.1');

            const version = resolver.resolvePhp();

            expect(version).toBe('8.5.1');
        });

        it('should return null when the PHP version is unset', () => {
            (phpProvider.getVersion as jest.Mock).mockReturnValue(null);

            const version = resolver.resolvePhp();

            expect(version).toBeNull();
        });
    });

    describe('LatestVersionResolver.resolveWordPress', () => {
        it('should return the version when the WordPress version is set', () => {
            (wordPressProvider.getVersion as jest.Mock).mockReturnValue('6.3.1');

            const version = resolver.resolveWordPress();

            expect(version).toBe('6.3.1');
        });

        it('should return null when the WordPress version is unset', () => {
            (wordPressProvider.getVersion as jest.Mock).mockReturnValue(null);

            const version = resolver.resolveWordPress();

            expect(version).toBeNull();
        });
    });

    describe('LatestVersionResolver.resolvePlugin', () => {
        it('should return version from the first provider', async () => {
            (pluginProviders[0].get as jest.Mock).mockResolvedValue({
                version: '1.0.0',
                requiredPhpVersion: '8.5.1',
                requiredWpVersion: '6.9.0',
            });

            const version = await resolver.resolvePlugin('sample-plugin');

            expect(version).toEqual({ version: '1.0.0', requiredPhpVersion: '8.5.1', requiredWpVersion: '6.9.0' });
            expect(pluginProviders[0].get).toHaveBeenCalledWith('sample-plugin');
            expect(pluginProviders[1].get).not.toHaveBeenCalled();
        });

        it('should return version from the second provider', async () => {
            (pluginProviders[0].get as jest.Mock).mockResolvedValue({
                version: null,
                requiredPhpVersion: null,
                requiredWpVersion: null,
            });

            (pluginProviders[1].get as jest.Mock).mockResolvedValue({
                version: '1.0.0',
                requiredPhpVersion: '8.5.1',
                requiredWpVersion: '6.9.0',
            });

            const version = await resolver.resolvePlugin('sample-plugin');

            expect(version).toEqual({ version: '1.0.0', requiredPhpVersion: '8.5.1', requiredWpVersion: '6.9.0' });
            expect(pluginProviders[0].get).toHaveBeenCalledWith('sample-plugin');
            expect(pluginProviders[1].get).toHaveBeenCalledWith('sample-plugin');
        });

        it('should return null values when no plugin provider got a version', async () => {
            (pluginProviders[0].get as jest.Mock).mockResolvedValue({
                version: null,
                requiredPhpVersion: null,
                requiredWpVersion: null,
            });

            (pluginProviders[1].get as jest.Mock).mockResolvedValue({
                version: null,
                requiredPhpVersion: null,
                requiredWpVersion: null,
            });

            const version = await resolver.resolvePlugin('sample-plugin');

            expect(version).toEqual({ version: null, requiredPhpVersion: null, requiredWpVersion: null });
            expect(pluginProviders[0].get).toHaveBeenCalledWith('sample-plugin');
            expect(pluginProviders[1].get).toHaveBeenCalledWith('sample-plugin');
        });
    });
});
