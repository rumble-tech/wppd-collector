import Logger from 'src/components/Logger';
import Server from 'src/components/server/Server';
import Config from 'src/config/Config';
import ConfigSchema from 'src/config/Schema';
import IndexController from 'src/controllers/IndexController';
import SiteController from 'src/controllers/SiteController';
import SiteRepository from 'src/repositories/SiteRepository';
import PluginRepository from 'src/repositories/PluginRepository';
import { db } from 'src/components/database/Database';
import { sitesTable, pluginsTable } from 'src/components/database/Schema';

Config.load(ConfigSchema);

Logger.setConfig(Config.getLoggerConfig());
const logger = new Logger();

Server.setConfig(Config.getServerConfig());
const server = Server.getInstance(logger);

const siteRepository = new SiteRepository(db, sitesTable);
const pluginRepository = new PluginRepository(db, pluginsTable);

const indexController = new IndexController(logger);
const siteController = new SiteController(logger, siteRepository, pluginRepository);

server.useRouter('/', indexController.getRouter());
server.useRouter('/site', siteController.getRouter());
server
    .start()
    .then(() => {
        logger.app.info('Server started successfully');
    })
    .catch((error) => {
        logger.app.error('Failed to start server:', error);
        process.exit(1);
    });
