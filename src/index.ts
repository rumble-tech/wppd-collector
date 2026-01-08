import IndexController from 'src/controllers/IndexController';
import SiteController from 'src/controllers/SiteController';
import SiteRepository from 'src/repositories/SiteRepository';
import LatestVersionResolver from 'src/resolver/latest-version/LatestVersionResolver';
import LatestPhpRuntimeVersionProvider from 'src/resolver/latest-version/providers/runtime/PHP';
import LatestWordPressRuntimeVersionProvider from 'src/resolver/latest-version/providers/runtime/WordPress';
import Config from 'src/services/config/Config';
import configSchema from 'src/services/config/Schema';
import { database } from 'src/services/database/Database';
import { sitesTable } from 'src/services/database/Schema';
import Logger from 'src/services/logger/Logger';
import Scheduler from 'src/services/scheduler/Scheduler';
import Server from 'src/services/server/Server';

Config.load(configSchema);

const logger = new Logger(Config.getLoggerConfig());

Server.setConfig(Config.getServerConfig());
const server = Server.getInstance(logger);

const siteRepository = new SiteRepository(database, sitesTable);

const latestPhpRuntimeVersionProvider = new LatestPhpRuntimeVersionProvider();
const latestWordPressRuntimeVersionProvider = new LatestWordPressRuntimeVersionProvider();

const latestVersionResolver = new LatestVersionResolver(
    latestPhpRuntimeVersionProvider,
    latestWordPressRuntimeVersionProvider
);

server.registerController(new IndexController(logger));
server.registerController(new SiteController(logger, siteRepository, latestVersionResolver));
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
scheduler.addTask('ExampleTask', '*/5 * * * * *', async () => null);

(async () => {
    await latestPhpRuntimeVersionProvider.fetch();
    await latestWordPressRuntimeVersionProvider.fetch();
})();
