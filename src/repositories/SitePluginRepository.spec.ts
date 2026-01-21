import { and, eq } from 'drizzle-orm';
import SitePluginRepository from 'src/repositories/SitePluginRepository';
import { TDatabase, TSitePluginsTable } from 'src/services/database/Types';

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
        const sitePluginsPayload = [
            {
                createdAt: new Date('2026-01-01T00:00:00Z'),
                updatedAt: new Date('2026-01-01T00:00:00Z'),
                siteId: 1,
                pluginId: 1,
                installedVersion: '1.0.0',
                requiredPhpVersion: '8.5.1',
                requiredWpVersion: '6.9.0',
                isActive: true,
            },
            {
                createdAt: new Date('2026-01-02T00:00:00Z'),
                updatedAt: new Date('2026-01-02T00:00:00Z'),
                siteId: 2,
                pluginId: 2,
                installedVersion: '1.0.0',
                requiredPhpVersion: '8.5.1',
                requiredWpVersion: '6.9.0',
                isActive: false,
            },
        ] as const;

        it('should return all site plugins', async () => {
            const builder = {
                from: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue(sitePluginsPayload),
            };

            (database.select as jest.Mock).mockReturnValueOnce(builder);

            const sitePlugins = await sitePluginRepository.findAll();

            expect(database.select).toHaveBeenCalled();
            expect(builder.from).toHaveBeenCalledWith(sitePluginsTable);
            expect(builder.execute).toHaveBeenCalled();

            expect(sitePlugins).toHaveLength(2);

            const [firstSitePlugin, secondSitePlugin] = sitePlugins;

            expect(firstSitePlugin.getSiteId()).toBe(sitePluginsPayload[0].siteId);
            expect(firstSitePlugin.getPluginId()).toBe(sitePluginsPayload[0].pluginId);
            expect(firstSitePlugin.getInstalledVersion()).toBe(sitePluginsPayload[0].installedVersion);
            expect(firstSitePlugin.getRequiredPhpVersion()).toBe(sitePluginsPayload[0].requiredPhpVersion);
            expect(firstSitePlugin.getRequiredWpVersion()).toBe(sitePluginsPayload[0].requiredWpVersion);

            expect(secondSitePlugin.getSiteId()).toBe(sitePluginsPayload[1].siteId);
            expect(secondSitePlugin.getPluginId()).toBe(sitePluginsPayload[1].pluginId);
            expect(secondSitePlugin.getInstalledVersion()).toBe(sitePluginsPayload[1].installedVersion);
            expect(secondSitePlugin.getRequiredPhpVersion()).toBe(sitePluginsPayload[1].requiredPhpVersion);
            expect(secondSitePlugin.getRequiredWpVersion()).toBe(sitePluginsPayload[1].requiredWpVersion);
        });
    });

    describe('SitePluginRepository.findAllBySiteId', () => {
        const sitePluginsPayload = [
            {
                createdAt: new Date('2026-01-01T00:00:00Z'),
                updatedAt: new Date('2026-01-01T00:00:00Z'),
                siteId: 1,
                pluginId: 1,
                installedVersion: '1.0.0',
                requiredPhpVersion: '8.5.1',
                requiredWpVersion: '6.9.0',
                isActive: true,
            },
            {
                createdAt: new Date('2026-01-02T00:00:00Z'),
                updatedAt: new Date('2026-01-02T00:00:00Z'),
                siteId: 1,
                pluginId: 2,
                installedVersion: '1.0.0',
                requiredPhpVersion: '8.5.1',
                requiredWpVersion: '6.9.0',
                isActive: false,
            },
        ] as const;

        it('should return all site plugins for a given siteId', async () => {
            const builder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue(sitePluginsPayload),
            };

            (database.select as jest.Mock).mockReturnValueOnce(builder);

            const sitePlugins = await sitePluginRepository.findAllBySiteId(1);

            expect(database.select).toHaveBeenCalled();
            expect(builder.from).toHaveBeenCalledWith(sitePluginsTable);
            expect(builder.where).toHaveBeenCalledWith(eq(sitePluginsTable.siteId, 1));
            expect(builder.execute).toHaveBeenCalled();

            expect(sitePlugins).toHaveLength(2);

            const [firstSitePlugin, secondSitePlugin] = sitePlugins;

            expect(firstSitePlugin.getSiteId()).toBe(sitePluginsPayload[0].siteId);
            expect(firstSitePlugin.getPluginId()).toBe(sitePluginsPayload[0].pluginId);
            expect(firstSitePlugin.getInstalledVersion()).toBe(sitePluginsPayload[0].installedVersion);
            expect(firstSitePlugin.getRequiredPhpVersion()).toBe(sitePluginsPayload[0].requiredPhpVersion);
            expect(firstSitePlugin.getRequiredWpVersion()).toBe(sitePluginsPayload[0].requiredWpVersion);

            expect(secondSitePlugin.getSiteId()).toBe(sitePluginsPayload[1].siteId);
            expect(secondSitePlugin.getPluginId()).toBe(sitePluginsPayload[1].pluginId);
            expect(secondSitePlugin.getInstalledVersion()).toBe(sitePluginsPayload[1].installedVersion);
            expect(secondSitePlugin.getRequiredPhpVersion()).toBe(sitePluginsPayload[1].requiredPhpVersion);
            expect(secondSitePlugin.getRequiredWpVersion()).toBe(sitePluginsPayload[1].requiredWpVersion);
        });
    });

    describe('SitePluginRepository.findBySiteIdAndPluginId', () => {
        it('should return one site plugin by its siteId and pluginId', async () => {
            const builder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([
                    {
                        createdAt: new Date('2026-01-01T00:00:00Z'),
                        updatedAt: new Date('2026-01-01T00:00:00Z'),
                        siteId: 1,
                        pluginId: 1,
                        installedVersion: '1.0.0',
                        requiredPhpVersion: '8.5.1',
                        requiredWpVersion: '6.9.0',
                        isActive: true,
                    },
                ]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(builder);

            const sitePlugin = await sitePluginRepository.findBySiteIdAndPluginId(1, 1);

            expect(database.select).toHaveBeenCalled();
            expect(builder.from).toHaveBeenCalledWith(sitePluginsTable);
            expect(builder.where).toHaveBeenCalledWith(
                and(eq(sitePluginsTable.siteId, 1), eq(sitePluginsTable.pluginId, 1))
            );
            expect(builder.limit).toHaveBeenCalledWith(1);
            expect(builder.execute).toHaveBeenCalled();

            expect(sitePlugin).not.toBeNull();
            expect(sitePlugin?.getSiteId()).toBe(1);
            expect(sitePlugin?.getPluginId()).toBe(1);
            expect(sitePlugin?.getInstalledVersion()).toBe('1.0.0');
            expect(sitePlugin?.getRequiredPhpVersion()).toBe('8.5.1');
            expect(sitePlugin?.getRequiredWpVersion()).toBe('6.9.0');
        });

        it('should return null if the plugin could not be found by its id', async () => {
            const builder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(builder);

            const sitePlugin = await sitePluginRepository.findBySiteIdAndPluginId(1, 1);

            expect(database.select).toHaveBeenCalled();
            expect(builder.from).toHaveBeenCalledWith(sitePluginsTable);
            expect(builder.where).toHaveBeenCalledWith(
                and(eq(sitePluginsTable.siteId, 1), eq(sitePluginsTable.pluginId, 1))
            );
            expect(builder.limit).toHaveBeenCalledWith(1);
            expect(builder.execute).toHaveBeenCalled();

            expect(sitePlugin).toBeNull();
        });
    });

    describe('SitePluginRepository.insert', () => {
        const sitePluginPayload = {
            siteId: 1,
            pluginId: 1,
            installedVersion: '1.0.0',
            requiredPhpVersion: '8.5.1',
            requiredWpVersion: '6.9.0',
            isActive: true,
        } as const;

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
                        ...sitePluginPayload,
                    },
                ]),
            };

            (database.insert as jest.Mock).mockReturnValueOnce(builder);

            const insertedSitePlugin = await sitePluginRepository.insert(sitePluginPayload);

            expect(database.insert).toHaveBeenCalledWith(sitePluginsTable);
            expect(builder.values).toHaveBeenCalledWith({
                createdAt: fixedSystemTime,
                updatedAt: fixedSystemTime,
                siteId: sitePluginPayload.siteId,
                pluginId: sitePluginPayload.pluginId,
                installedVersion: sitePluginPayload.installedVersion,
                requiredPhpVersion: sitePluginPayload.requiredPhpVersion,
                requiredWpVersion: sitePluginPayload.requiredWpVersion,
                isActive: sitePluginPayload.isActive ? 1 : 0,
            });
            expect(builder.returning).toHaveBeenCalled();
            expect(builder.execute).toHaveBeenCalled();

            expect(insertedSitePlugin).not.toBeNull();
            expect(insertedSitePlugin?.getCreatedAt()).toEqual(fixedSystemTime);
            expect(insertedSitePlugin?.getUpdatedAt()).toEqual(fixedSystemTime);
            expect(insertedSitePlugin?.getSiteId()).toBe(1);
            expect(insertedSitePlugin?.getPluginId()).toBe(1);
            expect(insertedSitePlugin?.getInstalledVersion()).toBe(sitePluginPayload.installedVersion);
            expect(insertedSitePlugin?.getRequiredPhpVersion()).toBe(sitePluginPayload.requiredPhpVersion);
            expect(insertedSitePlugin?.getRequiredWpVersion()).toBe(sitePluginPayload.requiredWpVersion);
            expect(insertedSitePlugin?.getIsActive()).toBeTruthy();
        });

        it('should return null when the site plugin insert fails', async () => {
            const builder = {
                values: jest.fn().mockReturnThis(),
                returning: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([]),
            };

            (database.insert as jest.Mock).mockReturnValueOnce(builder);

            const insertedSitePlugin = await sitePluginRepository.insert(sitePluginPayload);

            expect(database.insert).toHaveBeenCalledWith(sitePluginsTable);
            expect(builder.values).toHaveBeenCalledWith({
                createdAt: fixedSystemTime,
                updatedAt: fixedSystemTime,
                siteId: sitePluginPayload.siteId,
                pluginId: sitePluginPayload.pluginId,
                installedVersion: sitePluginPayload.installedVersion,
                requiredPhpVersion: sitePluginPayload.requiredPhpVersion,
                requiredWpVersion: sitePluginPayload.requiredWpVersion,
                isActive: sitePluginPayload.isActive ? 1 : 0,
            });
            expect(builder.returning).toHaveBeenCalled();
            expect(builder.execute).toHaveBeenCalled();

            expect(insertedSitePlugin).toBeNull();
        });
    });

    describe('SitePluginRepository.update', () => {
        const sitePluginPayload = {
            siteId: 1,
            pluginId: 1,
            installedVersion: '1.0.0',
            requiredPhpVersion: '8.5.1',
            requiredWpVersion: '6.9.0',
            isActive: true,
        } as const;

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
                        createdAt: fixedSystemTime,
                        updatedAt: fixedSystemTime,
                        ...sitePluginPayload,
                    },
                ]),
            };

            (database.update as jest.Mock).mockReturnValueOnce(builder);

            const updatedSitePlugin = await sitePluginRepository.update(sitePluginPayload);

            expect(database.update).toHaveBeenCalledWith(sitePluginsTable);
            expect(builder.set).toHaveBeenCalledWith({
                updatedAt: fixedSystemTime,
                installedVersion: sitePluginPayload.installedVersion,
                requiredPhpVersion: sitePluginPayload.requiredPhpVersion,
                requiredWpVersion: sitePluginPayload.requiredWpVersion,
                isActive: sitePluginPayload.isActive ? 1 : 0,
            });
            expect(builder.where).toHaveBeenCalledWith(
                and(
                    eq(sitePluginsTable.siteId, sitePluginPayload.siteId),
                    eq(sitePluginsTable.pluginId, sitePluginPayload.pluginId)
                )
            );
            expect(builder.returning).toHaveBeenCalled();
            expect(builder.execute).toHaveBeenCalled();

            expect(updatedSitePlugin?.getCreatedAt()).toEqual(fixedSystemTime);
            expect(updatedSitePlugin?.getUpdatedAt()).toEqual(fixedSystemTime);
            expect(updatedSitePlugin?.getSiteId()).toBe(sitePluginPayload.siteId);
            expect(updatedSitePlugin?.getPluginId()).toBe(sitePluginPayload.pluginId);
            expect(updatedSitePlugin?.getInstalledVersion()).toBe(sitePluginPayload.installedVersion);
            expect(updatedSitePlugin?.getRequiredPhpVersion()).toBe(sitePluginPayload.requiredPhpVersion);
            expect(updatedSitePlugin?.getRequiredWpVersion()).toBe(sitePluginPayload.requiredWpVersion);
            expect(updatedSitePlugin?.getIsActive()).toBeTruthy();
        });

        it('should return null when the site plugin update fails', async () => {
            const builder = {
                set: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                returning: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([]),
            };

            (database.update as jest.Mock).mockReturnValueOnce(builder);

            const updatedSitePlugin = await sitePluginRepository.update(sitePluginPayload);

            expect(database.update).toHaveBeenCalledWith(sitePluginsTable);
            expect(builder.set).toHaveBeenCalledWith({
                updatedAt: fixedSystemTime,
                installedVersion: sitePluginPayload.installedVersion,
                requiredPhpVersion: sitePluginPayload.requiredPhpVersion,
                requiredWpVersion: sitePluginPayload.requiredWpVersion,
                isActive: sitePluginPayload.isActive ? 1 : 0,
            });
            expect(builder.where).toHaveBeenCalledWith(
                and(
                    eq(sitePluginsTable.siteId, sitePluginPayload.siteId),
                    eq(sitePluginsTable.pluginId, sitePluginPayload.pluginId)
                )
            );
            expect(builder.returning).toHaveBeenCalled();
            expect(builder.execute).toHaveBeenCalled();

            expect(updatedSitePlugin).toBeNull();
        });
    });

    describe('SitePluginRepository.delete', () => {
        const sitePluginPayload = {
            siteId: 1,
            pluginId: 1,
            installedVersion: '1.0.0',
            requiredPhpVersion: '8.5.1',
            requiredWpVersion: '6.9.0',
            isActive: true,
        } as const;

        const fixedSystemTime = new Date('2026-01-01T00:00:00Z');

        beforeEach(() => {
            jest.useFakeTimers();
            jest.setSystemTime(fixedSystemTime);
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should return true when deletion was successful', async () => {
            const builder = {
                where: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue({
                    changes: 1,
                }),
            };

            (database.delete as jest.Mock).mockReturnValueOnce(builder);

            const isSitePluginDeleted = await sitePluginRepository.delete(1, 1);

            expect(database.delete).toHaveBeenCalledWith(sitePluginsTable);
            expect(builder.where).toHaveBeenCalledWith(
                and(
                    eq(sitePluginsTable.siteId, sitePluginPayload.siteId),
                    eq(sitePluginsTable.pluginId, sitePluginPayload.pluginId)
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

            const isSitePluginDeleted = await sitePluginRepository.delete(1, 1);

            expect(database.delete).toHaveBeenCalledWith(sitePluginsTable);
            expect(builder.where).toHaveBeenCalledWith(
                and(
                    eq(sitePluginsTable.siteId, sitePluginPayload.siteId),
                    eq(sitePluginsTable.pluginId, sitePluginPayload.pluginId)
                )
            );
            expect(builder.execute).toHaveBeenCalled();

            expect(isSitePluginDeleted).toBeFalsy();
        });
    });

    describe('SitePluginRepository.delete', () => {
        it('should delete a site plugin and return true', async () => {
            const builder = {
                set: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue({ changes: 1 }),
            };

            (database.delete as jest.Mock).mockReturnValueOnce(builder);

            const isDeleted = await sitePluginRepository.delete(1, 1);

            expect(database.delete).toHaveBeenCalledWith(sitePluginsTable);
            expect(builder.where).toHaveBeenCalledWith(
                and(eq(sitePluginsTable.siteId, 1), eq(sitePluginsTable.pluginId, 1))
            );
            expect(builder.execute).toHaveBeenCalled();

            expect(isDeleted).toBeTruthy();
        });

        it('should fail to delete a site plugin and return false', async () => {
            const builder = {
                set: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue({ changes: 0 }),
            };

            (database.delete as jest.Mock).mockReturnValueOnce(builder);

            const isDeleted = await sitePluginRepository.delete(1, 1);

            expect(database.delete).toHaveBeenCalledWith(sitePluginsTable);
            expect(builder.where).toHaveBeenCalledWith(
                and(eq(sitePluginsTable.siteId, 1), eq(sitePluginsTable.pluginId, 1))
            );
            expect(builder.execute).toHaveBeenCalled();

            expect(isDeleted).toBeFalsy();
        });
    });
});
