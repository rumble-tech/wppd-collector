import Site, { TSiteEnvironment } from 'src/entities/Site';

export const testDataSiteJSON = {
    id: 1,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    name: 'Site1',
    url: 'https://example.com/site1',
    apiKey: 'api-key-1',
    environment: 'development' as TSiteEnvironment,
    phpVersion: '8.5.1',
    wpVersion: '6.9.0',
};

export const testDataSiteEntity = new Site(testDataSiteJSON);
