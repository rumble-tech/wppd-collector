import { TPluginVersion } from 'src/models/Plugin';

export default class Plugin {
    private id: number;
    private slug: string;
    private name: string;
    private latestVersion: TPluginVersion;

    constructor(id: number, slug: string, name: string, latestVersion: TPluginVersion) {
        this.id = id;
        this.slug = slug;
        this.name = name;
        this.latestVersion = latestVersion;
    }

    public getId(): number {
        return this.id;
    }

    public getSlug(): string {
        return this.slug;
    }

    public getName(): string {
        return this.name;
    }

    public getLatestVersion(): TPluginVersion {
        return this.latestVersion;
    }
}
