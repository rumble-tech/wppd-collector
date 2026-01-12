import Site from 'src/entities/Site';
import SiteRepository from 'src/repositories/SiteRepository';
import LatestVersionResolver from 'src/resolver/latest-version/LatestVersionResolver';
import request from 'supertest';
import { setupTestServer } from 'test-utils/SetupServer';

describe('SiteController', () => {
    let mockSiteRepository: jest.Mocked<SiteRepository>;
    let mockLatestVersionResolver: jest.Mocked<LatestVersionResolver>;

    beforeEach(() => {
        mockSiteRepository = {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByNameAndUrl: jest.fn(),
            insert: jest.fn(),
            update: jest.fn(),
        } as unknown as jest.Mocked<SiteRepository>;

        mockLatestVersionResolver = {
            resolvePhp: jest.fn(),
            resolveWordPress: jest.fn(),
        } as unknown as jest.Mocked<LatestVersionResolver>;

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
            mockSiteRepository.findAll.mockRejectedValue(new Error('Database error'));

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app).get(requestConfig.url);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                message: 'Database error',
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
            mockSiteRepository.findById.mockRejectedValue(new Error('Database error'));

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app).get(requestConfig.url);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                message: 'Database error',
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

        it('should respond with (400) and { message: "The Field "name" is required and must be a non-empty string", data: null }', async () => {
            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app).post(requestConfig.url).set(requestConfig.headers).send({});

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'The field "name" is required and must be a non-empty string',
                data: null,
            });
        });

        it('should respond with (400) and { message: "The Field "url" is required and must be a non-empty string", data: null }', async () => {
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
            mockSiteRepository.findByNameAndUrl.mockRejectedValue(new Error('Database error'));

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app)
                .post(requestConfig.url)
                .set(requestConfig.headers)
                .send(requestConfig.body);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                message: 'Database error',
                data: null,
            });
        });
    });
});
