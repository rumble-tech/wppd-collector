export type TPlugin = {
    id: number;
    slug: string;
    name: string;
    latestVersion: string | null;
    requiredPhpVersion: string | null;
    requiredWpVersion: string | null;
};

export type TNewPlugin = Omit<TPlugin, 'id'>;

export type TPluginVersion = {
    version: string | null;
    requiredPhpVersion: string | null;
    requiredWpVersion: string | null;
};

export type TPluginVulnerability = {
    id: number;
    pluginId: number;
    from: {
        version: string;
        inclusive: boolean;
    };
    to: {
        version: string;
        inclusive: boolean;
    };
    score: number;
};

export type TNewPluginVulnerability = Omit<TPluginVulnerability, 'id'>;
