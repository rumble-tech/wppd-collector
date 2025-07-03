import { eq, notInArray } from 'drizzle-orm';
import {
    TDatabase,
    TPluginsTable,
    TPluginVulnerabilitiesTable,
    TSitePluginsTable,
} from 'src/components/database/Types';
import Plugin from 'src/entities/Plugin';
import { TNewPlugin, TNewPluginVulnerability, TPlugin, TPluginVersion, TPluginVulnerability } from 'src/models/Plugin';
import LatestVersionResolver from 'src/services/latest-version/LatestVersionResolver';
import VulnerabilitiesResolver from 'src/services/vulnerabilities/VulnerabilitiesResolver';

export default class PluginRepository {
    private db: TDatabase;
    private pluginsTable: TPluginsTable;
    private sitePluginsTable: TSitePluginsTable;
    private pluginVulnerabilitiesTable: TPluginVulnerabilitiesTable;
    private latestVersionResolver: LatestVersionResolver;
    private vulnerabilitiesResolver: VulnerabilitiesResolver;

    constructor(
        db: TDatabase,
        pluginsTable: TPluginsTable,
        sitePluginsTable: TSitePluginsTable,
        pluginVulnerabilitiesTable: TPluginVulnerabilitiesTable,
        latestVersionResolver: LatestVersionResolver,
        vulnerabilitiesResolver: VulnerabilitiesResolver
    ) {
        this.db = db;
        this.pluginsTable = pluginsTable;
        this.sitePluginsTable = sitePluginsTable;
        this.pluginVulnerabilitiesTable = pluginVulnerabilitiesTable; // Assuming plugin vulnerabilities table is part of pluginsTable
        this.latestVersionResolver = latestVersionResolver;
        this.vulnerabilitiesResolver = vulnerabilitiesResolver;
    }

    public async findAll(): Promise<Plugin[]> {
        const plugins = await this.db.select().from(this.pluginsTable).execute();

        return plugins.map(
            (plugin) =>
                new Plugin(plugin.id, plugin.slug, plugin.name, {
                    version: plugin.latestVersion,
                    requiredPhpVersion: plugin.requiredPhpVersion,
                    requiredWpVersion: plugin.requiredWpVersion,
                })
        );
    }

    public async findBySlug(slug: TPlugin['slug']): Promise<Plugin | null> {
        const [plugin] = await this.db
            .select()
            .from(this.pluginsTable)
            .where(eq(this.pluginsTable.slug, slug))
            .limit(1)
            .execute();

        if (!plugin) {
            return null;
        }

        return new Plugin(plugin.id, plugin.slug, plugin.name, {
            version: plugin.latestVersion,
            requiredPhpVersion: plugin.requiredPhpVersion,
            requiredWpVersion: plugin.requiredWpVersion,
        });
    }

    public async create(plugin: TNewPlugin): Promise<Plugin | null> {
        const [createdPlugin] = await this.db.insert(this.pluginsTable).values(plugin).returning().execute();

        if (!createdPlugin) {
            return null;
        }

        return new Plugin(createdPlugin.id, createdPlugin.slug, createdPlugin.name, {
            version: createdPlugin.latestVersion,
            requiredPhpVersion: createdPlugin.requiredPhpVersion,
            requiredWpVersion: createdPlugin.requiredWpVersion,
        });
    }

    public async update(plugin: TPlugin): Promise<Plugin | null> {
        const [updatedPlugin] = await this.db
            .update(this.pluginsTable)
            .set({
                slug: plugin.slug,
                name: plugin.name,
                latestVersion: plugin.latestVersion,
                requiredPhpVersion: plugin.requiredPhpVersion,
                requiredWpVersion: plugin.requiredWpVersion,
            })
            .where(eq(this.pluginsTable.id, plugin.id))
            .returning()
            .execute();

        if (!updatedPlugin) {
            return null;
        }

        return new Plugin(updatedPlugin.id, updatedPlugin.slug, updatedPlugin.name, {
            version: updatedPlugin.latestVersion,
            requiredPhpVersion: updatedPlugin.requiredPhpVersion,
            requiredWpVersion: updatedPlugin.requiredWpVersion,
        });
    }

    public async deleteUnused(): Promise<boolean> {
        const usedPlugins = await this.db.select().from(this.sitePluginsTable).execute();

        const usedPluginIds = usedPlugins.map((sitePlugin) => sitePlugin.pluginId);

        const result = await this.db
            .delete(this.pluginsTable)
            .where(notInArray(this.pluginsTable.id, usedPluginIds))
            .execute();

        return result.changes >= 0;
    }

    public async getLatestVersion(slug: TPlugin['slug']): Promise<TPluginVersion> {
        return await this.latestVersionResolver.resolve(slug);
    }

    public async getVulnerabilities(
        slug: TPlugin['slug']
    ): Promise<Omit<TPluginVulnerability, 'id' | 'pluginId'>[] | null> {
        return await this.vulnerabilitiesResolver.resolve(slug);
    }

    public async findVulnerabilities(pluginId: TPlugin['id']): Promise<TPluginVulnerability[]> {
        const vulnerabilities = await this.db
            .select()
            .from(this.pluginVulnerabilitiesTable)
            .where(eq(this.pluginVulnerabilitiesTable.pluginId, pluginId))
            .execute();

        return vulnerabilities.map((vuln) => ({
            id: vuln.id,
            pluginId: vuln.pluginId,
            from: { version: vuln.from, inclusive: Boolean(vuln.fromInclusive) },
            to: { version: vuln.to, inclusive: Boolean(vuln.toInclusive) },
            score: vuln.score,
        }));
    }

    public async createVulnerability(vulnerability: TNewPluginVulnerability): Promise<boolean> {
        const [createdVulnerability] = await this.db
            .insert(this.pluginVulnerabilitiesTable)
            .values({
                pluginId: vulnerability.pluginId,
                from: vulnerability.from.version,
                fromInclusive: Number(vulnerability.from.inclusive),
                to: vulnerability.to.version,
                toInclusive: Number(vulnerability.to.inclusive),
                score: vulnerability.score,
            })
            .returning()
            .execute();

        if (!createdVulnerability) {
            return false;
        }

        return true;
    }

    public async deleteAllVulnerabilitiesForPlugin(pluginId: TPluginVulnerability['id']): Promise<void> {
        await this.db
            .delete(this.pluginVulnerabilitiesTable)
            .where(eq(this.pluginVulnerabilitiesTable.pluginId, pluginId))
            .execute();
    }
}
