export type TSiteEnvironment = 'production' | 'staging' | 'development';

export type TSite = {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    url: string;
    apiKey: string;
    environment: TSiteEnvironment;
    phpVersion: string | null;
    wpVersion: string | null;
};

export default class Site {
    private readonly id: TSite['id'];
    private readonly createdAt: TSite['createdAt'];
    private readonly updatedAt: TSite['updatedAt'];
    private readonly name: TSite['name'];
    private readonly url: TSite['url'];
    private readonly apiKey: TSite['apiKey'];
    private readonly environment: TSite['environment'];
    private readonly phpVersion: TSite['phpVersion'];
    private readonly wpVersion: TSite['wpVersion'];

    constructor(site: TSite) {
        this.id = site.id;
        this.createdAt = site.createdAt;
        this.updatedAt = site.updatedAt;
        this.name = site.name;
        this.url = site.url;
        this.apiKey = site.apiKey;
        this.environment = site.environment;
        this.phpVersion = site.phpVersion;
        this.wpVersion = site.wpVersion;
    }

    public getId(): TSite['id'] {
        return this.id;
    }

    public getCreatedAt(): TSite['createdAt'] {
        return this.createdAt;
    }

    public getUpdatedAt(): TSite['updatedAt'] {
        return this.updatedAt;
    }

    public getName(): TSite['name'] {
        return this.name;
    }

    public getUrl(): TSite['url'] {
        return this.url;
    }

    public getApiKey(): TSite['apiKey'] {
        return this.apiKey;
    }

    public getEnvironment(): TSite['environment'] {
        return this.environment;
    }

    public getPhpVersion(): TSite['phpVersion'] {
        return this.phpVersion;
    }

    public getWpVersion(): TSite['wpVersion'] {
        return this.wpVersion;
    }
}
