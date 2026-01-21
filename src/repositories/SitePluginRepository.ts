import { and, eq } from 'drizzle-orm';
import SitePlugin, { TSitePlugin } from 'src/entities/SitePlugin';
import AbstractRepository from 'src/repositories/AbstractRepository';
import { TDatabase, TSitePluginsTable } from 'src/services/database/Types';

export default class SitePluginRepository extends AbstractRepository {
    private readonly sitePluginsTable: TSitePluginsTable;

    constructor(db: TDatabase, sitePluginsTable: TSitePluginsTable) {
        super(db);

        this.sitePluginsTable = sitePluginsTable;
    }

    public async findAll(): Promise<SitePlugin[]> {
        const sitePlugins = await this.db.select().from(this.sitePluginsTable).execute();

        return sitePlugins.map(
            (sitePlugin) =>
                new SitePlugin({
                    createdAt: sitePlugin.createdAt,
                    updatedAt: sitePlugin.updatedAt,
                    siteId: sitePlugin.siteId,
                    pluginId: sitePlugin.pluginId,
                    installedVersion: sitePlugin.installedVersion,
                    requiredPhpVersion: sitePlugin.requiredPhpVersion,
                    requiredWpVersion: sitePlugin.requiredWpVersion,
                    isActive: Boolean(sitePlugin.isActive),
                })
        );
    }

    public async findAllBySiteId(siteId: TSitePlugin['siteId']): Promise<SitePlugin[]> {
        const sitePlugins = await this.db
            .select()
            .from(this.sitePluginsTable)
            .where(eq(this.sitePluginsTable.siteId, siteId))
            .execute();

        return sitePlugins.map(
            (sitePlugin) =>
                new SitePlugin({
                    createdAt: sitePlugin.createdAt,
                    updatedAt: sitePlugin.updatedAt,
                    siteId: sitePlugin.siteId,
                    pluginId: sitePlugin.pluginId,
                    installedVersion: sitePlugin.installedVersion,
                    requiredPhpVersion: sitePlugin.requiredPhpVersion,
                    requiredWpVersion: sitePlugin.requiredWpVersion,
                    isActive: Boolean(sitePlugin.isActive),
                })
        );
    }

    public async findBySiteIdAndPluginId(
        siteId: TSitePlugin['siteId'],
        pluginId: TSitePlugin['pluginId']
    ): Promise<SitePlugin | null> {
        const [sitePlugin] = await this.db
            .select()
            .from(this.sitePluginsTable)
            .where(and(eq(this.sitePluginsTable.siteId, siteId), eq(this.sitePluginsTable.pluginId, pluginId)))
            .limit(1)
            .execute();

        if (!sitePlugin) {
            return null;
        }

        return new SitePlugin({
            createdAt: sitePlugin.createdAt,
            updatedAt: sitePlugin.updatedAt,
            siteId: sitePlugin.siteId,
            pluginId: sitePlugin.pluginId,
            installedVersion: sitePlugin.installedVersion,
            requiredPhpVersion: sitePlugin.requiredPhpVersion,
            requiredWpVersion: sitePlugin.requiredWpVersion,
            isActive: Boolean(sitePlugin.isActive),
        });
    }

    public async insert(sitePlugin: Omit<TSitePlugin, 'createdAt' | 'updatedAt'>): Promise<SitePlugin | null> {
        const [insertedSitePlugin] = await this.db
            .insert(this.sitePluginsTable)
            .values({
                siteId: sitePlugin.siteId,
                pluginId: sitePlugin.pluginId,
                createdAt: new Date(),
                updatedAt: new Date(),
                installedVersion: sitePlugin.installedVersion,
                requiredPhpVersion: sitePlugin.requiredPhpVersion,
                requiredWpVersion: sitePlugin.requiredWpVersion,
                isActive: Number(sitePlugin.isActive),
            })
            .returning()
            .execute();

        if (!insertedSitePlugin) {
            return null;
        }

        return new SitePlugin({
            createdAt: insertedSitePlugin.createdAt,
            updatedAt: insertedSitePlugin.updatedAt,
            siteId: insertedSitePlugin.siteId,
            pluginId: insertedSitePlugin.pluginId,
            installedVersion: insertedSitePlugin.installedVersion,
            requiredPhpVersion: insertedSitePlugin.requiredPhpVersion,
            requiredWpVersion: insertedSitePlugin.requiredWpVersion,
            isActive: Boolean(insertedSitePlugin.isActive),
        });
    }

    public async update(sitePlugin: Omit<TSitePlugin, 'createdAt' | 'updatedAt'>): Promise<SitePlugin | null> {
        const [updatedSitePlugin] = await this.db
            .update(this.sitePluginsTable)
            .set({
                updatedAt: new Date(),
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

        return new SitePlugin({
            createdAt: updatedSitePlugin.createdAt,
            updatedAt: updatedSitePlugin.updatedAt,
            siteId: updatedSitePlugin.siteId,
            pluginId: updatedSitePlugin.pluginId,
            installedVersion: updatedSitePlugin.installedVersion,
            requiredPhpVersion: updatedSitePlugin.requiredPhpVersion,
            requiredWpVersion: updatedSitePlugin.requiredWpVersion,
            isActive: Boolean(updatedSitePlugin.isActive),
        });
    }

    public async delete(siteId: TSitePlugin['siteId'], pluginId: TSitePlugin['pluginId']): Promise<boolean> {
        const result = await this.db
            .delete(this.sitePluginsTable)
            .where(and(eq(this.sitePluginsTable.siteId, siteId), eq(this.sitePluginsTable.pluginId, pluginId)))
            .execute();

        return result.changes > 0;
    }
}
