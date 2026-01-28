import { CorsOptions } from 'cors';

type TConfigField =
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

type TConfigSchema = {
    [key: string]: TConfigField;
};

type TLoggerConfig = {
    level: string;
    directory: string;
};

type TServerConfig = {
    port: number;
    corsOptions: CorsOptions;
};

type TMailingSESConfig = {
    region: string;
    accessKeyId: string;
    accessKeySecret: string;
};

export type { TConfigSchema, TLoggerConfig, TServerConfig, TMailingSESConfig };
