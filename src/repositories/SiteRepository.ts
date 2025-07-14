import { and, eq } from 'drizzle-orm';
import { TDatabase, TPluginsTable, TSitePluginsTable, TSitesTable } from 'src/components/database/Types';
import Site from 'src/entities/Site';
import SitePlugin from 'src/entities/SitePlugin';
import { TNewSite, TSite } from 'src/models/Site';
import { TNewSitePlugin, TSitePlugin } from 'src/models/SitePlugin';

export default class SiteRepository {
    private db: TDatabase;
    private sitesTable: TSitesTable;
    private pluginsTable: TPluginsTable;
    private sitePluginsTable: TSitePluginsTable;

    constructor(
        db: TDatabase,
        sitesTable: TSitesTable,
        pluginsTable: TPluginsTable,
        sitePluginsTable: TSitePluginsTable
    ) {
        this.db = db;
        this.sitesTable = sitesTable;
        this.pluginsTable = pluginsTable;
        this.sitePluginsTable = sitePluginsTable;
    }

    public async findAll(): Promise<Site[]> {
        const sites = await this.db.select().from(this.sitesTable).execute();

        return sites.map(
            (site) =>
                new Site(
                    site.id,
                    site.name,
                    site.phpVersion,
                    site.wpVersion,
                    site.token,
                    new Date(site.createdAt),
                    new Date(site.updatedAt),
                    site.url,
                    site.environment
                )
        );
    }

    public async findById(siteId: TSite['id']): Promise<Site | null> {
        const [site] = await this.db
            .select()
            .from(this.sitesTable)
            .where(eq(this.sitesTable.id, siteId))
            .limit(1)
            .execute();

        if (!site) {
            return null;
        }

        return new Site(
            site.id,
            site.name,
            site.phpVersion,
            site.wpVersion,
            site.token,
            new Date(site.createdAt),
            new Date(site.updatedAt),
            site.url,
            site.environment
        );
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

        return new Site(
            site.id,
            site.name,
            site.phpVersion,
            site.wpVersion,
            site.token,
            new Date(site.createdAt),
            new Date(site.updatedAt),
            site.url,
            site.environment
        );
    }

    public async create(site: TNewSite): Promise<Site | null> {
        const [createdSite] = await this.db.insert(this.sitesTable).values(site).returning().execute();

        if (!createdSite) {
            return null;
        }

        return new Site(
            createdSite.id,
            createdSite.name,
            createdSite.phpVersion,
            createdSite.wpVersion,
            createdSite.token,
            new Date(createdSite.createdAt),
            new Date(createdSite.updatedAt),
            createdSite.url,
            createdSite.environment
        );
    }

    public async update(site: TSite): Promise<Site | null> {
        const [updatedSite] = await this.db
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
            .returning()
            .execute();

        if (!updatedSite) {
            return null;
        }

        return new Site(
            updatedSite.id,
            updatedSite.name,
            updatedSite.phpVersion,
            updatedSite.wpVersion,
            updatedSite.token,
            new Date(updatedSite.createdAt),
            new Date(updatedSite.updatedAt),
            updatedSite.url,
            updatedSite.environment
        );
    }

    public async delete(siteId: TSite['id']): Promise<boolean> {
        const result = await this.db.delete(this.sitesTable).where(eq(this.sitesTable.id, siteId)).execute();

        return result.changes > 1;
    }

    public async findAllSitePlugins(siteId: TSitePlugin['siteId']): Promise<SitePlugin[]> {
        const sitePlugins = await this.db
            .select({
                id: this.sitePluginsTable.pluginId,
                slug: this.pluginsTable.slug,
                name: this.pluginsTable.name,
                installedVersion: this.sitePluginsTable.installedVersion,
                installedRequiredPhpVersion: this.sitePluginsTable.requiredPhpVersion,
                installedRequiredWpVersion: this.sitePluginsTable.requiredWpVersion,
                latestVersion: this.pluginsTable.latestVersion,
                latestRequiredPhpVersion: this.pluginsTable.requiredPhpVersion,
                latestRequiredWpVersion: this.pluginsTable.requiredWpVersion,
                isActive: this.sitePluginsTable.isActive,
            })
            .from(this.sitePluginsTable)
            .innerJoin(this.pluginsTable, eq(this.sitePluginsTable.pluginId, this.pluginsTable.id))
            .where(eq(this.sitePluginsTable.siteId, siteId))
            .execute();

        return sitePlugins.map(
            (sitePlugin) =>
                new SitePlugin(
                    sitePlugin.id,
                    sitePlugin.slug,
                    sitePlugin.name,
                    sitePlugin.isActive === 1,
                    {
                        version: sitePlugin.latestVersion,
                        requiredPhpVersion: sitePlugin.latestRequiredPhpVersion,
                        requiredWpVersion: sitePlugin.latestRequiredWpVersion,
                    },
                    {
                        version: sitePlugin.installedVersion,
                        requiredPhpVersion: sitePlugin.installedRequiredPhpVersion,
                        requiredWpVersion: sitePlugin.installedRequiredWpVersion,
                    }
                )
        );
    }

