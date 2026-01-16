import IndexController from 'src/controllers/IndexController';
import SiteController from 'src/controllers/SiteController';
import PluginRepository from 'src/repositories/PluginRepository';
import SitePluginRepository from 'src/repositories/SitePluginRepository';
import SiteRepository from 'src/repositories/SiteRepository';
import LatestVersionResolver from 'src/resolver/latest-version/LatestVersionResolver';
import LatestWordPressApiPluginVersionProvider from 'src/resolver/latest-version/providers/plugin/WordPressApi';
import LatestPhpRuntimeVersionProvider from 'src/resolver/latest-version/providers/runtime/PHP';
import LatestWordPressRuntimeVersionProvider from 'src/resolver/latest-version/providers/runtime/WordPress';
import WordFenceApiVulnerabilitiesProvider from 'src/resolver/vulnerabilities/providers/plugin/WordFenceApi';
import VulnerabilitiesResolver from 'src/resolver/vulnerabilities/VulnerabilitiesResolver';
import Config from 'src/services/config/Config';
import configSchema from 'src/services/config/Schema';
import { database } from 'src/services/database/Database';
import { pluginsTable, sitePluginsTable, sitesTable } from 'src/services/database/Schema';
import Logger from 'src/services/logger/Logger';
import Scheduler from 'src/services/scheduler/Scheduler';
import Server from 'src/services/server/Server';
import UpdateLatestPhpVersionTask from 'src/tasks/UpdateLatestPhpVersion';
import UpdateLatestPluginVersionsTask from 'src/tasks/UpdateLatestPluginVersions';
import UpdateLatestWordPressVersionTask from 'src/tasks/UpdateLatestWordPressVersion';

Config.load(configSchema);

const logger = new Logger(Config.getLoggerConfig());

Server.setConfig(Config.getServerConfig());
const server = Server.getInstance(logger);

const siteRepository = new SiteRepository(database, sitesTable);
const pluginRepository = new PluginRepository(database, pluginsTable);
const sitePluginRepository = new SitePluginRepository(database, sitePluginsTable);

const latestPhpRuntimeVersionProvider = new LatestPhpRuntimeVersionProvider();
const latestWordPressRuntimeVersionProvider = new LatestWordPressRuntimeVersionProvider();
const latestWordPressApiPluginVersionProvider = new LatestWordPressApiPluginVersionProvider();

const latestVersionResolver = new LatestVersionResolver(
    latestPhpRuntimeVersionProvider,
    latestWordPressRuntimeVersionProvider,
    [latestWordPressApiPluginVersionProvider]
);

const wordfenceVulnerabilitiesProvider = new WordFenceApiVulnerabilitiesProvider();

const vulnerabilitiesResolver = new VulnerabilitiesResolver([wordfenceVulnerabilitiesProvider]);

server.registerController(new IndexController(logger));
server.registerController(
    new SiteController(logger, siteRepository, pluginRepository, sitePluginRepository, latestVersionResolver)
);
server
    .start()
    .then(() => {
        logger.info('Successfully started server');
    })
    .catch((err) => {
        logger.error('Failed to start server', { err });
        process.exit(1);
    });

const scheduler = Scheduler.getInstance(logger);
scheduler.addTask('update-latest-php-version', '*/30 * * * *', () =>
    new UpdateLatestPhpVersionTask(logger, latestPhpRuntimeVersionProvider).run()
);
scheduler.addTask('update-latest-wordpress-version', '*/30 * * * *', () =>
    new UpdateLatestWordPressVersionTask(logger, latestWordPressRuntimeVersionProvider).run()
);
scheduler.addTask('update-latest-plugin-versions', '*/30 * * * *', () =>
    new UpdateLatestPluginVersionsTask(logger, pluginRepository, latestVersionResolver).run()
);

(async () => {
    await wordfenceVulnerabilitiesProvider.fetchVulnerabilities();
})();
