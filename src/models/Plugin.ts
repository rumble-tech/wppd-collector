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
