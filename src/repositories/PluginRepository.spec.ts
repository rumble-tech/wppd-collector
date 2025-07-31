import {
    TDatabase,
    TPluginsTable,
    TPluginVulnerabilitiesTable,
    TSitePluginsTable,
} from 'src/components/database/Types';
import PluginRepository from './PluginRepository';
import VulnerabilitiesResolver from 'src/services/vulnerabilities/VulnerabilitiesResolver';
import { eq, notInArray } from 'drizzle-orm';

describe('PluginRepository', () => {
    let pluginRepository: PluginRepository;
    let database: Partial<TDatabase>;
    let pluginsTable: TPluginsTable;
    let sitePluginsTable: TSitePluginsTable;
    let pluginVulnerabilitiesTable: TPluginVulnerabilitiesTable;
    let mockVulnerabilitiesResolver: jest.Mocked<VulnerabilitiesResolver>;

    beforeEach(() => {
        database = {
            select: jest.fn(),
            insert: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };

        pluginsTable = {} as unknown as TPluginsTable;
        sitePluginsTable = {} as unknown as TSitePluginsTable;
        pluginVulnerabilitiesTable = {} as unknown as TPluginVulnerabilitiesTable;
        mockVulnerabilitiesResolver = {
            resolve: jest.fn(),
        } as unknown as jest.Mocked<VulnerabilitiesResolver>;

        pluginRepository = new PluginRepository(
            database as TDatabase,
            pluginsTable,
            sitePluginsTable,
            pluginVulnerabilitiesTable,
            mockVulnerabilitiesResolver
        );
    });

    describe('PluginRepository.findAll', () => {
        it('should return all plugins', async () => {
            const builder = {
                from: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([
                    {
                        id: 1,
                        slug: 'plugin-1',
                        name: 'Plugin 1',
                        latestVersion: '1.0.0',
                        requiredPhpVersion: '7.4',
                        requiredWpVersion: '5.6',
                    },
                    {
                        id: 2,
                        slug: 'plugin-2',
                        name: 'Plugin 2',
                        latestVersion: '2.0.0',
                        requiredPhpVersion: '8.0',
                        requiredWpVersion: '5.8',
                    },
                ]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(builder);

            const plugins = await pluginRepository.findAll();

            expect(database.select).toHaveBeenCalled();
            expect(builder.from).toHaveBeenCalledWith(pluginsTable);
            expect(builder.execute).toHaveBeenCalled();

            expect(plugins).toHaveLength(2);
            expect(plugins[0].getSlug()).toBe('plugin-1');
            expect(plugins[1].getSlug()).toBe('plugin-2');
        });
    });

    describe('PluginRepository.findBySlug', () => {
        it('should return a plugin by slug', async () => {
            const builder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([
                    {
                        id: 1,
                        slug: 'plugin-1',
                        name: 'Plugin 1',
                        latestVersion: '1.0.0',
                        requiredPhpVersion: '7.4',
                        requiredWpVersion: '5.6',
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
        });

        it('should return null if no plugin is found by slug', async () => {
            const builder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(builder);

            const plugin = await pluginRepository.findBySlug('non-existent-plugin');

            expect(database.select).toHaveBeenCalled();
            expect(builder.from).toHaveBeenCalledWith(pluginsTable);
            expect(builder.where).toHaveBeenCalledWith(eq(pluginsTable.slug, 'non-existent-plugin'));
            expect(builder.limit).toHaveBeenCalledWith(1);
            expect(builder.execute).toHaveBeenCalled();

            expect(plugin).toBeNull();
        });
    });

    describe('PluginRepository.create', () => {
        it('should create a new plugin and return it', async () => {
            const builder = {
                values: jest.fn().mockReturnThis(),
                returning: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([
                    {
                        id: 1,
                        slug: 'new-plugin',
                        name: 'New Plugin',
                        latestVersion: '1.0.0',
                        requiredPhpVersion: '7.4',
                        requiredWpVersion: '5.6',
                    },
                ]),
            };

            (database.insert as jest.Mock).mockReturnValueOnce(builder);

            const plugin = await pluginRepository.create({
                slug: 'new-plugin',
                name: 'New Plugin',
                latestVersion: '1.0.0',
                requiredPhpVersion: '7.4',
                requiredWpVersion: '5.6',
            });

            expect(database.insert).toHaveBeenCalled();
            expect(builder.values).toHaveBeenCalledWith({
                slug: 'new-plugin',
                name: 'New Plugin',
                latestVersion: '1.0.0',
                requiredPhpVersion: '7.4',
                requiredWpVersion: '5.6',
            });
            expect(builder.returning).toHaveBeenCalled();
            expect(builder.execute).toHaveBeenCalled();

            expect(plugin).not.toBeNull();
            expect(plugin?.getId()).toBe(1);
            expect(plugin?.getSlug()).toBe('new-plugin');
            expect(plugin?.getName()).toBe('New Plugin');
        });

        it('should return null if the creation fails', async () => {
            const builder = {
                values: jest.fn().mockReturnThis(),
                returning: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([null]),
            };

            (database.insert as jest.Mock).mockReturnValueOnce(builder);

            const plugin = await pluginRepository.create({
                slug: 'new-plugin',
                name: 'New Plugin',
                latestVersion: '1.0.0',
                requiredPhpVersion: '7.4',
                requiredWpVersion: '5.6',
            });

            expect(database.insert).toHaveBeenCalled();
            expect(builder.values).toHaveBeenCalledWith({
                slug: 'new-plugin',
                name: 'New Plugin',
                latestVersion: '1.0.0',
                requiredPhpVersion: '7.4',
                requiredWpVersion: '5.6',
            });
            expect(builder.returning).toHaveBeenCalled();
            expect(builder.execute).toHaveBeenCalled();

            expect(plugin).toBeNull();
        });
    });

    describe('PluginRepository.update', () => {
        it('should update an existing plugin and return it', async () => {
            const builder = {
                set: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                returning: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([
                    {
                        id: 1,
                        slug: 'updated-plugin',
                        name: 'Updated Plugin',
                        latestVersion: '1.0.0',
                        requiredPhpVersion: '7.4',
                        requiredWpVersion: '5.6',
                    },
                ]),
            };

            (database.update as jest.Mock).mockReturnValueOnce(builder);

            const plugin = await pluginRepository.update({
                id: 1,
                slug: 'updated-plugin',
                name: 'Updated Plugin',
                latestVersion: '1.0.0',
                requiredPhpVersion: '7.4',
                requiredWpVersion: '5.6',
            });

            expect(database.update).toHaveBeenCalled();
            expect(builder.set).toHaveBeenCalledWith({
                slug: 'updated-plugin',
                name: 'Updated Plugin',
                latestVersion: '1.0.0',
                requiredPhpVersion: '7.4',
                requiredWpVersion: '5.6',
            });
            expect(builder.where).toHaveBeenCalledWith(eq(pluginsTable.id, 1));
            expect(builder.returning).toHaveBeenCalled();
            expect(builder.execute).toHaveBeenCalled();

            expect(plugin).not.toBeNull();
            expect(plugin?.getId()).toBe(1);
            expect(plugin?.getSlug()).toBe('updated-plugin');
            expect(plugin?.getName()).toBe('Updated Plugin');
        });

        it('should return null if the update fails', async () => {
            const builder = {
                set: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                returning: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([null]),
            };

            (database.update as jest.Mock).mockReturnValueOnce(builder);

            const plugin = await pluginRepository.update({
                id: 1,
                slug: 'updated-plugin',
                name: 'Updated Plugin',
                latestVersion: '1.0.0',
                requiredPhpVersion: '7.4',
                requiredWpVersion: '5.6',
            });

            expect(database.update).toHaveBeenCalled();
            expect(builder.set).toHaveBeenCalledWith({
                slug: 'updated-plugin',
                name: 'Updated Plugin',
                latestVersion: '1.0.0',
                requiredPhpVersion: '7.4',
                requiredWpVersion: '5.6',
            });
            expect(builder.where).toHaveBeenCalledWith(eq(pluginsTable.id, 1));
            expect(builder.returning).toHaveBeenCalled();
            expect(builder.execute).toHaveBeenCalled();

            expect(plugin).toBeNull();
        });
    });

    describe('PluginRepository.deleteUnused', () => {
        it('should delete unused plugins and return true', async () => {
            const selectBuilder = {
                from: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([{ pluginId: 1 }, { pluginId: 2 }]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(selectBuilder);

            const deleteBuilder = {
                where: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue({ changes: 2 }),
            };

            (database.delete as jest.Mock).mockReturnValueOnce(deleteBuilder);

            const result = await pluginRepository.deleteUnused();

            expect(database.select).toHaveBeenCalled();
            expect(selectBuilder.from).toHaveBeenCalledWith(sitePluginsTable);
            expect(selectBuilder.execute).toHaveBeenCalled();

            expect(database.delete).toHaveBeenCalled();
            expect(deleteBuilder.where).toHaveBeenCalledWith(notInArray(pluginsTable.id, [1, 2]));
            expect(deleteBuilder.execute).toHaveBeenCalled();

            expect(result).toBeTruthy();
        });

        it('should return false if no plugins were deleted', async () => {
            const selectBuilder = {
                from: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(selectBuilder);

            const deleteBuilder = {
                where: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue({ changes: 0 }),
            };

            (database.delete as jest.Mock).mockReturnValueOnce(deleteBuilder);

            const result = await pluginRepository.deleteUnused();

            expect(database.select).toHaveBeenCalled();
            expect(selectBuilder.from).toHaveBeenCalledWith(sitePluginsTable);
            expect(selectBuilder.execute).toHaveBeenCalled();

            expect(database.delete).toHaveBeenCalled();
            expect(deleteBuilder.where).toHaveBeenCalledWith(notInArray(pluginsTable.id, []));
            expect(deleteBuilder.execute).toHaveBeenCalled();

            expect(result).toBeFalsy();
        });
    });

    describe('PluginRepository.getVulnerabilities', () => {
        it('should resolve vulnerabilities for a plugin', async () => {
            const slug = 'plugin-1';
            const vulnerabilities = [
                { from: { version: '1.0.0', inclusive: true }, to: { version: '2.0.0', inclusive: true }, score: 5.0 },
            ];

            mockVulnerabilitiesResolver.resolve.mockResolvedValueOnce(vulnerabilities);

            const result = await pluginRepository.getVulnerabilities(slug);

            expect(mockVulnerabilitiesResolver.resolve).toHaveBeenCalledWith(slug);
            expect(result).toEqual(vulnerabilities);
        });

        it('should return null if vulnerabilities cannot be resolved', async () => {
            const slug = 'non-existent-plugin';

            mockVulnerabilitiesResolver.resolve.mockResolvedValueOnce(null);

            const result = await pluginRepository.getVulnerabilities(slug);

            expect(mockVulnerabilitiesResolver.resolve).toHaveBeenCalledWith(slug);
            expect(result).toBeNull();
        });
    });

    describe('PluginRepository.findVulnerabilities', () => {
        it('should return vulnerabilities for a plugin', async () => {
            const builder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([
                    {
                        id: 1,
                        pluginId: 1,
                        from: '1.0.0',
                        fromInclusive: true,
                        to: '2.0.0',
                        toInclusive: true,
                        score: 5.0,
                    },
                ]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(builder);

            const vulnerabilities = await pluginRepository.findVulnerabilities(1);

            expect(database.select).toHaveBeenCalled();
            expect(builder.from).toHaveBeenCalledWith(pluginVulnerabilitiesTable);
            expect(builder.where).toHaveBeenCalledWith(eq(pluginVulnerabilitiesTable.pluginId, 1));
            expect(builder.execute).toHaveBeenCalled();

            expect(vulnerabilities).toHaveLength(1);
            expect(vulnerabilities[0].id).toBe(1);
            expect(vulnerabilities[0].pluginId).toBe(1);
            expect(vulnerabilities[0].from.version).toBe('1.0.0');
            expect(vulnerabilities[0].from.inclusive).toBeTruthy();
            expect(vulnerabilities[0].to.version).toBe('2.0.0');
            expect(vulnerabilities[0].to.inclusive).toBeTruthy();
            expect(vulnerabilities[0].score).toBe(5.0);
        });
    });

    describe('PluginRepository.createVulnerability', () => {
        it('should return true if the creation succeeds', async () => {
            const builder = {
                values: jest.fn().mockReturnThis(),
                returning: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([
                    {
                        id: 1,
                        pluginId: 1,
                        from: '1.0.0',
                        fromInclusive: true,
                        to: '2.0.0',
                        toInclusive: true,
                        score: 5.0,
                    },
                ]),
            };

            (database.insert as jest.Mock).mockReturnValueOnce(builder);

            const vulnerability = await pluginRepository.createVulnerability({
                pluginId: 1,
                from: { version: '1.0.0', inclusive: true },
                to: { version: '2.0.0', inclusive: true },
                score: 5.0,
            });

            expect(database.insert).toHaveBeenCalled();
            expect(builder.values).toHaveBeenCalledWith({
                pluginId: 1,
                from: '1.0.0',
                fromInclusive: 1,
                to: '2.0.0',
                toInclusive: 1,
                score: 5.0,
            });
            expect(builder.returning).toHaveBeenCalled();
            expect(builder.execute).toHaveBeenCalled();

            expect(vulnerability).toBe(true);
        });

        it('should return false if the creation fails', async () => {
            const builder = {
                values: jest.fn().mockReturnThis(),
                returning: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([null]),
            };

            (database.insert as jest.Mock).mockReturnValueOnce(builder);

            const vulnerability = await pluginRepository.createVulnerability({
                pluginId: 1,
                from: { version: '1.0.0', inclusive: true },
                to: { version: '2.0.0', inclusive: true },
                score: 5.0,
            });

            expect(database.insert).toHaveBeenCalled();
            expect(builder.values).toHaveBeenCalledWith({
                pluginId: 1,
                from: '1.0.0',
                fromInclusive: 1,
                to: '2.0.0',
                toInclusive: 1,
                score: 5.0,
            });
            expect(builder.returning).toHaveBeenCalled();
            expect(builder.execute).toHaveBeenCalled();

            expect(vulnerability).toBe(false);
        });
    });

    describe('PluginRepository.deleteAllVulnerabilitiesForPlugin', () => {
        it('should delete all vulnerabilities for a plugin', async () => {
            const builder = {
                where: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([]),
            };

            (database.delete as jest.Mock).mockReturnValueOnce(builder);

            await pluginRepository.deleteAllVulnerabilitiesForPlugin(1);

            expect(database.delete).toHaveBeenCalled();
            expect(builder.where).toHaveBeenCalledWith(eq(pluginVulnerabilitiesTable.pluginId, 1));
            expect(builder.execute).toHaveBeenCalled();
        });
    });
});
