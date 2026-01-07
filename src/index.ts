import Config from 'src/services/config/Config';
import configSchema from 'src/services/config/Schema';
import Logger from 'src/services/logger/Logger';

Config.load(configSchema);

const logger = new Logger(Config.getLoggerConfig());

logger.info('Application started', {
    NODE_NEV: Config.get<string>('NODE_ENV'),
    TZ: Config.get<string>('TZ'),
});
