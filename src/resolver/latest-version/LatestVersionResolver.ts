import AbstractLatestRuntimeVersionProvider from 'src/resolver/latest-version/providers/runtime/AbstractLatestRuntimeVersionProvider';

export default class LatestVersionResolver {
    private readonly phpProvider: AbstractLatestRuntimeVersionProvider;
    private readonly wordPressProvider: AbstractLatestRuntimeVersionProvider;

    constructor(
        phpProvider: AbstractLatestRuntimeVersionProvider,
        wordPressProvider: AbstractLatestRuntimeVersionProvider
    ) {
        this.phpProvider = phpProvider;
        this.wordPressProvider = wordPressProvider;
    }

    public resolvePhp(): string | null {
        return this.phpProvider.getVersion();
    }

    public resolveWordPress(): string | null {
        return this.wordPressProvider.getVersion();
    }
}
