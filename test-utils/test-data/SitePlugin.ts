import SitePlugin from 'src/entities/SitePlugin';

export const testDataSitePluginJSON = {
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    siteId: 1,
    pluginId: 1,
    installedVersion: '1.0.0',
    requiredPhpVersion: '8.5.1',
    requiredWpVersion: '6.9.0',
    isActive: true,
};

export const testDataSitePluginEntity = new SitePlugin(testDataSitePluginJSON);
