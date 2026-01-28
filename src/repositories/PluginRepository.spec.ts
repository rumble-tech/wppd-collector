import { eq } from 'drizzle-orm';
import Plugin from 'src/entities/Plugin';
import PluginRepository from 'src/repositories/PluginRepository';
import { TDatabase, TPluginsTable } from 'src/services/database/Types';
import { testDataPluginEntity, testDataPluginJSON } from 'test-utils/test-data/Plugin';

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

    describe('PluginRepository.findAll', () => {
        it('should return all plugins', async () => {
            const builder = {
                from: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([testDataPluginJSON]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(builder);

            const plugins = await pluginRepository.findAll();

            expect(database.select).toHaveBeenCalled();
            expect(builder.from).toHaveBeenCalledWith(pluginsTable);
            expect(builder.execute).toHaveBeenCalled();

            expect(plugins).toHaveLength(1);
            const [plugin] = plugins;

            expect(plugin).toEqualPluginEntity(testDataPluginEntity);
        });
    });

    describe('PluginRepository.findById', () => {
        it('should return one plugin by its id', async () => {
            const builder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([testDataPluginJSON]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(builder);

            const plugin = await pluginRepository.findById(testDataPluginJSON.id);

            expect(database.select).toHaveBeenCalled();
            expect(builder.from).toHaveBeenCalledWith(pluginsTable);
            expect(builder.where).toHaveBeenCalledWith(eq(pluginsTable.id, testDataPluginJSON.id));
            expect(builder.limit).toHaveBeenCalledWith(1);
            expect(builder.execute).toHaveBeenCalled();

            expect(plugin).not.toBeNull();
            expect(plugin).toEqualPluginEntity(testDataPluginEntity);
        });

        it('should return null if the plugin could not be found by its id', async () => {
            const builder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(builder);

            const plugin = await pluginRepository.findById(testDataPluginJSON.id);

            expect(database.select).toHaveBeenCalled();
            expect(builder.from).toHaveBeenCalledWith(pluginsTable);
            expect(builder.where).toHaveBeenCalledWith(eq(pluginsTable.id, testDataPluginJSON.id));
            expect(builder.limit).toHaveBeenCalledWith(1);
            expect(builder.execute).toHaveBeenCalled();

            expect(plugin).toBeNull();
        });
    });

    describe('PluginRepository.findBySlug', () => {
        it('should return one plugin by its slug', async () => {
            const builder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([testDataPluginJSON]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(builder);

            const plugin = await pluginRepository.findBySlug(testDataPluginJSON.slug);

            expect(database.select).toHaveBeenCalled();
            expect(builder.from).toHaveBeenCalledWith(pluginsTable);
            expect(builder.where).toHaveBeenCalledWith(eq(pluginsTable.slug, testDataPluginJSON.slug));
            expect(builder.limit).toHaveBeenCalledWith(1);
            expect(builder.execute).toHaveBeenCalled();

            expect(plugin).not.toBeNull();
            expect(plugin).toEqualPluginEntity(testDataPluginEntity);
        });

        it('should return null if the plugin could not be found by its slug', async () => {
            const builder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(builder);

            const plugin = await pluginRepository.findBySlug(testDataPluginJSON.slug);

            expect(database.select).toHaveBeenCalled();
            expect(builder.from).toHaveBeenCalledWith(pluginsTable);
            expect(builder.where).toHaveBeenCalledWith(eq(pluginsTable.slug, testDataPluginJSON.slug));
            expect(builder.limit).toHaveBeenCalledWith(1);
            expect(builder.execute).toHaveBeenCalled();

            expect(plugin).toBeNull();
        });
    });

    describe('PluginRepository.insert', () => {
        const insertPluginPayload = {
            slug: testDataPluginJSON.slug,
            name: testDataPluginJSON.name,
            latestVersion: testDataPluginJSON.latestVersion,
            requiredPhpVersion: testDataPluginJSON.requiredPhpVersion,
            requiredWpVersion: testDataPluginJSON.requiredWpVersion,
        };

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
                        id: testDataPluginJSON.id,
                        createdAt: fixedSystemTime,
                        updatedAt: fixedSystemTime,
                        ...insertPluginPayload,
                    },
                ]),
            };

            (database.insert as jest.Mock).mockReturnValueOnce(builder);

            const insertedPlugin = await pluginRepository.insert(insertPluginPayload);

            expect(database.insert).toHaveBeenCalledWith(pluginsTable);
            expect(builder.values).toHaveBeenCalledWith({
                createdAt: fixedSystemTime,
                updatedAt: fixedSystemTime,
                ...insertPluginPayload,
            });
            expect(builder.returning).toHaveBeenCalled();
            expect(builder.execute).toHaveBeenCalled();

            expect(insertedPlugin).not.toBeNull();
            expect(insertedPlugin).toEqualPluginEntity(
                new Plugin({
                    ...testDataPluginJSON,
                    createdAt: fixedSystemTime,
                    updatedAt: fixedSystemTime,
                })
            );
        });

        it('should return null when the plugin insert fails', async () => {
            const builder = {
                values: jest.fn().mockReturnThis(),
                returning: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([]),
            };

            (database.insert as jest.Mock).mockReturnValueOnce(builder);

            const insertedPlugin = await pluginRepository.insert(insertPluginPayload);

            expect(database.insert).toHaveBeenCalledWith(pluginsTable);
            expect(builder.values).toHaveBeenCalledWith({
                createdAt: fixedSystemTime,
                updatedAt: fixedSystemTime,
                ...insertPluginPayload,
            });
            expect(builder.returning).toHaveBeenCalled();
            expect(builder.execute).toHaveBeenCalled();

            expect(insertedPlugin).toBeNull();
        });
    });

    describe('PluginRepository.update', () => {
        const pluginUpdatePayload = {
            id: testDataPluginJSON.id,
            slug: testDataPluginJSON.slug,
            name: testDataPluginJSON.name,
            latestVersion: testDataPluginJSON.latestVersion,
            requiredPhpVersion: testDataPluginJSON.requiredPhpVersion,
            requiredWpVersion: testDataPluginJSON.requiredWpVersion,
        };

        const fixedSystemTime = new Date('2026-01-01T00:00:00Z');

        beforeEach(() => {
            jest.useFakeTimers();
            jest.setSystemTime(fixedSystemTime);
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should update an existing plugin and return it', async () => {
            const builder = {
                set: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                returning: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([
                    {
                        createdAt: testDataPluginJSON.createdAt,
                        updatedAt: fixedSystemTime,
                        ...pluginUpdatePayload,
                    },
                ]),
            };

            (database.update as jest.Mock).mockReturnValueOnce(builder);

            const updatedPlugin = await pluginRepository.update(pluginUpdatePayload);

            expect(database.update).toHaveBeenCalledWith(pluginsTable);
            expect(builder.set).toHaveBeenCalledWith({
                updatedAt: fixedSystemTime,
                slug: pluginUpdatePayload.slug,
                name: pluginUpdatePayload.name,
                latestVersion: pluginUpdatePayload.latestVersion,
                requiredPhpVersion: pluginUpdatePayload.requiredPhpVersion,
                requiredWpVersion: pluginUpdatePayload.requiredWpVersion,
            });
            expect(builder.where).toHaveBeenCalledWith(eq(pluginsTable.id, pluginUpdatePayload.id));
            expect(builder.returning).toHaveBeenCalled();
            expect(builder.execute).toHaveBeenCalled();

            expect(updatedPlugin).not.toBeNull();
            expect(updatedPlugin).toEqualPluginEntity(
                new Plugin({
                    ...testDataPluginJSON,
                    updatedAt: fixedSystemTime,
                })
            );
        });

        it('should return null when the plugin update fails', async () => {
            const builder = {
                set: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                returning: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([]),
            };

            (database.update as jest.Mock).mockReturnValueOnce(builder);

            const updatedPlugin = await pluginRepository.update(pluginUpdatePayload);

            expect(database.update).toHaveBeenCalledWith(pluginsTable);
            expect(builder.set).toHaveBeenCalledWith({
                updatedAt: fixedSystemTime,
                slug: pluginUpdatePayload.slug,
                name: pluginUpdatePayload.name,
                latestVersion: pluginUpdatePayload.latestVersion,
                requiredPhpVersion: pluginUpdatePayload.requiredPhpVersion,
                requiredWpVersion: pluginUpdatePayload.requiredWpVersion,
            });
            expect(builder.where).toHaveBeenCalledWith(eq(pluginsTable.id, pluginUpdatePayload.id));
            expect(builder.returning).toHaveBeenCalled();
            expect(builder.execute).toHaveBeenCalled();

            expect(updatedPlugin).toBeNull();
        });
    });

    describe('PluginRepository.delete', () => {
        it('should delete a plugin and return true', async () => {
            const builder = {
                set: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue({ changes: 1 }),
            };

            (database.delete as jest.Mock).mockReturnValueOnce(builder);

            const isDeleted = await pluginRepository.delete(testDataPluginJSON.id);

            expect(database.delete).toHaveBeenCalledWith(pluginsTable);
            expect(builder.where).toHaveBeenCalledWith(eq(pluginsTable.id, testDataPluginJSON.id));
            expect(builder.execute).toHaveBeenCalled();

            expect(isDeleted).toBeTruthy();
        });

        it('should fail to delete a plugin and return false', async () => {
            const builder = {
                set: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue({ changes: 0 }),
            };

            (database.delete as jest.Mock).mockReturnValueOnce(builder);

            const isDeleted = await pluginRepository.delete(testDataPluginJSON.id);

            expect(database.delete).toHaveBeenCalledWith(pluginsTable);
            expect(builder.where).toHaveBeenCalledWith(eq(pluginsTable.id, testDataPluginJSON.id));
            expect(builder.execute).toHaveBeenCalled();

            expect(isDeleted).toBeFalsy();
        });
    });
});
