import Logger from 'src/components/Logger';
import Server from 'src/components/server/Server';
import Config from 'src/config/Config';
import ConfigSchema from 'src/config/Schema';
import IndexController from 'src/controllers/IndexController';

Config.load(ConfigSchema);

Logger.setConfig(Config.getLoggerConfig());
const logger = new Logger();

Server.setConfig(Config.getServerConfig());
const server = Server.getInstance(logger);


const indexController = new IndexController(logger);

server.useRouter('/', indexController.getRouter());
server
    .start()
    .then(() => {
        logger.app.info('Server started successfully');
    })
    .catch((error) => {
        logger.app.error('Failed to start server:', error);
        process.exit(1);
    });
