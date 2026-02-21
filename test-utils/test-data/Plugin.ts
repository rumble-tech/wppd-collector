import Plugin from 'src/entities/Plugin';

export const testDataPluginJSON = {
    id: 1,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    slug: 'plugin-1',
    name: 'Plugin1',
    latestVersion: '1.0.0',
    requiredPhpVersion: '8.5.1',
    requiredWpVersion: '6.9.0',
};

export const testDataPluginEntity = new Plugin(testDataPluginJSON);
