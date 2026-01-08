import LatestVersionResolver from 'src/resolver/latest-version/LatestVersionResolver';
import LatestPhpRuntimeVersionProvider from 'src/resolver/latest-version/providers/runtime/PHP';
import LatestWordPressRuntimeVersionProvider from 'src/resolver/latest-version/providers/runtime/WordPress';

describe('LatestVersionResolver', () => {
    let phpProvider: LatestPhpRuntimeVersionProvider;
    let wordPressProvider: LatestWordPressRuntimeVersionProvider;
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

        resolver = new LatestVersionResolver(phpProvider, wordPressProvider);
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
});
