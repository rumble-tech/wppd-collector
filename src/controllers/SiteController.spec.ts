import Site from 'src/entities/Site';
import SitePlugin from 'src/entities/SitePlugin';
import PluginRepository from 'src/repositories/PluginRepository';
import SiteRepository from 'src/repositories/SiteRepository';
import LatestVersionResolver from 'src/services/latest-version/LatestVersionResolver';
import request from 'supertest';
import { setupTestServer } from 'test-utils/setup-server';
import Plugin from 'src/entities/Plugin';

describe('SiteController', () => {
    let mockSiteRepository: jest.Mocked<SiteRepository>;
    let mockPluginRepository: jest.Mocked<PluginRepository>;
    let mockLatestVersionResolver: jest.Mocked<LatestVersionResolver>;

    beforeEach(async () => {
        mockSiteRepository = {
            findAll: jest.fn(),
            findById: jest.fn(),
            findAllSitePlugins: jest.fn(),
            findSitePlugin: jest.fn(),
            createSitePlugin: jest.fn(),
            updateSitePlugin: jest.fn(),
            deleteSitePlugin: jest.fn(),
            findByNameAndUrl: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        } as unknown as jest.Mocked<SiteRepository>;

        mockPluginRepository = {
            findVulnerabilities: jest.fn(),
            findBySlug: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            getVulnerabilities: jest.fn(),
            deleteAllVulnerabilitiesForPlugin: jest.fn(),
            createVulnerability: jest.fn(),
        } as unknown as jest.Mocked<PluginRepository>;

        mockLatestVersionResolver = {
            resolvePhp: jest.fn(),
            resolveWp: jest.fn(),
            resolvePlugin: jest.fn(),
        } as unknown as jest.Mocked<LatestVersionResolver>;
    });

    describe('GET /site', () => {
        it('should respond with (200) and { message: "Sites retrieved successfully", data: [...] }', async () => {
            mockSiteRepository.findAll.mockResolvedValue([
                new Site(
                    1,
                    'Test Site 1',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/site-1',
                    'development'
                ),
            ]);

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app).get('/site');

            expect(response.status).toBe(200);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'Sites retrieved successfully',
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            id: expect.any(Number),
                            name: expect.any(String),
                            url: expect.any(String),
                            environment: expect.any(String),
                        }),
                    ]),
                })
            );
        });

        it('should respond with (400) and { message: "The query parameter "environment" must be either "production", "staging", or "development"", data: null }', async () => {
            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app).get('/site?environment=invalid');

            expect(response.status).toBe(400);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message:
                        'The query parameter "environment" must be either "production", "staging", or "development"',
                    data: null,
                })
            );
        });

        it('should respond with (500) and { message: "Internal server error", data: null }', async () => {
            mockSiteRepository.findAll.mockRejectedValue(new Error('Database error'));

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app).get('/site');

            expect(response.status).toBe(500);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'Internal server error',
                    data: null,
                })
            );
        });
    });

    describe('GET /site/{siteId}', () => {
        it('should respond with (200) and { message: "Site retrieved successfully", data: {...} }', async () => {
            mockSiteRepository.findById.mockResolvedValue(
                new Site(
                    1,
                    'Test Site 1',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/site-1',
                    'development'
                )
            );

            mockLatestVersionResolver.resolvePhp.mockResolvedValue('9.0.0');
            mockLatestVersionResolver.resolveWp.mockResolvedValue('6.2.0');

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
                latestVersionResolver: mockLatestVersionResolver,
            });

            const response = await request(app).get('/site/1');
            expect(response.status).toBe(200);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'Site retrieved successfully',
                    data: expect.objectContaining({
                        id: 1,
                        name: 'Test Site 1',
                        url: 'https://example.com/site-1',
                        environment: 'development',
                        phpVersion: {
                            installed: '8.0.0',
                            latest: '9.0.0',
                            diff: 'major',
                        },
                        wpVersion: {
                            installed: '6.0.0',
                            latest: '6.2.0',
                            diff: 'minor',
                        },
                    }),
                })
            );
        });

        it('should respond with (200) and { message: "Site retrieved successfully", data: {...} } - [versions not categorizeable]', async () => {
            mockSiteRepository.findById.mockResolvedValue(
                new Site(
                    1,
                    'Test Site 1',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/site-1',
                    'development'
                )
            );

            mockLatestVersionResolver.resolvePhp.mockResolvedValue(null);
            mockLatestVersionResolver.resolveWp.mockResolvedValue(null);

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
                latestVersionResolver: mockLatestVersionResolver,
            });

            const response = await request(app).get('/site/1');
            expect(response.status).toBe(200);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'Site retrieved successfully',
                    data: expect.objectContaining({
                        id: 1,
                        name: 'Test Site 1',
                        url: 'https://example.com/site-1',
                        environment: 'development',
                        phpVersion: {
                            installed: '8.0.0',
                            latest: null,
                            diff: null,
                        },
                        wpVersion: {
                            installed: '6.0.0',
                            latest: null,
                            diff: null,
                        },
                    }),
                })
            );
        });

        it('should respond with (400) and { message: "The parameter "siteId" is required and must be a non-empty number", data: null }', async () => {
            const { app } = await setupTestServer();

            const response = await request(app).get('/site/invalid');

            expect(response.status).toBe(400);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'The parameter "siteId" is required and must be a non-empty number',
                    data: null,
                })
            );
        });

        it('should respond with (404) and { message: "A site with the given ID does not exist", data: null }', async () => {
            mockSiteRepository.findById = jest.fn().mockResolvedValue(null);

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
            });

            const response = await request(app).get('/site/1');

            expect(response.status).toBe(404);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'A site with the given ID does not exist',
                    data: null,
                })
            );
        });

        it('should respond with (500) and { message: "Internal server error", data: null }', async () => {
            mockSiteRepository.findById = jest.fn().mockRejectedValue(new Error('Database error'));

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
            });

            const response = await request(app).get('/site/1');

            expect(response.status).toBe(500);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'Internal server error',
                    data: null,
                })
            );
        });
    });

    describe('GET /site/{siteId}/plugins', () => {
        it('should respond with (200) and { message: "Site Plugins retrieved successfully", data: [...] }', async () => {
            mockSiteRepository.findById.mockResolvedValue(
                new Site(
                    1,
                    'Test Site 1',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/site-1',
                    'development'
                )
            );

            mockSiteRepository.findAllSitePlugins.mockResolvedValue([
                new SitePlugin(
                    1,
                    'test-plugin',
                    'Test Plugin',
                    true,
                    { version: '2.0.0', requiredPhpVersion: '8.4', requiredWpVersion: '6.8.1' },
                    { version: '1.0.0', requiredPhpVersion: '7.4', requiredWpVersion: '5.8' }
                ),
            ]);

            mockPluginRepository.findVulnerabilities.mockResolvedValue([
                {
                    id: 1,
                    pluginId: 1,
                    from: { version: '1.0.0', inclusive: true },
                    to: { version: '2.0.0', inclusive: false },
                    score: 5,
                },
                {
                    id: 2,
                    pluginId: 1,
                    from: { version: '1.0.0', inclusive: true },
                    to: { version: '*', inclusive: false },
                    score: 5,
                },
                {
                    id: 3,
                    pluginId: 1,
                    from: { version: '0.1.0', inclusive: true },
                    to: { version: '0.2.0', inclusive: false },
                    score: 5,
                },
                {
                    id: 4,
                    pluginId: 1,
                    from: { version: '1.0.0', inclusive: true },
                    to: { version: 'invalid', inclusive: false },
                    score: 5,
                },
                {
                    id: 5,
                    pluginId: 1,
                    from: { version: '0.1.0', inclusive: true },
                    to: { version: '1.0.0', inclusive: true },
                    score: 5,
                },
            ]);

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
                pluginRepository: mockPluginRepository,
            });

            const response = await request(app).get('/site/1/plugins');

            expect(response.status).toBe(200);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'Site Plugins retrieved successfully',
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            pluginId: 1,
                            name: 'Test Plugin',
                            slug: 'test-plugin',
                            installedVersion: {
                                version: '1.0.0',
                                requiredPhpVersion: '7.4',
                                requiredWpVersion: '5.8',
                            },
                            latestVersion: {
                                version: '2.0.0',
                                requiredPhpVersion: '8.4',
                                requiredWpVersion: '6.8.1',
                            },
                            versionDiff: 'major',
                            isActive: true,
                            vulnerabilities: expect.objectContaining({
                                list: expect.arrayContaining([
                                    {
                                        from: { version: '1.0.0', inclusive: true },
                                        to: { version: '2.0.0', inclusive: false },
                                        score: 5,
                                    },
                                    {
                                        from: { version: '1.0.0', inclusive: true },
                                        to: { version: '*', inclusive: false },
                                        score: 5,
                                    },
                                    {
                                        from: { version: '0.1.0', inclusive: true },
                                        to: { version: '1.0.0', inclusive: true },
                                        score: 5,
                                    },
                                ]),
                                count: 3,
                                highestScore: 5,
                            }),
                        }),
                    ]),
                })
            );
        });

        it('should respond with (200) and { message: "Site Plugins retrieved successfully", data: [...] } - [versions not categorizeable]', async () => {
            mockSiteRepository.findById.mockResolvedValue(
                new Site(
                    1,
                    'Test Site 1',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/site-1',
                    'development'
                )
            );

            mockSiteRepository.findAllSitePlugins.mockResolvedValue([
                new SitePlugin(
                    1,
                    'test-plugin',
                    'Test Plugin',
                    true,
                    { version: null, requiredPhpVersion: null, requiredWpVersion: null },
                    { version: null, requiredPhpVersion: null, requiredWpVersion: null }
                ),
            ]);

            mockPluginRepository.findVulnerabilities.mockResolvedValue([
                {
                    id: 1,
                    pluginId: 1,
                    from: { version: '1.0.0', inclusive: true },
                    to: { version: '2.0.0', inclusive: false },
                    score: 5,
                },
                {
                    id: 2,
                    pluginId: 1,
                    from: { version: '*', inclusive: true },
                    to: { version: '2.0.0', inclusive: false },
                    score: 5,
                },
            ]);

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
                pluginRepository: mockPluginRepository,
            });

            const response = await request(app).get('/site/1/plugins');

            expect(response.status).toBe(200);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'Site Plugins retrieved successfully',
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            pluginId: 1,
                            name: 'Test Plugin',
                            slug: 'test-plugin',
                            installedVersion: {
                                version: null,
                                requiredPhpVersion: null,
                                requiredWpVersion: null,
                            },
                            latestVersion: {
                                version: null,
                                requiredPhpVersion: null,
                                requiredWpVersion: null,
                            },
                            versionDiff: null,
                            isActive: true,
                            vulnerabilities: expect.objectContaining({
                                list: expect.arrayContaining([
                                    {
                                        from: { version: '1.0.0', inclusive: true },
                                        to: { version: '2.0.0', inclusive: false },
                                        score: 5,
                                    },
                                    {
                                        from: { version: '*', inclusive: true },
                                        to: { version: '2.0.0', inclusive: false },
                                        score: 5,
                                    },
                                ]),
                                count: 2,
                                highestScore: 5,
                            }),
                        }),
                    ]),
                })
            );
        });

        it('should respond with (400) and { message: "The parameter "siteId" is required and must be a non-empty number", data: null }', async () => {
            const { app } = await setupTestServer();

            const response = await request(app).get('/site/invalid/plugins');

            expect(response.status).toBe(400);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'The parameter "siteId" is required and must be a non-empty number',
                    data: null,
                })
            );
        });

        it('should respond with (404) and { message: "A site with the given ID does not exist", data: null }', async () => {
            mockSiteRepository.findById = jest.fn().mockResolvedValue(null);

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
            });

            const response = await request(app).get('/site/1/plugins');

            expect(response.status).toBe(404);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'A site with the given ID does not exist',
                    data: null,
                })
            );
        });

        it('should respond with (500) and { message: "Internal server error", data: null }', async () => {
            mockSiteRepository.findById = jest.fn().mockRejectedValue(new Error('Database error'));

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
            });

            const response = await request(app).get('/site/1/plugins');

            expect(response.status).toBe(500);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'Internal server error',
                    data: null,
                })
            );
        });
    });

    describe('POST /site/register', () => {
        it('should respond with (201) and { message: "Site registered successfully", data: {...} }', async () => {
            mockSiteRepository.findByNameAndUrl.mockResolvedValue(null);

            mockSiteRepository.create.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    null,
                    null,
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
            });

            const response = await request(app)
                .post('/site/register')
                .set({ 'Content-Type': 'application/json' })
                .send({
                    name: 'Test Site',
                    url: 'https://example.com/test-site',
                    environment: 'development',
                });

            expect(response.status).toBe(201);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'Site registered successfully',
                    data: expect.objectContaining({
                        id: 1,
                        name: 'Test Site',
                        url: 'https://example.com/test-site',
                        token: 'abc',
                    }),
                })
            );
        });

        it('should respond with (200) and { message: "Site re-registered successfully", data: {...} }', async () => {
            mockSiteRepository.findByNameAndUrl.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    null,
                    null,
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );

            mockSiteRepository.update.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    null,
                    null,
                    'def',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
            });

            const response = await request(app)
                .post('/site/register')
                .set({ 'Content-Type': 'application/json' })
                .send({
                    name: 'Test Site',
                    url: 'https://example.com/test-site',
                    environment: 'development',
                });

            expect(response.status).toBe(200);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'Site re-registered successfully',
                    data: expect.objectContaining({
                        id: 1,
                        name: 'Test Site',
                        url: 'https://example.com/test-site',
                        token: 'def',
                    }),
                })
            );
        });

        it('should respond with (400) and { message: "The field "name" is required and must be a non-empty string", data: null }', async () => {
            const { app } = await setupTestServer();

            const response = await request(app)
                .post('/site/register')
                .set({ 'Content-Type': 'application/json' })
                .send({});

            expect(response.status).toBe(400);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'The field "name" is required and must be a non-empty string',
                    data: null,
                })
            );
        });

        it('should respond with (400) and { message: "The field "url" is required and must be a non-empty string", data: null }', async () => {
            const { app } = await setupTestServer();

            const response = await request(app)
                .post('/site/register')
                .set({ 'Content-Type': 'application/json' })
                .send({ name: 'Test Site' });

            expect(response.status).toBe(400);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'The field "url" is required and must be a non-empty string',
                    data: null,
                })
            );
        });

        it('should respond with (400) and { message: "The field "environment" is required and must be either "production", "staging", or "development"", data: null }', async () => {
            const { app } = await setupTestServer();

            const response = await request(app)
                .post('/site/register')
                .set({ 'Content-Type': 'application/json' })
                .send({ name: 'Test Site', url: 'https://example.com/test-site' });

            expect(response.status).toBe(400);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message:
                        'The field "environment" is required and must be either "production", "staging", or "development"',
                    data: null,
                })
            );
        });

        it('should respond with (500) and { message: "Failed to register site", data: null }', async () => {
            mockSiteRepository.findByNameAndUrl.mockResolvedValue(null);
            mockSiteRepository.create.mockResolvedValue(null);

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
            });

            const response = await request(app)
                .post('/site/register')
                .set({ 'Content-Type': 'application/json' })
                .send({
                    name: 'Test Site',
                    url: 'https://example.com/test-site',
                    environment: 'development',
                });

            expect(response.status).toBe(500);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'Failed to register site',
                    data: null,
                })
            );
        });

        it('should respond with (500) and { message: "Failed to re-register already registered site", data: null }', async () => {
            mockSiteRepository.findByNameAndUrl.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    null,
                    null,
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );
            mockSiteRepository.update.mockResolvedValue(null);

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
            });

            const response = await request(app)
                .post('/site/register')
                .set({ 'Content-Type': 'application/json' })
                .send({
                    name: 'Test Site',
                    url: 'https://example.com/test-site',
                    environment: 'development',
                });

            expect(response.status).toBe(500);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'Failed to re-register already registered site',
                    data: null,
                })
            );
        });

        it('should respond with (500) and { message: "Internal server error", data: null }', async () => {
            mockSiteRepository.findByNameAndUrl.mockRejectedValue(new Error('Database error'));

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });

            const response = await request(app)
                .post('/site/register')
                .set({ 'Content-Type': 'application/json' })
                .send({
                    name: 'Test Site',
                    url: 'https://example.com/test-site',
                    environment: 'development',
                });

            expect(response.status).toBe(500);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'Internal server error',
                    data: null,
                })
            );
        });
    });

    describe('PUT /site/{siteId}/update', () => {
        it('should respond with (200) and { message: "Site updated successfully", data: {...} } - [skip plugin with invalid file]', async () => {
            mockSiteRepository.findById.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );
            mockSiteRepository.update.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );

            mockSiteRepository.findAllSitePlugins.mockResolvedValue([]);

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
                pluginRepository: mockPluginRepository,
            });

            const response = await request(app)
                .put('/site/1/update')
                .set({ 'Content-Type': 'application/json', Authorization: 'Bearer abc' })
                .send({
                    name: 'Test Site',
                    url: 'https://example.com/test-site',
                    phpVersion: '8.0.0',
                    wpVersion: '6.0.0',
                    plugins: [
                        {
                            file: 'invalid',
                            name: 'Test Plugin',
                            active: true,
                            version: { installedVersion: '1.0.0', requiredPhpVersion: '7.4', requiredWpVersion: '5.8' },
                        },
                    ],
                });

            expect(response.status).toBe(200);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'Site updated successfully',
                    data: expect.objectContaining({
                        id: 1,
                        name: 'Test Site',
                        url: 'https://example.com/test-site',
                        phpVersion: '8.0.0',
                        wpVersion: '6.0.0',
                        environment: 'development',
                    }),
                })
            );
        });

        it('should respond with (200) and { message: "Site updated successfully", data: {...} } - [plugin not found after not being created]', async () => {
            mockSiteRepository.findById.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );
            mockSiteRepository.update.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );

            mockPluginRepository.findBySlug.mockResolvedValue(null);
            mockLatestVersionResolver.resolvePlugin.mockResolvedValue({
                version: null,
                requiredPhpVersion: null,
                requiredWpVersion: null,
            });
            mockPluginRepository.create.mockResolvedValue(null);

            mockSiteRepository.findAllSitePlugins.mockResolvedValue([]);

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
                pluginRepository: mockPluginRepository,
                latestVersionResolver: mockLatestVersionResolver,
            });

            const response = await request(app)
                .put('/site/1/update')
                .set({ 'Content-Type': 'application/json', Authorization: 'Bearer abc' })
                .send({
                    name: 'Test Site',
                    url: 'https://example.com/test-site',
                    phpVersion: '8.0.0',
                    wpVersion: '6.0.0',
                    plugins: [
                        {
                            file: 'test-plugin/test-plugin.php',
                            name: 'Test Plugin',
                            active: true,
                            version: { installedVersion: '1.0.0', requiredPhpVersion: '7.4', requiredWpVersion: '5.8' },
                        },
                    ],
                });

            expect(response.status).toBe(200);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'Site updated successfully',
                    data: expect.objectContaining({
                        id: 1,
                        name: 'Test Site',
                        url: 'https://example.com/test-site',
                        phpVersion: '8.0.0',
                        wpVersion: '6.0.0',
                        environment: 'development',
                    }),
                })
            );
        });

        it('should respond with (200) and { message: "Site updated successfully", data: {...} } - [plugin not found after creation]', async () => {
            mockSiteRepository.findById.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );
            mockSiteRepository.update.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );

            mockPluginRepository.findBySlug.mockResolvedValue(null);
            mockLatestVersionResolver.resolvePlugin.mockResolvedValue({
                version: null,
                requiredPhpVersion: null,
                requiredWpVersion: null,
            });
            mockPluginRepository.create.mockResolvedValue(
                new Plugin(1, 'test-plugin', 'Test Plugin', {
                    version: null,
                    requiredPhpVersion: null,
                    requiredWpVersion: null,
                })
            );
            mockPluginRepository.getVulnerabilities.mockResolvedValue([
                { from: { version: '1.0.0', inclusive: true }, to: { version: '2.0.0', inclusive: false }, score: 5 },
            ]);

            mockPluginRepository.deleteAllVulnerabilitiesForPlugin.mockResolvedValue();
            mockPluginRepository.createVulnerability.mockResolvedValue(true);

            mockSiteRepository.findAllSitePlugins.mockResolvedValue([]);

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
                pluginRepository: mockPluginRepository,
                latestVersionResolver: mockLatestVersionResolver,
            });

            const response = await request(app)
                .put('/site/1/update')
                .set({ 'Content-Type': 'application/json', Authorization: 'Bearer abc' })
                .send({
                    name: 'Test Site',
                    url: 'https://example.com/test-site',
                    phpVersion: '8.0.0',
                    wpVersion: '6.0.0',
                    plugins: [
                        {
                            file: 'test-plugin/test-plugin.php',
                            name: 'Test Plugin',
                            active: true,
                            version: { installedVersion: '1.0.0', requiredPhpVersion: '7.4', requiredWpVersion: '5.8' },
                        },
                    ],
                });

            expect(response.status).toBe(200);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'Site updated successfully',
                    data: expect.objectContaining({
                        id: 1,
                        name: 'Test Site',
                        url: 'https://example.com/test-site',
                        phpVersion: '8.0.0',
                        wpVersion: '6.0.0',
                        environment: 'development',
                    }),
                })
            );
        });

        it('should respond with (200) and { message: "Site updated successfully", data: {...} } - [plugin found after creation, but vulnerabilities not an array]', async () => {
            mockSiteRepository.findById.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );
            mockSiteRepository.update.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );

            mockPluginRepository.findBySlug.mockResolvedValue(null);
            mockLatestVersionResolver.resolvePlugin.mockResolvedValue({
                version: null,
                requiredPhpVersion: null,
                requiredWpVersion: null,
            });
            mockPluginRepository.create.mockResolvedValue(
                new Plugin(1, 'test-plugin', 'Test Plugin', {
                    version: null,
                    requiredPhpVersion: null,
                    requiredWpVersion: null,
                })
            );
            mockPluginRepository.getVulnerabilities.mockResolvedValue(null);

            mockSiteRepository.findAllSitePlugins.mockResolvedValue([]);

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
                pluginRepository: mockPluginRepository,
                latestVersionResolver: mockLatestVersionResolver,
            });

            const response = await request(app)
                .put('/site/1/update')
                .set({ 'Content-Type': 'application/json', Authorization: 'Bearer abc' })
                .send({
                    name: 'Test Site',
                    url: 'https://example.com/test-site',
                    phpVersion: '8.0.0',
                    wpVersion: '6.0.0',
                    plugins: [
                        {
                            file: 'test-plugin/test-plugin.php',
                            name: 'Test Plugin',
                            active: true,
                            version: { installedVersion: '1.0.0', requiredPhpVersion: '7.4', requiredWpVersion: '5.8' },
                        },
                    ],
                });

            expect(response.status).toBe(200);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'Site updated successfully',
                    data: expect.objectContaining({
                        id: 1,
                        name: 'Test Site',
                        url: 'https://example.com/test-site',
                        phpVersion: '8.0.0',
                        wpVersion: '6.0.0',
                        environment: 'development',
                    }),
                })
            );
        });

        it('should respond with (200) and { message: "Site updated successfully", data: {...} } - [plugin found, site plugin not found -> create]', async () => {
            mockSiteRepository.findById.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );
            mockSiteRepository.update.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );

            mockPluginRepository.findBySlug.mockResolvedValue(
                new Plugin(1, 'test-plugin', 'Test Plugin', {
                    version: null,
                    requiredPhpVersion: null,
                    requiredWpVersion: null,
                })
            );

            mockSiteRepository.findSitePlugin.mockResolvedValue(null);
            mockSiteRepository.createSitePlugin.mockResolvedValue(
                new SitePlugin(
                    1,
                    'test-plugin',
                    'Test Plugin',
                    true,
                    { version: '1.0.0', requiredPhpVersion: '7.4', requiredWpVersion: '5.8' },
                    { version: '1.0.0', requiredPhpVersion: '7.4', requiredWpVersion: '5.8' }
                )
            );

            mockSiteRepository.findAllSitePlugins.mockResolvedValue([]);

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
                pluginRepository: mockPluginRepository,
            });

            const response = await request(app)
                .put('/site/1/update')
                .set({ 'Content-Type': 'application/json', Authorization: 'Bearer abc' })
                .send({
                    name: 'Test Site',
                    url: 'https://example.com/test-site',
                    phpVersion: '8.0.0',
                    wpVersion: '6.0.0',
                    plugins: [
                        {
                            file: 'test-plugin/test-plugin.php',
                            name: 'Test Plugin',
                            active: true,
                            version: { installedVersion: '1.0.0', requiredPhpVersion: '7.4', requiredWpVersion: '5.8' },
                        },
                    ],
                });

            expect(response.status).toBe(200);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'Site updated successfully',
                    data: expect.objectContaining({
                        id: 1,
                        name: 'Test Site',
                        url: 'https://example.com/test-site',
                        phpVersion: '8.0.0',
                        wpVersion: '6.0.0',
                        environment: 'development',
                    }),
                })
            );
        });

        it('should respond with (200) and { message: "Site updated successfully", data: {...} } - [plugin found, site plugin not found -> create, versions not formattable]', async () => {
            mockSiteRepository.findById.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );
            mockSiteRepository.update.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );

            mockPluginRepository.findBySlug.mockResolvedValue(
                new Plugin(1, 'test-plugin', 'Test Plugin', {
                    version: null,
                    requiredPhpVersion: null,
                    requiredWpVersion: null,
                })
            );

            mockSiteRepository.findSitePlugin.mockResolvedValue(null);
            mockSiteRepository.createSitePlugin.mockResolvedValue(
                new SitePlugin(
                    1,
                    'test-plugin',
                    'Test Plugin',
                    true,
                    { version: '1.0.0', requiredPhpVersion: '7.4', requiredWpVersion: '5.8' },
                    { version: null, requiredPhpVersion: null, requiredWpVersion: null }
                )
            );

            mockSiteRepository.findAllSitePlugins.mockResolvedValue([]);

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
                pluginRepository: mockPluginRepository,
            });

            const response = await request(app)
                .put('/site/1/update')
                .set({ 'Content-Type': 'application/json', Authorization: 'Bearer abc' })
                .send({
                    name: 'Test Site',
                    url: 'https://example.com/test-site',
                    phpVersion: '8.0.0',
                    wpVersion: '6.0.0',
                    plugins: [
                        {
                            file: 'test-plugin/test-plugin.php',
                            name: 'Test Plugin',
                            active: true,
                            version: { installedVersion: null, requiredPhpVersion: null, requiredWpVersion: null },
                        },
                    ],
                });

            expect(response.status).toBe(200);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'Site updated successfully',
                    data: expect.objectContaining({
                        id: 1,
                        name: 'Test Site',
                        url: 'https://example.com/test-site',
                        phpVersion: '8.0.0',
                        wpVersion: '6.0.0',
                        environment: 'development',
                    }),
                })
            );
        });

        it('should respond with (200) and { message: "Site updated successfully", data: {...} } - [plugin found, site plugin not found -> create failed]', async () => {
            mockSiteRepository.findById.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );
            mockSiteRepository.update.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );

            mockPluginRepository.findBySlug.mockResolvedValue(
                new Plugin(1, 'test-plugin', 'Test Plugin', {
                    version: null,
                    requiredPhpVersion: null,
                    requiredWpVersion: null,
                })
            );

            mockSiteRepository.findSitePlugin.mockResolvedValue(null);
            mockSiteRepository.createSitePlugin.mockResolvedValue(null);

            mockSiteRepository.findAllSitePlugins.mockResolvedValue([]);

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
                pluginRepository: mockPluginRepository,
            });

            const response = await request(app)
                .put('/site/1/update')
                .set({ 'Content-Type': 'application/json', Authorization: 'Bearer abc' })
                .send({
                    name: 'Test Site',
                    url: 'https://example.com/test-site',
                    phpVersion: '8.0.0',
                    wpVersion: '6.0.0',
                    plugins: [
                        {
                            file: 'test-plugin/test-plugin.php',
                            name: 'Test Plugin',
                            active: true,
                            version: { installedVersion: '1.0.0', requiredPhpVersion: '7.4', requiredWpVersion: '5.8' },
                        },
                    ],
                });

            expect(response.status).toBe(200);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'Site updated successfully',
                    data: expect.objectContaining({
                        id: 1,
                        name: 'Test Site',
                        url: 'https://example.com/test-site',
                        phpVersion: '8.0.0',
                        wpVersion: '6.0.0',
                        environment: 'development',
                    }),
                })
            );
        });

        it('should respond with (200) and { message: "Site updated successfully", data: {...} } - [plugin found, site plugin found -> update]', async () => {
            mockSiteRepository.findById.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );
            mockSiteRepository.update.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );

            mockPluginRepository.findBySlug.mockResolvedValue(
                new Plugin(1, 'test-plugin', 'Test Plugin', {
                    version: null,
                    requiredPhpVersion: null,
                    requiredWpVersion: null,
                })
            );

            mockSiteRepository.findSitePlugin.mockResolvedValue(
                new SitePlugin(
                    1,
                    'test-plugin',
                    'Test Plugin',
                    true,
                    { version: '1.0.0', requiredPhpVersion: '7.4', requiredWpVersion: '5.8' },
                    { version: '1.0.0', requiredPhpVersion: '7.4', requiredWpVersion: '5.8' }
                )
            );
            mockSiteRepository.updateSitePlugin.mockResolvedValue(
                new SitePlugin(
                    1,
                    'test-plugin',
                    'Test Plugin',
                    true,
                    { version: '1.0.0', requiredPhpVersion: '7.4', requiredWpVersion: '5.8' },
                    { version: '1.0.0', requiredPhpVersion: '7.4', requiredWpVersion: '5.8' }
                )
            );

            mockSiteRepository.findAllSitePlugins.mockResolvedValue([]);

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
                pluginRepository: mockPluginRepository,
            });

            const response = await request(app)
                .put('/site/1/update')
                .set({ 'Content-Type': 'application/json', Authorization: 'Bearer abc' })
                .send({
                    name: 'Test Site',
                    url: 'https://example.com/test-site',
                    phpVersion: '8.0.0',
                    wpVersion: '6.0.0',
                    plugins: [
                        {
                            file: 'test-plugin/test-plugin.php',
                            name: 'Test Plugin',
                            active: true,
                            version: { installedVersion: '1.0.0', requiredPhpVersion: '7.4', requiredWpVersion: '5.8' },
                        },
                    ],
                });

            expect(response.status).toBe(200);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'Site updated successfully',
                    data: expect.objectContaining({
                        id: 1,
                        name: 'Test Site',
                        url: 'https://example.com/test-site',
                        phpVersion: '8.0.0',
                        wpVersion: '6.0.0',
                        environment: 'development',
                    }),
                })
            );
        });

        it('should respond with (200) and { message: "Site updated successfully", data: {...} } - [plugin found, site plugin found -> update, versions not formattable]', async () => {
            mockSiteRepository.findById.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );
            mockSiteRepository.update.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );

            mockPluginRepository.findBySlug.mockResolvedValue(
                new Plugin(1, 'test-plugin', 'Test Plugin', {
                    version: null,
                    requiredPhpVersion: null,
                    requiredWpVersion: null,
                })
            );

            mockSiteRepository.findSitePlugin.mockResolvedValue(
                new SitePlugin(
                    1,
                    'test-plugin',
                    'Test Plugin',
                    true,
                    { version: '1.0.0', requiredPhpVersion: '7.4', requiredWpVersion: '5.8' },
                    { version: null, requiredPhpVersion: null, requiredWpVersion: null }
                )
            );
            mockSiteRepository.updateSitePlugin.mockResolvedValue(
                new SitePlugin(
                    1,
                    'test-plugin',
                    'Test Plugin',
                    true,
                    { version: '1.0.0', requiredPhpVersion: '7.4', requiredWpVersion: '5.8' },
                    { version: null, requiredPhpVersion: null, requiredWpVersion: null }
                )
            );

            mockSiteRepository.findAllSitePlugins.mockResolvedValue([]);

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
                pluginRepository: mockPluginRepository,
            });

            const response = await request(app)
                .put('/site/1/update')
                .set({ 'Content-Type': 'application/json', Authorization: 'Bearer abc' })
                .send({
                    name: 'Test Site',
                    url: 'https://example.com/test-site',
                    phpVersion: '8.0.0',
                    wpVersion: '6.0.0',
                    plugins: [
                        {
                            file: 'test-plugin/test-plugin.php',
                            name: 'Test Plugin',
                            active: true,
                            version: { installedVersion: null, requiredPhpVersion: null, requiredWpVersion: null },
                        },
                    ],
                });

            expect(response.status).toBe(200);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'Site updated successfully',
                    data: expect.objectContaining({
                        id: 1,
                        name: 'Test Site',
                        url: 'https://example.com/test-site',
                        phpVersion: '8.0.0',
                        wpVersion: '6.0.0',
                        environment: 'development',
                    }),
                })
            );
        });

        it('should respond with (200) and { message: "Site updated successfully", data: {...} } - [plugin found, site plugin found -> update failed]', async () => {
            mockSiteRepository.findById.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );
            mockSiteRepository.update.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );

            mockPluginRepository.findBySlug.mockResolvedValue(
                new Plugin(1, 'test-plugin', 'Test Plugin', {
                    version: null,
                    requiredPhpVersion: null,
                    requiredWpVersion: null,
                })
            );

            mockSiteRepository.findSitePlugin.mockResolvedValue(
                new SitePlugin(
                    1,
                    'test-plugin',
                    'Test Plugin',
                    true,
                    { version: '1.0.0', requiredPhpVersion: '7.4', requiredWpVersion: '5.8' },
                    { version: '1.0.0', requiredPhpVersion: '7.4', requiredWpVersion: '5.8' }
                )
            );
            mockSiteRepository.updateSitePlugin.mockResolvedValue(null);

            mockSiteRepository.findAllSitePlugins.mockResolvedValue([]);

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
                pluginRepository: mockPluginRepository,
            });

            const response = await request(app)
                .put('/site/1/update')
                .set({ 'Content-Type': 'application/json', Authorization: 'Bearer abc' })
                .send({
                    name: 'Test Site',
                    url: 'https://example.com/test-site',
                    phpVersion: '8.0.0',
                    wpVersion: '6.0.0',
                    plugins: [
                        {
                            file: 'test-plugin/test-plugin.php',
                            name: 'Test Plugin',
                            active: true,
                            version: { installedVersion: '1.0.0', requiredPhpVersion: '7.4', requiredWpVersion: '5.8' },
                        },
                    ],
                });

            expect(response.status).toBe(200);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'Site updated successfully',
                    data: expect.objectContaining({
                        id: 1,
                        name: 'Test Site',
                        url: 'https://example.com/test-site',
                        phpVersion: '8.0.0',
                        wpVersion: '6.0.0',
                        environment: 'development',
                    }),
                })
            );
        });

        it('should respond with (200) and { message: "Site updated successfully", data: {...} } - [remove unused site plugins]', async () => {
            mockSiteRepository.findById.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );
            mockSiteRepository.update.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );

            mockSiteRepository.findAllSitePlugins.mockResolvedValue([
                new SitePlugin(
                    1,
                    'plugin-1/plugin-1.php',
                    'Test Plugin',
                    true,
                    { version: '1.0.0', requiredPhpVersion: '7.4', requiredWpVersion: '5.8' },
                    { version: '1.0.0', requiredPhpVersion: '7.4', requiredWpVersion: '5.8' }
                ),
                new SitePlugin(
                    2,
                    'plugin-2/plugin-2.php',
                    'Test Plugin',
                    true,
                    { version: '1.0.0', requiredPhpVersion: '7.4', requiredWpVersion: '5.8' },
                    { version: '1.0.0', requiredPhpVersion: '7.4', requiredWpVersion: '5.8' }
                ),
            ]);

            mockSiteRepository.deleteSitePlugin
                .mockResolvedValueOnce(true) // First plugin is removed
                .mockResolvedValueOnce(false); // First plugin could not be removed

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
                pluginRepository: mockPluginRepository,
            });

            const response = await request(app)
                .put('/site/1/update')
                .set({ 'Content-Type': 'application/json', Authorization: 'Bearer abc' })
                .send({
                    name: 'Test Site',
                    url: 'https://example.com/test-site',
                    phpVersion: '8.0.0',
                    wpVersion: '6.0.0',
                    plugins: [],
                });

            expect(response.status).toBe(200);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'Site updated successfully',
                    data: expect.objectContaining({
                        id: 1,
                        name: 'Test Site',
                        url: 'https://example.com/test-site',
                        phpVersion: '8.0.0',
                        wpVersion: '6.0.0',
                        environment: 'development',
                    }),
                })
            );
        });

        it('should respond with (400) and { message: "The parameter "siteId" is required and must be a non-empty number", data: null }', async () => {
            const { app } = await setupTestServer();

            const response = await request(app)
                .put('/site/invalid/update')
                .set({ 'Content-Type': 'application/json' })
                .send({});

            expect(response.status).toBe(400);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'The parameter "siteId" is required and must be a non-empty number',
                    data: null,
                })
            );
        });

        it('should respond with (400) and { message: "The field "name" is required and must be a non-empty string", data: null }', async () => {
            mockSiteRepository.findById.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
            });

            const response = await request(app)
                .put('/site/1/update')
                .set({ 'Content-Type': 'application/json', Authorization: 'Bearer abc' })
                .send({});

            expect(response.status).toBe(400);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'The field "name" is required and must be a non-empty string',
                    data: null,
                })
            );
        });

        it('should respond with (400) and { message: "The field "url" is required and must be a non-empty string", data: null }', async () => {
            mockSiteRepository.findById.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
            });

            const response = await request(app)
                .put('/site/1/update')
                .set({ 'Content-Type': 'application/json', Authorization: 'Bearer abc' })
                .send({ name: 'Test Site' });

            expect(response.status).toBe(400);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'The field "url" is required and must be a non-empty string',
                    data: null,
                })
            );
        });

        it('should respond with (400) and { message: "The field "phpVersion" is required and must be a valid version string", data: null }', async () => {
            mockSiteRepository.findById.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
            });

            const response = await request(app)
                .put('/site/1/update')
                .set({ 'Content-Type': 'application/json', Authorization: 'Bearer abc' })
                .send({ name: 'Test Site', url: 'https://example.com/test-site' });

            expect(response.status).toBe(400);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'The field "phpVersion" is required and must be a valid version string',
                    data: null,
                })
            );
        });

        it('should respond with (400) and { message: "The field "wpVersion" is required and must be a valid version string", data: null }', async () => {
            mockSiteRepository.findById.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
            });

            const response = await request(app)
                .put('/site/1/update')
                .set({ 'Content-Type': 'application/json', Authorization: 'Bearer abc' })
                .send({ name: 'Test Site', url: 'https://example.com/test-site', phpVersion: '8.0.0' });

            expect(response.status).toBe(400);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'The field "wpVersion" is required and must be a valid version string',
                    data: null,
                })
            );
        });

        it('should respond with (400) and { message: "The field "plugins" is required and must be an array", data: null }', async () => {
            mockSiteRepository.findById.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
            });

            const response = await request(app)
                .put('/site/1/update')
                .set({ 'Content-Type': 'application/json', Authorization: 'Bearer abc' })
                .send({
                    name: 'Test Site',
                    url: 'https://example.com/test-site',
                    phpVersion: '8.0.0',
                    wpVersion: '6.0.0',
                });

            expect(response.status).toBe(400);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'The field "plugins" is required and must be an array',
                    data: null,
                })
            );
        });

        it('should respond with (400) and { message: "The field "plugins[0].file" is required and must be a string", data: null }', async () => {
            mockSiteRepository.findById.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
            });

            const response = await request(app)
                .put('/site/1/update')
                .set({ 'Content-Type': 'application/json', Authorization: 'Bearer abc' })
                .send({
                    name: 'Test Site',
                    url: 'https://example.com/test-site',
                    phpVersion: '8.0.0',
                    wpVersion: '6.0.0',
                    plugins: [{}],
                });

            expect(response.status).toBe(400);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'The field "plugins[0].file" is required and must be a string',
                    data: null,
                })
            );
        });

        it('should respond with (400) and { message: "The field "plugins[0].name" is required and must be a string", data: null }', async () => {
            mockSiteRepository.findById.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
            });

            const response = await request(app)
                .put('/site/1/update')
                .set({ 'Content-Type': 'application/json', Authorization: 'Bearer abc' })
                .send({
                    name: 'Test Site',
                    url: 'https://example.com/test-site',
                    phpVersion: '8.0.0',
                    wpVersion: '6.0.0',
                    plugins: [{ file: 'test-plugin.php' }],
                });

            expect(response.status).toBe(400);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'The field "plugins[0].name" is required and must be a string',
                    data: null,
                })
            );
        });

        it('should respond with (400) and { message: "The field "plugins[0].active" is required and must be a boolean", data: null }', async () => {
            mockSiteRepository.findById.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
            });

            const response = await request(app)
                .put('/site/1/update')
                .set({ 'Content-Type': 'application/json', Authorization: 'Bearer abc' })
                .send({
                    name: 'Test Site',
                    url: 'https://example.com/test-site',
                    phpVersion: '8.0.0',
                    wpVersion: '6.0.0',
                    plugins: [{ file: 'test-plugin.php', name: 'Test Plugin' }],
                });

            expect(response.status).toBe(400);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'The field "plugins[0].active" is required and must be a boolean',
                    data: null,
                })
            );
        });

        it('should respond with (400) and { message: "The field "plugins[0].version" is required and must be an object", data: null }', async () => {
            mockSiteRepository.findById.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
            });

            const response = await request(app)
                .put('/site/1/update')
                .set({ 'Content-Type': 'application/json', Authorization: 'Bearer abc' })
                .send({
                    name: 'Test Site',
                    url: 'https://example.com/test-site',
                    phpVersion: '8.0.0',
                    wpVersion: '6.0.0',
                    plugins: [{ file: 'test-plugin.php', name: 'Test Plugin', active: true }],
                });

            expect(response.status).toBe(400);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'The field "plugins[0].version" is required and must be an object',
                    data: null,
                })
            );
        });

        it('should respond with (400) and { message: "The field "plugins[0].version.installedVersion" is required and must be a valid version string or null", data: null }', async () => {
            mockSiteRepository.findById.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
            });

            const response = await request(app)
                .put('/site/1/update')
                .set({ 'Content-Type': 'application/json', Authorization: 'Bearer abc' })
                .send({
                    name: 'Test Site',
                    url: 'https://example.com/test-site',
                    phpVersion: '8.0.0',
                    wpVersion: '6.0.0',
                    plugins: [{ file: 'test-plugin.php', name: 'Test Plugin', active: true, version: {} }],
                });

            expect(response.status).toBe(400);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message:
                        'The field "plugins[0].version.installedVersion" is required and must be a valid version string or null',
                    data: null,
                })
            );
        });

        it('should respond with (400) and { message: "The field "plugins[0].version.requiredPhpVersion" is required and must be a valid version string or null", data: null }', async () => {
            mockSiteRepository.findById.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
            });

            const response = await request(app)
                .put('/site/1/update')
                .set({ 'Content-Type': 'application/json', Authorization: 'Bearer abc' })
                .send({
                    name: 'Test Site',
                    url: 'https://example.com/test-site',
                    phpVersion: '8.0.0',
                    wpVersion: '6.0.0',
                    plugins: [
                        {
                            file: 'test-plugin.php',
                            name: 'Test Plugin',
                            active: true,
                            version: { installedVersion: '1.0.0' },
                        },
                    ],
                });

            expect(response.status).toBe(400);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message:
                        'The field "plugins[0].version.requiredPhpVersion" is required and must be a valid version string or null',
                    data: null,
                })
            );
        });

        it('should respond with (400) and { message: "The field "plugins[0].version.requiredWpVersion" is required and must be a valid version string or null", data: null }', async () => {
            mockSiteRepository.findById.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
            });

            const response = await request(app)
                .put('/site/1/update')
                .set({ 'Content-Type': 'application/json', Authorization: 'Bearer abc' })
                .send({
                    name: 'Test Site',
                    url: 'https://example.com/test-site',
                    phpVersion: '8.0.0',
                    wpVersion: '6.0.0',
                    plugins: [
                        {
                            file: 'test-plugin.php',
                            name: 'Test Plugin',
                            active: true,
                            version: { installedVersion: '1.0.0', requiredPhpVersion: '7.4' },
                        },
                    ],
                });

            expect(response.status).toBe(400);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message:
                        'The field "plugins[0].version.requiredWpVersion" is required and must be a valid version string or null',
                    data: null,
                })
            );
        });

        it('should respond with (401) and { message: "The header "Authorization" is required", data: null }', async () => {
            const { app } = await setupTestServer();

            const response = await request(app)
                .put('/site/1/update')
                .set({ 'Content-Type': 'application/json' })
                .send({});

            expect(response.status).toBe(401);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'The header "Authorization" is required',
                    data: null,
                })
            );
        });

        it('should respond with (403) and { message: "The header "Authorization" is invalid", data: null }', async () => {
            mockSiteRepository.findById.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
            });

            const response = await request(app)
                .put('/site/1/update')
                .set({ 'Content-Type': 'application/json', Authorization: 'Bearer INVALID' })
                .send({});

            expect(response.status).toBe(403);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'The header "Authorization" is invalid',
                    data: null,
                })
            );
        });

        it('should respond with (404) and { message: "A site with the given ID does not exist", data: null }', async () => {
            mockSiteRepository.findById.mockResolvedValue(null);

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
            });

            const response = await request(app)
                .put('/site/1/update')
                .set({ 'Content-Type': 'application/json', Authorization: 'Bearer abc' })
                .send({});

            expect(response.status).toBe(404);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'A site with the given ID does not exist',
                    data: null,
                })
            );
        });

        it('should respond with (500) and { message: "Failed to update site", data: null }', async () => {
            mockSiteRepository.findById.mockResolvedValue(
                new Site(
                    1,
                    'Test Site',
                    '8.0.0',
                    '6.0.0',
                    'abc',
                    new Date(),
                    new Date(),
                    'https://example.com/test-site',
                    'development'
                )
            );

            mockSiteRepository.update.mockResolvedValue(null);

            const { app } = await setupTestServer({
                siteRepository: mockSiteRepository,
            });

            const response = await request(app)
                .put('/site/1/update')
                .set({ 'Content-Type': 'application/json', Authorization: 'Bearer abc' })
                .send({
                    name: 'Test Site',
                    url: 'https://example.com/test-site',
                    phpVersion: '8.0.0',
                    wpVersion: '6.0.0',
                    plugins: [
                        {
                            file: 'test-plugin.php',
                            name: 'Test Plugin',
                            active: true,
                            version: { installedVersion: '1.0.0', requiredPhpVersion: '7.4', requiredWpVersion: '5.8' },
                        },
                    ],
                });

            expect(response.status).toBe(500);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'Failed to update site',
                    data: null,
                })
            );
        });

        it('should respond with (500) and { message: "Internal server error", data: null }', async () => {
            mockSiteRepository.findById.mockRejectedValue(new Error('Database error'));

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });

            const response = await request(app)
                .put('/site/1/update')
                .set({ 'Content-Type': 'application/json', Authorization: 'Bearer abc' })
                .send({
                    name: 'Test Site',
                    url: 'https://example.com/test-site',
                    phpVersion: '8.0.0',
                    wpVersion: '6.0.0',
                    plugins: [
                        {
                            file: 'test-plugin.php',
                            name: 'Test Plugin',
                            active: true,
                            version: { installedVersion: '1.0.0', requiredPhpVersion: '7.4', requiredWpVersion: '5.8' },
                        },
                    ],
                });

            expect(response.status).toBe(500);
            expect(response.body).toEqual(
                expect.objectContaining({
                    message: 'Internal server error',
                    data: null,
                })
            );
        });
    });
});
