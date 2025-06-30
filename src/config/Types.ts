type ConfigField =
    | {
          type: 'string';
          required: boolean;
          defaultValue?: string;
      }
    | {
          type: 'number';
          required: boolean;
          defaultValue?: number;
      }
    | {
          type: 'boolean';
          required: boolean;
          defaultValue?: boolean;
      };

type ConfigSchema = {
    [key: string]: ConfigField;
};

type LoggerConfig = {
    level: string;
    directory: string;
};

export type { ConfigField, ConfigSchema, LoggerConfig };