    public async findSitePlugin(
        siteId: TSitePlugin['siteId'],
        pluginId: TSitePlugin['pluginId']
    ): Promise<SitePlugin | null> {
        const [sitePlugin] = await this.db
            .select({
                id: this.sitePluginsTable.pluginId,
                slug: this.pluginsTable.slug,
                name: this.pluginsTable.name,
                installedVersion: this.sitePluginsTable.installedVersion,
                installedRequiredPhpVersion: this.sitePluginsTable.requiredPhpVersion,
                installedRequiredWpVersion: this.sitePluginsTable.requiredWpVersion,
                latestVersion: this.pluginsTable.latestVersion,
                latestRequiredPhpVersion: this.pluginsTable.requiredPhpVersion,
                latestRequiredWpVersion: this.pluginsTable.requiredWpVersion,
                isActive: this.sitePluginsTable.isActive,
            })
            .from(this.sitePluginsTable)
            .innerJoin(this.pluginsTable, eq(this.sitePluginsTable.pluginId, this.pluginsTable.id))
            .where(and(eq(this.sitePluginsTable.siteId, siteId), eq(this.sitePluginsTable.pluginId, pluginId)))
            .limit(1)
            .execute();

        if (!sitePlugin) {
            return null;
        }

        return new SitePlugin(
            sitePlugin.id,
            sitePlugin.slug,
            sitePlugin.name,
            sitePlugin.isActive === 1,
            {
                version: sitePlugin.latestVersion,
                requiredPhpVersion: sitePlugin.latestRequiredPhpVersion,
                requiredWpVersion: sitePlugin.latestRequiredWpVersion,
            },
            {
                version: sitePlugin.installedVersion,
                requiredPhpVersion: sitePlugin.installedRequiredPhpVersion,
                requiredWpVersion: sitePlugin.installedRequiredWpVersion,
            }
        );
    }

    public async createSitePlugin(sitePlugin: TNewSitePlugin): Promise<SitePlugin | null> {
        const [plugin] = await this.db
            .select()
            .from(this.pluginsTable)
            .where(eq(this.pluginsTable.id, sitePlugin.pluginId))
            .limit(1)
            .execute();

        if (!plugin) {
            throw new Error(`Plugin with ID: ${sitePlugin.pluginId} not found`);
        }

        const [createdSitePlugin] = await this.db
            .insert(this.sitePluginsTable)
            .values({ ...sitePlugin, isActive: Number(sitePlugin.isActive) })
            .returning()
            .execute();

        if (!createdSitePlugin) {
            return null;
        }

        return new SitePlugin(
            createdSitePlugin.pluginId,
            plugin.slug,
            plugin.name,
            createdSitePlugin.isActive === 1,
            {
                version: plugin.latestVersion,
                requiredPhpVersion: plugin.requiredPhpVersion,
                requiredWpVersion: plugin.requiredWpVersion,
            },
            {
                version: createdSitePlugin.installedVersion,
                requiredPhpVersion: createdSitePlugin.requiredPhpVersion,
                requiredWpVersion: createdSitePlugin.requiredWpVersion,
            }
        );
    }

    public async updateSitePlugin(sitePlugin: TSitePlugin): Promise<SitePlugin | null> {
        const [plugin] = await this.db
            .select()
            .from(this.pluginsTable)
            .where(eq(this.pluginsTable.id, sitePlugin.pluginId))
            .limit(1)
            .execute();

        if (!plugin) {
            throw new Error(`Plugin with ID: ${sitePlugin.pluginId} not found`);
        }

        const [updatedSitePlugin] = await this.db
            .update(this.sitePluginsTable)
            .set({
                installedVersion: sitePlugin.installedVersion,
                requiredPhpVersion: sitePlugin.requiredPhpVersion,
                requiredWpVersion: sitePlugin.requiredWpVersion,
                isActive: Number(sitePlugin.isActive),
            })
            .where(
                and(
                    eq(this.sitePluginsTable.siteId, sitePlugin.siteId),
                    eq(this.sitePluginsTable.pluginId, sitePlugin.pluginId)
                )
            )
            .returning()
            .execute();

        if (!updatedSitePlugin) {
            return null;
        }

        return new SitePlugin(
            updatedSitePlugin.pluginId,
            plugin.slug,
            plugin.name,
            updatedSitePlugin.isActive === 1,
            {
                version: plugin.latestVersion,
                requiredPhpVersion: plugin.requiredPhpVersion,
                requiredWpVersion: plugin.requiredWpVersion,
            },
            {
                version: updatedSitePlugin.installedVersion,
                requiredPhpVersion: updatedSitePlugin.requiredPhpVersion,
                requiredWpVersion: updatedSitePlugin.requiredWpVersion,
            }
        );
    }

    public async deleteSitePlugin(siteId: TSitePlugin['siteId'], pluginId: TSitePlugin['pluginId']): Promise<boolean> {
        const result = await this.db
            .delete(this.sitePluginsTable)
            .where(and(eq(this.sitePluginsTable.siteId, siteId), eq(this.sitePluginsTable.pluginId, pluginId)))
            .execute();

        return result.changes > 0;
    }
}
