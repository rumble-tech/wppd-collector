import { ConfigSchema } from 'src/config/Types';

const schema: ConfigSchema = {
    NODE_ENV: {
        type: 'string',
        required: true,
    },
};

export default schema;
