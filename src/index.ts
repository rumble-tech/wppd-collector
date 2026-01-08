import IndexController from 'src/controllers/IndexController';
import SiteController from 'src/controllers/SiteController';
import SiteRepository from 'src/repositories/SiteRepository';
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

server.registerController(new IndexController(logger));
server.registerController(new SiteController(logger, siteRepository));
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
