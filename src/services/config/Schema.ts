import { TConfigSchema } from 'src/services/config/Types';

export default {
    NODE_ENV: {
        type: 'string',
        required: true,
    },
    TZ: {
        type: 'string',
        required: true,
    },
    LOG_LEVEL: {
        type: 'string',
        required: true,
    },
    CORS_WHITELIST: {
        type: 'string',
        required: true,
    },
    npm_package_version: {
        type: 'string',
        required: true,
    },
    PHP_VERSION_API: {
        type: 'string',
        required: true,
    },
    WP_VERSION_API: {
        type: 'string',
        required: true,
    },
    WP_PLUGIN_VERSION_API: {
        type: 'string',
        required: true,
    },
} as TConfigSchema;
