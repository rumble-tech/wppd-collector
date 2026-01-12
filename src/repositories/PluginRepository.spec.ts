import { eq } from 'drizzle-orm';
import PluginRepository from 'src/repositories/PluginRepository';
import { TDatabase, TPluginsTable } from 'src/services/database/Types';

describe('PluginRepository', () => {
    let pluginRepository: PluginRepository;
    let database: Partial<TDatabase>;
    let pluginsTable: TPluginsTable;

    beforeEach(() => {
        database = {
            select: jest.fn(),
            insert: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };

        pluginsTable = {} as unknown as TPluginsTable;

        pluginRepository = new PluginRepository(database as TDatabase, pluginsTable);
    });

    describe('PluginRepository.findBySlug', () => {
        it('should return one plugin by its slug', async () => {
            const builder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([
                    {
                        id: 1,
                        createdAt: new Date('2026-01-01T00:00:00Z'),
                        updatedAt: new Date('2026-01-02T00:00:00Z'),
                        slug: 'plugin-1',
                        name: 'Plugin1',
                        latestVersion: '1.0.0',
                        requiredPhpVersion: '8.5.1',
                        requiredWpVersion: '6.9.0',
                    },
                ]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(builder);

            const plugin = await pluginRepository.findBySlug('plugin-1');

            expect(database.select).toHaveBeenCalled();
            expect(builder.from).toHaveBeenCalledWith(pluginsTable);
            expect(builder.where).toHaveBeenCalledWith(eq(pluginsTable.slug, 'plugin-1'));
            expect(builder.limit).toHaveBeenCalledWith(1);
            expect(builder.execute).toHaveBeenCalled();

            expect(plugin).not.toBeNull();
            expect(plugin?.getId()).toBe(1);
            expect(plugin?.getSlug()).toBe('plugin-1');
            expect(plugin?.getName()).toBe('Plugin1');
            expect(plugin?.getLatestVersion()).toBe('1.0.0');
            expect(plugin?.getRequiredPhpVersion()).toBe('8.5.1');
            expect(plugin?.getRequiredWpVersion()).toBe('6.9.0');
        });

        it('should return null if the plugin could not be found by its slug', async () => {
            const builder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(builder);

            const plugin = await pluginRepository.findBySlug('plugin-1');

            expect(database.select).toHaveBeenCalled();
            expect(builder.from).toHaveBeenCalledWith(pluginsTable);
            expect(builder.where).toHaveBeenCalledWith(eq(pluginsTable.slug, 'plugin-1'));
            expect(builder.limit).toHaveBeenCalledWith(1);
            expect(builder.execute).toHaveBeenCalled();

            expect(plugin).toBeNull();
        });
    });

    describe('PluginRepository.insert', () => {
        const pluginPayload = {
            slug: 'plugin-1',
            name: 'Plugin1',
            latestVersion: '1.0.0',
            requiredPhpVersion: '8.5.1',
            requiredWpVersion: '6.9.0',
        } as const;

        const fixedSystemTime = new Date('2026-01-01T00:00:00Z');

        beforeEach(() => {
            jest.useFakeTimers();
            jest.setSystemTime(fixedSystemTime);
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should insert a new plugin and return it', async () => {
            const builder = {
                values: jest.fn().mockReturnThis(),
                returning: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([
                    {
                        id: 1,
                        createdAt: fixedSystemTime,
                        updatedAt: fixedSystemTime,
                        ...pluginPayload,
                    },
                ]),
            };

            (database.insert as jest.Mock).mockReturnValueOnce(builder);

            const insertedPlugin = await pluginRepository.insert(pluginPayload);

            expect(database.insert).toHaveBeenCalledWith(pluginsTable);
            expect(builder.values).toHaveBeenCalledWith({
                createdAt: fixedSystemTime,
                updatedAt: fixedSystemTime,
                ...pluginPayload,
            });
            expect(builder.returning).toHaveBeenCalled();
            expect(builder.execute).toHaveBeenCalled();

            expect(insertedPlugin).not.toBeNull();
            expect(insertedPlugin?.getId()).toBe(1);
            expect(insertedPlugin?.getCreatedAt()).toEqual(fixedSystemTime);
            expect(insertedPlugin?.getUpdatedAt()).toEqual(fixedSystemTime);
            expect(insertedPlugin?.getSlug()).toBe(pluginPayload.slug);
            expect(insertedPlugin?.getName()).toBe(pluginPayload.name);
            expect(insertedPlugin?.getLatestVersion()).toBe(pluginPayload.latestVersion);
            expect(insertedPlugin?.getRequiredPhpVersion()).toBe(pluginPayload.requiredPhpVersion);
            expect(insertedPlugin?.getRequiredWpVersion()).toBe(pluginPayload.requiredWpVersion);
        });

        it('should return null when the plugin insert fails', async () => {
            const builder = {
                values: jest.fn().mockReturnThis(),
                returning: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([]),
            };

            (database.insert as jest.Mock).mockReturnValueOnce(builder);

            const insertedPlugin = await pluginRepository.insert(pluginPayload);

            expect(database.insert).toHaveBeenCalledWith(pluginsTable);
            expect(builder.values).toHaveBeenCalledWith({
                createdAt: fixedSystemTime,
                updatedAt: fixedSystemTime,
                ...pluginPayload,
            });
            expect(builder.returning).toHaveBeenCalled();
            expect(builder.execute).toHaveBeenCalled();

            expect(insertedPlugin).toBeNull();
        });
    });
});
