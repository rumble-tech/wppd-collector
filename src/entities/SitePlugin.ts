export type TSitePlugin = {
    createdAt: Date;
    updatedAt: Date;
    siteId: number;
    pluginId: number;
    installedVersion: string | null;
    requiredPhpVersion: string | null;
    requiredWpVersion: string | null;
    isActive: boolean;
};

export default class SitePlugin {
    private readonly createdAt: TSitePlugin['createdAt'];
    private readonly updatedAt: TSitePlugin['updatedAt'];
    private readonly siteId: TSitePlugin['siteId'];
    private readonly pluginId: TSitePlugin['pluginId'];
    private readonly installedVersion: TSitePlugin['installedVersion'];
    private readonly requiredPhpVersion: TSitePlugin['requiredPhpVersion'];
    private readonly requiredWpVersion: TSitePlugin['requiredWpVersion'];
    private readonly isActive: TSitePlugin['isActive'];

    constructor(sitePlugin: TSitePlugin) {
        this.createdAt = sitePlugin.createdAt;
        this.updatedAt = sitePlugin.updatedAt;
        this.siteId = sitePlugin.siteId;
        this.pluginId = sitePlugin.pluginId;
        this.installedVersion = sitePlugin.installedVersion;
        this.requiredPhpVersion = sitePlugin.requiredPhpVersion;
        this.requiredWpVersion = sitePlugin.requiredWpVersion;
        this.isActive = sitePlugin.isActive;
    }

    public getCreatedAt(): TSitePlugin['createdAt'] {
        return this.createdAt;
    }

    public getUpdatedAt(): TSitePlugin['updatedAt'] {
        return this.updatedAt;
    }

    public getSiteId(): TSitePlugin['siteId'] {
        return this.siteId;
    }

    public getPluginId(): TSitePlugin['pluginId'] {
        return this.pluginId;
    }

    public getInstalledVersion(): TSitePlugin['installedVersion'] {
        return this.installedVersion;
    }

    public getRequiredPhpVersion(): TSitePlugin['requiredPhpVersion'] {
        return this.requiredPhpVersion;
    }

    public getRequiredWpVersion(): TSitePlugin['requiredWpVersion'] {
        return this.requiredWpVersion;
    }

    public getIsActive(): TSitePlugin['isActive'] {
        return this.isActive;
    }
}
