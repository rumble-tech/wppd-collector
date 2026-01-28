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
    MAILING_SES_REGION: {
        type: 'string',
        required: false,
    },
    MAILING_SES_ACCESS_KEY_ID: {
        type: 'string',
        required: false,
    },
    MAILING_SES_ACCESS_KEY_SECRET: {
        type: 'string',
        required: false,
    },
    MAILING_REPORT_ENABLED: {
        type: 'boolean',
        required: true,
    },
    MAILING_REPORT_SENDER: {
        type: 'string',
        required: false,
    },
    MAILING_REPORT_RECIPIENT: {
        type: 'string',
        required: false,
    },
} as TConfigSchema;
