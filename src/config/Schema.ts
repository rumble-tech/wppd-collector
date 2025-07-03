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
    CORS_WHITELIST: {
        type: 'string',
        required: true,
    },
    WP_PLUGIN_API_URL: {
        type: 'string',
        required: false,
        defaultValue: 'https://api.wordpress.org/plugins/info/1.0',
    },
    MAILING_ENABLED: {
        type: 'boolean',
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
    MAILING_SES_SECRET_ACCESS_KEY: {
        type: 'string',
        required: false,
    },
    MAILING_REPORT_SENDER: {
        type: 'string',
        required: false,
    },
    MAILING_REPORT_RECIPIENT: {
        type: 'string',
        required: false,
    },
    WORDFENCE_API_URL: {
        type: 'string',
        required: false,
    },
};

export default schema;
