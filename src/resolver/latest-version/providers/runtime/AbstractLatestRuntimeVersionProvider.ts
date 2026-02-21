export default class AbstractLatestRuntimeVersionProvider {
    protected version: string | null = null;

    public getVersion(): string | null {
        return this.version;
    }

    protected async fetch(): Promise<void> {}
}
