import Site from 'src/entities/Site';
import SiteRepository from 'src/repositories/SiteRepository';
import request from 'supertest';
import { setupTestServer } from 'test-utils/SetupServer';

describe('SiteController', () => {
    let mockSiteRepository: jest.Mocked<SiteRepository>;

    beforeEach(async () => {
        mockSiteRepository = {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByNameAndUrl: jest.fn(),
            insert: jest.fn(),
            update: jest.fn(),
        } as unknown as jest.Mocked<SiteRepository>;
    });

    describe('GET /site', () => {
        const sitePayload = {
            id: 1,
            createdAt: new Date('2026-01-01T00:00:00Z'),
            updatedAt: new Date('2026-01-02T00:00:00Z'),
            name: 'Site1',
            url: 'https://example.com/site1',
            apiKey: 'api-key-1',
            environment: 'development',
            phpVersion: '8.5',
            wpVersion: '6.9',
        } as const;

        it('should respond with (200) and { message: "Successfully retrieved all sites", data: [...] }', async () => {
            mockSiteRepository.findAll.mockResolvedValue([new Site(sitePayload)]);

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app).get('/site');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'Successfully retrieved all sites',
                data: [
                    {
                        id: sitePayload.id,
                        name: sitePayload.name,
                        url: sitePayload.url,
                        environment: sitePayload.environment,
                    },
                ],
            });
        });

        it('should respond with (500) and { message: "Database Error", data: null }', async () => {
            mockSiteRepository.findAll.mockRejectedValue(new Error('Database error'));

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app).get('/site');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                message: 'Database error',
                data: null,
            });
        });
    });

    describe('GET /site/{siteId}', () => {
        const sitePayload = {
            id: 1,
            createdAt: new Date('2026-01-01T00:00:00Z'),
            updatedAt: new Date('2026-01-02T00:00:00Z'),
            name: 'Site1',
            url: 'https://example.com/site1',
            apiKey: 'api-key-1',
            environment: 'development',
            phpVersion: '8.5',
            wpVersion: '6.9',
        } as const;

        it('should respond with (200) and { message: "Successfully retrieved site", data: [...] }', async () => {
            mockSiteRepository.findById.mockResolvedValue(new Site(sitePayload));

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app).get(`/site/${sitePayload.id}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'Successfully retrieved site',
                data: {
                    id: sitePayload.id,
                    name: sitePayload.name,
                    url: sitePayload.url,
                    environment: sitePayload.environment,
                    phpVersion: sitePayload.phpVersion,
                    wpVersion: sitePayload.wpVersion,
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

        it('should respond with (404) and { message: "Failed to find site with the given Id", data: null }', async () => {
            mockSiteRepository.findById.mockResolvedValue(null);

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app).get(`/site/${sitePayload.id}`);

            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                message: 'Failed to find site with the given Id',
                data: null,
            });
        });

        it('should respond with (500) and { message: "Database Error", data: null }', async () => {
            mockSiteRepository.findById.mockRejectedValue(new Error('Database error'));

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app).get(`/site/${sitePayload.id}`);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                message: 'Database error',
                data: null,
            });
        });
    });

    describe('POST /site', () => {
        const sitePayload = {
            id: 1,
            createdAt: new Date('2026-01-01T00:00:00Z'),
            updatedAt: new Date('2026-01-01T00:00:00Z'),
            name: 'Site1',
            url: 'https://example.com/site1',
            apiKey: 'api-key-1',
            environment: 'development',
            phpVersion: '8.5',
            wpVersion: '6.9',
        } as const;

        it('should respond with (200) and { message: "Successfully registered site", data: { ... } }', async () => {
            mockSiteRepository.findByNameAndUrl.mockResolvedValue(null);
            mockSiteRepository.insert.mockResolvedValue(new Site(sitePayload));

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app).post('/site').set({ 'Content-Type': 'application/json' }).send({
                name: sitePayload.name,
                url: sitePayload.url,
                environment: sitePayload.environment,
            });

            expect(response.status).toBe(201);
            expect(response.body).toEqual({
                message: 'Successfully registered site',
                data: {
                    id: sitePayload.id,
                    name: sitePayload.name,
                    url: sitePayload.url,
                    apiKey: sitePayload.apiKey,
                    environment: sitePayload.environment,
                },
            });
        });

        it('should respond with (200) and { message: "Successfully re-registered site", data: { ... } }', async () => {
            mockSiteRepository.findByNameAndUrl.mockResolvedValue(new Site(sitePayload));
            mockSiteRepository.update.mockResolvedValue(new Site(sitePayload));

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app).post('/site').set({ 'Content-Type': 'application/json' }).send({
                name: sitePayload.name,
                url: sitePayload.url,
                environment: sitePayload.environment,
            });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'Successfully re-registered site',
                data: {
                    id: sitePayload.id,
                    name: sitePayload.name,
                    url: sitePayload.url,
                    apiKey: sitePayload.apiKey,
                    environment: sitePayload.environment,
                },
            });
        });

        it('should respond with (400) and { message: "The Field "name" is required and must be a non-empty string", data: null }', async () => {
            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app).post('/site').set({ 'Content-Type': 'application/json' }).send({});

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'The field "name" is required and must be a non-empty string',
                data: null,
            });
        });

        it('should respond with (400) and { message: "The Field "url" is required and must be a non-empty string", data: null }', async () => {
            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app).post('/site').set({ 'Content-Type': 'application/json' }).send({
                name: 'Site1',
            });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'The field "url" is required and must be a non-empty string',
                data: null,
            });
        });

        it('should respond with (400) and { message: "The field "environment" is required and must either be "production", "staging" or "development"", data: null }', async () => {
            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app).post('/site').set({ 'Content-Type': 'application/json' }).send({
                name: 'Site1',
                url: 'https://example.com/site1',
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
            const response = await request(app).post('/site').set({ 'Content-Type': 'application/json' }).send({
                name: 'Site1',
                url: 'https://example.com/site1',
                environment: 'development',
            });

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                message: 'Failed to create site',
                data: null,
            });
        });

        it('should respond with (500) and { message: "Failed to update site", data: null }', async () => {
            mockSiteRepository.findByNameAndUrl.mockResolvedValue(
                new Site({
                    id: 1,
                    createdAt: new Date('2026-01-01T00:00:00Z'),
                    updatedAt: new Date('2026-01-01T00:00:00Z'),
                    name: 'Site1',
                    url: 'https://example.com/site1',
                    apiKey: 'api-key-1',
                    environment: 'development',
                    phpVersion: '8.5',
                    wpVersion: '6.9',
                })
            );
            mockSiteRepository.update.mockResolvedValue(null);

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app).post('/site').set({ 'Content-Type': 'application/json' }).send({
                name: 'Site1',
                url: 'https://example.com/site1',
                environment: 'development',
            });

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                message: 'Failed to update site',
                data: null,
            });
        });

        it('should respond with (500) and { message: "Database Error", data: null }', async () => {
            mockSiteRepository.findByNameAndUrl.mockRejectedValue(new Error('Database error'));

            const { app } = await setupTestServer({ siteRepository: mockSiteRepository });
            const response = await request(app).post('/site').set({ 'Content-Type': 'application/json' }).send({
                name: 'Site1',
                url: 'https://example.com/site1',
                environment: 'development',
            });

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                message: 'Database error',
                data: null,
            });
        });
    });
});
