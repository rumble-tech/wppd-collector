import Logger from 'src/components/Logger';
import Server from 'src/components/server/Server';
import Config from 'src/config/Config';
import ConfigSchema from 'src/config/Schema';
import IndexController from 'src/controllers/IndexController';

Config.load(ConfigSchema);

Logger.setConfig(Config.getLoggerConfig());
Logger.init();

Server.setConfig(Config.getServerConfig());
const server = Server.getInstance();

server.useRouter('/', new IndexController().getRouter());
server
    .start()
    .then(() => {
        Logger.app.info('Server started successfully');
    })
    .catch((error) => {
        Logger.app.error('Failed to start server:', error);
        process.exit(1);
    });
