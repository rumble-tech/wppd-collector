import { eq } from 'drizzle-orm';
import Plugin, { TPlugin } from 'src/entities/Plugin';
import AbstractRepository from 'src/repositories/AbstractRepository';
import { TDatabase, TPluginsTable } from 'src/services/database/Types';

export default class PluginRepository extends AbstractRepository {
    private readonly pluginsTable: TPluginsTable;

    constructor(db: TDatabase, pluginsTable: TPluginsTable) {
        super(db);

        this.pluginsTable = pluginsTable;
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

        return new Plugin({
            id: plugin.id,
            createdAt: plugin.createdAt,
            updatedAt: plugin.updatedAt,
            slug: plugin.slug,
            name: plugin.name,
            latestVersion: plugin.latestVersion,
            requiredPhpVersion: plugin.requiredPhpVersion,
            requiredWpVersion: plugin.requiredWpVersion,
        });
    }

    public async insert(plugin: Omit<TPlugin, 'id' | 'createdAt' | 'updatedAt'>): Promise<Plugin | null> {
        const [insertedPlugin] = await this.db
            .insert(this.pluginsTable)
            .values({
                createdAt: new Date(),
                updatedAt: new Date(),
                slug: plugin.slug,
                name: plugin.name,
                latestVersion: plugin.latestVersion,
                requiredPhpVersion: plugin.requiredPhpVersion,
                requiredWpVersion: plugin.requiredWpVersion,
            })
            .returning()
            .execute();

        if (!insertedPlugin) {
            return null;
        }

        return new Plugin({
            id: insertedPlugin.id,
            createdAt: insertedPlugin.createdAt,
            updatedAt: insertedPlugin.updatedAt,
            slug: insertedPlugin.slug,
            name: insertedPlugin.name,
            latestVersion: insertedPlugin.latestVersion,
            requiredPhpVersion: insertedPlugin.requiredPhpVersion,
            requiredWpVersion: insertedPlugin.requiredWpVersion,
        });
    }
}
