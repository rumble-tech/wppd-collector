// src/testUtils/setupServer.ts
import type { LoggerInterface } from 'src/components/logger/LoggerInterface';
import Server from 'src/components/server/Server';
import IndexController from 'src/controllers/IndexController';
import SiteController from 'src/controllers/SiteController';
import PluginRepository from 'src/repositories/PluginRepository';
import SiteRepository from 'src/repositories/SiteRepository';
import LatestVersionResolver from 'src/services/latest-version/LatestVersionResolver';

export async function setupTestServer({
    logger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        silly: jest.fn(),
    } as LoggerInterface,
    siteRepository = {} as jest.Mocked<SiteRepository>,
    pluginRepository = {} as jest.Mocked<PluginRepository>,
    latestVersionResolver = {} as jest.Mocked<LatestVersionResolver>,
}: {
    logger?: LoggerInterface;
    siteRepository?: jest.Mocked<SiteRepository>;
    pluginRepository?: jest.Mocked<PluginRepository>;
    latestVersionResolver?: jest.Mocked<LatestVersionResolver>;
} = {}) {
    Server.setConfig({ port: 0, corsOptions: {} });
    Server.resetInstance();

    const serverInstance = Server.getInstance(logger);
    serverInstance.useRouter('/', new IndexController(logger).getRouter());
    serverInstance.useRouter(
        '/site',
        new SiteController(logger, siteRepository, pluginRepository, latestVersionResolver).getRouter()
    );

    const app = serverInstance.getApp();
    return { app, server: serverInstance };
}
