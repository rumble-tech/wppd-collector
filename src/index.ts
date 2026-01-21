import IndexController from 'src/controllers/IndexController';
import SiteController from 'src/controllers/SiteController';
import PluginRepository from 'src/repositories/PluginRepository';
import PluginVulnerabilityRepository from 'src/repositories/PluginVulnerabilityRepository';
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
import { pluginsTable, pluginVulnerabilitiesTable, sitePluginsTable, sitesTable } from 'src/services/database/Schema';
import Logger from 'src/services/logger/Logger';
import Scheduler from 'src/services/scheduler/Scheduler';
import Server from 'src/services/server/Server';
import DeleteInactiveSitesTask from 'src/tasks/DeleteInactiveSites';
import DeleteUnusedPluginsTask from 'src/tasks/DeleteUnusedPlugins';
import UpdateLatestPhpVersionTask from 'src/tasks/UpdateLatestPhpVersion';
import UpdateLatestPluginVersionsTask from 'src/tasks/UpdateLatestPluginVersions';
import UpdateLatestWordPressVersionTask from 'src/tasks/UpdateLatestWordPressVersion';
import UpdatePluginVulnerabilitiesTask from 'src/tasks/UpdatePluginVulnerabilities';
import UpdateWordFenceVulnerabilitiesTask from 'src/tasks/UpdateWordFenceVulnerabilities';

Config.load(configSchema);

const logger = new Logger(Config.getLoggerConfig());

Server.setConfig(Config.getServerConfig());
const server = Server.getInstance(logger);

const siteRepository = new SiteRepository(database, sitesTable);
const pluginRepository = new PluginRepository(database, pluginsTable);
const sitePluginRepository = new SitePluginRepository(database, sitePluginsTable);
const pluginVulnerabilityRepository = new PluginVulnerabilityRepository(database, pluginVulnerabilitiesTable);

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
scheduler.addTask('update-wordfence-vulnerabilities', '*/30 * * * *', () =>
    new UpdateWordFenceVulnerabilitiesTask(logger, wordfenceVulnerabilitiesProvider).run()
);
scheduler.addTask('update-latest-plugin-versions', '*/30 * * * *', () =>
    new UpdateLatestPluginVersionsTask(logger, pluginRepository, latestVersionResolver).run()
);
scheduler.addTask('update-plugin-vulnerabilities', '*/30 * * * *', () =>
    new UpdatePluginVulnerabilitiesTask(
        logger,
        pluginRepository,
        pluginVulnerabilityRepository,
        vulnerabilitiesResolver
    ).run()
);
scheduler.addTask('delete-inactive-sites', '0 12 */7 * *', () =>
    new DeleteInactiveSitesTask(logger, siteRepository).run()
);
scheduler.addTask('delete-unused-plugins', '0 12 * * *', () =>
    new DeleteUnusedPluginsTask(logger, pluginRepository, sitePluginRepository).run()
);

(async () => {
    await latestPhpRuntimeVersionProvider.fetch();
    await latestWordPressRuntimeVersionProvider.fetch();
    await wordfenceVulnerabilitiesProvider.fetch();
})();
