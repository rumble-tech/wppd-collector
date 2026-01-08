import IndexController from 'src/controllers/IndexController';
import SiteController from 'src/controllers/SiteController';
import SiteRepository from 'src/repositories/SiteRepository';
import LatestVersionResolver from 'src/resolver/latest-version/LatestVersionResolver';
import Config from 'src/services/config/Config';
import Logger from 'src/services/logger/Logger';
import Server from 'src/services/server/Server';

export async function setupTestServer({
    logger = new Logger({
        level: 'silly',
        directory: process.cwd() + '/logger',
    }),
    siteRepository = {} as jest.Mocked<SiteRepository>,
    latestVersionResolver = {} as jest.Mocked<LatestVersionResolver>,
}: {
    logger?: Logger;
    siteRepository?: jest.Mocked<SiteRepository>;
    latestVersionResolver?: jest.Mocked<LatestVersionResolver>;
} = {}) {
    logger.info = jest.fn();
    logger.warn = jest.fn();
    logger.error = jest.fn();
    logger.debug = jest.fn();
    logger.silly = jest.fn();

    Config.load({
        NODE_ENV: {
            type: 'string',
            required: true,
        },
        npm_package_version: {
            type: 'string',
            required: true,
        },
    });

    Server.setConfig({ port: 0, corsOptions: {} });
    Server.unsetInstance();

    const serverInstance = Server.getInstance(logger);
    serverInstance.registerController(new IndexController(logger));
    serverInstance.registerController(new SiteController(logger, siteRepository, latestVersionResolver));

    const app = serverInstance.getApp();
    return { app, server: serverInstance };
}
