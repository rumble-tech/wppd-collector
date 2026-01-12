export type TPlugin = {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    slug: string;
    name: string;
    latestVersion: string | null;
    requiredPhpVersion: string | null;
    requiredWpVersion: string | null;
};

export default class Plugin {
    private readonly id: TPlugin['id'];
    private readonly createdAt: TPlugin['createdAt'];
    private readonly updatedAt: TPlugin['updatedAt'];
    private readonly slug: TPlugin['slug'];
    private readonly name: TPlugin['name'];
    private readonly latestVersion: TPlugin['latestVersion'];
    private readonly requiredPhpVersion: TPlugin['requiredPhpVersion'];
    private readonly requiredWpVersion: TPlugin['requiredWpVersion'];

    constructor(plugin: TPlugin) {
        this.id = plugin.id;
        this.createdAt = plugin.createdAt;
        this.updatedAt = plugin.updatedAt;
        this.slug = plugin.slug;
        this.name = plugin.name;
        this.latestVersion = plugin.latestVersion;
        this.requiredPhpVersion = plugin.requiredPhpVersion;
        this.requiredWpVersion = plugin.requiredWpVersion;
    }

    public getId(): TPlugin['id'] {
        return this.id;
    }

    public getCreatedAt(): TPlugin['createdAt'] {
        return this.createdAt;
    }

    public getUpdatedAt(): TPlugin['updatedAt'] {
        return this.updatedAt;
    }

    public getSlug(): TPlugin['slug'] {
        return this.slug;
    }

    public getName(): TPlugin['name'] {
        return this.name;
    }

    public getLatestVersion(): TPlugin['latestVersion'] {
        return this.latestVersion;
    }

    public getRequiredPhpVersion(): TPlugin['requiredPhpVersion'] {
        return this.requiredPhpVersion;
    }

    public getRequiredWpVersion(): TPlugin['requiredWpVersion'] {
        return this.requiredWpVersion;
    }
}
