import Config from 'src/services/config/Config';
import configSchema from 'src/services/config/Schema';

Config.load(configSchema);

console.log('Application started', {
    NODE_NEV: Config.get<string>('NODE_ENV'),
    TZ: Config.get<string>('TZ'),
});
