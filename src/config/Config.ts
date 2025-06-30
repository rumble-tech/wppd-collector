import { ConfigSchema } from 'src/config/Types';

export default class Config {
    private static values: Record<string, string | number | boolean | undefined> = {};

    public static load(schema: ConfigSchema): void {
        for (const key of Object.keys(schema)) {
            const definition = schema[key];
            const rawValue = process.env[key];

            if (rawValue === undefined) {
                if (definition.required) {
                    throw new Error(`missing required environment variable: ${key}`);
                }

                Config.values[key] = definition.defaultValue;
                continue;
            }

            switch (definition.type) {
                case 'string': {
                    Config.values[key] = rawValue;
                    break;
                }
                case 'number': {
                    const numberValue = Number(rawValue);
                    if (isNaN(numberValue)) {
                        throw new Error(`invalid value for environment variable: ${key} - expected: number`);
                    }

                    Config.values[key] = numberValue;
                    break;
                }
                case 'boolean': {
                    const lowerRawValue = rawValue.toLowerCase();

                    if (lowerRawValue !== 'true' && lowerRawValue !== 'false') {
                        throw new Error(`invalid value for environment variable: ${key} - expected: boolean`);
                    }

                    Config.values[key] = lowerRawValue === 'true';
                    break;
                }
                default: {
                    throw new Error(`Unknown type for environment variable: ${key}`);
                }
            }
        }
    }

    public static get<T extends string | number | boolean>(key: string): T {
        const value = Config.values[key];

        if (value === undefined) {
            throw new Error(`missing required environment variable: ${key}`);
        }

        return value as T;
    }
}
