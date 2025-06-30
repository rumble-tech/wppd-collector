import { and, eq } from 'drizzle-orm';
import { TDatabase, TSitesTable } from 'src/components/database/Types';
import Site from 'src/entities/Site';
import { TNewSite, TSite } from 'src/models/Site';
import SitePlugin from 'src/entities/SitePlugin';

export default class SiteRepository {
    private db: TDatabase;
    private sitesTable: TSitesTable;

    constructor(db: TDatabase, sitesTable: TSitesTable) {
        this.db = db;
        this.sitesTable = sitesTable;
    }

    public async findAll(): Promise<Site[]> {
        const sites = await this.db.select().from(this.sitesTable).execute();

        return sites.map((site) => new Site(site.id, site.name, site.phpVersion, site.wpVersion, site.token, new Date(site.createdAt), new Date(site.updatedAt), site.url, site.environment));
    }

    public async findById(siteId: TSite['id']): Promise<Site | null> {
        const [site] = await this.db.select().from(this.sitesTable).where(eq(this.sitesTable.id, siteId)).limit(1).execute();

        if (!site) {
            return null;
        }

        return new Site(site.id, site.name, site.phpVersion, site.wpVersion, site.token, new Date(site.createdAt), new Date(site.updatedAt), site.url, site.environment);
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

        return new Site(site.id, site.name, site.phpVersion, site.wpVersion, site.token, new Date(site.createdAt), new Date(site.updatedAt), site.url, site.environment);
    }

    public async create(site: TNewSite): Promise<Site | null> {
        const [createdSite] = await this.db.insert(this.sitesTable).values(site).returning().execute();

        if (!createdSite) {
            return null;
        }

        return new Site(createdSite.id, createdSite.name, createdSite.phpVersion, createdSite.wpVersion, createdSite.token, new Date(createdSite.createdAt), new Date(createdSite.updatedAt), createdSite.url, createdSite.environment);
    }

    public async update(site: TSite): Promise<Site | null> {
        await this.db
            .update(this.sitesTable)
            .set({
                name: site.name,
                phpVersion: site.phpVersion,
                wpVersion: site.wpVersion,
                token: site.token,
                updatedAt: site.updatedAt,
                url: site.url,
                environment: site.environment,
            })
            .where(eq(this.sitesTable.id, site.id))
            .execute();

        const updatedSite = await this.findById(site.id);

        if (!updatedSite) {
            return null;
        }

        return updatedSite;
    }
}
