import IndexController from 'src/controllers/IndexController';
import Config from 'src/services/config/Config';
import configSchema from 'src/services/config/Schema';
import Logger from 'src/services/logger/Logger';
import Scheduler from 'src/services/scheduler/Scheduler';
import Server from 'src/services/server/Server';

Config.load(configSchema);

const logger = new Logger(Config.getLoggerConfig());

Server.setConfig(Config.getServerConfig());
const server = Server.getInstance(logger);

server.registerController(new IndexController(logger));
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
