export type TSitePlugin = {
    siteId: number;
    pluginId: number;
    installedVersion: string | null;
    requiredPhpVersion: string | null;
    requiredWpVersion: string | null;
    isActive: boolean;
};

export type TNewSitePlugin = TSitePlugin;
