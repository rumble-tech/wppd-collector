import request from 'supertest';
import { setupTestServer } from 'test-utils/setup-server';

describe('IndexController', () => {
    it('should respond with (200) and { message: "Welcome to the API", data: { ... } }', async () => {
        const { app } = await setupTestServer();
        const response = await request(app).get('/');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            message: 'Welcome to the API',
            data: {
                version: process.env.npm_package_version,
            },
        });
    });

    it('should respond with (404) and { message: "Route not found: GET /invalid", data: null }', async () => {
        const { app } = await setupTestServer();
        const response = await request(app).get('/invalid');

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            message: 'Route not found: GET /invalid',
            data: null,
        });
    });
});
