// src/testUtils/setupServer.ts
import type { LoggerInterface } from 'src/components/logger/LoggerInterface';
import Server from 'src/components/server/Server';
import IndexController from 'src/controllers/IndexController';

const mockLogger: LoggerInterface = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    silly: jest.fn(),
};

export async function setupTestServer() {
    Server.setConfig({ port: 0, corsOptions: {} });

    const serverInstance = Server.getInstance(mockLogger);
    serverInstance.useRouter('/', new IndexController(mockLogger).getRouter());

    const app = serverInstance.getApp();
    return { app, server: serverInstance };
}
