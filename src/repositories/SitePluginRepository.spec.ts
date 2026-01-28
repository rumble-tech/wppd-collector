import { and, eq } from 'drizzle-orm';
import SitePlugin from 'src/entities/SitePlugin';
import SitePluginRepository from 'src/repositories/SitePluginRepository';
import { TDatabase, TSitePluginsTable } from 'src/services/database/Types';
import { testDataSitePluginEntity, testDataSitePluginJSON } from 'test-utils/test-data/SitePlugin';

describe('SitePluginRepository', () => {
    let sitePluginRepository: SitePluginRepository;
    let database: Partial<TDatabase>;
    let sitePluginsTable: TSitePluginsTable;

    beforeEach(() => {
        database = {
            select: jest.fn(),
            insert: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };

        sitePluginsTable = {} as unknown as TSitePluginsTable;

        sitePluginRepository = new SitePluginRepository(database as TDatabase, sitePluginsTable);
    });

    describe('SitePluginRepository.findAll', () => {
        it('should return all site plugins', async () => {
            const builder = {
                from: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([testDataSitePluginJSON]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(builder);

            const sitePlugins = await sitePluginRepository.findAll();

            expect(database.select).toHaveBeenCalled();
            expect(builder.from).toHaveBeenCalledWith(sitePluginsTable);
            expect(builder.execute).toHaveBeenCalled();

            expect(sitePlugins).toHaveLength(1);

            const [sitePlugin] = sitePlugins;

            expect(sitePlugin).toEqualSitePluginEntity(testDataSitePluginEntity);
        });
    });

    describe('SitePluginRepository.findAllBySiteId', () => {
        it('should return all site plugins for a given siteId', async () => {
            const builder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([testDataSitePluginJSON]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(builder);

            const sitePlugins = await sitePluginRepository.findAllBySiteId(testDataSitePluginJSON.siteId);

            expect(database.select).toHaveBeenCalled();
            expect(builder.from).toHaveBeenCalledWith(sitePluginsTable);
            expect(builder.where).toHaveBeenCalledWith(eq(sitePluginsTable.siteId, testDataSitePluginJSON.siteId));
            expect(builder.execute).toHaveBeenCalled();

            expect(sitePlugins).toHaveLength(1);

            const [sitePlugin] = sitePlugins;

            expect(sitePlugin).toEqualSitePluginEntity(testDataSitePluginEntity);
        });
    });

    describe('SitePluginRepository.findBySiteIdAndPluginId', () => {
        it('should return one site plugin by its siteId and pluginId', async () => {
            const builder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([testDataSitePluginJSON]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(builder);

            const sitePlugin = await sitePluginRepository.findBySiteIdAndPluginId(
                testDataSitePluginJSON.siteId,
                testDataSitePluginJSON.pluginId
            );

            expect(database.select).toHaveBeenCalled();
            expect(builder.from).toHaveBeenCalledWith(sitePluginsTable);
            expect(builder.where).toHaveBeenCalledWith(
                and(
                    eq(sitePluginsTable.siteId, testDataSitePluginJSON.siteId),
                    eq(sitePluginsTable.pluginId, testDataSitePluginJSON.pluginId)
                )
            );
            expect(builder.limit).toHaveBeenCalledWith(1);
            expect(builder.execute).toHaveBeenCalled();

            expect(sitePlugin).not.toBeNull();
            expect(sitePlugin).toEqualSitePluginEntity(testDataSitePluginEntity);
        });

        it('should return null if the plugin could not be found by its id', async () => {
            const builder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(builder);

            const sitePlugin = await sitePluginRepository.findBySiteIdAndPluginId(
                testDataSitePluginJSON.siteId,
                testDataSitePluginJSON.pluginId
            );

            expect(database.select).toHaveBeenCalled();
            expect(builder.from).toHaveBeenCalledWith(sitePluginsTable);
            expect(builder.where).toHaveBeenCalledWith(
                and(
                    eq(sitePluginsTable.siteId, testDataSitePluginJSON.siteId),
                    eq(sitePluginsTable.pluginId, testDataSitePluginJSON.pluginId)
                )
            );
            expect(builder.limit).toHaveBeenCalledWith(1);
            expect(builder.execute).toHaveBeenCalled();

            expect(sitePlugin).toBeNull();
        });
    });

    describe('SitePluginRepository.insert', () => {
        const insertSitePluginPayload = {
            siteId: testDataSitePluginJSON.siteId,
            pluginId: testDataSitePluginJSON.pluginId,
            installedVersion: testDataSitePluginJSON.installedVersion,
            requiredPhpVersion: testDataSitePluginJSON.requiredPhpVersion,
            requiredWpVersion: testDataSitePluginJSON.requiredWpVersion,
            isActive: testDataSitePluginJSON.isActive,
        };

        const fixedSystemTime = new Date('2026-01-01T00:00:00Z');

        beforeEach(() => {
            jest.useFakeTimers();
            jest.setSystemTime(fixedSystemTime);
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should insert a new site plugin and return it', async () => {
            const builder = {
                values: jest.fn().mockReturnThis(),
                returning: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([
                    {
                        createdAt: fixedSystemTime,
                        updatedAt: fixedSystemTime,
                        ...insertSitePluginPayload,
                    },
                ]),
            };

            (database.insert as jest.Mock).mockReturnValueOnce(builder);

            const insertedSitePlugin = await sitePluginRepository.insert(insertSitePluginPayload);

            expect(database.insert).toHaveBeenCalledWith(sitePluginsTable);
            expect(builder.values).toHaveBeenCalledWith({
                createdAt: fixedSystemTime,
                updatedAt: fixedSystemTime,
                siteId: insertSitePluginPayload.siteId,
                pluginId: insertSitePluginPayload.pluginId,
                installedVersion: insertSitePluginPayload.installedVersion,
                requiredPhpVersion: insertSitePluginPayload.requiredPhpVersion,
                requiredWpVersion: insertSitePluginPayload.requiredWpVersion,
                isActive: insertSitePluginPayload.isActive ? 1 : 0,
            });
            expect(builder.returning).toHaveBeenCalled();
            expect(builder.execute).toHaveBeenCalled();

            expect(insertedSitePlugin).not.toBeNull();
            expect(insertedSitePlugin).toEqualSitePluginEntity(
                new SitePlugin({
                    ...testDataSitePluginJSON,
                    createdAt: fixedSystemTime,
                    updatedAt: fixedSystemTime,
                })
            );
        });

        it('should return null when the site plugin insert fails', async () => {
            const builder = {
                values: jest.fn().mockReturnThis(),
                returning: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([]),
            };

            (database.insert as jest.Mock).mockReturnValueOnce(builder);

            const insertedSitePlugin = await sitePluginRepository.insert(insertSitePluginPayload);

            expect(database.insert).toHaveBeenCalledWith(sitePluginsTable);
            expect(builder.values).toHaveBeenCalledWith({
                createdAt: fixedSystemTime,
                updatedAt: fixedSystemTime,
                siteId: insertSitePluginPayload.siteId,
                pluginId: insertSitePluginPayload.pluginId,
                installedVersion: insertSitePluginPayload.installedVersion,
                requiredPhpVersion: insertSitePluginPayload.requiredPhpVersion,
                requiredWpVersion: insertSitePluginPayload.requiredWpVersion,
                isActive: insertSitePluginPayload.isActive ? 1 : 0,
            });
            expect(builder.returning).toHaveBeenCalled();
            expect(builder.execute).toHaveBeenCalled();

            expect(insertedSitePlugin).toBeNull();
        });
    });

    describe('SitePluginRepository.update', () => {
        const updateSitePluginPayload = {
            siteId: testDataSitePluginJSON.siteId,
            pluginId: testDataSitePluginJSON.pluginId,
            installedVersion: testDataSitePluginJSON.installedVersion,
            requiredPhpVersion: testDataSitePluginJSON.requiredPhpVersion,
            requiredWpVersion: testDataSitePluginJSON.requiredWpVersion,
            isActive: testDataSitePluginJSON.isActive,
        };

        const fixedSystemTime = new Date('2026-01-01T00:00:00Z');

        beforeEach(() => {
            jest.useFakeTimers();
            jest.setSystemTime(fixedSystemTime);
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should update an existing site plugin and return it', async () => {
            const builder = {
                set: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                returning: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([
                    {
                        createdAt: testDataSitePluginJSON.createdAt,
                        updatedAt: fixedSystemTime,
                        ...updateSitePluginPayload,
                    },
                ]),
            };

            (database.update as jest.Mock).mockReturnValueOnce(builder);

            const updatedSitePlugin = await sitePluginRepository.update(updateSitePluginPayload);

            expect(database.update).toHaveBeenCalledWith(sitePluginsTable);
            expect(builder.set).toHaveBeenCalledWith({
                updatedAt: fixedSystemTime,
                installedVersion: updateSitePluginPayload.installedVersion,
                requiredPhpVersion: updateSitePluginPayload.requiredPhpVersion,
                requiredWpVersion: updateSitePluginPayload.requiredWpVersion,
                isActive: updateSitePluginPayload.isActive ? 1 : 0,
            });
            expect(builder.where).toHaveBeenCalledWith(
                and(
                    eq(sitePluginsTable.siteId, updateSitePluginPayload.siteId),
                    eq(sitePluginsTable.pluginId, updateSitePluginPayload.pluginId)
                )
            );
            expect(builder.returning).toHaveBeenCalled();
            expect(builder.execute).toHaveBeenCalled();

            expect(updatedSitePlugin).not.toBeNull();
            expect(updatedSitePlugin).toEqualSitePluginEntity(
                new SitePlugin({
                    ...testDataSitePluginJSON,
                    updatedAt: fixedSystemTime,
                })
            );
        });

        it('should return null when the site plugin update fails', async () => {
            const builder = {
                set: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                returning: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([]),
            };

            (database.update as jest.Mock).mockReturnValueOnce(builder);

            const updatedSitePlugin = await sitePluginRepository.update(updateSitePluginPayload);

            expect(database.update).toHaveBeenCalledWith(sitePluginsTable);
            expect(builder.set).toHaveBeenCalledWith({
                updatedAt: fixedSystemTime,
                installedVersion: updateSitePluginPayload.installedVersion,
                requiredPhpVersion: updateSitePluginPayload.requiredPhpVersion,
                requiredWpVersion: updateSitePluginPayload.requiredWpVersion,
                isActive: updateSitePluginPayload.isActive ? 1 : 0,
            });
            expect(builder.where).toHaveBeenCalledWith(
                and(
                    eq(sitePluginsTable.siteId, updateSitePluginPayload.siteId),
                    eq(sitePluginsTable.pluginId, updateSitePluginPayload.pluginId)
                )
            );
            expect(builder.returning).toHaveBeenCalled();
            expect(builder.execute).toHaveBeenCalled();

            expect(updatedSitePlugin).toBeNull();
        });
    });

    describe('SitePluginRepository.delete', () => {
        it('should return true when deletion was successful', async () => {
            const builder = {
                where: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue({
                    changes: 1,
                }),
            };

            (database.delete as jest.Mock).mockReturnValueOnce(builder);

            const isSitePluginDeleted = await sitePluginRepository.delete(
                testDataSitePluginJSON.siteId,
                testDataSitePluginJSON.pluginId
            );

            expect(database.delete).toHaveBeenCalledWith(sitePluginsTable);
            expect(builder.where).toHaveBeenCalledWith(
                and(
                    eq(sitePluginsTable.siteId, testDataSitePluginJSON.siteId),
                    eq(sitePluginsTable.pluginId, testDataSitePluginJSON.pluginId)
                )
            );
            expect(builder.execute).toHaveBeenCalled();

            expect(isSitePluginDeleted).toBeTruthy();
        });

        it('should return false when deletion failed', async () => {
            const builder = {
                where: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue({
                    changes: 0,
                }),
            };

            (database.delete as jest.Mock).mockReturnValueOnce(builder);

            const isSitePluginDeleted = await sitePluginRepository.delete(
                testDataSitePluginJSON.siteId,
                testDataSitePluginJSON.pluginId
            );

            expect(database.delete).toHaveBeenCalledWith(sitePluginsTable);
            expect(builder.where).toHaveBeenCalledWith(
                and(
                    eq(sitePluginsTable.siteId, testDataSitePluginJSON.siteId),
                    eq(sitePluginsTable.pluginId, testDataSitePluginJSON.pluginId)
                )
            );
            expect(builder.execute).toHaveBeenCalled();

            expect(isSitePluginDeleted).toBeFalsy();
        });
    });
});
