import Plugin from 'src/entities/Plugin';
import PluginVulnerability from 'src/entities/PluginVulnerability';
import Site from 'src/entities/Site';
import SitePlugin from 'src/entities/SitePlugin';

expect.extend({
    toEqualSiteEntity(received: Site, expected: Site) {
        const pass =
            received.getId() === expected.getId() &&
            received.getCreatedAt().getTime() === expected.getCreatedAt().getTime() &&
            received.getUpdatedAt().getTime() === expected.getUpdatedAt().getTime() &&
            received.getName() === expected.getName() &&
            received.getUrl() === expected.getUrl() &&
            received.getApiKey() === expected.getApiKey() &&
            received.getEnvironment() === expected.getEnvironment() &&
            received.getPhpVersion() === expected.getPhpVersion() &&
            received.getWpVersion() === expected.getWpVersion();

        return {
            pass,
            message: () =>
                `expected site ${pass ? 'not ' : ''}to equal\n` +
                `  expected: ${JSON.stringify(expected)}\n` +
                `  received: ${JSON.stringify(received)}`,
        };
    },
    toEqualPluginEntity(received: Plugin, expected: Plugin) {
        const pass =
            received.getId() === expected.getId() &&
            received.getCreatedAt().getTime() === expected.getCreatedAt().getTime() &&
            received.getUpdatedAt().getTime() === expected.getUpdatedAt().getTime() &&
            received.getSlug() === expected.getSlug() &&
            received.getName() === expected.getName() &&
            received.getLatestVersion() === expected.getLatestVersion() &&
            received.getRequiredPhpVersion() === expected.getRequiredPhpVersion() &&
            received.getRequiredWpVersion() === expected.getRequiredWpVersion();

        return {
            pass,
            message: () =>
                `expected plugin ${pass ? 'not ' : ''}to equal\n` +
                `  expected: ${JSON.stringify(expected)}\n` +
                `  received: ${JSON.stringify(received)}`,
        };
    },
    toEqualSitePluginEntity(received: SitePlugin, expected: SitePlugin) {
        const pass =
            received.getCreatedAt().getTime() === expected.getCreatedAt().getTime() &&
            received.getUpdatedAt().getTime() === expected.getUpdatedAt().getTime() &&
            received.getSiteId() === expected.getSiteId() &&
            received.getPluginId() === expected.getPluginId() &&
            received.getInstalledVersion() === expected.getInstalledVersion() &&
            received.getRequiredPhpVersion() === expected.getRequiredPhpVersion() &&
            received.getRequiredWpVersion() === expected.getRequiredWpVersion() &&
            received.getIsActive() === expected.getIsActive();

        return {
            pass,
            message: () =>
                `expected site plugin ${pass ? 'not ' : ''}to equal\n` +
                `  expected: ${JSON.stringify(expected)}\n` +
                `  received: ${JSON.stringify(received)}`,
        };
    },
    toEqualPluginVulnerabilityEntity(received: PluginVulnerability, expected: PluginVulnerability) {
        const pass =
            received.getId() === expected.getId() &&
            received.getCreatedAt().getTime() === expected.getCreatedAt().getTime() &&
            received.getPluginId() === expected.getPluginId() &&
            received.getDescription() === expected.getDescription() &&
            received.getPublishedAt().getTime() === expected.getPublishedAt().getTime() &&
            received.getSeverity() === expected.getSeverity() &&
            received.getReferences() === expected.getReferences() &&
            JSON.stringify(received.getFromVersion()) === JSON.stringify(expected.getFromVersion()) &&
            JSON.stringify(received.getToVersion()) === JSON.stringify(expected.getToVersion());

        return {
            pass,
            message: () =>
                `expected plugin vulnerability ${pass ? 'not ' : ''}to equal\n` +
                `  expected: ${JSON.stringify(expected)}\n` +
                `  received: ${JSON.stringify(received)}`,
        };
    },
});
