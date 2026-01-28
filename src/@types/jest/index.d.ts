declare global {
    namespace jest {
        interface Matchers<R> {
            toEqualSiteEntity(expected: unknown): R;
            toEqualPluginEntity(expected: unknown): R;
            toEqualSitePluginEntity(expected: unknown): R;
            toEqualPluginVulnerabilityEntity(expected: unknown): R;
        }
    }
}

export {};
