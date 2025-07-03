export const siteEnvironments = ['production', 'staging', 'development'] as const;
export type TSiteEnvironment = (typeof siteEnvironments)[number];

export type TSite = {
    id: number;
    name: string;
    phpVersion: string | null;
    wpVersion: string | null;
    token: string;
    createdAt: string;
    updatedAt: string;
    url: string;
    environment: TSiteEnvironment;
};

export type TNewSite = Omit<TSite, 'id'>;
