import { TDatabase, TPluginsTable, TSitePluginsTable, TSitesTable } from 'src/components/database/Types';
import SiteRepository from './SiteRepository';
import { and, eq } from 'drizzle-orm';
import { version } from 'winston';

describe('SiteRepository', () => {
    let siteRepository: SiteRepository;
    let database: Partial<TDatabase>;
    let sitesTable: TSitesTable;
    let pluginsTable: TPluginsTable;
    let sitePluginsTable: TSitePluginsTable;

    beforeEach(() => {
        database = {
            select: jest.fn(),
            insert: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };

        sitesTable = {} as unknown as TSitesTable;
        pluginsTable = {} as unknown as TPluginsTable;
        sitePluginsTable = {} as unknown as TSitePluginsTable;

        siteRepository = new SiteRepository(database as TDatabase, sitesTable, pluginsTable, sitePluginsTable);
    });

    describe('SiteRepository.findAll', () => {
        it('should return all sites', async () => {
            const builder = {
                from: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([
                    {
                        id: 1,
                        name: 'Test Site 1',
                        url: 'https://example.com/site-1',
                        phpVersion: '7.4',
                        wpVersion: '5.8',
                        token: 'site-1-token',
                        environment: 'development',
                        createdAt: new Date('2025-01-01T00:00:00Z'),
                        updatedAt: new Date('2025-01-02T00:00:00Z'),
                    },
                ]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(builder);

            const sites = await siteRepository.findAll();

            expect(database.select).toHaveBeenCalled();
            expect(builder.from).toHaveBeenCalledWith(sitesTable);
            expect(builder.execute).toHaveBeenCalled();

            expect(sites[0].getId()).toBe(1);
            expect(sites[0].getName()).toBe('Test Site 1');
            expect(sites[0].getUrl()).toBe('https://example.com/site-1');
            expect(sites[0].getPhpVersion()).toBe('7.4');
            expect(sites[0].getWpVersion()).toBe('5.8');
            expect(sites[0].getToken()).toBe('site-1-token');
            expect(sites[0].getEnvironment()).toBe('development');
            expect(sites[0].getCreatedAt()).toEqual(new Date('2025-01-01T00:00:00Z'));
            expect(sites[0].getUpdatedAt()).toEqual(new Date('2025-01-02T00:00:00Z'));
        });
    });

    describe('SiteRepository.findById', () => {
        it('should return a site by ID', async () => {
            const builder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([
                    {
                        id: 1,
                        name: 'Test Site 1',
                        url: 'https://example.com/site-1',
                        phpVersion: '7.4',
                        wpVersion: '5.8',
                        token: 'site-1-token',
                        environment: 'development',
                        createdAt: new Date('2025-01-01T00:00:00Z'),
                        updatedAt: new Date('2025-01-02T00:00:00Z'),
                    },
                ]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(builder);

            const site = await siteRepository.findById(1);

            expect(database.select).toHaveBeenCalled();
            expect(builder.from).toHaveBeenCalledWith(sitesTable);
            expect(builder.where).toHaveBeenCalledWith(eq(sitesTable.id, 1));
            expect(builder.limit).toHaveBeenCalledWith(1);
            expect(builder.execute).toHaveBeenCalled();

            expect(site).not.toBeNull();
            expect(site?.getId()).toBe(1);
            expect(site?.getName()).toBe('Test Site 1');
            expect(site?.getUrl()).toBe('https://example.com/site-1');
            expect(site?.getPhpVersion()).toBe('7.4');
            expect(site?.getWpVersion()).toBe('5.8');
            expect(site?.getToken()).toBe('site-1-token');
            expect(site?.getEnvironment()).toBe('development');
            expect(site?.getCreatedAt()).toEqual(new Date('2025-01-01T00:00:00Z'));
            expect(site?.getUpdatedAt()).toEqual(new Date('2025-01-02T00:00:00Z'));
        });

        it('should return null if the site could not be found by ID', async () => {
            const builder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([null]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(builder);

            const site = await siteRepository.findById(1);

            expect(database.select).toHaveBeenCalled();
            expect(builder.from).toHaveBeenCalledWith(sitesTable);
            expect(builder.where).toHaveBeenCalledWith(eq(sitesTable.id, 1));
            expect(builder.limit).toHaveBeenCalledWith(1);
            expect(builder.execute).toHaveBeenCalled();

            expect(site).toBeNull();
        });
    });

    describe('SiteRepository.findByNameAndUrl', () => {
        it('should return a site by name and url', async () => {
            const builder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([
                    {
                        id: 1,
                        name: 'Test Site 1',
                        url: 'https://example.com/site-1',
                        phpVersion: '7.4',
                        wpVersion: '5.8',
                        token: 'site-1-token',
                        environment: 'development',
                        createdAt: new Date('2025-01-01T00:00:00Z'),
                        updatedAt: new Date('2025-01-02T00:00:00Z'),
                    },
                ]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(builder);

            const site = await siteRepository.findByNameAndUrl('Test Site 1', 'https://example.com/site-1');

            expect(database.select).toHaveBeenCalled();
            expect(builder.from).toHaveBeenCalledWith(sitesTable);
            expect(builder.where).toHaveBeenCalledWith(
                and(eq(sitesTable.name, 'Test Site 1'), eq(sitesTable.url, 'https://example.com/site-1'))
            );
            expect(builder.limit).toHaveBeenCalledWith(1);
            expect(builder.execute).toHaveBeenCalled();

            expect(site).not.toBeNull();
            expect(site?.getId()).toBe(1);
            expect(site?.getName()).toBe('Test Site 1');
            expect(site?.getUrl()).toBe('https://example.com/site-1');
            expect(site?.getPhpVersion()).toBe('7.4');
            expect(site?.getWpVersion()).toBe('5.8');
            expect(site?.getToken()).toBe('site-1-token');
            expect(site?.getEnvironment()).toBe('development');
            expect(site?.getCreatedAt()).toEqual(new Date('2025-01-01T00:00:00Z'));
            expect(site?.getUpdatedAt()).toEqual(new Date('2025-01-02T00:00:00Z'));
        });

        it('should return null if the site could not be found by name and url', async () => {
            const builder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([null]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(builder);

            const site = await siteRepository.findByNameAndUrl('Test Site 1', 'https://example.com/site-1');

            expect(database.select).toHaveBeenCalled();
            expect(builder.from).toHaveBeenCalledWith(sitesTable);
            expect(builder.where).toHaveBeenCalledWith(
                and(eq(sitesTable.name, 'Test Site 1'), eq(sitesTable.url, 'https://example.com/site-1'))
            );
            expect(builder.limit).toHaveBeenCalledWith(1);
            expect(builder.execute).toHaveBeenCalled();

            expect(site).toBeNull();
        });
    });

    describe('SiteRepository.create', () => {
        it('should create a new site and return it', async () => {
            const builder = {
                values: jest.fn().mockReturnThis(),
                returning: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([
                    {
                        id: 1,
                        name: 'New Site',
                        url: 'https://example.com/new-site',
                        phpVersion: '8.0',
                        wpVersion: '5.9',
                        token: 'new-site-token',
                        environment: 'production',
                        createdAt: new Date('2025-01-01T00:00:00Z'),
                        updatedAt: new Date('2025-01-02T00:00:00Z'),
                    },
                ]),
            };

            (database.insert as jest.Mock).mockReturnValueOnce(builder);

            const site = await siteRepository.create({
                name: 'New Site',
                url: 'https://example.com/new-site',
                phpVersion: '8.0',
                wpVersion: '5.9',
                token: 'new-site-token',
                environment: 'production',
                createdAt: '2025-01-01T00:00:00Z',
                updatedAt: '2025-01-02T00:00:00Z',
            });

            expect(database.insert).toHaveBeenCalled();
            expect(builder.values).toHaveBeenCalledWith({
                name: 'New Site',
                url: 'https://example.com/new-site',
                phpVersion: '8.0',
                wpVersion: '5.9',
                token: 'new-site-token',
                environment: 'production',
                createdAt: '2025-01-01T00:00:00Z',
                updatedAt: '2025-01-02T00:00:00Z',
            });
            expect(builder.returning).toHaveBeenCalled();
            expect(builder.execute).toHaveBeenCalled();

            expect(site).not.toBeNull();
            expect(site?.getId()).toBe(1);
            expect(site?.getName()).toBe('New Site');
            expect(site?.getUrl()).toBe('https://example.com/new-site');
            expect(site?.getPhpVersion()).toBe('8.0');
            expect(site?.getWpVersion()).toBe('5.9');
            expect(site?.getToken()).toBe('new-site-token');
            expect(site?.getEnvironment()).toBe('production');
            expect(site?.getCreatedAt()).toEqual(new Date('2025-01-01T00:00:00Z'));
            expect(site?.getUpdatedAt()).toEqual(new Date('2025-01-02T00:00:00Z'));
        });

        it('should return null if the creation fails', async () => {
            const builder = {
                values: jest.fn().mockReturnThis(),
                returning: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([null]),
            };

            (database.insert as jest.Mock).mockReturnValueOnce(builder);

            const site = await siteRepository.create({
                name: 'New Site',
                url: 'https://example.com/new-site',
                phpVersion: '8.0',
                wpVersion: '5.9',
                token: 'new-site-token',
                environment: 'production',
                createdAt: '2025-01-01T00:00:00Z',
                updatedAt: '2025-01-02T00:00:00Z',
            });

            expect(database.insert).toHaveBeenCalled();
            expect(builder.values).toHaveBeenCalledWith({
                name: 'New Site',
                url: 'https://example.com/new-site',
                phpVersion: '8.0',
                wpVersion: '5.9',
                token: 'new-site-token',
                environment: 'production',
                createdAt: '2025-01-01T00:00:00Z',
                updatedAt: '2025-01-02T00:00:00Z',
            });
            expect(builder.returning).toHaveBeenCalled();
            expect(builder.execute).toHaveBeenCalled();

            expect(site).toBeNull();
        });
    });

    describe('SiteRepository.update', () => {
        it('should update an existing site and return it', async () => {
            const builder = {
                set: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                returning: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([
                    {
                        id: 1,
                        name: 'Updated Site',
                        url: 'https://example.com/updated-site',
                        phpVersion: '8.0',
                        wpVersion: '5.9',
                        token: 'updated-site-token',
                        environment: 'production',
                        createdAt: new Date('2025-01-01T00:00:00Z'),
                        updatedAt: new Date('2025-01-02T00:00:00Z'),
                    },
                ]),
            };

            (database.update as jest.Mock).mockReturnValueOnce(builder);

            const site = await siteRepository.update({
                id: 1,
                name: 'Updated Site',
                url: 'https://example.com/updated-site',
                phpVersion: '8.0',
                wpVersion: '5.9',
                token: 'updated-site-token',
                environment: 'production',
                createdAt: '2025-01-01T00:00:00Z',
                updatedAt: '2025-01-02T00:00:00Z',
            });

            expect(database.update).toHaveBeenCalled();
            expect(builder.set).toHaveBeenCalledWith({
                name: 'Updated Site',
                url: 'https://example.com/updated-site',
                phpVersion: '8.0',
                wpVersion: '5.9',
                token: 'updated-site-token',
                environment: 'production',
                updatedAt: '2025-01-02T00:00:00Z',
            });
            expect(builder.where).toHaveBeenCalledWith(eq(sitesTable.id, 1));
            expect(builder.returning).toHaveBeenCalled();
            expect(builder.execute).toHaveBeenCalled();

            expect(site).not.toBeNull();
            expect(site?.getId()).toBe(1);
            expect(site?.getName()).toBe('Updated Site');
            expect(site?.getUrl()).toBe('https://example.com/updated-site');
            expect(site?.getPhpVersion()).toBe('8.0');
            expect(site?.getWpVersion()).toBe('5.9');
            expect(site?.getToken()).toBe('updated-site-token');
            expect(site?.getEnvironment()).toBe('production');
            expect(site?.getCreatedAt()).toEqual(new Date('2025-01-01T00:00:00Z'));
            expect(site?.getUpdatedAt()).toEqual(new Date('2025-01-02T00:00:00Z'));
        });

        it('should return null if the update fails', async () => {
            const builder = {
                set: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                returning: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([null]),
            };

            (database.update as jest.Mock).mockReturnValueOnce(builder);

            const site = await siteRepository.update({
                id: 1,
                name: 'Updated Site',
                url: 'https://example.com/updated-site',
                phpVersion: '8.0',
                wpVersion: '5.9',
                token: 'updated-site-token',
                environment: 'production',
                createdAt: '2025-01-01T00:00:00Z',
                updatedAt: '2025-01-02T00:00:00Z',
            });

            expect(database.update).toHaveBeenCalled();
            expect(builder.set).toHaveBeenCalledWith({
                name: 'Updated Site',
                url: 'https://example.com/updated-site',
                phpVersion: '8.0',
                wpVersion: '5.9',
                token: 'updated-site-token',
                environment: 'production',
                updatedAt: '2025-01-02T00:00:00Z',
            });
            expect(builder.where).toHaveBeenCalledWith(eq(sitesTable.id, 1));
            expect(builder.returning).toHaveBeenCalled();
            expect(builder.execute).toHaveBeenCalled();

            expect(site).toBeNull();
        });
    });

    describe('SiteRepository.delete', () => {
        it('should delete a site by ID and return true', async () => {
            const builder = {
                where: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue({ changes: 1 }),
            };

            (database.delete as jest.Mock).mockReturnValueOnce(builder);

            const result = await siteRepository.delete(1);

            expect(database.delete).toHaveBeenCalled();
            expect(builder.where).toHaveBeenCalledWith(eq(sitesTable.id, 1));
            expect(builder.execute).toHaveBeenCalled();

            expect(result).toBeTruthy();
        });

        it('should return false if the site could not be deleted', async () => {
            const builder = {
                where: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue({ changes: 0 }),
            };

            (database.delete as jest.Mock).mockReturnValueOnce(builder);

            const result = await siteRepository.delete(1);

            expect(database.delete).toHaveBeenCalled();
            expect(builder.where).toHaveBeenCalledWith(eq(sitesTable.id, 1));
            expect(builder.execute).toHaveBeenCalled();

            expect(result).toBeFalsy();
        });
    });

    describe('SiteRepository.findAllSitePlugins', () => {
        it('should return all site plugins for a given site ID', async () => {
            const builder = {
                from: jest.fn().mockReturnThis(),
                innerJoin: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([
                    {
                        id: 1,
                        slug: 'plugin-1',
                        name: 'Plugin 1',
                        installedVersion: '1.0.0',
                        installedRequiredPhpVersion: '7.4',
                        installedRequiredWpVersion: '5.8',
                        latestVersion: '2.0.0',
                        latestRequiredPhpVersion: '8.0',
                        latestRequiredWpVersion: '5.9',
                        isActive: 1,
                    },
                ]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(builder);

            const sitePlugins = await siteRepository.findAllSitePlugins(1);

            expect(database.select).toHaveBeenCalled();
            expect(builder.from).toHaveBeenCalledWith(sitePluginsTable);
            expect(builder.innerJoin).toHaveBeenCalledWith(
                pluginsTable,
                eq(sitePluginsTable.pluginId, pluginsTable.id)
            );
            expect(builder.where).toHaveBeenCalledWith(eq(sitePluginsTable.siteId, 1));
            expect(builder.execute).toHaveBeenCalled();

            expect(sitePlugins[0].getId()).toBe(1);
            expect(sitePlugins[0].getSlug()).toBe('plugin-1');
            expect(sitePlugins[0].getName()).toBe('Plugin 1');
            expect(sitePlugins[0].getIsActive()).toBeTruthy();
            expect(sitePlugins[0].getInstalledVersion()).toEqual({
                version: '1.0.0',
                requiredPhpVersion: '7.4',
                requiredWpVersion: '5.8',
            });
            expect(sitePlugins[0].getLatestVersion()).toEqual({
                version: '2.0.0',
                requiredPhpVersion: '8.0',
                requiredWpVersion: '5.9',
            });
        });
    });

    describe('SiteRepository.findSitePlugin', () => {
        it('should return a site plugin by site ID and plugin ID', async () => {
            const builder = {
                from: jest.fn().mockReturnThis(),
                innerJoin: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([
                    {
                        id: 1,
                        slug: 'plugin-1',
                        name: 'Plugin 1',
                        installedVersion: '1.0.0',
                        installedRequiredPhpVersion: '7.4',
                        installedRequiredWpVersion: '5.8',
                        latestVersion: '2.0.0',
                        latestRequiredPhpVersion: '8.0',
                        latestRequiredWpVersion: '5.9',
                        isActive: 1,
                    },
                ]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(builder);

            const sitePlugin = await siteRepository.findSitePlugin(1, 1);

            expect(database.select).toHaveBeenCalled();
            expect(builder.from).toHaveBeenCalledWith(sitePluginsTable);
            expect(builder.innerJoin).toHaveBeenCalledWith(
                pluginsTable,
                eq(sitePluginsTable.pluginId, pluginsTable.id)
            );
            expect(builder.where).toHaveBeenCalledWith(
                and(eq(sitePluginsTable.siteId, 1), eq(sitePluginsTable.pluginId, 1))
            );
            expect(builder.limit).toHaveBeenCalledWith(1);
            expect(builder.execute).toHaveBeenCalled();

            expect(sitePlugin?.getId()).toBe(1);
            expect(sitePlugin?.getSlug()).toBe('plugin-1');
            expect(sitePlugin?.getName()).toBe('Plugin 1');
            expect(sitePlugin?.getIsActive()).toBeTruthy();
            expect(sitePlugin?.getInstalledVersion()).toEqual({
                version: '1.0.0',
                requiredPhpVersion: '7.4',
                requiredWpVersion: '5.8',
            });
            expect(sitePlugin?.getLatestVersion()).toEqual({
                version: '2.0.0',
                requiredPhpVersion: '8.0',
                requiredWpVersion: '5.9',
            });
        });

        it('should return null if the site plugin could not be found', async () => {
            const builder = {
                from: jest.fn().mockReturnThis(),
                innerJoin: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([null]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(builder);

            const sitePlugin = await siteRepository.findSitePlugin(1, 1);

            expect(database.select).toHaveBeenCalled();
            expect(builder.from).toHaveBeenCalledWith(sitePluginsTable);
            expect(builder.innerJoin).toHaveBeenCalledWith(
                pluginsTable,
                eq(sitePluginsTable.pluginId, pluginsTable.id)
            );
            expect(builder.where).toHaveBeenCalledWith(
                and(eq(sitePluginsTable.siteId, 1), eq(sitePluginsTable.pluginId, 1))
            );
            expect(builder.limit).toHaveBeenCalledWith(1);
            expect(builder.execute).toHaveBeenCalled();

            expect(sitePlugin).toBeNull();
        });
    });

    describe('SiteRepository.createSitePlugin', () => {
        it('should create a new site plugin and return it', async () => {
            const selectBuilder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([
                    {
                        id: 1,
                        slug: 'plugin-1',
                        name: 'Plugin 1',
                        latestVersion: '2.0.0',
                        requiredPhpVersion: '8.0',
                        requiredWpVersion: '5.9',
                    },
                ]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(selectBuilder);

            const insertBuilder = {
                values: jest.fn().mockReturnThis(),
                returning: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([
                    {
                        pluginId: 1,
                        isActive: 1,
                        installedVersion: '1.0.0',
                        requiredPhpVersion: '7.4',
                        requiredWpVersion: '5.8',
                    },
                ]),
            };

            (database.insert as jest.Mock).mockReturnValueOnce(insertBuilder);

            const sitePlugin = await siteRepository.createSitePlugin({
                siteId: 1,
                pluginId: 1,
                installedVersion: '1.0.0',
                requiredPhpVersion: '7.4',
                requiredWpVersion: '5.8',
                isActive: true,
            });

            expect(database.select).toHaveBeenCalled();
            expect(selectBuilder.from).toHaveBeenCalledWith(pluginsTable);
            expect(selectBuilder.where).toHaveBeenCalledWith(eq(pluginsTable.id, 1));
            expect(selectBuilder.limit).toHaveBeenCalledWith(1);
            expect(selectBuilder.execute).toHaveBeenCalled();

            expect(database.insert).toHaveBeenCalled();
            expect(insertBuilder.values).toHaveBeenCalledWith({
                siteId: 1,
                pluginId: 1,
                installedVersion: '1.0.0',
                requiredPhpVersion: '7.4',
                requiredWpVersion: '5.8',
                isActive: 1,
            });
            expect(insertBuilder.returning).toHaveBeenCalled();
            expect(insertBuilder.execute).toHaveBeenCalled();

            expect(sitePlugin?.getId()).toBe(1);
            expect(sitePlugin?.getSlug()).toBe('plugin-1');
            expect(sitePlugin?.getName()).toBe('Plugin 1');
            expect(sitePlugin?.getIsActive()).toBeTruthy();
            expect(sitePlugin?.getInstalledVersion()).toEqual({
                version: '1.0.0',
                requiredPhpVersion: '7.4',
                requiredWpVersion: '5.8',
            });
            expect(sitePlugin?.getLatestVersion()).toEqual({
                version: '2.0.0',
                requiredPhpVersion: '8.0',
                requiredWpVersion: '5.9',
            });
        });

        it('should return null if the plugin does not exist', async () => {
            const selectBuilder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([null]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(selectBuilder);

            const sitePlugin = await siteRepository.createSitePlugin({
                siteId: 1,
                pluginId: 1,
                installedVersion: '1.0.0',
                requiredPhpVersion: '7.4',
                requiredWpVersion: '5.8',
                isActive: true,
            });

            expect(database.select).toHaveBeenCalled();
            expect(selectBuilder.from).toHaveBeenCalledWith(pluginsTable);
            expect(selectBuilder.where).toHaveBeenCalledWith(eq(pluginsTable.id, 1));
            expect(selectBuilder.limit).toHaveBeenCalledWith(1);
            expect(selectBuilder.execute).toHaveBeenCalled();

            expect(sitePlugin).toBeNull();
        });

        it('should return null if the creation fails', async () => {
            const selectBuilder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([
                    {
                        id: 1,
                        slug: 'plugin-1',
                        name: 'Plugin 1',
                        latestVersion: '2.0.0',
                        requiredPhpVersion: '8.0',
                        requiredWpVersion: '5.9',
                    },
                ]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(selectBuilder);

            const insertBuilder = {
                values: jest.fn().mockReturnThis(),
                returning: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([]),
            };

            (database.insert as jest.Mock).mockReturnValueOnce(insertBuilder);

            const sitePlugin = await siteRepository.createSitePlugin({
                siteId: 1,
                pluginId: 1,
                installedVersion: '1.0.0',
                requiredPhpVersion: '7.4',
                requiredWpVersion: '5.8',
                isActive: true,
            });

            expect(database.select).toHaveBeenCalled();
            expect(selectBuilder.from).toHaveBeenCalledWith(pluginsTable);
            expect(selectBuilder.where).toHaveBeenCalledWith(eq(pluginsTable.id, 1));
            expect(selectBuilder.limit).toHaveBeenCalledWith(1);
            expect(selectBuilder.execute).toHaveBeenCalled();

            expect(database.insert).toHaveBeenCalled();
            expect(insertBuilder.values).toHaveBeenCalledWith({
                siteId: 1,
                pluginId: 1,
                installedVersion: '1.0.0',
                requiredPhpVersion: '7.4',
                requiredWpVersion: '5.8',
                isActive: 1,
            });
            expect(insertBuilder.returning).toHaveBeenCalled();
            expect(insertBuilder.execute).toHaveBeenCalled();

            expect(sitePlugin).toBeNull();
        });
    });

    describe('SiteRepository.updateSitePlugin', () => {
        it('should update an existing site plugin and return it', async () => {
            const selectBuilder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([
                    {
                        id: 1,
                        slug: 'plugin-1',
                        name: 'Plugin 1',
                        latestVersion: '2.0.0',
                        requiredPhpVersion: '8.0',
                        requiredWpVersion: '5.9',
                    },
                ]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(selectBuilder);

            const updateBuilder = {
                set: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                returning: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([
                    {
                        pluginId: 1,
                        isActive: 1,
                        installedVersion: '1.0.0',
                        requiredPhpVersion: '7.4',
                        requiredWpVersion: '5.8',
                    },
                ]),
            };

            (database.update as jest.Mock).mockReturnValueOnce(updateBuilder);

            const sitePlugin = await siteRepository.updateSitePlugin({
                siteId: 1,
                pluginId: 1,
                installedVersion: '1.0.0',
                requiredPhpVersion: '7.4',
                requiredWpVersion: '5.8',
                isActive: true,
            });

            expect(database.select).toHaveBeenCalled();
            expect(selectBuilder.from).toHaveBeenCalledWith(pluginsTable);
            expect(selectBuilder.where).toHaveBeenCalledWith(eq(pluginsTable.id, 1));
            expect(selectBuilder.limit).toHaveBeenCalledWith(1);
            expect(selectBuilder.execute).toHaveBeenCalled();

            expect(database.update).toHaveBeenCalled();
            expect(updateBuilder.set).toHaveBeenCalledWith({
                installedVersion: '1.0.0',
                requiredPhpVersion: '7.4',
                requiredWpVersion: '5.8',
                isActive: 1,
            });
            expect(updateBuilder.where).toHaveBeenCalledWith(
                and(eq(sitePluginsTable.siteId, 1), eq(sitePluginsTable.pluginId, 1))
            );
            expect(updateBuilder.returning).toHaveBeenCalled();
            expect(updateBuilder.execute).toHaveBeenCalled();

            expect(sitePlugin?.getId()).toBe(1);
            expect(sitePlugin?.getSlug()).toBe('plugin-1');
            expect(sitePlugin?.getName()).toBe('Plugin 1');
            expect(sitePlugin?.getIsActive()).toBeTruthy();
            expect(sitePlugin?.getInstalledVersion()).toEqual({
                version: '1.0.0',
                requiredPhpVersion: '7.4',
                requiredWpVersion: '5.8',
            });
            expect(sitePlugin?.getLatestVersion()).toEqual({
                version: '2.0.0',
                requiredPhpVersion: '8.0',
                requiredWpVersion: '5.9',
            });
        });

        it('should return null if the plugin does not exist', async () => {
            const selectBuilder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([null]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(selectBuilder);

            const sitePlugin = await siteRepository.updateSitePlugin({
                siteId: 1,
                pluginId: 1,
                installedVersion: '1.0.0',
                requiredPhpVersion: '7.4',
                requiredWpVersion: '5.8',
                isActive: true,
            });

            expect(database.select).toHaveBeenCalled();
            expect(selectBuilder.from).toHaveBeenCalledWith(pluginsTable);
            expect(selectBuilder.where).toHaveBeenCalledWith(eq(pluginsTable.id, 1));
            expect(selectBuilder.limit).toHaveBeenCalledWith(1);
            expect(selectBuilder.execute).toHaveBeenCalled();

            expect(sitePlugin).toBeNull();
        });

        it('should return null if the update fails', async () => {
            const selectBuilder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([
                    {
                        id: 1,
                        slug: 'plugin-1',
                        name: 'Plugin 1',
                        latestVersion: '2.0.0',
                        requiredPhpVersion: '8.0',
                        requiredWpVersion: '5.9',
                    },
                ]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(selectBuilder);

            const updateBuilder = {
                set: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                returning: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([null]),
            };

            (database.update as jest.Mock).mockReturnValueOnce(updateBuilder);

            const sitePlugin = await siteRepository.updateSitePlugin({
                siteId: 1,
                pluginId: 1,
                installedVersion: '1.0.0',
                requiredPhpVersion: '7.4',
                requiredWpVersion: '5.8',
                isActive: true,
            });

            expect(database.select).toHaveBeenCalled();
            expect(selectBuilder.from).toHaveBeenCalledWith(pluginsTable);
            expect(selectBuilder.where).toHaveBeenCalledWith(eq(pluginsTable.id, 1));
            expect(selectBuilder.limit).toHaveBeenCalledWith(1);
            expect(selectBuilder.execute).toHaveBeenCalled();

            expect(database.update).toHaveBeenCalled();
            expect(updateBuilder.set).toHaveBeenCalledWith({
                installedVersion: '1.0.0',
                requiredPhpVersion: '7.4',
                requiredWpVersion: '5.8',
                isActive: 1,
            });
            expect(updateBuilder.where).toHaveBeenCalledWith(
                and(eq(sitePluginsTable.siteId, 1), eq(sitePluginsTable.pluginId, 1))
            );
            expect(updateBuilder.returning).toHaveBeenCalled();
            expect(updateBuilder.execute).toHaveBeenCalled();

            expect(sitePlugin).toBeNull();
        });
    });

    describe('SiteRepository.deleteSitePlugin', () => {
        it('should delete a site plugin by site ID and plugin ID and return true', async () => {
            const builder = {
                where: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue({ changes: 1 }),
            };

            (database.delete as jest.Mock).mockReturnValueOnce(builder);

            const result = await siteRepository.deleteSitePlugin(1, 1);

            expect(database.delete).toHaveBeenCalled();
            expect(builder.where).toHaveBeenCalledWith(
                and(eq(sitePluginsTable.siteId, 1), eq(sitePluginsTable.pluginId, 1))
            );
            expect(builder.execute).toHaveBeenCalled();

            expect(result).toBeTruthy();
        });

        it('should return false if the site could not be deleted', async () => {
            const builder = {
                where: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue({ changes: 0 }),
            };

            (database.delete as jest.Mock).mockReturnValueOnce(builder);

            const result = await siteRepository.deleteSitePlugin(1, 1);

            expect(database.delete).toHaveBeenCalled();
            expect(builder.where).toHaveBeenCalledWith(
                and(eq(sitePluginsTable.siteId, 1), eq(sitePluginsTable.pluginId, 1))
            );
            expect(builder.execute).toHaveBeenCalled();

            expect(result).toBeFalsy();
        });
    });
});
