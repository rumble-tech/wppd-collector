import request from 'supertest';
import { setupTestServer } from 'test-utils/setup-server';

describe('IndexController', () => {
    let app: Express.Application;

    beforeAll(async () => {
        const { app: _app } = await setupTestServer();
        app = _app;
    });

    it('should return 200 with welcome message', async () => {
        const response = await request(app).get('/');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            message: 'Welcome to the API',
            data: {
                version: process.env.npm_package_version,
            },
        });
    });
});
