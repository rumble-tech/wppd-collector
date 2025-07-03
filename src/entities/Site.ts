import { TSiteEnvironment } from 'src/models/Site';

export default class Site {
    private id: number;
    private name: string;
    private phpVersion: string | null;
    private wpVersion: string | null;
    private token: string;
    private createdAt: Date;
    private updatedAt: Date;
    private url: string;
    private environment: TSiteEnvironment;

    constructor(
        id: number,
        name: string,
        phpVersion: string | null,
        wpVersion: string | null,
        token: string,
        createdAt: Date,
        updatedAt: Date,
        url: string,
        environment: TSiteEnvironment
    ) {
        this.id = id;
        this.name = name;
        this.phpVersion = phpVersion;
        this.wpVersion = wpVersion;
        this.token = token;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.url = url;
        this.environment = environment;
    }

    public getId(): number {
        return this.id;
    }

    public getName(): string {
        return this.name;
    }

    public getPhpVersion(): string | null {
        return this.phpVersion;
    }

    public getWpVersion(): string | null {
        return this.wpVersion;
    }

    public getToken(): string {
        return this.token;
    }

    public getCreatedAt(): Date {
        return this.createdAt;
    }

    public getUpdatedAt(): Date {
        return this.updatedAt;
    }

    public getUrl(): string {
        return this.url;
    }

    public getEnvironment(): TSiteEnvironment {
        return this.environment;
    }
}
