import Config from 'src/config/Config';
import ConfigSchema from 'src/config/Schema';
import Logger from 'src/components/Logger';

Config.load(ConfigSchema);
Logger.setConfig(Config.getLoggerConfig());
Logger.init();

Logger.app.info('Application started');
