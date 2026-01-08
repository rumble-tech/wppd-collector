import { and, eq } from 'drizzle-orm';
import Site, { TSite } from 'src/entities/Site';
import AbstractRepository from 'src/repositories/AbstractRepository';
import { TDatabase, TSitesTable } from 'src/services/database/Types';

export default class SiteRepository extends AbstractRepository {
    private readonly sitesTable: TSitesTable;

    constructor(db: TDatabase, sitesTable: TSitesTable) {
        super(db);

        this.sitesTable = sitesTable;
    }

    public async findAll(): Promise<Site[]> {
        const sites = await this.db.select().from(this.sitesTable).execute();

        return sites.map(
            (site) =>
                new Site({
                    id: site.id,
                    createdAt: site.createdAt,
                    updatedAt: site.updatedAt,
                    name: site.name,
                    url: site.url,
                    apiKey: site.apiKey,
                    environment: site.environment,
                    phpVersion: site.phpVersion,
                    wpVersion: site.wpVersion,
                })
        );
    }

    public async findById(id: TSite['id']): Promise<Site | null> {
        const [site] = await this.db
            .select()
            .from(this.sitesTable)
            .where(eq(this.sitesTable.id, id))
            .limit(1)
            .execute();

        if (!site) {
            return null;
        }

        return new Site({
            id: site.id,
            createdAt: site.createdAt,
            updatedAt: site.updatedAt,
            name: site.name,
            url: site.url,
            apiKey: site.apiKey,
            environment: site.environment,
            phpVersion: site.phpVersion,
            wpVersion: site.wpVersion,
        });
    }

    public async findByNameAndUrl(name: TSite['name'], url: TSite['url']): Promise<Site | null> {
        const [site] = await this.db
            .select()
            .from(this.sitesTable)
            .where(and(eq(this.sitesTable.name, name), eq(this.sitesTable.url, url)))
            .limit(1)
            .execute();

        if (!site) {
            return null;
        }

        return new Site({
            id: site.id,
            createdAt: site.createdAt,
            updatedAt: site.updatedAt,
            name: site.name,
            url: site.url,
            apiKey: site.apiKey,
            environment: site.environment,
            phpVersion: site.phpVersion,
            wpVersion: site.wpVersion,
        });
    }

    public async insert(
        site: Omit<TSite, 'id' | 'createdAt' | 'updatedAt' | 'phpVersion' | 'wpVersion'>
    ): Promise<Site | null> {
        const [insertedSite] = await this.db
            .insert(this.sitesTable)
            .values({
                createdAt: new Date(),
                updatedAt: new Date(),
                name: site.name,
                url: site.url,
                apiKey: site.apiKey,
                environment: site.environment,
                phpVersion: null,
                wpVersion: null,
            })
            .returning()
            .execute();

        if (!insertedSite) {
            return null;
        }

        return new Site({
            id: insertedSite.id,
            createdAt: insertedSite.createdAt,
            updatedAt: insertedSite.updatedAt,
            name: insertedSite.name,
            url: insertedSite.url,
            apiKey: insertedSite.apiKey,
            environment: insertedSite.environment,
            phpVersion: insertedSite.phpVersion,
            wpVersion: insertedSite.wpVersion,
        });
    }

    public async update(site: Omit<TSite, 'createdAt' | 'updatedAt'>): Promise<Site | null> {
        const [updatedSite] = await this.db
            .update(this.sitesTable)
            .set({
                updatedAt: new Date(),
                name: site.name,
                url: site.url,
                apiKey: site.apiKey,
                environment: site.environment,
                phpVersion: site.phpVersion,
                wpVersion: site.wpVersion,
            })
            .where(eq(this.sitesTable.id, site.id))
            .returning()
            .execute();

        if (!updatedSite) {
            return null;
        }

        return new Site({
            id: updatedSite.id,
            createdAt: updatedSite.createdAt,
            updatedAt: updatedSite.updatedAt,
            name: updatedSite.name,
            url: updatedSite.url,
            apiKey: updatedSite.apiKey,
            environment: updatedSite.environment,
            phpVersion: updatedSite.phpVersion,
            wpVersion: updatedSite.wpVersion,
        });
    }
}
