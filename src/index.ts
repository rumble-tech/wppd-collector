import Config from 'src/config/Config';
import ConfigSchema from 'src/config/Schema';

Config.load(ConfigSchema);
console.log(Config.get<string>('NODE_ENV'));
