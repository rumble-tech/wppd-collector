import IndexController from 'src/controllers/IndexController';
import SiteController from 'src/controllers/SiteController';
import PluginRepository from 'src/repositories/PluginRepository';
import PluginVulnerabilityRepository from 'src/repositories/PluginVulnerabilityRepository';
import SitePluginRepository from 'src/repositories/SitePluginRepository';
import SiteRepository from 'src/repositories/SiteRepository';
import LatestVersionResolver from 'src/resolver/latest-version/LatestVersionResolver';
import VulnerabilitiesResolver from 'src/resolver/vulnerabilities/VulnerabilitiesResolver';
import Config from 'src/services/config/Config';
import Logger from 'src/services/logger/Logger';
import Server from 'src/services/server/Server';

export async function setupTestServer({
    logger = new Logger({
        level: 'silly',
        directory: process.cwd() + '/logger',
    }),
    siteRepository = {} as jest.Mocked<SiteRepository>,
    pluginRepository = {} as jest.Mocked<PluginRepository>,
    sitePluginRepository = {} as jest.Mocked<SitePluginRepository>,
    pluginVulnerabilityRepository = {} as jest.Mocked<PluginVulnerabilityRepository>,
    latestVersionResolver = {} as jest.Mocked<LatestVersionResolver>,
    vulnerabilitiesResolver = {} as jest.Mocked<VulnerabilitiesResolver>,
}: {
    logger?: Logger;
    siteRepository?: jest.Mocked<SiteRepository>;
    pluginRepository?: jest.Mocked<PluginRepository>;
    sitePluginRepository?: jest.Mocked<SitePluginRepository>;
    pluginVulnerabilityRepository?: jest.Mocked<PluginVulnerabilityRepository>;
    latestVersionResolver?: jest.Mocked<LatestVersionResolver>;
    vulnerabilitiesResolver?: jest.Mocked<VulnerabilitiesResolver>;
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
    });

    Server.setConfig({ port: 0, corsOptions: {} });
    Server.unsetInstance();

    const serverInstance = Server.getInstance(logger);
    serverInstance.registerController(new IndexController(logger));
    serverInstance.registerController(
        new SiteController(
            logger,
            siteRepository,
            pluginRepository,
            sitePluginRepository,
            pluginVulnerabilityRepository,
            latestVersionResolver,
            vulnerabilitiesResolver
        )
    );

    const app = serverInstance.getApp();
    return { app, server: serverInstance };
}
