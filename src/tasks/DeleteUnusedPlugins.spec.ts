import Plugin from 'src/entities/Plugin';
import PluginRepository from 'src/repositories/PluginRepository';
import SitePluginRepository from 'src/repositories/SitePluginRepository';
import Logger from 'src/services/logger/Logger';
import DeleteUnusedPluginsTask from 'src/tasks/DeleteUnusedPlugins';

describe('DeleteUnusedPluginsTask', () => {
    let task: DeleteUnusedPluginsTask;
    let mockLogger: jest.Mocked<Logger>;
    let mockPluginRepository: jest.Mocked<PluginRepository>;
    let mockSitePluginRepository: jest.Mocked<SitePluginRepository>;

    beforeEach(() => {
        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
            silly: jest.fn(),
        } as unknown as jest.Mocked<Logger>;

        mockPluginRepository = {
            findAll: jest.fn(),
            delete: jest.fn(),
        } as unknown as jest.Mocked<PluginRepository>;

        mockSitePluginRepository = {
            findAll: jest.fn(),
        } as unknown as jest.Mocked<SitePluginRepository>;

        task = new DeleteUnusedPluginsTask(mockLogger, mockPluginRepository, mockSitePluginRepository);

        jest.clearAllMocks();
    });

    describe('DeleteUnusedPluginsTask.run', () => {
        const sitePluginPayload = {
            createdAt: new Date('2026-01-02T00:00:00Z'),
            updatedAt: new Date('2026-01-02T00:00:00Z'),
            siteId: 1,
            pluginId: 1,
            installedVersion: '1.0.0',
            requiredPhpVersion: '8.5.1',
            requiredWpVersion: '6.9.0',
            isActive: false,
        } as const;

        const pluginPayload = {
            id: 1,
            createdAt: new Date('2026-01-01T00:00:00Z'),
            updatedAt: new Date('2026-01-01T00:00:00Z'),
            slug: 'plugin-1',
            name: 'Plugin1',
            latestVersion: '1.0.0',
            requiredPhpVersion: '8.5.1',
            requiredWpVersion: '6.9.0',
        } as const;

        it('should delete unused plugins', async () => {
            mockSitePluginRepository.findAll.mockResolvedValue([]);
            mockPluginRepository.findAll.mockResolvedValue([new Plugin(pluginPayload)]);
            mockPluginRepository.delete.mockResolvedValue(true);

            await task.run();

            expect(mockLogger.info).toHaveBeenCalledWith('Deleting unused plugins...');
            expect(mockLogger.info).toHaveBeenCalledWith('Deleting unused plugin', {
                pluginId: pluginPayload.id,
            });
            expect(mockPluginRepository.delete).toHaveBeenCalledWith(pluginPayload.id);
            expect(mockLogger.info).toHaveBeenCalledWith('Successfully deleted plugin', {
                pluginId: pluginPayload.id,
            });
        });

        it('should log an error when deleting a plugin fails', async () => {
            mockSitePluginRepository.findAll.mockResolvedValue([]);
            mockPluginRepository.findAll.mockResolvedValue([new Plugin(pluginPayload)]);
            mockPluginRepository.delete.mockResolvedValue(false);

            await task.run();

            expect(mockLogger.info).toHaveBeenCalledWith('Deleting unused plugins...');
            expect(mockLogger.info).toHaveBeenCalledWith('Deleting unused plugin', {
                pluginId: pluginPayload.id,
            });
            expect(mockPluginRepository.delete).toHaveBeenCalledWith(pluginPayload.id);
            expect(mockLogger.error).toHaveBeenCalledWith('Failed to delete plugin', {
                pluginId: pluginPayload.id,
            });
        });

        it('should log an error when the task fails', async () => {
            const error = new Error('Network Error');

            mockSitePluginRepository.findAll.mockRejectedValue(error);

            await task.run();

            expect(mockLogger.error).toHaveBeenCalledWith('Failed to delete unused plugins', {
                err: error,
            });
        });
    });
});
