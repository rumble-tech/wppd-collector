import { TPluginVersion } from 'src/models/Plugin';
import Plugin from 'src/entities/Plugin';

export default class SitePlugin extends Plugin {
    private installedVersion: TPluginVersion;
    private isActive: boolean;

    constructor(id: number, slug: string, name: string, isActive: boolean, latestVersion: TPluginVersion, installedVersion: TPluginVersion) {
        super(id, slug, name, latestVersion);

        this.isActive = isActive;
        this.installedVersion = installedVersion;
    }

    public getInstalledVersion(): TPluginVersion {
        return this.installedVersion;
    }

    public getIsActive(): boolean {
        return this.isActive;
    }
}
