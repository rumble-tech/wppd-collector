import Plugin from 'src/entities/Plugin';
import PluginVulnerability from 'src/entities/PluginVulnerability';
import Site from 'src/entities/Site';
import SitePlugin from 'src/entities/SitePlugin';
import PluginRepository from 'src/repositories/PluginRepository';
import PluginVulnerabilityRepository from 'src/repositories/PluginVulnerabilityRepository';
import SitePluginRepository from 'src/repositories/SitePluginRepository';
import SiteRepository from 'src/repositories/SiteRepository';
import LatestVersionResolver from 'src/resolver/latest-version/LatestVersionResolver';
import VulnerabilitiesResolver from 'src/resolver/vulnerabilities/VulnerabilitiesResolver';
import Logger from 'src/services/logger/Logger';
import request from 'supertest';
import { setupTestServer } from 'test-utils/SetupServer';

describe('SiteController', () => {
    let mockSiteRepository: jest.Mocked<SiteRepository>;
    let mockPluginRepository: jest.Mocked<PluginRepository>;
    let mockSitePluginRepository: jest.Mocked<SitePluginRepository>;
    let mockPluginVulnerabilityRepository: jest.Mocked<PluginVulnerabilityRepository>;
    let mockLatestVersionResolver: jest.Mocked<LatestVersionResolver>;
    let mockVulnerabilitiesResolver: jest.Mocked<VulnerabilitiesResolver>;
    let mockLogger: jest.Mocked<Logger>;

    beforeEach(() => {
        mockSiteRepository = {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByNameAndUrl: jest.fn(),
            insert: jest.fn(),
            update: jest.fn(),
        } as unknown as jest.Mocked<SiteRepository>;

        mockPluginRepository = {
            findById: jest.fn(),
            findBySlug: jest.fn(),
            insert: jest.fn(),
        } as unknown as jest.Mocked<PluginRepository>;

        mockSitePluginRepository = {
            findAllBySiteId: jest.fn(),
            findBySiteIdAndPluginId: jest.fn(),
            insert: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        } as unknown as jest.Mocked<SitePluginRepository>;

        mockPluginVulnerabilityRepository = {
            findAllByPluginId: jest.fn(),
            findAllByPluginIdAndInstalledVersion: jest.fn(),
            insert: jest.fn(),
            deleteAllByPluginId: jest.fn(),
        } as unknown as jest.Mocked<PluginVulnerabilityRepository>;

        mockLatestVersionResolver = {
            resolvePhp: jest.fn(),
            resolveWordPress: jest.fn(),
            resolvePlugin: jest.fn(),
        } as unknown as jest.Mocked<LatestVersionResolver>;

        mockVulnerabilitiesResolver = {
            resolvePlugin: jest.fn(),
        } as unknown as jest.Mocked<VulnerabilitiesResolver>;

        mockLogger = new Logger({ level: 'silly', directory: process.cwd() + '/logger' }) as jest.Mocked<Logger>;

        mockLogger.info = jest.fn();
        mockLogger.warn = jest.fn();
        mockLogger.error = jest.fn();
        mockLogger.debug = jest.fn();
        mockLogger.silly = jest.fn();

        jest.clearAllMocks();
    });

    describe('GET /site', () => {
        const siteDB = {
            id: 1,
            createdAt: new Date('2026-01-01T00:00:00Z'),
            updatedAt: new Date('2026-01-02T00:00:00Z'),
            name: 'Site1',
            url: 'https://example.com/site1',
            apiKey: 'api-key-1',
            environment: 'development',
            phpVersion: '8.5.1',
            wpVersion: '6.9.0',
        } as const;

        const requestConfig = {
            url: '/site',
        };

        it('should respond with (200) and { message: "Successfully retrieved all sites", data: [...] }', async () => {
            mockSiteRepository.findAll.mockResolvedValue([new Site(siteDB)]);

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app).get(requestConfig.url);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'Successfully retrieved all sites',
                data: [
                    {
                        id: siteDB.id,
                        name: siteDB.name,
                        url: siteDB.url,
                        environment: siteDB.environment,
                    },
                ],
            });
        });

        it('should respond with (500) and { message: "Database Error", data: null }', async () => {
            mockSiteRepository.findAll.mockRejectedValue(new Error('Database Error'));

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app).get(requestConfig.url);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                message: 'Database Error',
                data: null,
            });
        });
    });

    describe('GET /site/{siteId}', () => {
        const siteDB = {
            id: 1,
            createdAt: new Date('2026-01-01T00:00:00Z'),
            updatedAt: new Date('2026-01-02T00:00:00Z'),
            name: 'Site1',
            url: 'https://example.com/site1',
            apiKey: 'api-key-1',
            environment: 'development',
            phpVersion: '8.5.1',
            wpVersion: '6.9.0',
        } as const;

        const requestConfig = {
            url: `/site/${siteDB.id}`,
        };

        it('should respond with (200) and { message: "Successfully retrieved site", data: [...] }', async () => {
            const latestPhpVersion = '8.5.1';
            const latestWordPressVersion = '6.9.0';

            mockSiteRepository.findById.mockResolvedValue(new Site(siteDB));
            mockLatestVersionResolver.resolvePhp.mockReturnValue(latestPhpVersion);
            mockLatestVersionResolver.resolveWordPress.mockReturnValue(latestWordPressVersion);

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
                latestVersionResolver: mockLatestVersionResolver,
            });
            const response = await request(app).get(requestConfig.url);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'Successfully retrieved site',
                data: {
                    id: siteDB.id,
                    name: siteDB.name,
                    url: siteDB.url,
                    environment: siteDB.environment,
                    phpVersion: {
                        installed: siteDB.phpVersion,
                        latest: latestPhpVersion,
                        difference: 'same',
                    },
                    wpVersion: {
                        installed: siteDB.wpVersion,
                        latest: latestWordPressVersion,
                        difference: 'same',
                    },
                },
            });
        });

        it('should respond with (200) and { message: "Successfully retrieved site", data: [...] } - versions not categorizable', async () => {
            const latestPhpVersion = null;
            const latestWordPressVersion = null;

            mockSiteRepository.findById.mockResolvedValue(new Site(siteDB));
            mockLatestVersionResolver.resolvePhp.mockReturnValue(latestPhpVersion);
            mockLatestVersionResolver.resolveWordPress.mockReturnValue(latestWordPressVersion);

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
                latestVersionResolver: mockLatestVersionResolver,
            });
            const response = await request(app).get(requestConfig.url);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'Successfully retrieved site',
                data: {
                    id: siteDB.id,
                    name: siteDB.name,
                    url: siteDB.url,
                    environment: siteDB.environment,
                    phpVersion: {
                        installed: siteDB.phpVersion,
                        latest: latestPhpVersion,
                        difference: null,
                    },
                    wpVersion: {
                        installed: siteDB.wpVersion,
                        latest: latestWordPressVersion,
                        difference: null,
                    },
                },
            });
        });

        it('should respond with (400) and { message: "The parameter "siteId" is required and must be a valid number", data: null }', async () => {
            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app).get(`/site/abc`);

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'The parameter "siteId" is required and must be a valid number',
                data: null,
            });
        });

        it('should respond with (404) and { message: "Failed to find a site with the given Id", data: null }', async () => {
            mockSiteRepository.findById.mockResolvedValue(null);

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app).get(requestConfig.url);

            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                message: 'Failed to find a site with the given Id',
                data: null,
            });
        });

        it('should respond with (500) and { message: "Database Error", data: null }', async () => {
            mockSiteRepository.findById.mockRejectedValue(new Error('Database Error'));

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app).get(requestConfig.url);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                message: 'Database Error',
                data: null,
            });
        });
    });

    describe('GET /site/{siteId}/plugins', () => {
        const siteDB = {
            id: 1,
            createdAt: new Date('2026-01-01T00:00:00Z'),
            updatedAt: new Date('2026-01-02T00:00:00Z'),
            name: 'Site1',
            url: 'https://example.com/site1',
            apiKey: 'api-key-1',
            environment: 'development',
            phpVersion: '8.5.1',
            wpVersion: '6.9.0',
        } as const;

        const plugin1DB = {
            id: 1,
            createdAt: new Date('2026-01-01T00:00:00Z'),
            updatedAt: new Date('2026-01-01T00:00:00Z'),
            slug: 'plugin-1',
            name: 'Plugin1',
            latestVersion: '1.0.0',
            requiredPhpVersion: '8.5.1',
            requiredWpVersion: '6.9.0',
        };

        const sitePlugin1DB = {
            createdAt: new Date('2026-01-01T00:00:00Z'),
            updatedAt: new Date('2026-01-01T00:00:00Z'),
            siteId: 1,
            pluginId: 1,
            installedVersion: '1.0.0',
            requiredPhpVersion: '8.5.1',
            requiredWpVersion: '6.9.0',
            isActive: true,
        };

        const pluginVulnerability1DB = {
            id: 1,
            createdAt: new Date('2026-01-01T00:00:00Z'),
            pluginId: 1,
            description: 'Vulnerability in Plugin1',
            publishedAt: new Date('2025-12-01T00:00:00Z'),
            severity: 5,
            references: 'https://example.com/vuln1',
            fromVersion: {
                version: '1.0.0',
                inclusive: true,
            },
            toVersion: {
                version: '2.0.0',
                inclusive: true,
            },
        };

        const requestConfig = {
            url: `/site/${siteDB.id}/plugins`,
        };

        it('should respond with (200) and { message: "Successfully retrieved site plugins", data: [ ... ] }', async () => {
            mockSiteRepository.findById.mockResolvedValue(new Site(siteDB));
            mockSitePluginRepository.findAllBySiteId.mockResolvedValue([new SitePlugin(sitePlugin1DB)]);
            mockPluginRepository.findById.mockResolvedValue(new Plugin(plugin1DB));
            mockPluginVulnerabilityRepository.findAllByPluginIdAndInstalledVersion.mockResolvedValue([
                new PluginVulnerability(pluginVulnerability1DB),
            ]);

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
                pluginRepository: mockPluginRepository,
                sitePluginRepository: mockSitePluginRepository,
                pluginVulnerabilityRepository: mockPluginVulnerabilityRepository,
            });

            const response = await request(app).get(requestConfig.url);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'Successfully retrieved site plugins',
                data: [
                    {
                        id: plugin1DB.id,
                        slug: plugin1DB.slug,
                        name: plugin1DB.name,
                        installedVersion: {
                            version: sitePlugin1DB.installedVersion,
                            requiredPhpVersion: sitePlugin1DB.requiredPhpVersion,
                            requiredWpVersion: sitePlugin1DB.requiredWpVersion,
                        },
                        latestVersion: {
                            version: plugin1DB.latestVersion,
                            requiredPhpVersion: plugin1DB.requiredPhpVersion,
                            requiredWpVersion: plugin1DB.requiredWpVersion,
                        },
                        versionDifference: 'same',
                        isActive: sitePlugin1DB.isActive,
                        vulnerabilities: {
                            count: 1,
                            maxSeverity: pluginVulnerability1DB.severity,
                            details: [
                                {
                                    description: pluginVulnerability1DB.description,
                                    publishedAt: pluginVulnerability1DB.publishedAt.toISOString(),
                                    severity: pluginVulnerability1DB.severity,
                                    references: pluginVulnerability1DB.references,
                                    fromVersion: pluginVulnerability1DB.fromVersion,
                                    toVersion: pluginVulnerability1DB.toVersion,
                                },
                            ],
                        },
                    },
                ],
            });
        });

        //it('should respond with (200) and { message: "Successfully retrieved site plugins", data: [ ... ] } - versions not categorizable', async () => {});

        it('should respond with (400) and { message: "The parameter "siteId" is required and must be a valid number", data: null }', async () => {
            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app).get(`/site/abc/plugins`);

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'The parameter "siteId" is required and must be a valid number',
                data: null,
            });
        });

        it('should respond with (404) and { message: "Failed to find a site with the given Id", data: null }', async () => {
            mockSiteRepository.findById.mockResolvedValue(null);

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app).get(requestConfig.url);

            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                message: 'Failed to find a site with the given Id',
                data: null,
            });
        });

        it('should respond with (500) and { message: "Database Error", data: null }', async () => {
            mockSiteRepository.findById.mockRejectedValue(new Error('Database Error'));

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app).get(requestConfig.url);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                message: 'Database Error',
                data: null,
            });
        });
    });

    describe('POST /site', () => {
        const siteDB = {
            id: 1,
            createdAt: new Date('2026-01-01T00:00:00Z'),
            updatedAt: new Date('2026-01-01T00:00:00Z'),
            name: 'Site1',
            url: 'https://example.com/site1',
            apiKey: 'api-key-1',
            environment: 'development',
            phpVersion: '8.5.1',
            wpVersion: '6.9.0',
        } as const;

        const requestConfig = {
            url: `/site`,
            headers: {
                'Content-Type': 'application/json',
            },
            body: {
                name: siteDB.name,
                url: siteDB.url,
                environment: siteDB.environment,
            },
        };

        it('should respond with (200) and { message: "Successfully registered site", data: { ... } }', async () => {
            mockSiteRepository.findByNameAndUrl.mockResolvedValue(null);
            mockSiteRepository.insert.mockResolvedValue(new Site(siteDB));

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app)
                .post(requestConfig.url)
                .set(requestConfig.headers)
                .send(requestConfig.body);

            expect(response.status).toBe(201);
            expect(response.body).toEqual({
                message: 'Successfully registered site',
                data: {
                    id: siteDB.id,
                    name: siteDB.name,
                    url: siteDB.url,
                    apiKey: siteDB.apiKey,
                    environment: siteDB.environment,
                },
            });
        });

        it('should respond with (200) and { message: "Successfully re-registered site", data: { ... } }', async () => {
            mockSiteRepository.findByNameAndUrl.mockResolvedValue(new Site(siteDB));
            mockSiteRepository.update.mockResolvedValue(new Site(siteDB));

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app)
                .post(requestConfig.url)
                .set(requestConfig.headers)
                .send(requestConfig.body);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'Successfully re-registered site',
                data: {
                    id: siteDB.id,
                    name: siteDB.name,
                    url: siteDB.url,
                    apiKey: siteDB.apiKey,
                    environment: siteDB.environment,
                },
            });
        });

        it('should respond with (400) and { message: "The field "name" is required and must be a non-empty string", data: null }', async () => {
            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app).post(requestConfig.url).set(requestConfig.headers).send({});

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'The field "name" is required and must be a non-empty string',
                data: null,
            });
        });

        it('should respond with (400) and { message: "The field "url" is required and must be a non-empty string", data: null }', async () => {
            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });

            const response = await request(app).post(requestConfig.url).set(requestConfig.headers).send({
                name: requestConfig.body.name,
            });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'The field "url" is required and must be a non-empty string',
                data: null,
            });
        });

        it('should respond with (400) and { message: "The field "environment" is required and must either be "production", "staging" or "development"", data: null }', async () => {
            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });

            const response = await request(app).post(requestConfig.url).set(requestConfig.headers).send({
                name: requestConfig.body.name,
                url: requestConfig.body.url,
            });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message:
                    'The field "environment" is required and must either be "production", "staging" or "development"',
                data: null,
            });
        });

        it('should respond with (500) and { message: "Failed to create site", data: null }', async () => {
            mockSiteRepository.findByNameAndUrl.mockResolvedValue(null);
            mockSiteRepository.insert.mockResolvedValue(null);

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app)
                .post(requestConfig.url)
                .set(requestConfig.headers)
                .send(requestConfig.body);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                message: 'Failed to create site',
                data: null,
            });
        });

        it('should respond with (500) and { message: "Failed to update site", data: null }', async () => {
            mockSiteRepository.findByNameAndUrl.mockResolvedValue(new Site(siteDB));
            mockSiteRepository.update.mockResolvedValue(null);

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app)
                .post(requestConfig.url)
                .set(requestConfig.headers)
                .send(requestConfig.body);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                message: 'Failed to update site',
                data: null,
            });
        });

        it('should respond with (500) and { message: "Database Error", data: null }', async () => {
            mockSiteRepository.findByNameAndUrl.mockRejectedValue(new Error('Database Error'));

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app)
                .post(requestConfig.url)
                .set(requestConfig.headers)
                .send(requestConfig.body);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                message: 'Database Error',
                data: null,
            });
        });
    });

    describe('PUT /site/{siteId}', () => {
        const siteDB = {
            id: 1,
            createdAt: new Date('2026-01-01T00:00:00Z'),
            updatedAt: new Date('2026-01-01T00:00:00Z'),
            name: 'Site1',
            url: 'https://example.com/site1',
            apiKey: 'api-key-1',
            environment: 'development',
            phpVersion: '8.5.1',
            wpVersion: '6.9.0',
        } as const;

        const plugin1DB = {
            id: 1,
            createdAt: new Date('2026-01-01T00:00:00Z'),
            updatedAt: new Date('2026-01-01T00:00:00Z'),
            slug: 'plugin-1',
            name: 'Plugin1',
            latestVersion: '1.0.0',
            requiredPhpVersion: '8.5.1',
            requiredWpVersion: '6.9.0',
        };

        const sitePlugin1DB = {
            createdAt: new Date('2026-01-01T00:00:00Z'),
            updatedAt: new Date('2026-01-01T00:00:00Z'),
            siteId: 1,
            pluginId: 1,
            installedVersion: '1.0.0',
            requiredPhpVersion: '8.5.1',
            requiredWpVersion: '6.9.0',
            isActive: true,
        };

        const pluginVulnerability1Resolver = {
            description: 'Vulnerability in Plugin1',
            publishedAt: new Date('2025-12-01T00:00:00Z'),
            severity: 5,
            references: 'https://example.com/vuln1',
            fromVersion: {
                version: '1.0.0',
                inclusive: true,
            },
            toVersion: {
                version: '2.0.0',
                inclusive: true,
            },
        };

        const requestConfig = {
            url: `/site/${siteDB.id}`,
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Token': siteDB.apiKey,
            },
            body: {
                name: siteDB.name,
                url: siteDB.url,
                phpVersion: '8.5.1',
                wpVersion: '6.9.0',
                plugins: [
                    {
                        file: 'plugin-1/plugin-1.php',
                        name: plugin1DB.name,
                        active: true,
                        version: {
                            installedVersion: '1.0.0',
                            requiredPhpVersion: '8.5.1',
                            requiredWpVersion: '6.9.0',
                        },
                    },
                ],
            },
        };

        it('should respond with (200) and { message: "Successfully updated site", data: { ... } } - empty plugin array', async () => {
            mockSiteRepository.findById.mockResolvedValue(new Site(siteDB));
            mockSiteRepository.update.mockResolvedValue(new Site(siteDB));
            mockSitePluginRepository.findAllBySiteId.mockResolvedValue([]);

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
                pluginRepository: mockPluginRepository,
                sitePluginRepository: mockSitePluginRepository,
            });
            const response = await request(app).put(requestConfig.url).set(requestConfig.headers).send({
                name: requestConfig.body.name,
                url: requestConfig.body.url,
                phpVersion: requestConfig.body.phpVersion,
                wpVersion: requestConfig.body.wpVersion,
                plugins: [],
            });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'Successfully updated site',
                data: {
                    id: siteDB.id,
                    name: siteDB.name,
                    url: siteDB.url,
                    environment: siteDB.environment,
                    phpVersion: siteDB.phpVersion,
                    wpVersion: siteDB.wpVersion,
                },
            });
        });

        it('should respond with (200) and { message: "Successfully updated site", data: { ... } } - skip plugins with invalid file format', async () => {
            mockSiteRepository.findById.mockResolvedValue(new Site(siteDB));
            mockSiteRepository.update.mockResolvedValue(new Site(siteDB));
            mockSitePluginRepository.findAllBySiteId.mockResolvedValue([]);

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
                pluginRepository: mockPluginRepository,
                sitePluginRepository: mockSitePluginRepository,
                logger: mockLogger,
            });
            const response = await request(app)
                .put(requestConfig.url)
                .set(requestConfig.headers)
                .send({
                    name: requestConfig.body.name,
                    url: requestConfig.body.url,
                    phpVersion: requestConfig.body.phpVersion,
                    wpVersion: requestConfig.body.wpVersion,
                    plugins: [
                        {
                            file: 'invalid-file-format',
                            name: requestConfig.body.plugins[0].name,
                            active: requestConfig.body.plugins[0].active,
                            version: {
                                installedVersion: requestConfig.body.plugins[0].version.installedVersion,
                                requiredPhpVersion: requestConfig.body.plugins[0].version.requiredPhpVersion,
                                requiredWpVersion: requestConfig.body.plugins[0].version.requiredWpVersion,
                            },
                        },
                    ],
                });

            expect(mockLogger.warn).toHaveBeenCalledWith('Invalid plugin file format', { file: 'invalid-file-format' });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'Successfully updated site',
                data: {
                    id: siteDB.id,
                    name: siteDB.name,
                    url: siteDB.url,
                    environment: siteDB.environment,
                    phpVersion: siteDB.phpVersion,
                    wpVersion: siteDB.wpVersion,
                },
            });
        });

        it('should respond with (200) and { message: "Successfully updated site", data: { ... } } - insert new plugin + inserting vulnerabilities', async () => {
            mockSiteRepository.findById.mockResolvedValue(new Site(siteDB));
            mockSiteRepository.update.mockResolvedValue(new Site(siteDB));
            mockPluginRepository.findBySlug.mockResolvedValueOnce(null).mockResolvedValue(new Plugin(plugin1DB));
            mockPluginRepository.insert.mockResolvedValue(new Plugin(plugin1DB));
            mockLatestVersionResolver.resolvePlugin.mockResolvedValue({
                version: '1.0.0',
                requiredPhpVersion: '8.5.1',
                requiredWpVersion: '6.9.0',
            });
            mockVulnerabilitiesResolver.resolvePlugin.mockReturnValue([pluginVulnerability1Resolver]);
            mockSitePluginRepository.findBySiteIdAndPluginId.mockResolvedValue(null);
            mockSitePluginRepository.insert.mockResolvedValue(null);
            mockSitePluginRepository.findAllBySiteId.mockResolvedValue([]);
            mockPluginVulnerabilityRepository.deleteAllByPluginId.mockResolvedValue(true);
            mockPluginVulnerabilityRepository.insert.mockResolvedValue(
                new PluginVulnerability({
                    id: 1,
                    createdAt: new Date('2026-01-01T00:00:00Z'),
                    pluginId: 1,
                    ...pluginVulnerability1Resolver,
                })
            );

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
                pluginRepository: mockPluginRepository,
                sitePluginRepository: mockSitePluginRepository,
                pluginVulnerabilityRepository: mockPluginVulnerabilityRepository,
                logger: mockLogger,
                latestVersionResolver: mockLatestVersionResolver,
                vulnerabilitiesResolver: mockVulnerabilitiesResolver,
            });

            const response = await request(app)
                .put(requestConfig.url)
                .set(requestConfig.headers)
                .send(requestConfig.body);

            expect(mockLogger.info).toHaveBeenCalledWith('Plugin not found in database. Creating new plugin entry', {
                slug: 'plugin-1',
                name: requestConfig.body.plugins[0].name,
            });
            expect(mockLogger.info).toHaveBeenCalledWith('Successfully inserted plugin vulnerability', {
                slug: 'plugin-1',
                vulnerability: pluginVulnerability1Resolver,
            });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'Successfully updated site',
                data: {
                    id: siteDB.id,
                    name: siteDB.name,
                    url: siteDB.url,
                    environment: siteDB.environment,
                    phpVersion: siteDB.phpVersion,
                    wpVersion: siteDB.wpVersion,
                },
            });
        });

        it('should respond with (200) and { message: "Successfully updated site", data: { ... } } - insert new plugin + inserting vulnerabilities fails', async () => {
            mockSiteRepository.findById.mockResolvedValue(new Site(siteDB));
            mockSiteRepository.update.mockResolvedValue(new Site(siteDB));
            mockPluginRepository.findBySlug.mockResolvedValueOnce(null).mockResolvedValue(new Plugin(plugin1DB));
            mockPluginRepository.insert.mockResolvedValue(new Plugin(plugin1DB));
            mockLatestVersionResolver.resolvePlugin.mockResolvedValue({
                version: '1.0.0',
                requiredPhpVersion: '8.5.1',
                requiredWpVersion: '6.9.0',
            });
            mockVulnerabilitiesResolver.resolvePlugin.mockReturnValue([pluginVulnerability1Resolver]);
            mockSitePluginRepository.findBySiteIdAndPluginId.mockResolvedValue(null);
            mockSitePluginRepository.insert.mockResolvedValue(null);
            mockSitePluginRepository.findAllBySiteId.mockResolvedValue([]);
            mockPluginVulnerabilityRepository.deleteAllByPluginId.mockResolvedValue(true);
            mockPluginVulnerabilityRepository.insert.mockResolvedValue(null);

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
                pluginRepository: mockPluginRepository,
                sitePluginRepository: mockSitePluginRepository,
                pluginVulnerabilityRepository: mockPluginVulnerabilityRepository,
                logger: mockLogger,
                latestVersionResolver: mockLatestVersionResolver,
                vulnerabilitiesResolver: mockVulnerabilitiesResolver,
            });

            const response = await request(app)
                .put(requestConfig.url)
                .set(requestConfig.headers)
                .send(requestConfig.body);

            expect(mockLogger.info).toHaveBeenCalledWith('Plugin not found in database. Creating new plugin entry', {
                slug: 'plugin-1',
                name: requestConfig.body.plugins[0].name,
            });
            expect(mockLogger.error).toHaveBeenCalledWith('Failed to insert plugin vulnerability', {
                slug: 'plugin-1',
                vulnerability: pluginVulnerability1Resolver,
            });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'Successfully updated site',
                data: {
                    id: siteDB.id,
                    name: siteDB.name,
                    url: siteDB.url,
                    environment: siteDB.environment,
                    phpVersion: siteDB.phpVersion,
                    wpVersion: siteDB.wpVersion,
                },
            });
        });

        it('should respond with (200) and { message: "Successfully updated site", data: { ... } } - insert new plugin + fetching vulnerabilities fails', async () => {
            mockSiteRepository.findById.mockResolvedValue(new Site(siteDB));
            mockSiteRepository.update.mockResolvedValue(new Site(siteDB));
            mockPluginRepository.findBySlug.mockResolvedValueOnce(null).mockResolvedValue(new Plugin(plugin1DB));
            mockPluginRepository.insert.mockResolvedValue(new Plugin(plugin1DB));
            mockLatestVersionResolver.resolvePlugin.mockResolvedValue({
                version: '1.0.0',
                requiredPhpVersion: '8.5.1',
                requiredWpVersion: '6.9.0',
            });
            mockVulnerabilitiesResolver.resolvePlugin.mockReturnValue(null);
            mockSitePluginRepository.findBySiteIdAndPluginId.mockResolvedValue(null);
            mockSitePluginRepository.insert.mockResolvedValue(null);
            mockSitePluginRepository.findAllBySiteId.mockResolvedValue([]);

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
                pluginRepository: mockPluginRepository,
                sitePluginRepository: mockSitePluginRepository,
                pluginVulnerabilityRepository: mockPluginVulnerabilityRepository,
                logger: mockLogger,
                latestVersionResolver: mockLatestVersionResolver,
                vulnerabilitiesResolver: mockVulnerabilitiesResolver,
            });

            const response = await request(app)
                .put(requestConfig.url)
                .set(requestConfig.headers)
                .send(requestConfig.body);

            expect(mockLogger.info).toHaveBeenCalledWith('Plugin not found in database. Creating new plugin entry', {
                slug: 'plugin-1',
                name: requestConfig.body.plugins[0].name,
            });
            expect(mockLogger.error).toHaveBeenCalledWith('Failed to fetch vulnerabilities for plugin after creation', {
                slug: 'plugin-1',
            });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'Successfully updated site',
                data: {
                    id: siteDB.id,
                    name: siteDB.name,
                    url: siteDB.url,
                    environment: siteDB.environment,
                    phpVersion: siteDB.phpVersion,
                    wpVersion: siteDB.wpVersion,
                },
            });
        });

        it('should respond with (200) and { message: "Successfully updated site", data: { ... } } - insert new plugin + insert site plugin', async () => {
            mockSiteRepository.findById.mockResolvedValue(new Site(siteDB));
            mockSiteRepository.update.mockResolvedValue(new Site(siteDB));
            mockPluginRepository.findBySlug.mockResolvedValueOnce(null).mockResolvedValue(new Plugin(plugin1DB));
            mockPluginRepository.insert.mockResolvedValue(new Plugin(plugin1DB));
            mockLatestVersionResolver.resolvePlugin.mockResolvedValue({
                version: '1.0.0',
                requiredPhpVersion: '8.5.1',
                requiredWpVersion: '6.9.0',
            });
            mockVulnerabilitiesResolver.resolvePlugin.mockReturnValue([]);
            mockSitePluginRepository.findBySiteIdAndPluginId.mockResolvedValue(null);
            mockSitePluginRepository.insert.mockResolvedValue(new SitePlugin(sitePlugin1DB));
            mockSitePluginRepository.findAllBySiteId.mockResolvedValue([]);

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
                pluginRepository: mockPluginRepository,
                sitePluginRepository: mockSitePluginRepository,
                pluginVulnerabilityRepository: mockPluginVulnerabilityRepository,
                logger: mockLogger,
                latestVersionResolver: mockLatestVersionResolver,
                vulnerabilitiesResolver: mockVulnerabilitiesResolver,
            });
            const response = await request(app)
                .put(requestConfig.url)
                .set(requestConfig.headers)
                .send(requestConfig.body);

            expect(mockLogger.info).toHaveBeenCalledWith('Plugin not found in database. Creating new plugin entry', {
                slug: 'plugin-1',
                name: requestConfig.body.plugins[0].name,
            });
            expect(mockLogger.info).toHaveBeenCalledWith('Successfully created site plugin entry', {
                siteId: siteDB.id,
                pluginId: plugin1DB.id,
            });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'Successfully updated site',
                data: {
                    id: siteDB.id,
                    name: siteDB.name,
                    url: siteDB.url,
                    environment: siteDB.environment,
                    phpVersion: siteDB.phpVersion,
                    wpVersion: siteDB.wpVersion,
                },
            });
        });

        it('should respond with (200) and { message: "Successfully updated site", data: { ... } } - insert new plugin + insert site plugin fails', async () => {
            mockSiteRepository.findById.mockResolvedValue(new Site(siteDB));
            mockSiteRepository.update.mockResolvedValue(new Site(siteDB));
            mockPluginRepository.findBySlug.mockResolvedValueOnce(null).mockResolvedValue(new Plugin(plugin1DB));
            mockPluginRepository.insert.mockResolvedValue(new Plugin(plugin1DB));
            mockLatestVersionResolver.resolvePlugin.mockResolvedValue({
                version: '1.0.0',
                requiredPhpVersion: '8.5.1',
                requiredWpVersion: '6.9.0',
            });
            mockVulnerabilitiesResolver.resolvePlugin.mockReturnValue([]);
            mockSitePluginRepository.findBySiteIdAndPluginId.mockResolvedValue(null);
            mockSitePluginRepository.insert.mockResolvedValue(null);
            mockSitePluginRepository.findAllBySiteId.mockResolvedValue([]);

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
                pluginRepository: mockPluginRepository,
                sitePluginRepository: mockSitePluginRepository,
                pluginVulnerabilityRepository: mockPluginVulnerabilityRepository,
                logger: mockLogger,
                latestVersionResolver: mockLatestVersionResolver,
                vulnerabilitiesResolver: mockVulnerabilitiesResolver,
            });
            const response = await request(app)
                .put(requestConfig.url)
                .set(requestConfig.headers)
                .send(requestConfig.body);

            expect(mockLogger.info).toHaveBeenCalledWith('Plugin not found in database. Creating new plugin entry', {
                slug: 'plugin-1',
                name: requestConfig.body.plugins[0].name,
            });
            expect(mockLogger.error).toHaveBeenCalledWith('Failed to create site plugin entry', {
                siteId: siteDB.id,
                pluginId: plugin1DB.id,
            });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'Successfully updated site',
                data: {
                    id: siteDB.id,
                    name: siteDB.name,
                    url: siteDB.url,
                    environment: siteDB.environment,
                    phpVersion: siteDB.phpVersion,
                    wpVersion: siteDB.wpVersion,
                },
            });
        });

        it('should respond with (200) and { message: "Successfully updated site", data: { ... } } - insert new plugin + plugin not found after insertion', async () => {
            mockSiteRepository.findById.mockResolvedValue(new Site(siteDB));
            mockSiteRepository.update.mockResolvedValue(new Site(siteDB));
            mockPluginRepository.findBySlug.mockResolvedValue(null);
            mockPluginRepository.insert.mockResolvedValue(new Plugin(plugin1DB));
            mockLatestVersionResolver.resolvePlugin.mockResolvedValue({
                version: '1.0.0',
                requiredPhpVersion: '8.5.1',
                requiredWpVersion: '6.9.0',
            });
            mockVulnerabilitiesResolver.resolvePlugin.mockReturnValue(null);
            mockSitePluginRepository.findBySiteIdAndPluginId.mockResolvedValue(null);
            mockSitePluginRepository.insert.mockResolvedValue(null);
            mockSitePluginRepository.findAllBySiteId.mockResolvedValue([]);

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
                pluginRepository: mockPluginRepository,
                sitePluginRepository: mockSitePluginRepository,
                logger: mockLogger,
                latestVersionResolver: mockLatestVersionResolver,
                vulnerabilitiesResolver: mockVulnerabilitiesResolver,
            });
            const response = await request(app)
                .put(requestConfig.url)
                .set(requestConfig.headers)
                .send(requestConfig.body);

            expect(mockLogger.info).toHaveBeenCalledWith('Plugin not found in database. Creating new plugin entry', {
                slug: 'plugin-1',
                name: requestConfig.body.plugins[0].name,
            });
            expect(mockLogger.error).toHaveBeenCalledWith('Plugin not found after insertion attempt', {
                slug: 'plugin-1',
            });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'Successfully updated site',
                data: {
                    id: siteDB.id,
                    name: siteDB.name,
                    url: siteDB.url,
                    environment: siteDB.environment,
                    phpVersion: siteDB.phpVersion,
                    wpVersion: siteDB.wpVersion,
                },
            });
        });

        it('should respond with (200) and { message: "Successfully updated site", data: { ... } } - insert new plugin fails', async () => {
            mockSiteRepository.findById.mockResolvedValue(new Site(siteDB));
            mockSiteRepository.update.mockResolvedValue(new Site(siteDB));
            mockPluginRepository.findBySlug.mockResolvedValue(null);
            mockPluginRepository.insert.mockResolvedValue(null);
            mockLatestVersionResolver.resolvePlugin.mockResolvedValue({
                version: '1.0.0',
                requiredPhpVersion: '8.5.1',
                requiredWpVersion: '6.9.0',
            });
            mockSitePluginRepository.findAllBySiteId.mockResolvedValue([]);

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
                pluginRepository: mockPluginRepository,
                sitePluginRepository: mockSitePluginRepository,
                logger: mockLogger,
                latestVersionResolver: mockLatestVersionResolver,
            });
            const response = await request(app)
                .put(requestConfig.url)
                .set(requestConfig.headers)
                .send(requestConfig.body);

            expect(mockLogger.info).toHaveBeenCalledWith('Plugin not found in database. Creating new plugin entry', {
                slug: 'plugin-1',
                name: requestConfig.body.plugins[0].name,
            });
            expect(mockLogger.error).toHaveBeenCalledWith('Failed to create plugin entry', {
                slug: plugin1DB.slug,
                name: plugin1DB.name,
            });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'Successfully updated site',
                data: {
                    id: siteDB.id,
                    name: siteDB.name,
                    url: siteDB.url,
                    environment: siteDB.environment,
                    phpVersion: siteDB.phpVersion,
                    wpVersion: siteDB.wpVersion,
                },
            });
        });

        it('should respond with (200) and { message: "Successfully updated site", data: { ... } } - skip insertion of existing plugin + insert site plugin', async () => {
            mockSiteRepository.findById.mockResolvedValue(new Site(siteDB));
            mockSiteRepository.update.mockResolvedValue(new Site(siteDB));
            mockPluginRepository.findBySlug.mockResolvedValue(new Plugin(plugin1DB));
            mockSitePluginRepository.findAllBySiteId.mockResolvedValue([]);
            mockSitePluginRepository.findBySiteIdAndPluginId.mockResolvedValue(null);
            mockSitePluginRepository.insert.mockResolvedValue(new SitePlugin(sitePlugin1DB));

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
                pluginRepository: mockPluginRepository,
                sitePluginRepository: mockSitePluginRepository,
                logger: mockLogger,
            });
            const response = await request(app)
                .put(requestConfig.url)
                .set(requestConfig.headers)
                .send(requestConfig.body);

            expect(mockLogger.info).toHaveBeenCalledWith('Successfully created site plugin entry', {
                siteId: siteDB.id,
                pluginId: plugin1DB.id,
            });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'Successfully updated site',
                data: {
                    id: siteDB.id,
                    name: siteDB.name,
                    url: siteDB.url,
                    environment: siteDB.environment,
                    phpVersion: siteDB.phpVersion,
                    wpVersion: siteDB.wpVersion,
                },
            });
        });

        it('should respond with (200) and { message: "Successfully updated site", data: { ... } } - skip insertion of existing plugin + insert site plugin fails', async () => {
            mockSiteRepository.findById.mockResolvedValue(new Site(siteDB));
            mockSiteRepository.update.mockResolvedValue(new Site(siteDB));
            mockPluginRepository.findBySlug.mockResolvedValue(new Plugin(plugin1DB));
            mockSitePluginRepository.findAllBySiteId.mockResolvedValue([]);
            mockSitePluginRepository.findBySiteIdAndPluginId.mockResolvedValue(null);
            mockSitePluginRepository.insert.mockResolvedValue(null);

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
                pluginRepository: mockPluginRepository,
                sitePluginRepository: mockSitePluginRepository,
                logger: mockLogger,
            });
            const response = await request(app)
                .put(requestConfig.url)
                .set(requestConfig.headers)
                .send(requestConfig.body);

            expect(mockLogger.error).toHaveBeenCalledWith('Failed to create site plugin entry', {
                siteId: siteDB.id,
                pluginId: plugin1DB.id,
            });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'Successfully updated site',
                data: {
                    id: siteDB.id,
                    name: siteDB.name,
                    url: siteDB.url,
                    environment: siteDB.environment,
                    phpVersion: siteDB.phpVersion,
                    wpVersion: siteDB.wpVersion,
                },
            });
        });

        it('should respond with (200) and { message: "Successfully updated site", data: { ... } } - skip insertion of existing plugin + update site plugin', async () => {
            mockSiteRepository.findById.mockResolvedValue(new Site(siteDB));
            mockSiteRepository.update.mockResolvedValue(new Site(siteDB));
            mockPluginRepository.findBySlug.mockResolvedValue(new Plugin(plugin1DB));
            mockSitePluginRepository.findAllBySiteId.mockResolvedValue([]);
            mockSitePluginRepository.findBySiteIdAndPluginId.mockResolvedValue(new SitePlugin(sitePlugin1DB));
            mockSitePluginRepository.update.mockResolvedValue(new SitePlugin(sitePlugin1DB));

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
                pluginRepository: mockPluginRepository,
                sitePluginRepository: mockSitePluginRepository,
                logger: mockLogger,
            });
            const response = await request(app)
                .put(requestConfig.url)
                .set(requestConfig.headers)
                .send(requestConfig.body);

            expect(mockLogger.info).toHaveBeenCalledWith('Successfully updated site plugin entry', {
                siteId: siteDB.id,
                pluginId: plugin1DB.id,
            });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'Successfully updated site',
                data: {
                    id: siteDB.id,
                    name: siteDB.name,
                    url: siteDB.url,
                    environment: siteDB.environment,
                    phpVersion: siteDB.phpVersion,
                    wpVersion: siteDB.wpVersion,
                },
            });
        });

        it('should respond with (200) and { message: "Successfully updated site", data: { ... } } - skip insertion of existing plugin + update site plugin fails', async () => {
            mockSiteRepository.findById.mockResolvedValue(new Site(siteDB));
            mockSiteRepository.update.mockResolvedValue(new Site(siteDB));
            mockPluginRepository.findBySlug.mockResolvedValue(new Plugin(plugin1DB));
            mockSitePluginRepository.findAllBySiteId.mockResolvedValue([]);
            mockSitePluginRepository.findBySiteIdAndPluginId.mockResolvedValue(new SitePlugin(sitePlugin1DB));
            mockSitePluginRepository.update.mockResolvedValue(null);

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
                pluginRepository: mockPluginRepository,
                sitePluginRepository: mockSitePluginRepository,
                logger: mockLogger,
            });
            const response = await request(app)
                .put(requestConfig.url)
                .set(requestConfig.headers)
                .send(requestConfig.body);

            expect(mockLogger.error).toHaveBeenCalledWith('Failed to update site plugin entry', {
                siteId: siteDB.id,
                pluginId: plugin1DB.id,
            });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'Successfully updated site',
                data: {
                    id: siteDB.id,
                    name: siteDB.name,
                    url: siteDB.url,
                    environment: siteDB.environment,
                    phpVersion: siteDB.phpVersion,
                    wpVersion: siteDB.wpVersion,
                },
            });
        });

        it('should respond with (200) and { message: "Successfully updated site", data: { ... } } - delete unused site plugins', async () => {
            mockSiteRepository.findById.mockResolvedValue(new Site(siteDB));
            mockSiteRepository.update.mockResolvedValue(new Site(siteDB));
            mockPluginRepository.findBySlug.mockResolvedValue(new Plugin(plugin1DB));
            mockSitePluginRepository.findAllBySiteId.mockResolvedValue([new SitePlugin(sitePlugin1DB)]);
            mockPluginRepository.findById.mockResolvedValue(new Plugin(plugin1DB));
            mockSitePluginRepository.delete.mockResolvedValue(true);

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
                pluginRepository: mockPluginRepository,
                sitePluginRepository: mockSitePluginRepository,
                logger: mockLogger,
            });
            const response = await request(app).put(requestConfig.url).set(requestConfig.headers).send({
                name: requestConfig.body.name,
                url: requestConfig.body.url,
                phpVersion: requestConfig.body.phpVersion,
                wpVersion: requestConfig.body.wpVersion,
                plugins: [],
            });

            expect(mockLogger.info).toHaveBeenCalledWith('Successfully deleted site plugin entry', {
                siteId: siteDB.id,
                pluginId: plugin1DB.id,
            });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'Successfully updated site',
                data: {
                    id: siteDB.id,
                    name: siteDB.name,
                    url: siteDB.url,
                    environment: siteDB.environment,
                    phpVersion: siteDB.phpVersion,
                    wpVersion: siteDB.wpVersion,
                },
            });
        });

        it('should respond with (200) and { message: "Successfully updated site", data: { ... } } - delete unused site plugins fails', async () => {
            mockSiteRepository.findById.mockResolvedValue(new Site(siteDB));
            mockSiteRepository.update.mockResolvedValue(new Site(siteDB));
            mockPluginRepository.findBySlug.mockResolvedValue(new Plugin(plugin1DB));
            mockSitePluginRepository.findAllBySiteId.mockResolvedValue([new SitePlugin(sitePlugin1DB)]);
            mockPluginRepository.findById.mockResolvedValue(new Plugin(plugin1DB));
            mockSitePluginRepository.delete.mockResolvedValue(false);

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
                pluginRepository: mockPluginRepository,
                sitePluginRepository: mockSitePluginRepository,
                logger: mockLogger,
            });
            const response = await request(app).put(requestConfig.url).set(requestConfig.headers).send({
                name: requestConfig.body.name,
                url: requestConfig.body.url,
                phpVersion: requestConfig.body.phpVersion,
                wpVersion: requestConfig.body.wpVersion,
                plugins: [],
            });

            expect(mockLogger.error).toHaveBeenCalledWith('Failed to delete site plugin entry', {
                siteId: siteDB.id,
                pluginId: plugin1DB.id,
            });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'Successfully updated site',
                data: {
                    id: siteDB.id,
                    name: siteDB.name,
                    url: siteDB.url,
                    environment: siteDB.environment,
                    phpVersion: siteDB.phpVersion,
                    wpVersion: siteDB.wpVersion,
                },
            });
        });

        it('should respond with (200) and { message: "Successfully updated site", data: { ... } } - delete unused site plugins skips when plugin cannot be found', async () => {
            mockSiteRepository.findById.mockResolvedValue(new Site(siteDB));
            mockSiteRepository.update.mockResolvedValue(new Site(siteDB));
            mockPluginRepository.findBySlug.mockResolvedValue(new Plugin(plugin1DB));
            mockSitePluginRepository.findAllBySiteId.mockResolvedValue([new SitePlugin(sitePlugin1DB)]);
            mockPluginRepository.findById.mockResolvedValue(null);

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
                pluginRepository: mockPluginRepository,
                sitePluginRepository: mockSitePluginRepository,
                logger: mockLogger,
            });
            const response = await request(app).put(requestConfig.url).set(requestConfig.headers).send({
                name: requestConfig.body.name,
                url: requestConfig.body.url,
                phpVersion: requestConfig.body.phpVersion,
                wpVersion: requestConfig.body.wpVersion,
                plugins: [],
            });

            expect(mockLogger.info).not.toHaveBeenCalledWith('Successfully deleted site plugin entry', {
                siteId: siteDB.id,
                pluginId: plugin1DB.id,
            });

            expect(mockLogger.error).not.toHaveBeenCalledWith('Failed to delete site plugin entry', {
                siteId: siteDB.id,
                pluginId: plugin1DB.id,
            });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'Successfully updated site',
                data: {
                    id: siteDB.id,
                    name: siteDB.name,
                    url: siteDB.url,
                    environment: siteDB.environment,
                    phpVersion: siteDB.phpVersion,
                    wpVersion: siteDB.wpVersion,
                },
            });
        });

        it('should respond with (400) and { message: "The parameter "siteId" is required and must be a valid number", data: null }', async () => {
            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app).put(`/site/abc`).set(requestConfig.headers).send(requestConfig.body);

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'The parameter "siteId" is required and must be a valid number',
                data: null,
            });
        });

        it('should respond with (400) and { message: "The field "name" is required and must be a non-empty string", data: null }', async () => {
            mockSiteRepository.findById.mockResolvedValue(new Site(siteDB));

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app).put(requestConfig.url).set(requestConfig.headers).send({});

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'The field "name" is required and must be a non-empty string',
                data: null,
            });
        });

        it('should respond with (400) and { message: "The field "url" is required and must be a non-empty string", data: null }', async () => {
            mockSiteRepository.findById.mockResolvedValue(new Site(siteDB));

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app).put(requestConfig.url).set(requestConfig.headers).send({
                name: requestConfig.body.name,
            });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'The field "url" is required and must be a non-empty string',
                data: null,
            });
        });

        it('should respond with (400) and { message: "The field "phpVersion" is required and must be a valid version string", data: null }', async () => {
            mockSiteRepository.findById.mockResolvedValue(new Site(siteDB));

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app).put(requestConfig.url).set(requestConfig.headers).send({
                name: requestConfig.body.name,
                url: requestConfig.body.url,
            });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'The field "phpVersion" is required and must be a valid version string',
                data: null,
            });
        });

        it('should respond with (400) and { message: "The field "wpVersion" is required and must be a valid version string", data: null }', async () => {
            mockSiteRepository.findById.mockResolvedValue(new Site(siteDB));

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app).put(requestConfig.url).set(requestConfig.headers).send({
                name: requestConfig.body.name,
                url: requestConfig.body.url,
                phpVersion: requestConfig.body.phpVersion,
            });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'The field "wpVersion" is required and must be a valid version string',
                data: null,
            });
        });

        it('should respond with (400) and { message: "The field "plugins" is required and must be an array", data: null }', async () => {
            mockSiteRepository.findById.mockResolvedValue(new Site(siteDB));

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app).put(requestConfig.url).set(requestConfig.headers).send({
                name: requestConfig.body.name,
                url: requestConfig.body.url,
                phpVersion: requestConfig.body.phpVersion,
                wpVersion: requestConfig.body.wpVersion,
            });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'The field "plugins" is required and must be an array',
                data: null,
            });
        });

        it('should respond with (400) and { message: "The field "plugins[i].file" is required and must be a string", data: null }', async () => {
            mockSiteRepository.findById.mockResolvedValue(new Site(siteDB));

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app)
                .put(requestConfig.url)
                .set(requestConfig.headers)
                .send({
                    name: requestConfig.body.name,
                    url: requestConfig.body.url,
                    phpVersion: requestConfig.body.phpVersion,
                    wpVersion: requestConfig.body.wpVersion,
                    plugins: [{}],
                });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'The field "plugins[0].file" is required and must be a string',
                data: null,
            });
        });

        it('should respond with (400) and { message: "The field "plugins[i].name" is required and must be a string", data: null }', async () => {
            mockSiteRepository.findById.mockResolvedValue(new Site(siteDB));

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app)
                .put(requestConfig.url)
                .set(requestConfig.headers)
                .send({
                    name: requestConfig.body.name,
                    url: requestConfig.body.url,
                    phpVersion: requestConfig.body.phpVersion,
                    wpVersion: requestConfig.body.wpVersion,
                    plugins: [
                        {
                            file: requestConfig.body.plugins[0].file,
                        },
                    ],
                });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'The field "plugins[0].name" is required and must be a string',
                data: null,
            });
        });

        it('should respond with (400) and { message: "The field "plugins[i].active" is required and must be a boolean", data: null }', async () => {
            mockSiteRepository.findById.mockResolvedValue(new Site(siteDB));

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app)
                .put(requestConfig.url)
                .set(requestConfig.headers)
                .send({
                    name: requestConfig.body.name,
                    url: requestConfig.body.url,
                    phpVersion: requestConfig.body.phpVersion,
                    wpVersion: requestConfig.body.wpVersion,
                    plugins: [
                        {
                            file: requestConfig.body.plugins[0].file,
                            name: requestConfig.body.plugins[0].name,
                        },
                    ],
                });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'The field "plugins[0].active" is required and must be a boolean',
                data: null,
            });
        });

        it('should respond with (400) and { message: "The field "plugins[i].version" is required and must be an object", data: null }', async () => {
            mockSiteRepository.findById.mockResolvedValue(new Site(siteDB));

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app)
                .put(requestConfig.url)
                .set(requestConfig.headers)
                .send({
                    name: requestConfig.body.name,
                    url: requestConfig.body.url,
                    phpVersion: requestConfig.body.phpVersion,
                    wpVersion: requestConfig.body.wpVersion,
                    plugins: [
                        {
                            file: requestConfig.body.plugins[0].file,
                            name: requestConfig.body.plugins[0].name,
                            active: requestConfig.body.plugins[0].active,
                        },
                    ],
                });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'The field "plugins[0].version" is required and must be an object',
                data: null,
            });
        });

        it('should respond with (400) and { message: "The field "plugins[i].version.installedVersion" is required and must be a valid version string or null", data: null }', async () => {
            mockSiteRepository.findById.mockResolvedValue(new Site(siteDB));

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app)
                .put(requestConfig.url)
                .set(requestConfig.headers)
                .send({
                    name: requestConfig.body.name,
                    url: requestConfig.body.url,
                    phpVersion: requestConfig.body.phpVersion,
                    wpVersion: requestConfig.body.wpVersion,
                    plugins: [
                        {
                            file: requestConfig.body.plugins[0].file,
                            name: requestConfig.body.plugins[0].name,
                            active: requestConfig.body.plugins[0].active,
                            version: {},
                        },
                    ],
                });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message:
                    'The field "plugins[0].version.installedVersion" is required and must be a valid version string or null',
                data: null,
            });
        });

        it('should respond with (400) and { message: "The field "plugins[i].version.requiredPhpVersion" is required and must be a valid version string or null", data: null }', async () => {
            mockSiteRepository.findById.mockResolvedValue(new Site(siteDB));

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app)
                .put(requestConfig.url)
                .set(requestConfig.headers)
                .send({
                    name: requestConfig.body.name,
                    url: requestConfig.body.url,
                    phpVersion: requestConfig.body.phpVersion,
                    wpVersion: requestConfig.body.wpVersion,
                    plugins: [
                        {
                            file: requestConfig.body.plugins[0].file,
                            name: requestConfig.body.plugins[0].name,
                            active: requestConfig.body.plugins[0].active,
                            version: {
                                installedVersion: requestConfig.body.plugins[0].version.installedVersion,
                            },
                        },
                    ],
                });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message:
                    'The field "plugins[0].version.requiredPhpVersion" is required and must be a valid version string or null',
                data: null,
            });
        });

        it('should respond with (400) and { message: "The field "plugins[i].version.requiredWpVersion" is required and must be a valid version string or null", data: null }', async () => {
            mockSiteRepository.findById.mockResolvedValue(new Site(siteDB));

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app)
                .put(requestConfig.url)
                .set(requestConfig.headers)
                .send({
                    name: requestConfig.body.name,
                    url: requestConfig.body.url,
                    phpVersion: requestConfig.body.phpVersion,
                    wpVersion: requestConfig.body.wpVersion,
                    plugins: [
                        {
                            file: requestConfig.body.plugins[0].file,
                            name: requestConfig.body.plugins[0].name,
                            active: requestConfig.body.plugins[0].active,
                            version: {
                                installedVersion: requestConfig.body.plugins[0].version.installedVersion,
                                requiredPhpVersion: requestConfig.body.plugins[0].version.requiredPhpVersion,
                            },
                        },
                    ],
                });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message:
                    'The field "plugins[0].version.requiredWpVersion" is required and must be a valid version string or null',
                data: null,
            });
        });

        it('should respond with (401) and { message: "The "X-Auth-Token" header is required", data: null }', async () => {
            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app)
                .put(requestConfig.url)
                .set({
                    'Content-Type': requestConfig.headers['Content-Type'],
                })
                .send(requestConfig.body);

            expect(response.status).toBe(401);
            expect(response.body).toEqual({
                message: 'The "X-Auth-Token" header is required',
                data: null,
            });
        });

        it('should respond with (403) and { message: "The "X-Auth-Token" header is invalid", data: null }', async () => {
            mockSiteRepository.findById.mockResolvedValue(new Site(siteDB));

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app)
                .put(requestConfig.url)
                .set({
                    'Content-Type': requestConfig.headers['Content-Type'],
                    'X-Auth-Token': 'invalid-api-key',
                })
                .send(requestConfig.body);

            expect(response.status).toBe(403);
            expect(response.body).toEqual({
                message: 'The "X-Auth-Token" header is invalid',
                data: null,
            });
        });

        it('should respond with (404) and { message: "Failed to find a site with the given Id", data: null }', async () => {
            mockSiteRepository.findById.mockResolvedValue(null);

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app)
                .put(requestConfig.url)
                .set(requestConfig.headers)
                .send(requestConfig.body);

            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                message: 'Failed to find a site with the given Id',
                data: null,
            });
        });

        it('should respond with (500) and { message: "Failed to update site", data: null }', async () => {
            mockSiteRepository.findById.mockResolvedValue(new Site(siteDB));
            mockSiteRepository.update.mockResolvedValue(null);

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app)
                .put(requestConfig.url)
                .set(requestConfig.headers)
                .send(requestConfig.body);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                message: 'Failed to update site',
                data: null,
            });
        });

        it('should respond with (500) and { message: "Database Error", data: null }', async () => {
            mockSiteRepository.findById.mockRejectedValue(new Error('Database Error'));

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app)
                .put(requestConfig.url)
                .set(requestConfig.headers)
                .send(requestConfig.body);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                message: 'Database Error',
                data: null,
            });
        });
    });
});
