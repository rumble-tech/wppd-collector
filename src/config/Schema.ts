import { ConfigSchema } from 'src/config/Types';

const schema: ConfigSchema = {
    NODE_ENV: {
        type: 'string',
        required: true,
    },
    LOG_LEVEL: {
        type: 'string',
        required: false,
        defaultValue: 'info',
    },
    LOG_DIRECTORY: {
        type: 'string',
        required: false,
        defaultValue: '/app/logs',
    },
};

export default schema;
